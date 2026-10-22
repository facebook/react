/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable, ReactKey} from 'shared/ReactTypes';
import type {LazyComponent} from 'react/src/ReactLazy';
import type {Result} from 'shared/ReactFlightResult';
import type {
  ClientReference,
  ClientReferenceMetadata,
  ServerConsumerModuleMap,
  ModuleLoading,
} from './ReactFlightClientConfig';
import type {ClientReferenceMetadata as ServerClientReferenceMetadata} from 'react-server/src/ReactFlightServerConfig';

import {
  resolveClientReference,
  preloadModule,
  requireModule,
  prepareDestinationForModule,
} from './ReactFlightClientConfig';

import {enableTaint} from 'shared/ReactFeatureFlags';

import {
  PENDING as TASK_PENDING,
  FULFILLED as TASK_FULFILLED,
  getResultTask,
  retainResult,
} from 'shared/ReactFlightResult';

import {
  REACT_ELEMENT_TYPE,
  REACT_LAZY_TYPE,
  REACT_LEGACY_ELEMENT_TYPE,
  REACT_MEMO_TYPE,
  REACT_FORWARD_REF_TYPE,
} from 'shared/ReactSymbols';
import isArray from 'shared/isArray';
import getPrototypeOf from 'shared/getPrototypeOf';
import binaryToComparableString from 'shared/binaryToComparableString';
import {describeObjectForErrorMessage} from 'shared/ReactSerializationErrors';

const ObjectPrototype = Object.prototype;

const emptyRoot = {};

// Reads a Result in the same process, for the renderer that consumes the
// Server Component output on the server, like Fizz rendering the HTML of a
// page. The model is walked once and what the serializer would have changed
// is applied as we go: a Server Component element is replaced by the value
// its Result task returned, a value that can't be passed to a Client
// Component is rejected with the same error. Everything else is returned
// as is, since it's already in this process: a plain object is only copied
// if something inside it changed.

// How the reader tells the server's references apart. These are the
// functions of the server's bundler config, which the entry point passes in
// because the reader runs in the server consumer's module graph.
export type ReferenceBundler = {
  isClientReference: (reference: any) => boolean,
  resolveClientReferenceMetadata: (
    reference: any,
  ) => ServerClientReferenceMetadata,
};

export type ResultResponse = {
  _result: Result<any>,
  _bundlerConfig: ServerConsumerModuleMap,
  _moduleLoading: ModuleLoading,
  _nonce: ?string,
  _bundler: ReferenceBundler,
  // Client Reference id -> the chunk that loads its module. On the wire each
  // module is its own row, referenced from every place it's used.
  _modules: Map<string, SomeChunk<any>>,
  _onError: (error: mixed) => ?string,
  // The first error met while reading the values inside the current element.
  // Like the serializer we report every invalid value in an element and
  // keep reading its siblings, then fail the element once.
  _readError: null | Error,
};

// Chunk status. These are the statuses use() understands, plus one for a
// module that has loaded but hasn't been required yet.
const PENDING = 'pending';
const RESOLVED_MODULE = 'resolved_module';
const INITIALIZED = 'fulfilled';
const ERRORED = 'rejected';

