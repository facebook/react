/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Thenable,
  ReactDebugInfo,
  ReactComponentInfo,
  ReactAsyncInfo,
  ReactStackTrace,
  ReactCallSite,
} from 'shared/ReactTypes';
import type {LazyComponent} from 'react/src/ReactLazy';

import type {
  ClientReference,
  ClientReferenceMetadata,
  SSRModuleMap,
  StringDecoder,
  ModuleLoading,
} from './ReactFlightClientConfig';

import type {
  HintCode,
  HintModel,
} from 'react-server/src/ReactFlightServerConfig';

import type {
  CallServerCallback,
  EncodeFormActionCallback,
} from './ReactFlightReplyClient';

import type {Postpone} from 'react/src/ReactPostpone';

import type {TemporaryReferenceSet} from './ReactFlightTemporaryReferences';

import {
  disableStringRefs,
  enableBinaryFlight,
  enablePostpone,
  enableRefAsProp,
  enableFlightReadableStream,
  enableOwnerStacks,
} from 'shared/ReactFeatureFlags';

import {
  resolveClientReference,
  preloadModule,
  requireModule,
  dispatchHint,
  readPartialStringChunk,
  readFinalStringChunk,
  createStringDecoder,
  prepareDestinationForModule,
  bindToConsole,
} from './ReactFlightClientConfig';

import {createBoundServerReference} from './ReactFlightReplyClient';

import {readTemporaryReference} from './ReactFlightTemporaryReferences';

import {
  REACT_LAZY_TYPE,
  REACT_ELEMENT_TYPE,
  REACT_POSTPONE_TYPE,
  ASYNC_ITERATOR,
  REACT_FRAGMENT_TYPE,
} from 'shared/ReactSymbols';

import getComponentNameFromType from 'shared/getComponentNameFromType';

import {getOwnerStackByComponentInfoInDev} from 'shared/ReactComponentInfoStack';

import isArray from 'shared/isArray';

import * as React from 'react';

// TODO: This is an unfortunate hack. We shouldn't feature detect the internals
// like this. It's just that for now we support the same build of the Flight
// client both in the RSC environment, in the SSR environments as well as the
// browser client. We should probably have a separate RSC build. This is DEV
// only though.
const ReactSharedInternals =
  React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
  React.__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

export type {CallServerCallback, EncodeFormActionCallback};

interface FlightStreamController {
  enqueueValue(value: any): void;
  enqueueModel(json: UninitializedModel): void;
  close(json: UninitializedModel): void;
  error(error: Error): void;
}

type UninitializedModel = string;

export type JSONValue =
  | number
  | null
  | boolean
  | string
  | {+[key: string]: JSONValue}
  | $ReadOnlyArray<JSONValue>;

const ROW_ID = 0;
const ROW_TAG = 1;
const ROW_LENGTH = 2;
const ROW_CHUNK_BY_NEWLINE = 3;
const ROW_CHUNK_BY_LENGTH = 4;

type RowParserState = 0 | 1 | 2 | 3 | 4;

const PENDING = 'pending';
const BLOCKED = 'blocked';
const RESOLVED_MODEL = 'resolved_model';
const RESOLVED_MODULE = 'resolved_module';
const INITIALIZED = 'fulfilled';
const ERRORED = 'rejected';

type PendingChunk<T> = {
  status: 'pending',
  value: null | Array<(T) => mixed>,
  reason: null | Array<(mixed) => mixed>,
  _response: Response,
  _debugInfo?: null | ReactDebugInfo,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type BlockedChunk<T> = {
  status: 'blocked',
  value: null | Array<(T) => mixed>,
  reason: null | Array<(mixed) => mixed>,
  _response: Response,
  _debugInfo?: null | ReactDebugInfo,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type ResolvedModelChunk<T> = {
  status: 'resolved_model',
  value: UninitializedModel,
  reason: null,
  _response: Response,
  _debugInfo?: null | ReactDebugInfo,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type ResolvedModuleChunk<T> = {
  status: 'resolved_module',
  value: ClientReference<T>,
  reason: null,
  _response: Response,
  _debugInfo?: null | ReactDebugInfo,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type InitializedChunk<T> = {
  status: 'fulfilled',
  value: T,
  reason: null | FlightStreamController,
  _response: Response,
  _debugInfo?: null | ReactDebugInfo,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type InitializedStreamChunk<
  T: ReadableStream | $AsyncIterable<any, any, void>,
> = {
  status: 'fulfilled',
  value: T,
  reason: FlightStreamController,
  _response: Response,
  _debugInfo?: null | ReactDebugInfo,
  then(resolve: (ReadableStream) => mixed, reject?: (mixed) => mixed): void,
};
type ErroredChunk<T> = {
  status: 'rejected',
  value: null,
  reason: mixed,
  _response: Response,
  _debugInfo?: null | ReactDebugInfo,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type SomeChunk<T> =
  | PendingChunk<T>
  | BlockedChunk<T>
  | ResolvedModelChunk<T>
  | ResolvedModuleChunk<T>
  | InitializedChunk<T>
  | ErroredChunk<T>;

// $FlowFixMe[missing-this-annot]
function ReactPromise(
  status: any,
  value: any,
  reason: any,
  response: Response,
) {
  this.status = status;
  this.value = value;
  this.reason = reason;
  this._response = response;
  if (__DEV__) {
    this._debugInfo = null;
  }
}
// We subclass Promise.prototype so that we get other methods like .catch
ReactPromise.prototype = (Object.create(Promise.prototype): any);
// TODO: This doesn't return a new Promise chain unlike the real .then
ReactPromise.prototype.then = function <T>(
  this: SomeChunk<T>,
  resolve: (value: T) => mixed,
  reject?: (reason: mixed) => mixed,
) {
  const chunk: SomeChunk<T> = this;
  // If we have resolved content, we try to initialize it first which
  // might put us back into one of the other states.
  switch (chunk.status) {
    case RESOLVED_MODEL:
      initializeModelChunk(chunk);
      break;
    case RESOLVED_MODULE:
      initializeModuleChunk(chunk);
      break;
  }
  // The status might have changed after initialization.
  switch (chunk.status) {
    case INITIALIZED:
      resolve(chunk.value);
      break;
    case PENDING:
    case BLOCKED:
      if (resolve) {
        if (chunk.value === null) {
          chunk.value = ([]: Array<(T) => mixed>);
        }
        chunk.value.push(resolve);
      }
      if (reject) {
        if (chunk.reason === null) {
          chunk.reason = ([]: Array<(mixed) => mixed>);
        }
        chunk.reason.push(reject);
      }
      break;
    default:
      if (reject) {
        reject(chunk.reason);
      }
      break;
  }
};

export type FindSourceMapURLCallback = (
  fileName: string,
  environmentName: string,
) => null | string;

export type Response = {
  _bundlerConfig: SSRModuleMap,
  _moduleLoading: ModuleLoading,
  _callServer: CallServerCallback,
  _encodeFormAction: void | EncodeFormActionCallback,
  _nonce: ?string,
  _chunks: Map<number, SomeChunk<any>>,
  _fromJSON: (key: string, value: JSONValue) => any,
  _stringDecoder: StringDecoder,
  _rowState: RowParserState,
  _rowID: number, // parts of a row ID parsed so far
  _rowTag: number, // 0 indicates that we're currently parsing the row ID
  _rowLength: number, // remaining bytes in the row. 0 indicates that we're looking for a newline.
  _buffer: Array<Uint8Array>, // chunks received so far as part of this row
  _tempRefs: void | TemporaryReferenceSet, // the set temporary references can be resolved from
  _debugRootTask?: null | ConsoleTask, // DEV-only
  _debugFindSourceMapURL?: void | FindSourceMapURLCallback, // DEV-only
  _replayConsole: boolean, // DEV-only
  _rootEnvironmentName: string, // DEV-only, the requested environment name.
};

function readChunk<T>(chunk: SomeChunk<T>): T {
  // If we have resolved content, we try to initialize it first which
  // might put us back into one of the other states.
  switch (chunk.status) {
    case RESOLVED_MODEL:
      initializeModelChunk(chunk);
      break;
    case RESOLVED_MODULE:
      initializeModuleChunk(chunk);
      break;
  }
  // The status might have changed after initialization.
  switch (chunk.status) {
    case INITIALIZED:
      return chunk.value;
    case PENDING:
    case BLOCKED:
      // eslint-disable-next-line no-throw-literal
      throw ((chunk: any): Thenable<T>);
    default:
      throw chunk.reason;
  }
}

export function getRoot<T>(response: Response): Thenable<T> {
  const chunk = getChunk(response, 0);
  return (chunk: any);
}

function createPendingChunk<T>(response: Response): PendingChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(PENDING, null, null, response);
}

function createBlockedChunk<T>(response: Response): BlockedChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(BLOCKED, null, null, response);
}

function createErrorChunk<T>(
  response: Response,
  error: Error | Postpone,
): ErroredChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(ERRORED, null, error, response);
}

function wakeChunk<T>(listeners: Array<(T) => mixed>, value: T): void {
  for (let i = 0; i < listeners.length; i++) {
    const listener = listeners[i];
    listener(value);
  }
}

function wakeChunkIfInitialized<T>(
  chunk: SomeChunk<T>,
  resolveListeners: Array<(T) => mixed>,
  rejectListeners: null | Array<(mixed) => mixed>,
): void {
  switch (chunk.status) {
    case INITIALIZED:
      wakeChunk(resolveListeners, chunk.value);
      break;
    case PENDING:
    case BLOCKED:
      if (chunk.value) {
        for (let i = 0; i < resolveListeners.length; i++) {
          chunk.value.push(resolveListeners[i]);
        }
      } else {
        chunk.value = resolveListeners;
      }

      if (chunk.reason) {
        if (rejectListeners) {
          for (let i = 0; i < rejectListeners.length; i++) {
            chunk.reason.push(rejectListeners[i]);
          }
        }
      } else {
        chunk.reason = rejectListeners;
      }

      break;
    case ERRORED:
      if (rejectListeners) {
        wakeChunk(rejectListeners, chunk.reason);
      }
      break;
  }
}

function triggerErrorOnChunk<T>(chunk: SomeChunk<T>, error: mixed): void {
  if (chunk.status !== PENDING && chunk.status !== BLOCKED) {
    if (enableFlightReadableStream) {
      // If we get more data to an already resolved ID, we assume that it's
      // a stream chunk since any other row shouldn't have more than one entry.
      const streamChunk: InitializedStreamChunk<any> = (chunk: any);
      const controller = streamChunk.reason;
      // $FlowFixMe[incompatible-call]: The error method should accept mixed.
      controller.error(error);
    }
    return;
  }
  const listeners = chunk.reason;
  const erroredChunk: ErroredChunk<T> = (chunk: any);
  erroredChunk.status = ERRORED;
  erroredChunk.reason = error;
  if (listeners !== null) {
    wakeChunk(listeners, error);
  }
}

function createResolvedModelChunk<T>(
  response: Response,
  value: UninitializedModel,
): ResolvedModelChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(RESOLVED_MODEL, value, null, response);
}

function createResolvedModuleChunk<T>(
  response: Response,
  value: ClientReference<T>,
): ResolvedModuleChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(RESOLVED_MODULE, value, null, response);
}

function createInitializedTextChunk(
  response: Response,
  value: string,
): InitializedChunk<string> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(INITIALIZED, value, null, response);
}

function createInitializedBufferChunk(
  response: Response,
  value: $ArrayBufferView | ArrayBuffer,
): InitializedChunk<Uint8Array> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(INITIALIZED, value, null, response);
}

function createInitializedIteratorResultChunk<T>(
  response: Response,
  value: T,
  done: boolean,
): InitializedChunk<IteratorResult<T, T>> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(
    INITIALIZED,
    {done: done, value: value},
    null,
    response,
  );
}

function createInitializedStreamChunk<
  T: ReadableStream | $AsyncIterable<any, any, void>,
>(
  response: Response,
  value: T,
  controller: FlightStreamController,
): InitializedChunk<T> {
  // We use the reason field to stash the controller since we already have that
  // field. It's a bit of a hack but efficient.
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(INITIALIZED, value, controller, response);
}

function createResolvedIteratorResultChunk<T>(
  response: Response,
  value: UninitializedModel,
  done: boolean,
): ResolvedModelChunk<IteratorResult<T, T>> {
  // To reuse code as much code as possible we add the wrapper element as part of the JSON.
  const iteratorResultJSON =
    (done ? '{"done":true,"value":' : '{"done":false,"value":') + value + '}';
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(RESOLVED_MODEL, iteratorResultJSON, null, response);
}

function resolveIteratorResultChunk<T>(
  chunk: SomeChunk<IteratorResult<T, T>>,
  value: UninitializedModel,
  done: boolean,
): void {
  // To reuse code as much code as possible we add the wrapper element as part of the JSON.
  const iteratorResultJSON =
    (done ? '{"done":true,"value":' : '{"done":false,"value":') + value + '}';
  resolveModelChunk(chunk, iteratorResultJSON);
}

function resolveModelChunk<T>(
  chunk: SomeChunk<T>,
  value: UninitializedModel,
): void {
  if (chunk.status !== PENDING) {
    if (enableFlightReadableStream) {
      // If we get more data to an already resolved ID, we assume that it's
      // a stream chunk since any other row shouldn't have more than one entry.
      const streamChunk: InitializedStreamChunk<any> = (chunk: any);
      const controller = streamChunk.reason;
      controller.enqueueModel(value);
    }
    return;
  }
  const resolveListeners = chunk.value;
  const rejectListeners = chunk.reason;
  const resolvedChunk: ResolvedModelChunk<T> = (chunk: any);
  resolvedChunk.status = RESOLVED_MODEL;
  resolvedChunk.value = value;
  if (resolveListeners !== null) {
    // This is unfortunate that we're reading this eagerly if
    // we already have listeners attached since they might no
    // longer be rendered or might not be the highest pri.
    initializeModelChunk(resolvedChunk);
    // The status might have changed after initialization.
    wakeChunkIfInitialized(chunk, resolveListeners, rejectListeners);
  }
}

function resolveModuleChunk<T>(
  chunk: SomeChunk<T>,
  value: ClientReference<T>,
): void {
  if (chunk.status !== PENDING && chunk.status !== BLOCKED) {
    // We already resolved. We didn't expect to see this.
    return;
  }
  const resolveListeners = chunk.value;
  const rejectListeners = chunk.reason;
  const resolvedChunk: ResolvedModuleChunk<T> = (chunk: any);
  resolvedChunk.status = RESOLVED_MODULE;
  resolvedChunk.value = value;
  if (resolveListeners !== null) {
    initializeModuleChunk(resolvedChunk);
    wakeChunkIfInitialized(chunk, resolveListeners, rejectListeners);
  }
}

type InitializationHandler = {
  parent: null | InitializationHandler,
  chunk: null | BlockedChunk<any>,
  value: any,
  deps: number,
  errored: boolean,
};
let initializingHandler: null | InitializationHandler = null;

function initializeModelChunk<T>(chunk: ResolvedModelChunk<T>): void {
  const prevHandler = initializingHandler;
  initializingHandler = null;

  const resolvedModel = chunk.value;

  // We go to the BLOCKED state until we've fully resolved this.
  // We do this before parsing in case we try to initialize the same chunk
  // while parsing the model. Such as in a cyclic reference.
  const cyclicChunk: BlockedChunk<T> = (chunk: any);
  cyclicChunk.status = BLOCKED;
  cyclicChunk.value = null;
  cyclicChunk.reason = null;

  try {
    const value: T = parseModel(chunk._response, resolvedModel);
    // Invoke any listeners added while resolving this model. I.e. cyclic
    // references. This may or may not fully resolve the model depending on
    // if they were blocked.
    const resolveListeners = cyclicChunk.value;
    if (resolveListeners !== null) {
      cyclicChunk.value = null;
      cyclicChunk.reason = null;
      wakeChunk(resolveListeners, value);
    }
    if (initializingHandler !== null) {
      if (initializingHandler.errored) {
        throw initializingHandler.value;
      }
      if (initializingHandler.deps > 0) {
        // We discovered new dependencies on modules that are not yet resolved.
        // We have to keep the BLOCKED state until they're resolved.
        initializingHandler.value = value;
        initializingHandler.chunk = cyclicChunk;
        return;
      }
    }
    const initializedChunk: InitializedChunk<T> = (chunk: any);
    initializedChunk.status = INITIALIZED;
    initializedChunk.value = value;
  } catch (error) {
    const erroredChunk: ErroredChunk<T> = (chunk: any);
    erroredChunk.status = ERRORED;
    erroredChunk.reason = error;
  } finally {
    initializingHandler = prevHandler;
  }
}

function initializeModuleChunk<T>(chunk: ResolvedModuleChunk<T>): void {
  try {
    const value: T = requireModule(chunk.value);
    const initializedChunk: InitializedChunk<T> = (chunk: any);
    initializedChunk.status = INITIALIZED;
    initializedChunk.value = value;
  } catch (error) {
    const erroredChunk: ErroredChunk<T> = (chunk: any);
    erroredChunk.status = ERRORED;
    erroredChunk.reason = error;
  }
}

// Report that any missing chunks in the model is now going to throw this
// error upon read. Also notify any pending promises.
export function reportGlobalError(response: Response, error: Error): void {
  response._chunks.forEach(chunk => {
    // If this chunk was already resolved or errored, it won't
    // trigger an error but if it wasn't then we need to
    // because we won't be getting any new data to resolve it.
    if (chunk.status === PENDING) {
      triggerErrorOnChunk(chunk, error);
    }
  });
}

function nullRefGetter() {
  if (__DEV__) {
    return null;
  }
}

function getServerComponentTaskName(componentInfo: ReactComponentInfo): string {
  return '<' + (componentInfo.name || '...') + '>';
}

function getTaskName(type: mixed): string {
  if (type === REACT_FRAGMENT_TYPE) {
    return '<>';
  }
  if (typeof type === 'function') {
    // This is a function so it must have been a Client Reference that resolved to
    // a function. We use "use client" to indicate that this is the boundary into
    // the client. There should only be one for any given owner chain.
    return '"use client"';
  }
  if (
    typeof type === 'object' &&
    type !== null &&
    type.$$typeof === REACT_LAZY_TYPE
  ) {
    if (type._init === readChunk) {
      // This is a lazy node created by Flight. It is probably a client reference.
      // We use the "use client" string to indicate that this is the boundary into
      // the client. There will only be one for any given owner chain.
      return '"use client"';
    }
    // We don't want to eagerly initialize the initializer in DEV mode so we can't
    // call it to extract the type so we don't know the type of this component.
    return '<...>';
  }
  try {
    const name = getComponentNameFromType(type);
    return name ? '<' + name + '>' : '<...>';
  } catch (x) {
    return '<...>';
  }
}

function createElement(
  response: Response,
  type: mixed,
  key: mixed,
  props: mixed,
  owner: null | ReactComponentInfo, // DEV-only
  stack: null | ReactStackTrace, // DEV-only
  validated: number, // DEV-only
):
  | React$Element<any>
  | LazyComponent<React$Element<any>, SomeChunk<React$Element<any>>> {
  let element: any;
  if (__DEV__ && enableRefAsProp) {
    // `ref` is non-enumerable in dev
    element = ({
      $$typeof: REACT_ELEMENT_TYPE,
      type,
      key,
      props,
      _owner: owner,
    }: any);
    Object.defineProperty(element, 'ref', {
      enumerable: false,
      get: nullRefGetter,
    });
  } else if (!__DEV__ && disableStringRefs) {
    element = ({
      // This tag allows us to uniquely identify this as a React Element
      $$typeof: REACT_ELEMENT_TYPE,

      type,
      key,
      ref: null,
      props,
    }: any);
  } else {
    element = ({
      // This tag allows us to uniquely identify this as a React Element
      $$typeof: REACT_ELEMENT_TYPE,

      type,
      key,
      ref: null,
      props,

      // Record the component responsible for creating this element.
      _owner: owner,
    }: any);
  }

  if (__DEV__) {
    // We don't really need to add any of these but keeping them for good measure.
    // Unfortunately, _store is enumerable in jest matchers so for equality to
    // work, I need to keep it or make _store non-enumerable in the other file.
    element._store = ({}: {
      validated?: number,
    });
    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: enableOwnerStacks ? validated : 1, // Whether the element has already been validated on the server.
    });
    // debugInfo contains Server Component debug information.
    Object.defineProperty(element, '_debugInfo', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: null,
    });
    let env = response._rootEnvironmentName;
    if (enableOwnerStacks) {
      if (owner !== null && owner.env != null) {
        // Interestingly we don't actually have the environment name of where
        // this JSX was created if it doesn't have an owner but if it does
        // it must be the same environment as the owner. We could send it separately
        // but it seems a bit unnecessary for this edge case.
        env = owner.env;
      }
      let normalizedStackTrace: null | Error = null;
      if (stack !== null) {
        // We create a fake stack and then create an Error object inside of it.
        // This means that the stack trace is now normalized into the native format
        // of the browser and the stack frames will have been registered with
        // source mapping information.
        // This can unfortunately happen within a user space callstack which will
        // remain on the stack.
        normalizedStackTrace = createFakeJSXCallStackInDEV(
          response,
          stack,
          env,
        );
      }
      Object.defineProperty(element, '_debugStack', {
        configurable: false,
        enumerable: false,
        writable: true,
        value: normalizedStackTrace,
      });

      let task: null | ConsoleTask = null;
      if (supportsCreateTask && stack !== null) {
        const createTaskFn = (console: any).createTask.bind(
          console,
          getTaskName(type),
        );
        const callStack = buildFakeCallStack(
          response,
          stack,
          env,
          createTaskFn,
        );
        // This owner should ideally have already been initialized to avoid getting
        // user stack frames on the stack.
        const ownerTask =
          owner === null ? null : initializeFakeTask(response, owner, env);
        if (ownerTask === null) {
          const rootTask = response._debugRootTask;
          if (rootTask != null) {
            task = rootTask.run(callStack);
          } else {
            task = callStack();
          }
        } else {
          task = ownerTask.run(callStack);
        }
      }
      Object.defineProperty(element, '_debugTask', {
        configurable: false,
        enumerable: false,
        writable: true,
        value: task,
      });

      // This owner should ideally have already been initialized to avoid getting
      // user stack frames on the stack.
      if (owner !== null) {
        initializeFakeStack(response, owner);
      }
    }
  }

  if (initializingHandler !== null) {
    const handler = initializingHandler;
    // We pop the stack to the previous outer handler before leaving the Element.
    // This is effectively the complete phase.
    initializingHandler = handler.parent;
    if (handler.errored) {
      // Something errored inside this Element's props. We can turn this Element
      // into a Lazy so that we can still render up until that Lazy is rendered.
      const erroredChunk: ErroredChunk<React$Element<any>> = createErrorChunk(
        response,
        handler.value,
      );
      if (__DEV__) {
        // Conceptually the error happened inside this Element but right before
        // it was rendered. We don't have a client side component to render but
        // we can add some DebugInfo to explain that this was conceptually a
        // Server side error that errored inside this element. That way any stack
        // traces will point to the nearest JSX that errored - e.g. during
        // serialization.
        const erroredComponent: ReactComponentInfo = {
          name: getComponentNameFromType(element.type) || '',
          owner: element._owner,
        };
        if (enableOwnerStacks) {
          // $FlowFixMe[cannot-write]
          erroredComponent.debugStack = element._debugStack;
          // $FlowFixMe[cannot-write]
          erroredComponent.debugTask = element._debugTask;
        }
        erroredChunk._debugInfo = [erroredComponent];
      }
      return createLazyChunkWrapper(erroredChunk);
    }
    if (handler.deps > 0) {
      // We have blocked references inside this Element but we can turn this into
      // a Lazy node referencing this Element to let everything around it proceed.
      const blockedChunk: BlockedChunk<React$Element<any>> =
        createBlockedChunk(response);
      handler.value = element;
      handler.chunk = blockedChunk;
      if (__DEV__) {
        const freeze = Object.freeze.bind(Object, element.props);
        blockedChunk.then(freeze, freeze);
      }
      return createLazyChunkWrapper(blockedChunk);
    }
  } else if (__DEV__) {
    // TODO: We should be freezing the element but currently, we might write into
    // _debugInfo later. We could move it into _store which remains mutable.
    Object.freeze(element.props);
  }

  return element;
}