type PendingChunk<T> = {
  status: 'pending',
  value: null | Array<(T) => mixed>,
  reason: null | Array<(mixed) => mixed>,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type ResolvedModuleChunk<T> = {
  status: 'resolved_module',
  value: ClientReference<T>,
  reason: null,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type InitializedChunk<T> = {
  status: 'fulfilled',
  value: T,
  reason: null,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type ErroredChunk<T> = {
  status: 'rejected',
  value: null,
  reason: mixed,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type SomeChunk<T> =
  | PendingChunk<T>
  | ResolvedModuleChunk<T>
  | InitializedChunk<T>
  | ErroredChunk<T>;

// $FlowFixMe[missing-this-annot]
function ReactPromise(status: any, value: any, reason: any) {
  this.status = status;
  this.value = value;
  this.reason = reason;
}
// We subclass Promise.prototype so that we get other methods like .catch
ReactPromise.prototype = Object.create(Promise.prototype) as any;
// TODO: This doesn't return a new Promise chain unlike the real .then
function reactPromiseThen<T>(
  this: SomeChunk<T>,
  resolve: (value: T) => mixed,
  reject?: (reason: mixed) => mixed,
) {
  const chunk: SomeChunk<T> = this;
  // If we have resolved content, we try to initialize it first which
  // might put us back into one of the other states.
  switch (chunk.status) {
    case RESOLVED_MODULE:
      initializeModuleChunk(chunk);
      break;
  }
  // The status might have changed after initialization.
  switch (chunk.status) {
    case INITIALIZED:
      if (typeof resolve === 'function') {
        resolve(chunk.value);
      }
      break;
    case PENDING:
      if (typeof resolve === 'function') {
        if (chunk.value === null) {
          chunk.value = [] as Array<(T) => mixed>;
        }
        chunk.value.push(resolve);
      }
      if (typeof reject === 'function') {
        if (chunk.reason === null) {
          chunk.reason = [] as Array<(mixed) => mixed>;
        }
        chunk.reason.push(reject);
      }
      break;
    default:
      if (typeof reject === 'function') {
        reject(chunk.reason);
      }
      break;
  }
}
// The shadowing `then` must be defined with `Object.defineProperty` instead of
// assignment. Assignment would throw when `Promise.prototype` is frozen (e.g.
// by SES lockdown) because assigning over an inherited non-writable property
// is rejected.
Object.defineProperty(ReactPromise.prototype, 'then', {
  writable: true,
  enumerable: true,
  configurable: true,
  value: reactPromiseThen,
});

function readChunk<T>(chunk: SomeChunk<T>): T {
  // If we have resolved content, we try to initialize it first which
  // might put us back into one of the other states.
  switch (chunk.status) {
    case RESOLVED_MODULE:
      initializeModuleChunk(chunk);
      break;
  }
  // The status might have changed after initialization.
  switch (chunk.status) {
    case INITIALIZED:
      return chunk.value;
    case PENDING:
      // eslint-disable-next-line no-throw-literal
      throw chunk as any as Thenable<T>;
    default:
      throw chunk.reason;
  }
}

function createPendingChunk<T>(response: ResultResponse): PendingChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(PENDING, null, null);
}

function createErrorChunk<T>(
  response: ResultResponse,
  error: mixed,
): ErroredChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(ERRORED, null, error);
}

// A chunk for a model that's already here, read right away.
function createModelChunk<T>(
  response: ResultResponse,
  model: any,
): SomeChunk<T> {
  const chunk: SomeChunk<T> = createPendingChunk(response);
  resolveModelChunk(response, chunk, model);
  return chunk;
}

function createResolvedModuleChunk<T>(
  response: ResultResponse,
  value: ClientReference<T>,
): ResolvedModuleChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(RESOLVED_MODULE, value, null);
}

function wakeChunk<T>(listeners: Array<(T) => mixed>, value: T): void {
  for (let i = 0; i < listeners.length; i++) {
    listeners[i](value);
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

function fulfillChunk<T>(chunk: SomeChunk<T>, value: T): void {
  if (chunk.status !== PENDING) {
    return;
  }
  const listeners = chunk.value;
  const initializedChunk: InitializedChunk<T> = chunk as any;
  initializedChunk.status = INITIALIZED;
  initializedChunk.value = value;
  initializedChunk.reason = null;
  if (listeners !== null) {
    wakeChunk(listeners, value);
  }
}

function triggerErrorOnChunk<T>(chunk: SomeChunk<T>, error: mixed): void {
  if (chunk.status !== PENDING) {
    return;
  }
  const listeners = chunk.reason;
  const erroredChunk: ErroredChunk<T> = chunk as any;
  erroredChunk.status = ERRORED;
  erroredChunk.reason = error;
  if (listeners !== null) {
    wakeChunk(listeners, error);
  }
}

// Reads the model that arrived for a pending chunk and settles the chunk
// with what it reads. The model is read now rather than when the chunk is
// first read, since the serializer would have reported anything invalid in
// it at this point too. A chunk is a row: a value that couldn't be read
// anywhere inside it fails the whole chunk, like a row with an error
// reference in it fails on the client.
function resolveModelChunk<T>(
  response: ResultResponse,
  chunk: SomeChunk<T>,
  model: any,
): void {
  if (chunk.status !== PENDING) {
    return;
  }
  const prevReadError = response._readError;
  response._readError = null;
  let value;
  try {
    value = readModel(response, model, emptyRoot, '');
  } catch (thrown) {
    response._readError = prevReadError;
    if (isThenable(thrown)) {
      // Something inside the model is still loading, like a Client
      // Component's module. The chunk waits for it and reads the model again
      // then, the way a row waits for a reference inside it before it
      // initializes.
      const retry = () => resolveModelChunk(response, chunk, model);
      thrown.then(retry, retry);
      return;
    }
    // The value at the top of the row can't be read, so the row fails with
    // it, the way a task errors when its model does.
    triggerErrorOnChunk(chunk, reportReadError(response, thrown));
    return;
  }
  const error = response._readError;
  response._readError = prevReadError;
  if (error !== null) {
    triggerErrorOnChunk(chunk, error);
    return;
  }
  fulfillChunk(chunk, value);
}

function resolveModuleChunk<T>(
  response: ResultResponse,
  chunk: SomeChunk<T>,
  value: ClientReference<T>,
): void {
  if (chunk.status !== PENDING) {
    // We already resolved. We didn't expect to see this.
    return;
  }
  const resolveListeners = chunk.value;
  const rejectListeners = chunk.reason;
  const resolvedChunk: ResolvedModuleChunk<T> = chunk as any;
  resolvedChunk.status = RESOLVED_MODULE;
  resolvedChunk.value = value;
  resolvedChunk.reason = null;
  if (resolveListeners !== null) {
    initializeModuleChunk(resolvedChunk);
    wakeChunkIfInitialized(chunk, resolveListeners, rejectListeners);
  }
}

function initializeModuleChunk<T>(chunk: ResolvedModuleChunk<T>): void {
  try {
    const value: T = requireModule(chunk.value);
    const initializedChunk: InitializedChunk<T> = chunk as any;
    initializedChunk.status = INITIALIZED;
    initializedChunk.value = value;
    initializedChunk.reason = null;
  } catch (error) {
    const erroredChunk: ErroredChunk<T> = chunk as any;
    erroredChunk.status = ERRORED;
    erroredChunk.reason = error;
  }
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
    // The key was validated when the element was created on the server.
    lazyType._store = {validated: 1};
  }
  return lazyType;
}

// The error the renderer sees for an error that happened on the server. In
// production the message is replaced with a generic one, like it is for an
// error row on the wire. The digest is how a server error is identified.
function resolveErrorProd(response: ResultResponse): Error {
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
  return error;
}

function resolveErrorDev(response: ResultResponse, reason: mixed): Error {
  if (!__DEV__) {
    // These errors should never make it into a build so we don't need to encode them in codes.json
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'resolveErrorDev should never be called in production mode. Use resolveErrorProd instead. This is a bug in React.',
    );
  }
  let error;
  if (reason instanceof Error) {
    // eslint-disable-next-line react-internal/prod-error-codes
    error = new Error(reason.message);
    error.name = reason.name;
    error.stack = reason.stack;
  } else if (typeof reason === 'object' && reason !== null) {
    // eslint-disable-next-line react-internal/prod-error-codes
    error = new Error(describeObjectForErrorMessage(reason));
  } else {
    // eslint-disable-next-line react-internal/prod-error-codes, react-internal/safe-string-coercion
    error = new Error(String(reason));
  }
  return error;
}

function resolveError(
  response: ResultResponse,
  reason: mixed,
  digest: string,
): Error {
  const error = __DEV__
    ? resolveErrorDev(response, reason)
    : resolveErrorProd(response);
  (error as any).digest = digest;
  return error;
}

function logRecoverableError(response: ResultResponse, error: mixed): string {
  const onError = response._onError;
  const errorDigest = onError(error);
  if (errorDigest != null && typeof errorDigest !== 'string') {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      `onError returned something with a type other than "string". onError should return a string and may return null or undefined but must not return anything else. It received something of type "${typeof errorDigest}" instead`,
    );
  }
  return errorDigest || '';
}