function createLazyChunkWrapper<T>(
  chunk: SomeChunk<T>,
): LazyComponent<T, SomeChunk<T>> {
  const lazyType: LazyComponent<T, SomeChunk<T>> = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: chunk,
    _init: readChunk,
  };
  if (__DEV__) {
    // Ensure we have a live array to track future debug info.
    const chunkDebugInfo: ReactDebugInfo =
      chunk._debugInfo || (chunk._debugInfo = []);
    lazyType._debugInfo = chunkDebugInfo;
  }
  return lazyType;
}

function getChunk(response: Response, id: number): SomeChunk<any> {
  const chunks = response._chunks;
  let chunk = chunks.get(id);
  if (!chunk) {
    chunk = createPendingChunk(response);
    chunks.set(id, chunk);
  }
  return chunk;
}

function waitForReference<T>(
  referencedChunk: SomeChunk<T>,
  parentObject: Object,
  key: string,
  response: Response,
  map: (response: Response, model: any) => T,
  path: Array<string>,
): T {
  let handler: InitializationHandler;
  if (initializingHandler) {
    handler = initializingHandler;
    handler.deps++;
  } else {
    handler = initializingHandler = {
      parent: null,
      chunk: null,
      value: null,
      deps: 1,
      errored: false,
    };
  }

  function fulfill(value: any): void {
    for (let i = 1; i < path.length; i++) {
      while (value.$$typeof === REACT_LAZY_TYPE) {
        // We never expect to see a Lazy node on this path because we encode those as
        // separate models. This must mean that we have inserted an extra lazy node
        // e.g. to replace a blocked element. We must instead look for it inside.
        const chunk: SomeChunk<any> = value._payload;
        if (chunk === handler.chunk) {
          // This is a reference to the thing we're currently blocking. We can peak
          // inside of it to get the value.
          value = handler.value;
          continue;
        } else if (chunk.status === INITIALIZED) {
          value = chunk.value;
          continue;
        } else {
          // If we're not yet initialized we need to skip what we've already drilled
          // through and then wait for the next value to become available.
          path.splice(0, i - 1);
          chunk.then(fulfill, reject);
          return;
        }
      }
      value = value[path[i]];
    }
    parentObject[key] = map(response, value);

    // If this is the root object for a model reference, where `handler.value`
    // is a stale `null`, the resolved value can be used directly.
    if (key === '' && handler.value === null) {
      handler.value = parentObject[key];
    }

    // If the parent object is an unparsed React element tuple and its outlined
    // props have now been resolved, we also need to update the props of the
    // parsed element object (i.e. handler.value).
    if (
      parentObject[0] === REACT_ELEMENT_TYPE &&
      key === '3' &&
      typeof handler.value === 'object' &&
      handler.value !== null &&
      handler.value.$$typeof === REACT_ELEMENT_TYPE &&
      handler.value.props === null
    ) {
      handler.value.props = parentObject[key];
    }

    handler.deps--;

    if (handler.deps === 0) {
      const chunk = handler.chunk;
      if (chunk === null || chunk.status !== BLOCKED) {
        return;
      }
      const resolveListeners = chunk.value;
      const initializedChunk: InitializedChunk<T> = (chunk: any);
      initializedChunk.status = INITIALIZED;
      initializedChunk.value = handler.value;
      if (resolveListeners !== null) {
        wakeChunk(resolveListeners, handler.value);
      }
    }
  }

  function reject(error: mixed): void {
    if (handler.errored) {
      // We've already errored. We could instead build up an AggregateError
      // but if there are multiple errors we just take the first one like
      // Promise.all.
      return;
    }
    const blockedValue = handler.value;
    handler.errored = true;
    handler.value = error;
    const chunk = handler.chunk;
    if (chunk === null || chunk.status !== BLOCKED) {
      return;
    }

    if (__DEV__) {
      if (
        typeof blockedValue === 'object' &&
        blockedValue !== null &&
        blockedValue.$$typeof === REACT_ELEMENT_TYPE
      ) {
        const element = blockedValue;
        // Conceptually the error happened inside this Element but right before
        // it was rendered. We don't have a client side component to render but
        // we can add some DebugInfo to explain that this was conceptually a
        // Server side error that errored inside this element. That way any stack
        // traces will point to the nearest JSX that errored - e.g. during
        // serialization.
        const erroredComponent: ReactComponentInfo = {
          name: getComponentNameFromType(element.type) || '',
          owner: element._owner,
        };
        if (enableOwnerStacks) {
          // $FlowFixMe[cannot-write]
          erroredComponent.debugStack = element._debugStack;
          // $FlowFixMe[cannot-write]
          erroredComponent.debugTask = element._debugTask;
        }
        const chunkDebugInfo: ReactDebugInfo =
          chunk._debugInfo || (chunk._debugInfo = []);
        chunkDebugInfo.push(erroredComponent);
      }
    }

    triggerErrorOnChunk(chunk, error);
  }

  referencedChunk.then(fulfill, reject);

  // Return a place holder value for now.
  return (null: any);
}

function createServerReferenceProxy<A: Iterable<any>, T>(
  response: Response,
  metaData: {
    id: any,
    bound: null | Thenable<Array<any>>,
    name?: string, // DEV-only
    env?: string, // DEV-only
    location?: ReactCallSite, // DEV-only
  },
): (...A) => Promise<T> {
  return createBoundServerReference(
    metaData,
    response._callServer,
    response._encodeFormAction,
    __DEV__ ? response._debugFindSourceMapURL : undefined,
  );
}

function getOutlinedModel<T>(
  response: Response,
  reference: string,
  parentObject: Object,
  key: string,
  map: (response: Response, model: any) => T,
): T {
  const path = reference.split(':');
  const id = parseInt(path[0], 16);
  const chunk = getChunk(response, id);
  switch (chunk.status) {
    case RESOLVED_MODEL:
      initializeModelChunk(chunk);
      break;
    case RESOLVED_MODULE:
      initializeModuleChunk(chunk);
      break;
  }
  // The status might have changed after initialization.
  switch (chunk.status) {
    case INITIALIZED:
      let value = chunk.value;
      for (let i = 1; i < path.length; i++) {
        value = value[path[i]];
        if (value.$$typeof === REACT_LAZY_TYPE) {
          const referencedChunk: SomeChunk<any> = value._payload;
          if (referencedChunk.status === INITIALIZED) {
            value = referencedChunk.value;
          } else {
            return waitForReference(
              referencedChunk,
              parentObject,
              key,
              response,
              map,
              path.slice(i),
            );
          }
        }
      }
      const chunkValue = map(response, value);
      if (__DEV__ && chunk._debugInfo) {
        // If we have a direct reference to an object that was rendered by a synchronous
        // server component, it might have some debug info about how it was rendered.
        // We forward this to the underlying object. This might be a React Element or
        // an Array fragment.
        // If this was a string / number return value we lose the debug info. We choose
        // that tradeoff to allow sync server components to return plain values and not
        // use them as React Nodes necessarily. We could otherwise wrap them in a Lazy.
        if (
          typeof chunkValue === 'object' &&
          chunkValue !== null &&
          (isArray(chunkValue) ||
            typeof chunkValue[ASYNC_ITERATOR] === 'function' ||
            chunkValue.$$typeof === REACT_ELEMENT_TYPE) &&
          !chunkValue._debugInfo
        ) {
          // We should maybe use a unique symbol for arrays but this is a React owned array.
          // $FlowFixMe[prop-missing]: This should be added to elements.
          Object.defineProperty((chunkValue: any), '_debugInfo', {
            configurable: false,
            enumerable: false,
            writable: true,
            value: chunk._debugInfo,
          });
        }
      }
      return chunkValue;
    case PENDING:
    case BLOCKED:
      return waitForReference(chunk, parentObject, key, response, map, path);
    default:
      // This is an error. Instead of erroring directly, we're going to encode this on
      // an initialization handler so that we can catch it at the nearest Element.
      if (initializingHandler) {
        initializingHandler.errored = true;
        initializingHandler.value = chunk.reason;
      } else {
        initializingHandler = {
          parent: null,
          chunk: null,
          value: chunk.reason,
          deps: 0,
          errored: true,
        };
      }
      // Placeholder
      return (null: any);
  }
}