// Reports an error that happened while reading, like a value the serializer
// would have rejected, and returns the error the renderer sees for it.
function reportReadError(response: ResultResponse, error: mixed): Error {
  const digest = logRecoverableError(response, error);
  return resolveError(response, error, digest);
}

function createElement(type: any, key: ReactKey, props: any): any {
  let element: any;
  if (__DEV__) {
    element = {
      $$typeof: REACT_ELEMENT_TYPE,
      type,
      key,
      props,
      _owner: null,
    } as any;
    Object.defineProperty(element, 'ref', {
      enumerable: false,
      get: nullRefGetter,
    });
    element._store = {} as {validated?: number};
    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      // The key was validated when the element was created on the server.
      value: 1,
    });
    Object.defineProperty(element, '_debugInfo', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: null,
    });
    Object.defineProperty(element, '_debugStack', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: null,
    });
    Object.defineProperty(element, '_debugTask', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: null,
    });
  } else {
    element = {
      $$typeof: REACT_ELEMENT_TYPE,
      type,
      key,
      ref: null,
      props,
    };
  }
  return element;
}

function nullRefGetter() {
  if (__DEV__) {
    return null;
  }
}

// Reads one value, like renderModel on the server: if it can't be read, the
// error is reported and remembered as the error of the row being read, and
// the rest of the row is still read and reported. The row fails once at the
// end. On the server each invalid value becomes an error reference in the
// row; here it becomes undefined, since the row fails anyway.
function readValue(
  response: ResultResponse,
  parent: Object,
  parentPropertyName: string,
  value: any,
): any {
  try {
    return readModel(response, value, parent, parentPropertyName);
  } catch (thrown) {
    if (isThenable(thrown)) {
      // A reference inside is still loading. Let the row wait for it.
      throw thrown;
    }
    const error = reportReadError(response, thrown);
    if (response._readError === null) {
      response._readError = error;
    }
    return undefined;
  }
}

function readArray(response: ResultResponse, array: Array<any>): Array<any> {
  let copy: null | Array<any> = null;
  for (let i = 0; i < array.length; i++) {
    const child = array[i];
    const read = readValue(response, array, '' + i, child);
    if (copy === null) {
      if (read === child) {
        continue;
      }
      copy = array.slice(0, i);
    }
    copy.push(read);
  }
  return copy === null ? array : copy;
}

function readObject(
  response: ResultResponse,
  object: {[key: string]: any},
): {[key: string]: any} {
  let copy: null | {[key: string]: any} = null;
  const keys = Object.keys(object);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const child = object[key];
    // JSON drops a property whose value is undefined, and the client never
    // assigns __proto__.
    const read =
      child === undefined || key === '__proto__'
        ? undefined
        : readValue(response, object, key, child);
    if (copy === null) {
      if (read === child && child !== undefined) {
        continue;
      }
      copy = {} as {[key: string]: any};
      for (let j = 0; j < i; j++) {
        copy[keys[j]] = object[keys[j]];
      }
    }
    if (read !== undefined) {
      copy[key] = read;
    }
  }
  return copy === null ? object : copy;
}

function readMap(response: ResultResponse, map: Map<any, any>): Map<any, any> {
  const entries = Array.from(map);
  const read = readArray(response, entries);
  return read === entries ? map : new Map(read);
}

function readSet(response: ResultResponse, set: Set<any>): Set<any> {
  const values = Array.from(set);
  const read = readArray(response, values);
  return read === values ? set : new Set(read);
}