function createMap(
  response: Response,
  model: Array<[any, any]>,
): Map<any, any> {
  return new Map(model);
}

function createSet(response: Response, model: Array<any>): Set<any> {
  return new Set(model);
}

function createBlob(response: Response, model: Array<any>): Blob {
  return new Blob(model.slice(1), {type: model[0]});
}

function createFormData(
  response: Response,
  model: Array<[any, any]>,
): FormData {
  const formData = new FormData();
  for (let i = 0; i < model.length; i++) {
    formData.append(model[i][0], model[i][1]);
  }
  return formData;
}

function extractIterator(response: Response, model: Array<any>): Iterator<any> {
  // $FlowFixMe[incompatible-use]: This uses raw Symbols because we're extracting from a native array.
  return model[Symbol.iterator]();
}

function createModel(response: Response, model: any): any {
  return model;
}

function parseModelString(
  response: Response,
  parentObject: Object,
  key: string,
  value: string,
): any {
  if (value[0] === '$') {
    if (value === '$') {
      // A very common symbol.
      if (initializingHandler !== null && key === '0') {
        // We we already have an initializing handler and we're abound to enter
        // a new element, we need to shadow it because we're now in a new scope.
        // This is effectively the "begin" or "push" phase of Element parsing.
        // We'll pop later when we parse the array itself.
        initializingHandler = {
          parent: initializingHandler,
          chunk: null,
          value: null,
          deps: 0,
          errored: false,
        };
      }
      return REACT_ELEMENT_TYPE;
    }
    switch (value[1]) {
      case '$': {
        // This was an escaped string value.
        return value.slice(1);
      }
      case 'L': {
        // Lazy node
        const id = parseInt(value.slice(2), 16);
        const chunk = getChunk(response, id);
        // We create a React.lazy wrapper around any lazy values.
        // When passed into React, we'll know how to suspend on this.
        return createLazyChunkWrapper(chunk);
      }
      case '@': {
        // Promise
        if (value.length === 2) {
          // Infinite promise that never resolves.
          return new Promise(() => {});
        }
        const id = parseInt(value.slice(2), 16);
        const chunk = getChunk(response, id);
        return chunk;
      }
      case 'S': {
        // Symbol
        return Symbol.for(value.slice(2));
      }
      case 'F': {
        // Server Reference
        const ref = value.slice(2);
        return getOutlinedModel(
          response,
          ref,
          parentObject,
          key,
          createServerReferenceProxy,
        );
      }
      case 'T': {
        // Temporary Reference
        const reference = '$' + value.slice(2);
        const temporaryReferences = response._tempRefs;
        if (temporaryReferences == null) {
          throw new Error(
            'Missing a temporary reference set but the RSC response returned a temporary reference. ' +
              'Pass a temporaryReference option with the set that was used with the reply.',
          );
        }
        return readTemporaryReference(temporaryReferences, reference);
      }
      case 'Q': {
        // Map
        const ref = value.slice(2);
        return getOutlinedModel(response, ref, parentObject, key, createMap);
      }
      case 'W': {
        // Set
        const ref = value.slice(2);
        return getOutlinedModel(response, ref, parentObject, key, createSet);
      }
      case 'B': {
        // Blob
        if (enableBinaryFlight) {
          const ref = value.slice(2);
          return getOutlinedModel(response, ref, parentObject, key, createBlob);
        }
        return undefined;
      }
      case 'K': {
        // FormData
        const ref = value.slice(2);
        return getOutlinedModel(
          response,
          ref,
          parentObject,
          key,
          createFormData,
        );
      }
      case 'i': {
        // Iterator
        const ref = value.slice(2);
        return getOutlinedModel(
          response,
          ref,
          parentObject,
          key,
          extractIterator,
        );
      }
      case 'I': {
        // $Infinity
        return Infinity;
      }
      case '-': {
        // $-0 or $-Infinity
        if (value === '$-0') {
          return -0;
        } else {
          return -Infinity;
        }
      }
      case 'N': {
        // $NaN
        return NaN;
      }
      case 'u': {
        // matches "$undefined"
        // Special encoding for `undefined` which can't be serialized as JSON otherwise.
        return undefined;
      }
      case 'D': {
        // Date
        return new Date(Date.parse(value.slice(2)));
      }
      case 'n': {
        // BigInt
        return BigInt(value.slice(2));
      }
      case 'E': {
        if (__DEV__) {
          // In DEV mode we allow indirect eval to produce functions for logging.
          // This should not compile to eval() because then it has local scope access.
          try {
            // eslint-disable-next-line no-eval
            return (0, eval)(value.slice(2));
          } catch (x) {
            // We currently use this to express functions so we fail parsing it,
            // let's just return a blank function as a place holder.
            return function () {};
          }
        }
        // Fallthrough
      }
      case 'Y': {
        if (__DEV__) {
          // In DEV mode we encode omitted objects in logs as a getter that throws
          // so that when you try to access it on the client, you know why that
          // happened.
          Object.defineProperty(parentObject, key, {
            get: function () {
              // We intentionally don't throw an error object here because it looks better
              // without the stack in the console which isn't useful anyway.
              // eslint-disable-next-line no-throw-literal
              throw (
                'This object has been omitted by React in the console log ' +
                'to avoid sending too much data from the server. Try logging smaller ' +
                'or more specific objects.'
              );
            },
            enumerable: true,
            configurable: false,
          });
          return null;
        }
        // Fallthrough
      }
      default: {
        // We assume that anything else is a reference ID.
        const ref = value.slice(1);
        return getOutlinedModel(response, ref, parentObject, key, createModel);
      }
    }
  }
  return value;
}

function parseModelTuple(
  response: Response,
  value: {+[key: string]: JSONValue} | $ReadOnlyArray<JSONValue>,
): any {
  const tuple: [mixed, mixed, mixed, mixed] = (value: any);

  if (tuple[0] === REACT_ELEMENT_TYPE) {
    // TODO: Consider having React just directly accept these arrays as elements.
    // Or even change the ReactElement type to be an array.
    return createElement(
      response,
      tuple[1],
      tuple[2],
      tuple[3],
      __DEV__ ? (tuple: any)[4] : null,
      __DEV__ && enableOwnerStacks ? (tuple: any)[5] : null,
      __DEV__ && enableOwnerStacks ? (tuple: any)[6] : 0,
    );
  }
  return value;
}

function missingCall() {
  throw new Error(
    'Trying to call a function from "use server" but the callServer option ' +
      'was not implemented in your router runtime.',
  );
}

function ResponseInstance(
  this: $FlowFixMe,
  bundlerConfig: SSRModuleMap,
  moduleLoading: ModuleLoading,
  callServer: void | CallServerCallback,
  encodeFormAction: void | EncodeFormActionCallback,
  nonce: void | string,
  temporaryReferences: void | TemporaryReferenceSet,
  findSourceMapURL: void | FindSourceMapURLCallback,
  replayConsole: boolean,
  environmentName: void | string,
) {
  const chunks: Map<number, SomeChunk<any>> = new Map();
  this._bundlerConfig = bundlerConfig;
  this._moduleLoading = moduleLoading;
  this._callServer = callServer !== undefined ? callServer : missingCall;
  this._encodeFormAction = encodeFormAction;
  this._nonce = nonce;
  this._chunks = chunks;
  this._stringDecoder = createStringDecoder();
  this._fromJSON = (null: any);
  this._rowState = 0;
  this._rowID = 0;
  this._rowTag = 0;
  this._rowLength = 0;
  this._buffer = [];
  this._tempRefs = temporaryReferences;
  if (__DEV__) {
    const rootEnv = environmentName === undefined ? 'Server' : environmentName;
    if (supportsCreateTask) {
      // Any stacks that appear on the server need to be rooted somehow on the client
      // so we create a root Task for this response which will be the root owner for any
      // elements created by the server. We use the "use server" string to indicate that
      // this is where we enter the server from the client.
      // TODO: Make this string configurable.
      this._debugRootTask = (console: any).createTask(
        '"use ' + rootEnv.toLowerCase() + '"',
      );
    }
    this._debugFindSourceMapURL = findSourceMapURL;
    this._replayConsole = replayConsole;
    this._rootEnvironmentName = rootEnv;
  }
  // Don't inline this call because it causes closure to outline the call above.
  this._fromJSON = createFromJSONCallback(this);
}

export function createResponse(
  bundlerConfig: SSRModuleMap,
  moduleLoading: ModuleLoading,
  callServer: void | CallServerCallback,
  encodeFormAction: void | EncodeFormActionCallback,
  nonce: void | string,
  temporaryReferences: void | TemporaryReferenceSet,
  findSourceMapURL: void | FindSourceMapURLCallback,
  replayConsole: boolean,
  environmentName: void | string,
): Response {
  // $FlowFixMe[invalid-constructor]: the shapes are exact here but Flow doesn't like constructors
  return new ResponseInstance(
    bundlerConfig,
    moduleLoading,
    callServer,
    encodeFormAction,
    nonce,
    temporaryReferences,
    findSourceMapURL,
    replayConsole,
    environmentName,
  );
}

function resolveModel(
  response: Response,
  id: number,
  model: UninitializedModel,
): void {
  const chunks = response._chunks;
  const chunk = chunks.get(id);
  if (!chunk) {
    chunks.set(id, createResolvedModelChunk(response, model));
  } else {
    resolveModelChunk(chunk, model);
  }
}

function resolveText(response: Response, id: number, text: string): void {
  const chunks = response._chunks;
  if (enableFlightReadableStream) {
    const chunk = chunks.get(id);
    if (chunk && chunk.status !== PENDING) {
      // If we get more data to an already resolved ID, we assume that it's
      // a stream chunk since any other row shouldn't have more than one entry.
      const streamChunk: InitializedStreamChunk<any> = (chunk: any);
      const controller = streamChunk.reason;
      controller.enqueueValue(text);
      return;
    }
  }
  chunks.set(id, createInitializedTextChunk(response, text));
}

function resolveBuffer(
  response: Response,
  id: number,
  buffer: $ArrayBufferView | ArrayBuffer,
): void {
  const chunks = response._chunks;
  if (enableFlightReadableStream) {
    const chunk = chunks.get(id);
    if (chunk && chunk.status !== PENDING) {
      // If we get more data to an already resolved ID, we assume that it's
      // a stream chunk since any other row shouldn't have more than one entry.
      const streamChunk: InitializedStreamChunk<any> = (chunk: any);
      const controller = streamChunk.reason;
      controller.enqueueValue(buffer);
      return;
    }
  }
  chunks.set(id, createInitializedBufferChunk(response, buffer));
}