// Finds the Server Component an element renders, through memo, forwardRef
// and lazy wrappers, the same way renderElement does on the server. Returns
// null if the element renders something else.
function resolveServerComponentType(
  response: ResultResponse,
  type: any,
): null | Function {
  if (
    typeof type === 'function' &&
    !response._bundler.isClientReference(type)
  ) {
    return type;
  } else if (
    type != null &&
    typeof type === 'object' &&
    !response._bundler.isClientReference(type)
  ) {
    switch (type.$$typeof) {
      case REACT_LAZY_TYPE: {
        const payload = type._payload;
        const init = type._init;
        return resolveServerComponentType(response, init(payload));
      }
      case REACT_FORWARD_REF_TYPE:
        return resolveServerComponentType(response, type.render);
      case REACT_MEMO_TYPE:
        return resolveServerComponentType(response, type.type);
    }
  }
  return null;
}

// The value a Server Component returned has the same special cases here as
// in processServerComponentReturnValue on the server.
function processServerComponentReturnValue(
  response: ResultResponse,
  output: any,
): any {
  if (__DEV__) {
    if (
      typeof output === 'object' &&
      output !== null &&
      output.$$typeof === REACT_ELEMENT_TYPE &&
      output._store
    ) {
      // If the server component renders to an element, then it was in a static position.
      // That doesn't need further validation of keys. The Server Component itself would
      // have had a key.
      output._store.validated = 1;
    }
  }
  return output;
}

function readServerComponentOutput(response: ResultResponse, output: any): any {
  output = processServerComponentReturnValue(response, output);
  if (isThenable(output) && !response._bundler.isClientReference(output)) {
    // When the return value is in children position we can resolve it immediately,
    // to its value without a wrapper if it's synchronously available.
    const thenable: Thenable<any> = output;
    switch (thenable.status) {
      case 'fulfilled':
        return readServerComponentOutput(response, thenable.value);
      case 'rejected':
        return createLazyChunkWrapper(
          createErrorChunk(
            response,
            reportReadError(response, thenable.reason),
          ),
        );
    }
    const chunk: SomeChunk<any> = createPendingChunk(response);
    resolveServerComponentOutput(response, chunk, thenable);
    return createLazyChunkWrapper(chunk);
  }
  return readModel(response, output, emptyRoot, '');
}

// Resolves a chunk with the value a Server Component returned once that is
// known, unwrapping a returned promise first.
function resolveServerComponentOutput(
  response: ResultResponse,
  chunk: SomeChunk<any>,
  output: any,
): void {
  output = processServerComponentReturnValue(response, output);
  if (isThenable(output) && !response._bundler.isClientReference(output)) {
    const thenable: Thenable<any> = output;
    thenable.then(
      value => resolveServerComponentOutput(response, chunk, value),
      reason => triggerErrorOnChunk(chunk, reportReadError(response, reason)),
    );
    return;
  }
  resolveModelChunk(response, chunk, output);
}

function readServerComponent(response: ResultResponse, element: any): any {
  const task = getResultTask(response._result, element);
  switch (task.status) {
    case TASK_FULFILLED:
      return readServerComponentOutput(response, task.value);
    case TASK_PENDING: {
      const chunk: SomeChunk<any> = createPendingChunk(response);
      task.then(
        value => resolveServerComponentOutput(response, chunk, value),
        reason => triggerErrorOnChunk(chunk, reportReadError(response, reason)),
      );
      return createLazyChunkWrapper(chunk);
    }
    default:
      return createLazyChunkWrapper(
        createErrorChunk(response, reportReadError(response, task.reason)),
      );
  }
}

// A promise in the model reads as a chunk that resolves to its value, read
// once it's known.
function readThenable(
  response: ResultResponse,
  thenable: Thenable<any>,
): SomeChunk<any> {
  switch (thenable.status) {
    case 'fulfilled':
      return createModelChunk(response, thenable.value);
    case 'rejected':
      return createErrorChunk(
        response,
        reportReadError(response, thenable.reason),
      );
  }
  const chunk: SomeChunk<any> = createPendingChunk(response);
  thenable.then(
    value => resolveModelChunk(response, chunk, value),
    reason => triggerErrorOnChunk(chunk, reportReadError(response, reason)),
  );
  return chunk;
}

function isThenable(value: any): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.then === 'function'
  );
}

// An element that can't be read becomes a lazy that throws when the
// renderer reaches it, and its siblings are unaffected. On the wire this is
// what happens to an element in a row of its own; an element inlined into
// its parent's row takes the parent down with it, but which elements get
// inlined depends on row sizes and timing, so every element is treated as
// its own row here.
function readElement(response: ResultResponse, element: any): any {
  try {
    if (resolveServerComponentType(response, element.type) !== null) {
      return readServerComponent(response, element);
    }
    return readClientElement(response, element);
  } catch (thrown) {
    if (isThenable(thrown)) {
      // Something inside the element is still loading. It becomes a lazy
      // that reads the element again once that's done, like an element
      // whose row waits for a reference.
      const chunk: SomeChunk<any> = createPendingChunk(response);
      const retry = () => resolveModelChunk(response, chunk, element);
      thrown.then(retry, retry);
      return createLazyChunkWrapper(chunk);
    }
    return createLazyChunkWrapper(
      createErrorChunk(response, reportReadError(response, thrown)),
    );
  }
}

// A host or Client Component element. The serializer outlines each of these
// as its own row when it can't be inlined, and its props are what that row
// holds, so an invalid prop fails this element and nothing above it.
function readClientElement(response: ResultResponse, element: any): any {
  const props = element.props;
  if (props.ref !== undefined && props.ref !== null) {
    throw new Error(
      'Refs cannot be used in Server Components, nor passed to Client Components.',
    );
  }
  const prevReadError = response._readError;
  response._readError = null;
  const readProps = readValue(response, element, 'props', props);
  const error = response._readError;
  response._readError = prevReadError;
  if (error !== null) {
    return createLazyChunkWrapper(createErrorChunk(response, error));
  }
  const type = element.type;
  if (response._bundler.isClientReference(type)) {
    // Like on the wire, the type is a lazy over the module, so that the
    // renderer suspends on this component rather than its parent until the
    // code has loaded.
    return createElement(
      createLazyChunkWrapper(getModuleChunk(response, type)),
      element.key,
      readProps,
    );
  }
  if (readProps === props) {
    return element;
  }
  return createElement(type, element.key, readProps);
}

// The chunk loading a Client Reference's module in this consumer's module
// graph. The module is preloaded as early as possible, like on the wire,
// but only required when something first reads the chunk.
function getModuleChunk(
  response: ResultResponse,
  reference: any,
): SomeChunk<any> {
  const id: string = reference.$$id;
  const modules = response._modules;
  const existing = modules.get(id);
  if (existing !== undefined) {
    return existing;
  }
  // The metadata the server would have serialized is what the consumer's
  // module map is keyed by, as it is on the wire.
  const clientReferenceMetadata: ClientReferenceMetadata =
    response._bundler.resolveClientReferenceMetadata(reference) as any;
  const clientReference = resolveClientReference<$FlowFixMe>(
    response._bundlerConfig,
    clientReferenceMetadata,
  );
  prepareDestinationForModule(
    response._moduleLoading,
    response._nonce,
    clientReferenceMetadata,
  );
  const promise = preloadModule(clientReference);
  let chunk;
  if (promise) {
    const pendingChunk: SomeChunk<any> = createPendingChunk(response);
    promise.then(
      () => resolveModuleChunk(response, pendingChunk, clientReference),
      error => triggerErrorOnChunk(pendingChunk, error),
    );
    chunk = pendingChunk;
  } else {
    chunk = createResolvedModuleChunk(response, clientReference);
  }
  modules.set(id, chunk);
  return chunk;
}