function resolveModule(
  response: Response,
  id: number,
  model: UninitializedModel,
): void {
  const chunks = response._chunks;
  const chunk = chunks.get(id);
  const clientReferenceMetadata: ClientReferenceMetadata = parseModel(
    response,
    model,
  );
  const clientReference = resolveClientReference<$FlowFixMe>(
    response._bundlerConfig,
    clientReferenceMetadata,
  );

  prepareDestinationForModule(
    response._moduleLoading,
    response._nonce,
    clientReferenceMetadata,
  );

  // TODO: Add an option to encode modules that are lazy loaded.
  // For now we preload all modules as early as possible since it's likely
  // that we'll need them.
  const promise = preloadModule(clientReference);
  if (promise) {
    let blockedChunk: BlockedChunk<any>;
    if (!chunk) {
      // Technically, we should just treat promise as the chunk in this
      // case. Because it'll just behave as any other promise.
      blockedChunk = createBlockedChunk(response);
      chunks.set(id, blockedChunk);
    } else {
      // This can't actually happen because we don't have any forward
      // references to modules.
      blockedChunk = (chunk: any);
      blockedChunk.status = BLOCKED;
    }
    promise.then(
      () => resolveModuleChunk(blockedChunk, clientReference),
      error => triggerErrorOnChunk(blockedChunk, error),
    );
  } else {
    if (!chunk) {
      chunks.set(id, createResolvedModuleChunk(response, clientReference));
    } else {
      // This can't actually happen because we don't have any forward
      // references to modules.
      resolveModuleChunk(chunk, clientReference);
    }
  }
}

function resolveStream<T: ReadableStream | $AsyncIterable<any, any, void>>(
  response: Response,
  id: number,
  stream: T,
  controller: FlightStreamController,
): void {
  const chunks = response._chunks;
  const chunk = chunks.get(id);
  if (!chunk) {
    chunks.set(id, createInitializedStreamChunk(response, stream, controller));
    return;
  }
  if (chunk.status !== PENDING) {
    // We already resolved. We didn't expect to see this.
    return;
  }
  const resolveListeners = chunk.value;
  const resolvedChunk: InitializedStreamChunk<T> = (chunk: any);
  resolvedChunk.status = INITIALIZED;
  resolvedChunk.value = stream;
  resolvedChunk.reason = controller;
  if (resolveListeners !== null) {
    wakeChunk(resolveListeners, chunk.value);
  }
}

function startReadableStream<T>(
  response: Response,
  id: number,
  type: void | 'bytes',
): void {
  let controller: ReadableStreamController = (null: any);
  const stream = new ReadableStream({
    type: type,
    start(c) {
      controller = c;
    },
  });
  let previousBlockedChunk: SomeChunk<T> | null = null;
  const flightController = {
    enqueueValue(value: T): void {
      if (previousBlockedChunk === null) {
        controller.enqueue(value);
      } else {
        // We're still waiting on a previous chunk so we can't enqueue quite yet.
        previousBlockedChunk.then(function () {
          controller.enqueue(value);
        });
      }
    },
    enqueueModel(json: UninitializedModel): void {
      if (previousBlockedChunk === null) {
        // If we're not blocked on any other chunks, we can try to eagerly initialize
        // this as a fast-path to avoid awaiting them.
        const chunk: ResolvedModelChunk<T> = createResolvedModelChunk(
          response,
          json,
        );
        initializeModelChunk(chunk);
        const initializedChunk: SomeChunk<T> = chunk;
        if (initializedChunk.status === INITIALIZED) {
          controller.enqueue(initializedChunk.value);
        } else {
          chunk.then(
            v => controller.enqueue(v),
            e => controller.error((e: any)),
          );
          previousBlockedChunk = chunk;
        }
      } else {
        // We're still waiting on a previous chunk so we can't enqueue quite yet.
        const blockedChunk = previousBlockedChunk;
        const chunk: SomeChunk<T> = createPendingChunk(response);
        chunk.then(
          v => controller.enqueue(v),
          e => controller.error((e: any)),
        );
        previousBlockedChunk = chunk;
        blockedChunk.then(function () {
          if (previousBlockedChunk === chunk) {
            // We were still the last chunk so we can now clear the queue and return
            // to synchronous emitting.
            previousBlockedChunk = null;
          }
          resolveModelChunk(chunk, json);
        });
      }
    },
    close(json: UninitializedModel): void {
      if (previousBlockedChunk === null) {
        controller.close();
      } else {
        const blockedChunk = previousBlockedChunk;
        // We shouldn't get any more enqueues after this so we can set it back to null.
        previousBlockedChunk = null;
        blockedChunk.then(() => controller.close());
      }
    },
    error(error: mixed): void {
      if (previousBlockedChunk === null) {
        // $FlowFixMe[incompatible-call]
        controller.error(error);
      } else {
        const blockedChunk = previousBlockedChunk;
        // We shouldn't get any more enqueues after this so we can set it back to null.
        previousBlockedChunk = null;
        blockedChunk.then(() => controller.error((error: any)));
      }
    },
  };
  resolveStream(response, id, stream, flightController);
}

function asyncIterator(this: $AsyncIterator<any, any, void>) {
  // Self referencing iterator.
  return this;
}

function createIterator<T>(
  next: (arg: void) => SomeChunk<IteratorResult<T, T>>,
): $AsyncIterator<T, T, void> {
  const iterator: any = {
    next: next,
    // TODO: Add return/throw as options for aborting.
  };
  // TODO: The iterator could inherit the AsyncIterator prototype which is not exposed as
  // a global but exists as a prototype of an AsyncGenerator. However, it's not needed
  // to satisfy the iterable protocol.
  (iterator: any)[ASYNC_ITERATOR] = asyncIterator;
  return iterator;
}

function startAsyncIterable<T>(
  response: Response,
  id: number,
  iterator: boolean,
): void {
  const buffer: Array<SomeChunk<IteratorResult<T, T>>> = [];
  let closed = false;
  let nextWriteIndex = 0;
  const flightController = {
    enqueueValue(value: T): void {
      if (nextWriteIndex === buffer.length) {
        buffer[nextWriteIndex] = createInitializedIteratorResultChunk(
          response,
          value,
          false,
        );
      } else {
        const chunk: PendingChunk<IteratorResult<T, T>> = (buffer[
          nextWriteIndex
        ]: any);
        const resolveListeners = chunk.value;
        const rejectListeners = chunk.reason;
        const initializedChunk: InitializedChunk<IteratorResult<T, T>> =
          (chunk: any);
        initializedChunk.status = INITIALIZED;
        initializedChunk.value = {done: false, value: value};
        if (resolveListeners !== null) {
          wakeChunkIfInitialized(chunk, resolveListeners, rejectListeners);
        }
      }
      nextWriteIndex++;
    },
    enqueueModel(value: UninitializedModel): void {
      if (nextWriteIndex === buffer.length) {
        buffer[nextWriteIndex] = createResolvedIteratorResultChunk(
          response,
          value,
          false,
        );
      } else {
        resolveIteratorResultChunk(buffer[nextWriteIndex], value, false);
      }
      nextWriteIndex++;
    },
    close(value: UninitializedModel): void {
      closed = true;
      if (nextWriteIndex === buffer.length) {
        buffer[nextWriteIndex] = createResolvedIteratorResultChunk(
          response,
          value,
          true,
        );
      } else {
        resolveIteratorResultChunk(buffer[nextWriteIndex], value, true);
      }
      nextWriteIndex++;
      while (nextWriteIndex < buffer.length) {
        // In generators, any extra reads from the iterator have the value undefined.
        resolveIteratorResultChunk(
          buffer[nextWriteIndex++],
          '"$undefined"',
          true,
        );
      }
    },
    error(error: Error): void {
      closed = true;
      if (nextWriteIndex === buffer.length) {
        buffer[nextWriteIndex] =
          createPendingChunk<IteratorResult<T, T>>(response);
      }
      while (nextWriteIndex < buffer.length) {
        triggerErrorOnChunk(buffer[nextWriteIndex++], error);
      }
    },
  };
  const iterable: $AsyncIterable<T, T, void> = {
    [ASYNC_ITERATOR](): $AsyncIterator<T, T, void> {
      let nextReadIndex = 0;
      return createIterator(arg => {
        if (arg !== undefined) {
          throw new Error(
            'Values cannot be passed to next() of AsyncIterables passed to Client Components.',
          );
        }
        if (nextReadIndex === buffer.length) {
          if (closed) {
            // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
            return new ReactPromise(
              INITIALIZED,
              {done: true, value: undefined},
              null,
              response,
            );
          }
          buffer[nextReadIndex] =
            createPendingChunk<IteratorResult<T, T>>(response);
        }
        return buffer[nextReadIndex++];
      });
    },
  };
  // TODO: If it's a single shot iterator we can optimize memory by cleaning up the buffer after
  // reading through the end, but currently we favor code size over this optimization.
  resolveStream(
    response,
    id,
    iterator ? iterable[ASYNC_ITERATOR]() : iterable,
    flightController,
  );
}

function stopStream(
  response: Response,
  id: number,
  row: UninitializedModel,
): void {
  const chunks = response._chunks;
  const chunk = chunks.get(id);
  if (!chunk || chunk.status !== INITIALIZED) {
    // We didn't expect not to have an existing stream;
    return;
  }
  const streamChunk: InitializedStreamChunk<any> = (chunk: any);
  const controller = streamChunk.reason;
  controller.close(row === '' ? '"$undefined"' : row);
}

function formatV8Stack(
  errorName: string,
  errorMessage: string,
  stack: null | ReactStackTrace,
): string {
  let v8StyleStack = errorName + ': ' + errorMessage;
  if (stack) {
    for (let i = 0; i < stack.length; i++) {
      const frame = stack[i];
      const [name, filename, line, col] = frame;
      if (!name) {
        v8StyleStack += '\n    at ' + filename + ':' + line + ':' + col;
      } else {
        v8StyleStack +=
          '\n    at ' + name + ' (' + filename + ':' + line + ':' + col + ')';
      }
    }
  }
  return v8StyleStack;
}

type ErrorWithDigest = Error & {digest?: string};
function resolveErrorProd(
  response: Response,
  id: number,
  digest: string,
): void {
  if (__DEV__) {
    // These errors should never make it into a build so we don't need to encode them in codes.json
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'resolveErrorProd should never be called in development mode. Use resolveErrorDev instead. This is a bug in React.',
    );
  }
  const error = new Error(
    'An error occurred in the Server Components render. The specific message is omitted in production' +
      ' builds to avoid leaking sensitive details. A digest property is included on this error instance which' +
      ' may provide additional details about the nature of the error.',
  );
  error.stack = 'Error: ' + error.message;
  (error: any).digest = digest;
  const errorWithDigest: ErrorWithDigest = (error: any);
  const chunks = response._chunks;
  const chunk = chunks.get(id);
  if (!chunk) {
    chunks.set(id, createErrorChunk(response, errorWithDigest));
  } else {
    triggerErrorOnChunk(chunk, errorWithDigest);
  }
}