// A Client Reference anywhere else is its module's export. If the module
// is still loading, the row holding the reference waits for it. If the
// module failed to load, the row fails with the module's own error, which
// is this consumer's error and not reported to onError.
function readClientReferenceValue(response: ResultResponse, reference: any) {
  const chunk = getModuleChunk(response, reference);
  switch (chunk.status) {
    case RESOLVED_MODULE:
      initializeModuleChunk(chunk);
      break;
  }
  switch (chunk.status) {
    case INITIALIZED:
      return chunk.value;
    case PENDING:
      // eslint-disable-next-line no-throw-literal
      throw chunk as any as Thenable<any>;
    default:
      if (response._readError === null) {
        response._readError = chunk.reason as any;
      }
      return undefined;
  }
}

function throwTaintViolation(message: string) {
  // eslint-disable-next-line react-internal/prod-error-codes
  throw new Error(message);
}

function checkTaintedObject(response: ResultResponse, value: Object): void {
  const tainted = response._result.taintRegistries.objects.get(value);
  if (tainted !== undefined) {
    throwTaintViolation(tainted);
  }
}

function checkTaintedValue(
  response: ResultResponse,
  value: string | bigint,
): void {
  const tainted = response._result.taintRegistries.values.get(value);
  if (tainted !== undefined) {
    throwTaintViolation(tainted.message);
  }
}

function checkTaintedBytes(
  response: ResultResponse,
  view: $ArrayBufferView,
): void {
  const registries = response._result.taintRegistries;
  if (registries.byteLengths.has(view.byteLength)) {
    // If we have had any tainted values of this length, we check
    // to see if these bytes matches any entries in the registry.
    const tainted = registries.values.get(binaryToComparableString(view));
    if (tainted !== undefined) {
      throwTaintViolation(tainted.message);
    }
  }
}

// On the wire a FormData is its entries, so its names and strings are
// checked like them.
function checkTaintedFormData(
  response: ResultResponse,
  formData: FormData,
): void {
  const entries = Array.from(formData.entries());
  for (let i = 0; i < entries.length; i++) {
    const name = entries[i][0];
    const entry = entries[i][1];
    checkTaintedValue(response, name);
    if (typeof entry === 'string') {
      checkTaintedValue(response, entry);
    }
  }
}