function resolveErrorDev(
  response: Response,
  id: number,
  digest: string,
  message: string,
  stack: ReactStackTrace,
  env: string,
): void {
  if (!__DEV__) {
    // These errors should never make it into a build so we don't need to encode them in codes.json
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'resolveErrorDev should never be called in production mode. Use resolveErrorProd instead. This is a bug in React.',
    );
  }

  let error;
  if (!enableOwnerStacks) {
    // Executing Error within a native stack isn't really limited to owner stacks
    // but we gate it behind the same flag for now while iterating.
    // eslint-disable-next-line react-internal/prod-error-codes
    error = Error(
      message ||
        'An error occurred in the Server Components render but no message was provided',
    );
    // For backwards compat we use the V8 formatting when the flag is off.
    error.stack = formatV8Stack(error.name, error.message, stack);
  } else {
    const callStack = buildFakeCallStack(
      response,
      stack,
      env,
      // $FlowFixMe[incompatible-use]
      Error.bind(
        null,
        message ||
          'An error occurred in the Server Components render but no message was provided',
      ),
    );
    const rootTask = getRootTask(response, env);
    if (rootTask != null) {
      error = rootTask.run(callStack);
    } else {
      error = callStack();
    }
  }

  (error: any).digest = digest;
  (error: any).environmentName = env;
  const errorWithDigest: ErrorWithDigest = (error: any);
  const chunks = response._chunks;
  const chunk = chunks.get(id);
  if (!chunk) {
    chunks.set(id, createErrorChunk(response, errorWithDigest));
  } else {
    triggerErrorOnChunk(chunk, errorWithDigest);
  }
}

function resolvePostponeProd(response: Response, id: number): void {
  if (__DEV__) {
    // These errors should never make it into a build so we don't need to encode them in codes.json
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'resolvePostponeProd should never be called in development mode. Use resolvePostponeDev instead. This is a bug in React.',
    );
  }
  const error = new Error(
    'A Server Component was postponed. The reason is omitted in production' +
      ' builds to avoid leaking sensitive details.',
  );
  const postponeInstance: Postpone = (error: any);
  postponeInstance.$$typeof = REACT_POSTPONE_TYPE;
  postponeInstance.stack = 'Error: ' + error.message;
  const chunks = response._chunks;
  const chunk = chunks.get(id);
  if (!chunk) {
    chunks.set(id, createErrorChunk(response, postponeInstance));
  } else {
    triggerErrorOnChunk(chunk, postponeInstance);
  }
}

function resolvePostponeDev(
  response: Response,
  id: number,
  reason: string,
  stack: ReactStackTrace,
  env: string,
): void {
  if (!__DEV__) {
    // These errors should never make it into a build so we don't need to encode them in codes.json
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'resolvePostponeDev should never be called in production mode. Use resolvePostponeProd instead. This is a bug in React.',
    );
  }
  let postponeInstance: Postpone;
  if (!enableOwnerStacks) {
    // Executing Error within a native stack isn't really limited to owner stacks
    // but we gate it behind the same flag for now while iterating.
    // eslint-disable-next-line react-internal/prod-error-codes
    postponeInstance = (Error(reason || ''): any);
    postponeInstance.$$typeof = REACT_POSTPONE_TYPE;
    // For backwards compat we use the V8 formatting when the flag is off.
    postponeInstance.stack = formatV8Stack(
      postponeInstance.name,
      postponeInstance.message,
      stack,
    );
  } else {
    const callStack = buildFakeCallStack(
      response,
      stack,
      env,
      // $FlowFixMe[incompatible-use]
      Error.bind(null, reason || ''),
    );
    const rootTask = response._debugRootTask;
    if (rootTask != null) {
      postponeInstance = rootTask.run(callStack);
    } else {
      postponeInstance = callStack();
    }
    postponeInstance.$$typeof = REACT_POSTPONE_TYPE;
  }
  const chunks = response._chunks;
  const chunk = chunks.get(id);
  if (!chunk) {
    chunks.set(id, createErrorChunk(response, postponeInstance));
  } else {
    triggerErrorOnChunk(chunk, postponeInstance);
  }
}

function resolveHint<Code: HintCode>(
  response: Response,
  code: Code,
  model: UninitializedModel,
): void {
  const hintModel: HintModel<Code> = parseModel(response, model);
  dispatchHint(code, hintModel);
}

const supportsCreateTask =
  __DEV__ && enableOwnerStacks && !!(console: any).createTask;

type FakeFunction<T> = (() => T) => T;
const fakeFunctionCache: Map<string, FakeFunction<any>> = __DEV__
  ? new Map()
  : (null: any);

let fakeFunctionIdx = 0;
function createFakeFunction<T>(
  name: string,
  filename: string,
  sourceMap: null | string,
  line: number,
  col: number,
  environmentName: string,
): FakeFunction<T> {
  // This creates a fake copy of a Server Module. It represents a module that has already
  // executed on the server but we re-execute a blank copy for its stack frames on the client.

  const comment =
    '/* This module was rendered by a Server Component. Turn on Source Maps to see the server source. */';

  if (!name) {
    // An eval:ed function with no name gets the name "eval". We give it something more descriptive.
    name = '<anonymous>';
  }
  const encodedName = JSON.stringify(name);
  // We generate code where the call is at the line and column of the server executed code.
  // This allows us to use the original source map as the source map of this fake file to
  // point to the original source.
  let code;
  if (line <= 1) {
    const minSize = encodedName.length + 7;
    code =
      '({' +
      encodedName +
      ':_=>' +
      ' '.repeat(col < minSize ? 0 : col - minSize) +
      '_()})\n' +
      comment;
  } else {
    code =
      comment +
      '\n'.repeat(line - 2) +
      '({' +
      encodedName +
      ':_=>\n' +
      ' '.repeat(col < 1 ? 0 : col - 1) +
      '_()})';
  }

  if (filename.startsWith('/')) {
    // If the filename starts with `/` we assume that it is a file system file
    // rather than relative to the current host. Since on the server fully qualified
    // stack traces use the file path.
    // TODO: What does this look like on Windows?
    filename = 'file://' + filename;
  }

  if (sourceMap) {
    // We use the prefix rsc://React/ to separate these from other files listed in
    // the Chrome DevTools. We need a "host name" and not just a protocol because
    // otherwise the group name becomes the root folder. Ideally we don't want to
    // show these at all but there's two reasons to assign a fake URL.
    // 1) A printed stack trace string needs a unique URL to be able to source map it.
    // 2) If source maps are disabled or fails, you should at least be able to tell
    //    which file it was.
    code +=
      '\n//# sourceURL=rsc://React/' +
      encodeURIComponent(environmentName) +
      '/' +
      filename +
      '?' +
      fakeFunctionIdx++;
    code += '\n//# sourceMappingURL=' + sourceMap;
  } else if (filename) {
    code += '\n//# sourceURL=' + filename;
  }

  let fn: FakeFunction<T>;
  try {
    // eslint-disable-next-line no-eval
    fn = (0, eval)(code)[name];
  } catch (x) {
    // If eval fails, such as if in an environment that doesn't support it,
    // we fallback to creating a function here. It'll still have the right
    // name but it'll lose line/column number and file name.
    fn = function (_) {
      return _();
    };
  }
  return fn;
}

function buildFakeCallStack<T>(
  response: Response,
  stack: ReactStackTrace,
  environmentName: string,
  innerCall: () => T,
): () => T {
  let callStack = innerCall;
  for (let i = 0; i < stack.length; i++) {
    const frame = stack[i];
    const frameKey = frame.join('-') + '-' + environmentName;
    let fn = fakeFunctionCache.get(frameKey);
    if (fn === undefined) {
      const [name, filename, line, col] = frame;
      const findSourceMapURL = response._debugFindSourceMapURL;
      const sourceMap = findSourceMapURL
        ? findSourceMapURL(filename, environmentName)
        : null;
      fn = createFakeFunction(
        name,
        filename,
        sourceMap,
        line,
        col,
        environmentName,
      );
      // TODO: This cache should technically live on the response since the _debugFindSourceMapURL
      // function is an input and can vary by response.
      fakeFunctionCache.set(frameKey, fn);
    }
    callStack = fn.bind(null, callStack);
  }
  return callStack;
}

function getRootTask(
  response: Response,
  childEnvironmentName: string,
): null | ConsoleTask {
  const rootTask = response._debugRootTask;
  if (!rootTask) {
    return null;
  }
  if (response._rootEnvironmentName !== childEnvironmentName) {
    // If the root most owner component is itself in a different environment than the requested
    // environment then we create an extra task to indicate that we're transitioning into it.
    // Like if one environment just requests another environment.
    const createTaskFn = (console: any).createTask.bind(
      console,
      '"use ' + childEnvironmentName.toLowerCase() + '"',
    );
    return rootTask.run(createTaskFn);
  }
  return rootTask;
}

function initializeFakeTask(
  response: Response,
  debugInfo: ReactComponentInfo | ReactAsyncInfo,
  childEnvironmentName: string,
): null | ConsoleTask {
  if (!supportsCreateTask) {
    return null;
  }
  const componentInfo: ReactComponentInfo = (debugInfo: any); // Refined
  if (debugInfo.stack == null) {
    // If this is an error, we should've really already initialized the task.
    // If it's null, we can't initialize a task.
    return null;
  }
  const stack = debugInfo.stack;
  const env: string =
    componentInfo.env == null
      ? response._rootEnvironmentName
      : componentInfo.env;
  if (env !== childEnvironmentName) {
    // This is the boundary between two environments so we'll annotate the task name.
    // That is unusual so we don't cache it.
    const ownerTask =
      componentInfo.owner == null
        ? null
        : initializeFakeTask(response, componentInfo.owner, env);
    return buildFakeTask(
      response,
      ownerTask,
      stack,
      '"use ' + childEnvironmentName.toLowerCase() + '"',
      env,
    );
  } else {
    const cachedEntry = componentInfo.debugTask;
    if (cachedEntry !== undefined) {
      return cachedEntry;
    }
    const ownerTask =
      componentInfo.owner == null
        ? null
        : initializeFakeTask(response, componentInfo.owner, env);
    // $FlowFixMe[cannot-write]: We consider this part of initialization.
    return (componentInfo.debugTask = buildFakeTask(
      response,
      ownerTask,
      stack,
      getServerComponentTaskName(componentInfo),
      env,
    ));
  }
}

function buildFakeTask(
  response: Response,
  ownerTask: null | ConsoleTask,
  stack: ReactStackTrace,
  taskName: string,
  env: string,
): ConsoleTask {
  const createTaskFn = (console: any).createTask.bind(console, taskName);
  const callStack = buildFakeCallStack(response, stack, env, createTaskFn);
  if (ownerTask === null) {
    const rootTask = getRootTask(response, env);
    if (rootTask != null) {
      return rootTask.run(callStack);
    } else {
      return callStack();
    }
  } else {
    return ownerTask.run(callStack);
  }
}