// Reads a value, applying what the serializer would have changed about it.
// The checks follow renderModelDestructive on the server: what it rejects
// is rejected here with the same message, so an invalid value fails this
// consumer like it fails the wire. `parent` and `parentPropertyName` only
// describe the location in that message.
function readModel(
  response: ResultResponse,
  value: any,
  parent: Object,
  parentPropertyName: string,
): any {
  if (value === null) {
    return null;
  }
  if (typeof value === 'object') {
    switch (value.$$typeof) {
      case REACT_ELEMENT_TYPE:
        return readElement(response, value);
      case REACT_LAZY_TYPE: {
        const lazy: LazyComponent<any, any> = value;
        const payload = lazy._payload;
        const init = lazy._init;
        return readModel(response, init(payload), parent, parentPropertyName);
      }
      case REACT_LEGACY_ELEMENT_TYPE:
        throw new Error(
          'A React Element from an older version of React was rendered. ' +
            'This is not supported. It can happen if:\n' +
            '- Multiple copies of the "react" package is used.\n' +
            '- A library pre-bundled an old copy of "react" or "react/jsx-runtime".\n' +
            '- A compiler tries to "inline" JSX instead of using the runtime.',
        );
    }
    if (response._bundler.isClientReference(value)) {
      return readClientReferenceValue(response, value);
    }
    if (enableTaint) {
      checkTaintedObject(response, value);
    }
    if (typeof value.then === 'function') {
      // We assume that any object with a .then property is a "Thenable" type,
      // or a Promise type. Either of which can be represented by a Promise.
      return readThenable(response, value);
    }
    const proto = getPrototypeOf(value);
    if (proto === ObjectPrototype) {
      // Nearly every value is a plain object, and none of the cases below
      // can apply to one, so the built-ins are checked for the rest.
      return readObject(response, value);
    }
    if (isArray(value)) {
      return readArray(response, value);
    }
    if (value instanceof Map) {
      return readMap(response, value);
    }
    if (value instanceof Set) {
      return readSet(response, value);
    }
    // TODO: FormData is not available in old Node. Remove the typeof later.
    if (typeof FormData === 'function' && value instanceof FormData) {
      if (enableTaint) {
        checkTaintedFormData(response, value);
      }
      return value;
    }
    if (value instanceof Error) {
      // An Error value carries no details in production, like on the wire.
      return resolveError(response, value, '');
    }
    if (value instanceof ArrayBuffer) {
      if (enableTaint) {
        checkTaintedBytes(response, new Uint8Array(value));
      }
      return value;
    }
    if (ArrayBuffer.isView(value)) {
      if (enableTaint) {
        checkTaintedBytes(response, value);
      }
      return value;
    }
    // TODO: Blob is not available in old Node. Remove the typeof check later.
    if (typeof Blob === 'function' && value instanceof Blob) {
      return value;
    }
    if (value instanceof Date) {
      return value;
    }

    // Verify that this is a simple plain object.
    if (proto === null || getPrototypeOf(proto) !== null) {
      throw new Error(
        'Only plain objects, and a few built-ins, can be passed to Client Components ' +
          'from Server Components. Classes or null prototypes are not supported.' +
          describeObjectForErrorMessage(parent, parentPropertyName),
      );
    }
    return readObject(response, value);
  }

  if (typeof value === 'string') {
    if (enableTaint) {
      checkTaintedValue(response, value);
    }
    return value;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'undefined') {
    return undefined;
  }

  if (typeof value === 'function') {
    if (response._bundler.isClientReference(value)) {
      return readClientReferenceValue(response, value);
    }
    if (enableTaint) {
      checkTaintedObject(response, value);
    }
    if (/^on[A-Z]/.test(parentPropertyName)) {
      throw new Error(
        'Event handlers cannot be passed to Client Component props.' +
          describeObjectForErrorMessage(parent, parentPropertyName) +
          '\nIf you need interactivity, consider converting part of this to a Client Component.',
      );
    } else {
      throw new Error(
        'Functions cannot be passed directly to Client Components ' +
          'unless you explicitly expose it by marking it with "use server". ' +
          'Or maybe you meant to call this function rather than return it.' +
          describeObjectForErrorMessage(parent, parentPropertyName),
      );
    }
  }

  if (typeof value === 'symbol') {
    if (Symbol.keyFor(value) === undefined) {
      throw new Error(
        'Only global symbols received from Symbol.for(...) can be passed to Client Components. ' +
          `The symbol Symbol.for(${
            // $FlowFixMe[incompatible-type] `description` might be undefined
            value.description
          }) cannot be found among global symbols.` +
          describeObjectForErrorMessage(parent, parentPropertyName),
      );
    }
    return value;
  }

  if (typeof value === 'bigint') {
    if (enableTaint) {
      checkTaintedValue(response, value);
    }
    return value;
  }

  throw new Error(
    `Type ${typeof value} is not supported in Client Component props.` +
      describeObjectForErrorMessage(parent, parentPropertyName),
  );
}

export function createResponse(
  result: Result<any>,
  bundlerConfig: ServerConsumerModuleMap,
  moduleLoading: ModuleLoading,
  bundler: ReferenceBundler,
  nonce: ?string,
  onError: void | ((error: mixed) => ?string),
): ResultResponse {
  const response: ResultResponse = {
    _result: result,
    _bundlerConfig: bundlerConfig,
    _moduleLoading: moduleLoading,
    _nonce: nonce,
    _bundler: bundler,
    _modules: new Map(),
    _onError: onError === undefined ? result.onError : onError,
    _readError: null,
  };
  // The renderer may read the Result for as long as it likes, so this
  // consumer holds the cache signal open from here on.
  retainResult(result);
  return response;
}

export function getRoot<T>(response: ResultResponse): Thenable<T> {
  const chunk: SomeChunk<T> = createModelChunk(
    response,
    response._result.model,
  );
  return chunk as any;
}