const createFakeJSXCallStack = {
  'react-stack-bottom-frame': function (
    response: Response,
    stack: ReactStackTrace,
    environmentName: string,
  ): Error {
    const callStackForError = buildFakeCallStack(
      response,
      stack,
      environmentName,
      fakeJSXCallSite,
    );
    return callStackForError();
  },
};

const createFakeJSXCallStackInDEV: (
  response: Response,
  stack: ReactStackTrace,
  environmentName: string,
) => Error = __DEV__
  ? // We use this technique to trick minifiers to preserve the function name.
    (createFakeJSXCallStack['react-stack-bottom-frame'].bind(
      createFakeJSXCallStack,
    ): any)
  : (null: any);

/** @noinline */
function fakeJSXCallSite() {
  // This extra call frame represents the JSX creation function. We always pop this frame
  // off before presenting so it needs to be part of the stack.
  return new Error('react-stack-top-frame');
}

function initializeFakeStack(
  response: Response,
  debugInfo: ReactComponentInfo | ReactAsyncInfo,
): void {
  const cachedEntry = debugInfo.debugStack;
  if (cachedEntry !== undefined) {
    return;
  }
  if (debugInfo.stack != null) {
    const stack = debugInfo.stack;
    const env = debugInfo.env == null ? '' : debugInfo.env;
    // $FlowFixMe[cannot-write]
    // $FlowFixMe[prop-missing]
    debugInfo.debugStack = createFakeJSXCallStackInDEV(response, stack, env);
  }
  if (debugInfo.owner != null) {
    // Initialize any owners not yet initialized.
    initializeFakeStack(response, debugInfo.owner);
  }
}

function resolveDebugInfo(
  response: Response,
  id: number,
  debugInfo: ReactComponentInfo | ReactAsyncInfo,
): void {
  if (!__DEV__) {
    // These errors should never make it into a build so we don't need to encode them in codes.json
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'resolveDebugInfo should never be called in production mode. This is a bug in React.',
    );
  }
  // We eagerly initialize the fake task because this resolving happens outside any
  // render phase so we're not inside a user space stack at this point. If we waited
  // to initialize it when we need it, we might be inside user code.
  const env =
    debugInfo.env === undefined ? response._rootEnvironmentName : debugInfo.env;
  initializeFakeTask(response, debugInfo, env);
  initializeFakeStack(response, debugInfo);

  const chunk = getChunk(response, id);
  const chunkDebugInfo: ReactDebugInfo =
    chunk._debugInfo || (chunk._debugInfo = []);
  chunkDebugInfo.push(debugInfo);
}

let currentOwnerInDEV: null | ReactComponentInfo = null;
function getCurrentStackInDEV(): string {
  if (__DEV__) {
    if (enableOwnerStacks) {
      const owner: null | ReactComponentInfo = currentOwnerInDEV;
      if (owner === null) {
        return '';
      }
      return getOwnerStackByComponentInfoInDev(owner);
    }
    // We don't have Parent Stacks in Flight.
    return '';
  }
  return '';
}

function resolveConsoleEntry(
  response: Response,
  value: UninitializedModel,
): void {
  if (!__DEV__) {
    // These errors should never make it into a build so we don't need to encode them in codes.json
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'resolveConsoleEntry should never be called in production mode. This is a bug in React.',
    );
  }

  if (!response._replayConsole) {
    return;
  }

  const payload: [
    string,
    ReactStackTrace,
    null | ReactComponentInfo,
    string,
    mixed,
  ] = parseModel(response, value);
  const methodName = payload[0];
  const stackTrace = payload[1];
  const owner = payload[2];
  const env = payload[3];
  const args = payload.slice(4);

  // There really shouldn't be anything else on the stack atm.
  const prevStack = ReactSharedInternals.getCurrentStack;
  ReactSharedInternals.getCurrentStack = getCurrentStackInDEV;
  currentOwnerInDEV = owner;

  try {
    if (!enableOwnerStacks) {
      // Printing with stack isn't really limited to owner stacks but
      // we gate it behind the same flag for now while iterating.
      bindToConsole(methodName, args, env)();
      return;
    }
    const callStack = buildFakeCallStack(
      response,
      stackTrace,
      env,
      bindToConsole(methodName, args, env),
    );
    if (owner != null) {
      const task = initializeFakeTask(response, owner, env);
      initializeFakeStack(response, owner);
      if (task !== null) {
        task.run(callStack);
        return;
      }
      // TODO: Set the current owner so that captureOwnerStack() adds the component
      // stack during the replay - if needed.
    }
    const rootTask = getRootTask(response, env);
    if (rootTask != null) {
      rootTask.run(callStack);
      return;
    }
    callStack();
  } finally {
    ReactSharedInternals.getCurrentStack = prevStack;
  }
}

function mergeBuffer(
  buffer: Array<Uint8Array>,
  lastChunk: Uint8Array,
): Uint8Array {
  const l = buffer.length;
  // Count the bytes we'll need
  let byteLength = lastChunk.length;
  for (let i = 0; i < l; i++) {
    byteLength += buffer[i].byteLength;
  }
  // Allocate enough contiguous space
  const result = new Uint8Array(byteLength);
  let offset = 0;
  // Copy all the buffers into it.
  for (let i = 0; i < l; i++) {
    const chunk = buffer[i];
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  result.set(lastChunk, offset);
  return result;
}

function resolveTypedArray(
  response: Response,
  id: number,
  buffer: Array<Uint8Array>,
  lastChunk: Uint8Array,
  constructor: any,
  bytesPerElement: number,
): void {
  // If the view fits into one original buffer, we just reuse that buffer instead of
  // copying it out to a separate copy. This means that it's not always possible to
  // transfer these values to other threads without copying first since they may
  // share array buffer. For this to work, it must also have bytes aligned to a
  // multiple of a size of the type.
  const chunk =
    buffer.length === 0 && lastChunk.byteOffset % bytesPerElement === 0
      ? lastChunk
      : mergeBuffer(buffer, lastChunk);
  // TODO: The transfer protocol of RSC is little-endian. If the client isn't little-endian
  // we should convert it instead. In practice big endian isn't really Web compatible so it's
  // somewhat safe to assume that browsers aren't going to run it, but maybe there's some SSR
  // server that's affected.
  const view: $ArrayBufferView = new constructor(
    chunk.buffer,
    chunk.byteOffset,
    chunk.byteLength / bytesPerElement,
  );
  resolveBuffer(response, id, view);
}

function processFullBinaryRow(
  response: Response,
  id: number,
  tag: number,
  buffer: Array<Uint8Array>,
  chunk: Uint8Array,
): void {
  if (enableBinaryFlight) {
    switch (tag) {
      case 65 /* "A" */:
        // We must always clone to extract it into a separate buffer instead of just a view.
        resolveBuffer(response, id, mergeBuffer(buffer, chunk).buffer);
        return;
      case 79 /* "O" */:
        resolveTypedArray(response, id, buffer, chunk, Int8Array, 1);
        return;
      case 111 /* "o" */:
        resolveBuffer(
          response,
          id,
          buffer.length === 0 ? chunk : mergeBuffer(buffer, chunk),
        );
        return;
      case 85 /* "U" */:
        resolveTypedArray(response, id, buffer, chunk, Uint8ClampedArray, 1);
        return;
      case 83 /* "S" */:
        resolveTypedArray(response, id, buffer, chunk, Int16Array, 2);
        return;
      case 115 /* "s" */:
        resolveTypedArray(response, id, buffer, chunk, Uint16Array, 2);
        return;
      case 76 /* "L" */:
        resolveTypedArray(response, id, buffer, chunk, Int32Array, 4);
        return;
      case 108 /* "l" */:
        resolveTypedArray(response, id, buffer, chunk, Uint32Array, 4);
        return;
      case 71 /* "G" */:
        resolveTypedArray(response, id, buffer, chunk, Float32Array, 4);
        return;
      case 103 /* "g" */:
        resolveTypedArray(response, id, buffer, chunk, Float64Array, 8);
        return;
      case 77 /* "M" */:
        resolveTypedArray(response, id, buffer, chunk, BigInt64Array, 8);
        return;
      case 109 /* "m" */:
        resolveTypedArray(response, id, buffer, chunk, BigUint64Array, 8);
        return;
      case 86 /* "V" */:
        resolveTypedArray(response, id, buffer, chunk, DataView, 1);
        return;
    }
  }

  const stringDecoder = response._stringDecoder;
  let row = '';
  for (let i = 0; i < buffer.length; i++) {
    row += readPartialStringChunk(stringDecoder, buffer[i]);
  }
  row += readFinalStringChunk(stringDecoder, chunk);
  processFullStringRow(response, id, tag, row);
}

function processFullStringRow(
  response: Response,
  id: number,
  tag: number,
  row: string,
): void {
  switch (tag) {
    case 73 /* "I" */: {
      resolveModule(response, id, row);
      return;
    }
    case 72 /* "H" */: {
      const code: HintCode = (row[0]: any);
      resolveHint(response, code, row.slice(1));
      return;
    }
    case 69 /* "E" */: {
      const errorInfo = JSON.parse(row);
      if (__DEV__) {
        resolveErrorDev(
          response,
          id,
          errorInfo.digest,
          errorInfo.message,
          errorInfo.stack,
          errorInfo.env,
        );
      } else {
        resolveErrorProd(response, id, errorInfo.digest);
      }
      return;
    }
    case 84 /* "T" */: {
      resolveText(response, id, row);
      return;
    }
    case 68 /* "D" */: {
      if (__DEV__) {
        const debugInfo: ReactComponentInfo | ReactAsyncInfo = parseModel(
          response,
          row,
        );
        resolveDebugInfo(response, id, debugInfo);
        return;
      }
      // Fallthrough to share the error with Console entries.
    }
    case 87 /* "W" */: {
      if (__DEV__) {
        resolveConsoleEntry(response, row);
        return;
      }
      throw new Error(
        'Failed to read a RSC payload created by a development version of React ' +
          'on the server while using a production version on the client. Always use ' +
          'matching versions on the server and the client.',
      );
    }
    case 82 /* "R" */: {
      if (enableFlightReadableStream) {
        startReadableStream(response, id, undefined);
        return;
      }
    }
    // Fallthrough
    case 114 /* "r" */: {
      if (enableFlightReadableStream) {
        startReadableStream(response, id, 'bytes');
        return;
      }
    }
    // Fallthrough
    case 88 /* "X" */: {
      if (enableFlightReadableStream) {
        startAsyncIterable(response, id, false);
        return;
      }
    }
    // Fallthrough
    case 120 /* "x" */: {
      if (enableFlightReadableStream) {
        startAsyncIterable(response, id, true);
        return;
      }
    }
    // Fallthrough
    case 67 /* "C" */: {
      if (enableFlightReadableStream) {
        stopStream(response, id, row);
        return;
      }
    }
    // Fallthrough
    case 80 /* "P" */: {
      if (enablePostpone) {
        if (__DEV__) {
          const postponeInfo = JSON.parse(row);
          resolvePostponeDev(
            response,
            id,
            postponeInfo.reason,
            postponeInfo.stack,
            postponeInfo.env,
          );
        } else {
          resolvePostponeProd(response, id);
        }
        return;
      }
    }
    // Fallthrough
    default: /* """ "{" "[" "t" "f" "n" "0" - "9" */ {
      // We assume anything else is JSON.
      resolveModel(response, id, row);
      return;
    }
  }
}

export function processBinaryChunk(
  response: Response,
  chunk: Uint8Array,
): void {
  let i = 0;
  let rowState = response._rowState;
  let rowID = response._rowID;
  let rowTag = response._rowTag;
  let rowLength = response._rowLength;
  const buffer = response._buffer;
  const chunkLength = chunk.length;
  while (i < chunkLength) {
    let lastIdx = -1;
    switch (rowState) {
      case ROW_ID: {
        const byte = chunk[i++];
        if (byte === 58 /* ":" */) {
          // Finished the rowID, next we'll parse the tag.
          rowState = ROW_TAG;
        } else {
          rowID = (rowID << 4) | (byte > 96 ? byte - 87 : byte - 48);
        }
        continue;
      }
      case ROW_TAG: {
        const resolvedRowTag = chunk[i];
        if (
          resolvedRowTag === 84 /* "T" */ ||
          (enableBinaryFlight &&
            (resolvedRowTag === 65 /* "A" */ ||
              resolvedRowTag === 79 /* "O" */ ||
              resolvedRowTag === 111 /* "o" */ ||
              resolvedRowTag === 85 /* "U" */ ||
              resolvedRowTag === 83 /* "S" */ ||
              resolvedRowTag === 115 /* "s" */ ||
              resolvedRowTag === 76 /* "L" */ ||
              resolvedRowTag === 108 /* "l" */ ||
              resolvedRowTag === 71 /* "G" */ ||
              resolvedRowTag === 103 /* "g" */ ||
              resolvedRowTag === 77 /* "M" */ ||
              resolvedRowTag === 109 /* "m" */ ||
              resolvedRowTag === 86)) /* "V" */
        ) {
          rowTag = resolvedRowTag;
          rowState = ROW_LENGTH;
          i++;
        } else if (
          (resolvedRowTag > 64 && resolvedRowTag < 91) /* "A"-"Z" */ ||
          resolvedRowTag === 35 /* "#" */ ||
          resolvedRowTag === 114 /* "r" */ ||
          resolvedRowTag === 120 /* "x" */
        ) {
          rowTag = resolvedRowTag;
          rowState = ROW_CHUNK_BY_NEWLINE;
          i++;
        } else {
          rowTag = 0;
          rowState = ROW_CHUNK_BY_NEWLINE;
          // This was an unknown tag so it was probably part of the data.
        }
        continue;
      }
      case ROW_LENGTH: {
        const byte = chunk[i++];
        if (byte === 44 /* "," */) {
          // Finished the rowLength, next we'll buffer up to that length.
          rowState = ROW_CHUNK_BY_LENGTH;
        } else {
          rowLength = (rowLength << 4) | (byte > 96 ? byte - 87 : byte - 48);
        }
        continue;
      }
      case ROW_CHUNK_BY_NEWLINE: {
        // We're looking for a newline
        lastIdx = chunk.indexOf(10 /* "\n" */, i);
        break;
      }
      case ROW_CHUNK_BY_LENGTH: {
        // We're looking for the remaining byte length
        lastIdx = i + rowLength;
        if (lastIdx > chunk.length) {
          lastIdx = -1;
        }
        break;
      }
    }
    const offset = chunk.byteOffset + i;
    if (lastIdx > -1) {
      // We found the last chunk of the row
      const length = lastIdx - i;
      const lastChunk = new Uint8Array(chunk.buffer, offset, length);
      processFullBinaryRow(response, rowID, rowTag, buffer, lastChunk);
      // Reset state machine for a new row
      i = lastIdx;
      if (rowState === ROW_CHUNK_BY_NEWLINE) {
        // If we're trailing by a newline we need to skip it.
        i++;
      }
      rowState = ROW_ID;
      rowTag = 0;
      rowID = 0;
      rowLength = 0;
      buffer.length = 0;
    } else {
      // The rest of this row is in a future chunk. We stash the rest of the
      // current chunk until we can process the full row.
      const length = chunk.byteLength - i;
      const remainingSlice = new Uint8Array(chunk.buffer, offset, length);
      buffer.push(remainingSlice);
      // Update how many bytes we're still waiting for. If we're looking for
      // a newline, this doesn't hurt since we'll just ignore it.
      rowLength -= remainingSlice.byteLength;
      break;
    }
  }
  response._rowState = rowState;
  response._rowID = rowID;
  response._rowTag = rowTag;
  response._rowLength = rowLength;
}

export function processStringChunk(response: Response, chunk: string): void {
  // This is a fork of processBinaryChunk that takes a string as input.
  // This can't be just any binary chunk coverted to a string. It needs to be
  // in the same offsets given from the Flight Server. E.g. if it's shifted by
  // one byte then it won't line up to the UCS-2 encoding. It also needs to
  // be valid Unicode. Also binary chunks cannot use this even if they're
  // value Unicode. Large strings are encoded as binary and cannot be passed
  // here. Basically, only if Flight Server gave you this string as a chunk,
  // you can use it here.
  let i = 0;
  let rowState = response._rowState;
  let rowID = response._rowID;
  let rowTag = response._rowTag;
  let rowLength = response._rowLength;
  const buffer = response._buffer;
  const chunkLength = chunk.length;
  while (i < chunkLength) {
    let lastIdx = -1;
    switch (rowState) {
      case ROW_ID: {
        const byte = chunk.charCodeAt(i++);
        if (byte === 58 /* ":" */) {
          // Finished the rowID, next we'll parse the tag.
          rowState = ROW_TAG;
        } else {
          rowID = (rowID << 4) | (byte > 96 ? byte - 87 : byte - 48);
        }
        continue;
      }
      case ROW_TAG: {
        const resolvedRowTag = chunk.charCodeAt(i);
        if (
          resolvedRowTag === 84 /* "T" */ ||
          (enableBinaryFlight &&
            (resolvedRowTag === 65 /* "A" */ ||
              resolvedRowTag === 79 /* "O" */ ||
              resolvedRowTag === 111 /* "o" */ ||
              resolvedRowTag === 85 /* "U" */ ||
              resolvedRowTag === 83 /* "S" */ ||
              resolvedRowTag === 115 /* "s" */ ||
              resolvedRowTag === 76 /* "L" */ ||
              resolvedRowTag === 108 /* "l" */ ||
              resolvedRowTag === 71 /* "G" */ ||
              resolvedRowTag === 103 /* "g" */ ||
              resolvedRowTag === 77 /* "M" */ ||
              resolvedRowTag === 109 /* "m" */ ||
              resolvedRowTag === 86)) /* "V" */
        ) {
          rowTag = resolvedRowTag;
          rowState = ROW_LENGTH;
          i++;
        } else if (
          (resolvedRowTag > 64 && resolvedRowTag < 91) /* "A"-"Z" */ ||
          resolvedRowTag === 114 /* "r" */ ||
          resolvedRowTag === 120 /* "x" */
        ) {
          rowTag = resolvedRowTag;
          rowState = ROW_CHUNK_BY_NEWLINE;
          i++;
        } else {
          rowTag = 0;
          rowState = ROW_CHUNK_BY_NEWLINE;
          // This was an unknown tag so it was probably part of the data.
        }
        continue;
      }
      case ROW_LENGTH: {
        const byte = chunk.charCodeAt(i++);
        if (byte === 44 /* "," */) {
          // Finished the rowLength, next we'll buffer up to that length.
          rowState = ROW_CHUNK_BY_LENGTH;
        } else {
          rowLength = (rowLength << 4) | (byte > 96 ? byte - 87 : byte - 48);
        }
        continue;
      }
      case ROW_CHUNK_BY_NEWLINE: {
        // We're looking for a newline
        lastIdx = chunk.indexOf('\n', i);
        break;
      }
      case ROW_CHUNK_BY_LENGTH: {
        if (rowTag !== 84) {
          throw new Error(
            'Binary RSC chunks cannot be encoded as strings. ' +
              'This is a bug in the wiring of the React streams.',
          );
        }
        // For a large string by length, we don't know how many unicode characters
        // we are looking for but we can assume that the raw string will be its own
        // chunk. We add extra validation that the length is at least within the
        // possible byte range it could possibly be to catch mistakes.
        if (rowLength < chunk.length || chunk.length > rowLength * 3) {
          throw new Error(
            'String chunks need to be passed in their original shape. ' +
              'Not split into smaller string chunks. ' +
              'This is a bug in the wiring of the React streams.',
          );
        }
        lastIdx = chunk.length;
        break;
      }
    }
    if (lastIdx > -1) {
      // We found the last chunk of the row
      if (buffer.length > 0) {
        // If we had a buffer already, it means that this chunk was split up into
        // binary chunks preceeding it.
        throw new Error(
          'String chunks need to be passed in their original shape. ' +
            'Not split into smaller string chunks. ' +
            'This is a bug in the wiring of the React streams.',
        );
      }
      const lastChunk = chunk.slice(i, lastIdx);
      processFullStringRow(response, rowID, rowTag, lastChunk);
      // Reset state machine for a new row
      i = lastIdx;
      if (rowState === ROW_CHUNK_BY_NEWLINE) {
        // If we're trailing by a newline we need to skip it.
        i++;
      }
      rowState = ROW_ID;
      rowTag = 0;
      rowID = 0;
      rowLength = 0;
      buffer.length = 0;
    } else if (chunk.length !== i) {
      // The rest of this row is in a future chunk. We only support passing the
      // string from chunks in their entirety. Not split up into smaller string chunks.
      // We could support this by buffering them but we shouldn't need to for
      // this use case.
      throw new Error(
        'String chunks need to be passed in their original shape. ' +
          'Not split into smaller string chunks. ' +
          'This is a bug in the wiring of the React streams.',
      );
    }
  }
  response._rowState = rowState;
  response._rowID = rowID;
  response._rowTag = rowTag;
  response._rowLength = rowLength;
}

function parseModel<T>(response: Response, json: UninitializedModel): T {
  return JSON.parse(json, response._fromJSON);
}

function createFromJSONCallback(response: Response) {
  // $FlowFixMe[missing-this-annot]
  return function (key: string, value: JSONValue) {
    if (typeof value === 'string') {
      // We can't use .bind here because we need the "this" value.
      return parseModelString(response, this, key, value);
    }
    if (typeof value === 'object' && value !== null) {
      return parseModelTuple(response, value);
    }
    return value;
  };
}

export function close(response: Response): void {
  // In case there are any remaining unresolved chunks, they won't
  // be resolved now. So we need to issue an error to those.
  // Ideally we should be able to early bail out if we kept a
  // ref count of pending chunks.
  reportGlobalError(response, new Error('Connection closed.'));
}
