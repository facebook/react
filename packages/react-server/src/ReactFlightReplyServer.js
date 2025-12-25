/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes';

// The server acts as a Client of itself when resolving Server References.
// That's why we import the Client configuration from the Server.
// Everything is aliased as their Server equivalence for clarity.
import type {
  ServerReferenceId,
  ServerManifest,
  ClientReference as ServerReference,
} from 'react-client/src/ReactFlightClientConfig';

import type {TemporaryReferenceSet} from './ReactFlightServerTemporaryReferences';

import {
  resolveServerReference,
  preloadModule,
  requireModule,
} from 'react-client/src/ReactFlightClientConfig';

import {
  createTemporaryReference,
  registerTemporaryReference,
} from './ReactFlightServerTemporaryReferences';
import {ASYNC_ITERATOR} from 'shared/ReactSymbols';

import hasOwnProperty from 'shared/hasOwnProperty';
import getPrototypeOf from 'shared/getPrototypeOf';

interface FlightStreamController {
  enqueueModel(json: string): void;
  close(json: string): void;
  error(error: Error): void;
}

export type JSONValue =
  | number
  | null
  | boolean
  | string
  | {+[key: string]: JSONValue}
  | $ReadOnlyArray<JSONValue>;

const PENDING = 'pending';
const BLOCKED = 'blocked';
const RESOLVED_MODEL = 'resolved_model';
const INITIALIZED = 'fulfilled';
const ERRORED = 'rejected';

type RESPONSE_SYMBOL_TYPE = 'RESPONSE_SYMBOL'; // Fake symbol type.
const RESPONSE_SYMBOL: RESPONSE_SYMBOL_TYPE = (Symbol(): any);

type PendingChunk<T> = {
  status: 'pending',
  value: null | Array<InitializationReference | (T => mixed)>,
  reason: null | Array<InitializationReference | (mixed => mixed)>,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type BlockedChunk<T> = {
  status: 'blocked',
  value: null | Array<InitializationReference | (T => mixed)>,
  reason: null | Array<InitializationReference | (mixed => mixed)>,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type ResolvedModelChunk<T> = {
  status: 'resolved_model',
  value: string,
  reason: {id: number, [RESPONSE_SYMBOL_TYPE]: Response},
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type InitializedChunk<T> = {
  status: 'fulfilled',
  value: T,
  reason: null,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type InitializedStreamChunk<
  T: ReadableStream | $AsyncIterable<any, any, void>,
> = {
  status: 'fulfilled',
  value: T,
  reason: FlightStreamController,
  then(resolve: (ReadableStream) => mixed, reject?: (mixed) => mixed): void,
};
type ErroredChunk<T> = {
  status: 'rejected',
  value: null,
  reason: mixed,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type SomeChunk<T> =
  | PendingChunk<T>
  | BlockedChunk<T>
  | ResolvedModelChunk<T>
  | InitializedChunk<T>
  | ErroredChunk<T>;

// $FlowFixMe[missing-this-annot]
function ReactPromise(status: any, value: any, reason: any) {
  this.status = status;
  this.value = value;
  this.reason = reason;
}
// We subclass Promise.prototype so that we get other methods like .catch
ReactPromise.prototype = (Object.create(Promise.prototype): any);
// TODO: This doesn't return a new Promise chain unlike the real .then
ReactPromise.prototype.then = function <T>(
  this: SomeChunk<T>,
  resolve: (value: T) => mixed,
  reject: ?(reason: mixed) => mixed,
) {
  const chunk: SomeChunk<T> = this;
  // If we have resolved content, we try to initialize it first which
  // might put us back into one of the other states.
  switch (chunk.status) {
    case RESOLVED_MODEL:
      initializeModelChunk(chunk);
      break;
  }
  // The status might have changed after initialization.
  switch (chunk.status) {
    case INITIALIZED:
      if (typeof resolve === 'function') {
        let inspectedValue = chunk.value;
        // Recursively check if the value is itself a ReactPromise and if so if it points
        // back to itself. This helps catch recursive thenables early error.
        let cycleProtection = 0;
        const visited = new Set<typeof ReactPromise>();
        while (inspectedValue instanceof ReactPromise) {
          cycleProtection++;
          if (
            inspectedValue === chunk ||
            visited.has(inspectedValue) ||
            cycleProtection > 1000
          ) {
            if (typeof reject === 'function') {
              reject(new Error('Cannot have cyclic thenables.'));
            }
            return;
          }
          visited.add(inspectedValue);
          if (inspectedValue.status === INITIALIZED) {
            inspectedValue = inspectedValue.value;
          } else {
            // If this is lazily resolved, pending or blocked, it'll eventually become
            // initialized and break the loop. Rejected also breaks it.
            break;
          }
        }
        resolve(chunk.value);
      }
      break;
    case PENDING:
    case BLOCKED:
      if (typeof resolve === 'function') {
        if (chunk.value === null) {
          chunk.value = ([]: Array<InitializationReference | (T => mixed)>);
        }
        chunk.value.push(resolve);
      }
      if (typeof reject === 'function') {
        if (chunk.reason === null) {
          chunk.reason = ([]: Array<
            InitializationReference | (mixed => mixed),
          >);
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
};

const ObjectPrototype = Object.prototype;
const ArrayPrototype = Array.prototype;

export type Response = {
  _bundlerConfig: ServerManifest,
  _prefix: string,
  _formData: FormData,
  _chunks: Map<number, SomeChunk<any>>,
  _closed: boolean,
  _closedReason: mixed,
  _temporaryReferences: void | TemporaryReferenceSet,
};

export function getRoot<T>(response: Response): Thenable<T> {
  const chunk = getChunk(response, 0);
  return (chunk: any);
}

function createPendingChunk<T>(response: Response): PendingChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(PENDING, null, null);
}

function wakeChunk<T>(
  response: Response,
  listeners: Array<InitializationReference | (T => mixed)>,
  value: T,
): void {
  for (let i = 0; i < listeners.length; i++) {
    const listener = listeners[i];
    if (typeof listener === 'function') {
      listener(value);
    } else {
      fulfillReference(response, listener, value);
    }
  }
}

function rejectChunk(
  response: Response,
  listeners: Array<InitializationReference | (mixed => mixed)>,
  error: mixed,
): void {
  for (let i = 0; i < listeners.length; i++) {
    const listener = listeners[i];
    if (typeof listener === 'function') {
      listener(error);
    } else {
      rejectReference(response, listener.handler, error);
    }
  }
}

function resolveBlockedCycle<T>(
  resolvedChunk: SomeChunk<T>,
  reference: InitializationReference,
): null | InitializationHandler {
  const referencedChunk = reference.handler.chunk;
  if (referencedChunk === null) {
    return null;
  }
  if (referencedChunk === resolvedChunk) {
    // We found the cycle. We can resolve the blocked cycle now.
    return reference.handler;
  }
  const resolveListeners = referencedChunk.value;
  if (resolveListeners !== null) {
    for (let i = 0; i < resolveListeners.length; i++) {
      const listener = resolveListeners[i];
      if (typeof listener !== 'function') {
        const foundHandler = resolveBlockedCycle(resolvedChunk, listener);
        if (foundHandler !== null) {
          return foundHandler;
        }
      }
    }
  }
  return null;
}

function wakeChunkIfInitialized<T>(
  response: Response,
  chunk: SomeChunk<T>,
  resolveListeners: Array<InitializationReference | (T => mixed)>,
  rejectListeners: null | Array<InitializationReference | (mixed => mixed)>,
): void {
  switch (chunk.status) {
    case INITIALIZED:
      wakeChunk(response, resolveListeners, chunk.value);
      break;
    case BLOCKED:
      // It is possible that we're blocked on our own chunk if it's a cycle.
      // Before adding back the listeners to the chunk, let's check if it would
      // result in a cycle.
      for (let i = 0; i < resolveListeners.length; i++) {
        const listener = resolveListeners[i];
        if (typeof listener !== 'function') {
          const reference: InitializationReference = listener;
          const cyclicHandler = resolveBlockedCycle(chunk, reference);
          if (cyclicHandler !== null) {
            // This reference points back to this chunk. We can resolve the cycle by
            // using the value from that handler.
            fulfillReference(response, reference, cyclicHandler.value);
            resolveListeners.splice(i, 1);
            i--;
            if (rejectListeners !== null) {
              const rejectionIdx = rejectListeners.indexOf(reference);
              if (rejectionIdx !== -1) {
                rejectListeners.splice(rejectionIdx, 1);
              }
            }
            // The status might have changed after fulfilling the reference.
            switch ((chunk: SomeChunk<T>).status) {
              case INITIALIZED:
                const initializedChunk: InitializedChunk<T> = (chunk: any);
                wakeChunk(response, resolveListeners, initializedChunk.value);
                return;
              case ERRORED:
                if (rejectListeners !== null) {
                  rejectChunk(response, rejectListeners, chunk.reason);
                }
                return;
            }
          }
        }
      }
    // Fallthrough
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
        wakeChunk(response, rejectListeners, chunk.reason);
      }
      break;
  }
}

function triggerErrorOnChunk<T>(
  response: Response,
  chunk: SomeChunk<T>,
  error: mixed,
): void {
  if (chunk.status !== PENDING && chunk.status !== BLOCKED) {
    // If we get more data to an already resolved ID, we assume that it's
    // a stream chunk since any other row shouldn't have more than one entry.
    const streamChunk: InitializedStreamChunk<any> = (chunk: any);
    const controller = streamChunk.reason;
    // $FlowFixMe[incompatible-call]: The error method should accept mixed.
    controller.error(error);
    return;
  }
  const listeners = chunk.reason;
  const erroredChunk: ErroredChunk<T> = (chunk: any);
  erroredChunk.status = ERRORED;
  erroredChunk.reason = error;
  if (listeners !== null) {
    rejectChunk(response, listeners, error);
  }
}

function createResolvedModelChunk<T>(
  response: Response,
  value: string,
  id: number,
): ResolvedModelChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(RESOLVED_MODEL, value, {
    id,
    [RESPONSE_SYMBOL]: response,
  });
}

function createErroredChunk<T>(
  response: Response,
  reason: mixed,
): ErroredChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(ERRORED, null, reason);
}

function resolveModelChunk<T>(
  response: Response,
  chunk: SomeChunk<T>,
  value: string,
  id: number,
): void {
  if (chunk.status !== PENDING) {
    // If we get more data to an already resolved ID, we assume that it's
    // a stream chunk since any other row shouldn't have more than one entry.
    const streamChunk: InitializedStreamChunk<any> = (chunk: any);
    const controller = streamChunk.reason;
    if (value[0] === 'C') {
      controller.close(value === 'C' ? '"$undefined"' : value.slice(1));
    } else {
      controller.enqueueModel(value);
    }
    return;
  }
  const resolveListeners = chunk.value;
  const rejectListeners = chunk.reason;
  const resolvedChunk: ResolvedModelChunk<T> = (chunk: any);
  resolvedChunk.status = RESOLVED_MODEL;
  resolvedChunk.value = value;
  resolvedChunk.reason = {id, [RESPONSE_SYMBOL]: response};
  if (resolveListeners !== null) {
    // This is unfortunate that we're reading this eagerly if
    // we already have listeners attached since they might no
    // longer be rendered or might not be the highest pri.
    initializeModelChunk(resolvedChunk);
    // The status might have changed after initialization.
    wakeChunkIfInitialized(response, chunk, resolveListeners, rejectListeners);
  }
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
  return new ReactPromise(INITIALIZED, value, controller);
}

function createResolvedIteratorResultChunk<T>(
  response: Response,
  value: string,
  done: boolean,
): ResolvedModelChunk<IteratorResult<T, T>> {
  // To reuse code as much code as possible we add the wrapper element as part of the JSON.
  const iteratorResultJSON =
    (done ? '{"done":true,"value":' : '{"done":false,"value":') + value + '}';
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(RESOLVED_MODEL, iteratorResultJSON, {
    id: -1,
    [RESPONSE_SYMBOL]: response,
  });
}

function resolveIteratorResultChunk<T>(
  response: Response,
  chunk: SomeChunk<IteratorResult<T, T>>,
  value: string,
  done: boolean,
): void {
  // To reuse code as much code as possible we add the wrapper element as part of the JSON.
  const iteratorResultJSON =
    (done ? '{"done":true,"value":' : '{"done":false,"value":') + value + '}';
  resolveModelChunk(response, chunk, iteratorResultJSON, -1);
}

function loadServerReference<A: Iterable<any>, T>(
  response: Response,
  metaData: {
    id: any,
    bound: null | Thenable<Array<any>>,
  },
  parentObject: Object,
  key: string,
): (...A) => Promise<T> {
  const id: ServerReferenceId = metaData.id;
  if (typeof id !== 'string') {
    return (null: any);
  }
  if (key === 'then') {
    // This should never happen because we always serialize objects with then-functions
    // as "thenable" which reduces to ReactPromise with no other fields.
    return (null: any);
  }
  const serverReference: ServerReference<T> =
    resolveServerReference<$FlowFixMe>(response._bundlerConfig, id);
  // We expect most servers to not really need this because you'd just have all
  // the relevant modules already loaded but it allows for lazy loading of code
  // if needed.
  const bound = metaData.bound;
  let promise: null | Thenable<any> = preloadModule(serverReference);
  if (!promise) {
    if (bound instanceof ReactPromise) {
      promise = Promise.resolve(bound);
    } else {
      const resolvedValue = (requireModule(serverReference): any);
      return resolvedValue;
    }
  } else if (bound instanceof ReactPromise) {
    promise = Promise.all([promise, bound]);
  }

  let handler: InitializationHandler;
  if (initializingHandler) {
    handler = initializingHandler;
    handler.deps++;
  } else {
    handler = initializingHandler = {
      chunk: null,
      value: null,
      reason: null,
      deps: 1,
      errored: false,
    };
  }

  function fulfill(): void {
    let resolvedValue = (requireModule(serverReference): any);

    if (metaData.bound) {
      // This promise is coming from us and should have initilialized by now.
      const promiseValue = (metaData.bound: any).value;
      const boundArgs: Array<any> = Array.isArray(promiseValue)
        ? promiseValue.slice(0)
        : [];
      boundArgs.unshift(null); // this
      resolvedValue = resolvedValue.bind.apply(resolvedValue, boundArgs);
    }

    parentObject[key] = resolvedValue;

    // If this is the root object for a model reference, where `handler.value`
    // is a stale `null`, the resolved value can be used directly.
    if (key === '' && handler.value === null) {
      handler.value = resolvedValue;
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
      initializedChunk.reason = null;
      if (resolveListeners !== null) {
        wakeChunk(response, resolveListeners, handler.value);
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
    handler.errored = true;
    handler.value = null;
    handler.reason = error;
    const chunk = handler.chunk;
    if (chunk === null || chunk.status !== BLOCKED) {
      return;
    }
    triggerErrorOnChunk(response, chunk, error);
  }

  promise.then(fulfill, reject);

  // Return a place holder value for now.
  return (null: any);
}

function reviveModel(
  response: Response,
  parentObj: any,
  parentKey: string,
  value: JSONValue,
  reference: void | string,
): any {
  if (typeof value === 'string') {
    // We can't use .bind here because we need the "this" value.
    return parseModelString(response, parentObj, parentKey, value, reference);
  }
  if (typeof value === 'object' && value !== null) {
    if (
      reference !== undefined &&
      response._temporaryReferences !== undefined
    ) {
      // Store this object's reference in case it's returned later.
      registerTemporaryReference(
        response._temporaryReferences,
        value,
        reference,
      );
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const childRef =
          reference !== undefined ? reference + ':' + i : undefined;
        // $FlowFixMe[cannot-write]
        value[i] = reviveModel(response, value, '' + i, value[i], childRef);
      }
    } else {
      for (const key in value) {
        if (hasOwnProperty.call(value, key)) {
          const childRef =
            reference !== undefined && key.indexOf(':') === -1
              ? reference + ':' + key
              : undefined;
          const newValue = reviveModel(
            response,
            value,
            key,
            value[key],
            childRef,
          );
          if (newValue !== undefined || key === '__proto__') {
            // $FlowFixMe[cannot-write]
            value[key] = newValue;
          } else {
            // $FlowFixMe[cannot-write]
            delete value[key];
          }
        }
      }
    }
  }
  return value;
}

type InitializationReference = {
  handler: InitializationHandler,
  parentObject: Object,
  key: string,
  map: (
    response: Response,
    model: any,
    parentObject: Object,
    key: string,
  ) => any,
  path: Array<string>,
};
type InitializationHandler = {
  chunk: null | BlockedChunk<any>,
  value: any,
  reason: any,
  deps: number,
  errored: boolean,
};
let initializingHandler: null | InitializationHandler = null;

function initializeModelChunk<T>(chunk: ResolvedModelChunk<T>): void {
  const prevHandler = initializingHandler;
  initializingHandler = null;

  const {[RESPONSE_SYMBOL]: response, id} = chunk.reason;

  const rootReference = id === -1 ? undefined : id.toString(16);

  const resolvedModel = chunk.value;

  // We go to the BLOCKED state until we've fully resolved this.
  // We do this before parsing in case we try to initialize the same chunk
  // while parsing the model. Such as in a cyclic reference.
  const cyclicChunk: BlockedChunk<T> = (chunk: any);
  cyclicChunk.status = BLOCKED;
  cyclicChunk.value = null;
  cyclicChunk.reason = null;

  try {
    const rawModel = JSON.parse(resolvedModel);

    const value: T = reviveModel(
      response,
      {'': rawModel},
      '',
      rawModel,
      rootReference,
    );

    // Invoke any listeners added while resolving this model. I.e. cyclic
    // references. This may or may not fully resolve the model depending on
    // if they were blocked.
    const resolveListeners = cyclicChunk.value;
    if (resolveListeners !== null) {
      cyclicChunk.value = null;
      cyclicChunk.reason = null;
      for (let i = 0; i < resolveListeners.length; i++) {
        const listener = resolveListeners[i];
        if (typeof listener === 'function') {
          listener(value);
        } else {
          fulfillReference(response, listener, value);
        }
      }
    }
    if (initializingHandler !== null) {
      if (initializingHandler.errored) {
        throw initializingHandler.reason;
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
    initializedChunk.reason = null;
  } catch (error) {
    const erroredChunk: ErroredChunk<T> = (chunk: any);
    erroredChunk.status = ERRORED;
    erroredChunk.reason = error;
  } finally {
    initializingHandler = prevHandler;
  }
}

// Report that any missing chunks in the model is now going to throw this
// error upon read. Also notify any pending promises.
export function reportGlobalError(response: Response, error: Error): void {
  response._closed = true;
  response._closedReason = error;
  response._chunks.forEach(chunk => {
    // If this chunk was already resolved or errored, it won't
    // trigger an error but if it wasn't then we need to
    // because we won't be getting any new data to resolve it.
    if (chunk.status === PENDING) {
      triggerErrorOnChunk(response, chunk, error);
    } else if (chunk.status === INITIALIZED && chunk.reason !== null) {
      chunk.reason.error(error);
    }
  });
}

function getChunk(response: Response, id: number): SomeChunk<any> {
  const chunks = response._chunks;
  let chunk = chunks.get(id);
  if (!chunk) {
    const prefix = response._prefix;
    const key = prefix + id;
    // Check if we have this field in the backing store already.
    const backingEntry = response._formData.get(key);
    if (typeof backingEntry === 'string') {
      chunk = createResolvedModelChunk(response, backingEntry, id);
    } else if (response._closed) {
      // We have already errored the response and we're not going to get
      // anything more streaming in so this will immediately error.
      chunk = createErroredChunk(response, response._closedReason);
    } else {
      // We're still waiting on this entry to stream in.
      chunk = createPendingChunk(response);
    }
    chunks.set(id, chunk);
  }
  return chunk;
}

function fulfillReference(
  response: Response,
  reference: InitializationReference,
  value: any,
): void {
  const {handler, parentObject, key, map, path} = reference;

  try {
    for (let i = 1; i < path.length; i++) {
      // The server doesn't have any lazy references so we don't expect to go through a Promise.
      const name = path[i];
      if (
        typeof value === 'object' &&
        value !== null &&
        (getPrototypeOf(value) === ObjectPrototype ||
          getPrototypeOf(value) === ArrayPrototype) &&
        hasOwnProperty.call(value, name)
      ) {
        value = value[name];
      } else {
        throw new Error('Invalid reference.');
      }
    }

    const mappedValue = map(response, value, parentObject, key);
    parentObject[key] = mappedValue;

    // If this is the root object for a model reference, where `handler.value`
    // is a stale `null`, the resolved value can be used directly.
    if (key === '' && handler.value === null) {
      handler.value = mappedValue;
    }
  } catch (error) {
    rejectReference(response, reference.handler, error);
    return;
  }

  // There are no Elements or Debug Info to transfer here.

  handler.deps--;

  if (handler.deps === 0) {
    const chunk = handler.chunk;
    if (chunk === null || chunk.status !== BLOCKED) {
      return;
    }
    const resolveListeners = chunk.value;
    const initializedChunk: InitializedChunk<any> = (chunk: any);
    initializedChunk.status = INITIALIZED;
    initializedChunk.value = handler.value;
    initializedChunk.reason = handler.reason; // Used by streaming chunks
    if (resolveListeners !== null) {
      wakeChunk(response, resolveListeners, handler.value);
    }
  }
}

function rejectReference(
  response: Response,
  handler: InitializationHandler,
  error: mixed,
): void {
  if (handler.errored) {
    // We've already errored. We could instead build up an AggregateError
    // but if there are multiple errors we just take the first one like
    // Promise.all.
    return;
  }
  handler.errored = true;
  handler.value = null;
  handler.reason = error;
  const chunk = handler.chunk;
  if (chunk === null || chunk.status !== BLOCKED) {
    return;
  }
  // There's no debug info to forward in this direction.
  triggerErrorOnChunk(response, chunk, error);
}

function waitForReference<T>(
  referencedChunk: PendingChunk<T> | BlockedChunk<T>,
  parentObject: Object,
  key: string,
  response: Response,
  map: (response: Response, model: any, parentObject: Object, key: string) => T,
  path: Array<string>,
): T {
  let handler: InitializationHandler;
  if (initializingHandler) {
    handler = initializingHandler;
    handler.deps++;
  } else {
    handler = initializingHandler = {
      chunk: null,
      value: null,
      reason: null,
      deps: 1,
      errored: false,
    };
  }

  const reference: InitializationReference = {
    handler,
    parentObject,
    key,
    map,
    path,
  };

  // Add "listener".
  if (referencedChunk.value === null) {
    referencedChunk.value = [reference];
  } else {
    referencedChunk.value.push(reference);
  }
  if (referencedChunk.reason === null) {
    referencedChunk.reason = [reference];
  } else {
    referencedChunk.reason.push(reference);
  }

  // Return a place holder value for now.
  return (null: any);
}

function getOutlinedModel<T>(
  response: Response,
  reference: string,
  parentObject: Object,
  key: string,
  map: (response: Response, model: any, parentObject: Object, key: string) => T,
): T {
  const path = reference.split(':');
  const id = parseInt(path[0], 16);
  const chunk = getChunk(response, id);
  switch (chunk.status) {
    case RESOLVED_MODEL:
      initializeModelChunk(chunk);
      break;
  }
  // The status might have changed after initialization.
  switch (chunk.status) {
    case INITIALIZED:
      let value = chunk.value;
      for (let i = 1; i < path.length; i++) {
        const name = path[i];
        if (
          typeof value === 'object' &&
          value !== null &&
          (getPrototypeOf(value) === ObjectPrototype ||
            getPrototypeOf(value) === ArrayPrototype) &&
          hasOwnProperty.call(value, name)
        ) {
          value = value[name];
        } else {
          throw new Error('Invalid reference.');
        }
      }
      const chunkValue = map(response, value, parentObject, key);
      // There's no Element nor Debug Info in the ReplyServer so we don't have to check those here.
      return chunkValue;
    case PENDING:
    case BLOCKED:
      return waitForReference(chunk, parentObject, key, response, map, path);
    default:
      // This is an error. Instead of erroring directly, we're going to encode this on
      // an initialization handler.
      if (initializingHandler) {
        initializingHandler.errored = true;
        initializingHandler.value = null;
        initializingHandler.reason = chunk.reason;
      } else {
        initializingHandler = {
          chunk: null,
          value: null,
          reason: chunk.reason,
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

function extractIterator(response: Response, model: Array<any>): Iterator<any> {
  // $FlowFixMe[incompatible-use]: This uses raw Symbols because we're extracting from a native array.
  return model[Symbol.iterator]();
}

function createModel(
  response: Response,
  model: any,
  parentObject: Object,
  key: string,
): any {
  if (key === 'then' && typeof model === 'function') {
    // This should never happen because we always serialize objects with then-functions
    // as "thenable" which reduces to ReactPromise with no other fields.
    return null;
  }
  return model;
}

function parseTypedArray<T: $ArrayBufferView | ArrayBuffer>(
  response: Response,
  reference: string,
  constructor: any,
  bytesPerElement: number,
  parentObject: Object,
  parentKey: string,
): null {
  const id = parseInt(reference.slice(2), 16);
  const prefix = response._prefix;
  const key = prefix + id;
  const chunks = response._chunks;
  if (chunks.has(id)) {
    throw new Error('Already initialized typed array.');
  }

  // We should have this backingEntry in the store already because we emitted
  // it before referencing it. It should be a Blob.
  // TODO: Use getOutlinedModel to allow us to emit the Blob later. We should be able to do that now.
  const backingEntry: Blob = (response._formData.get(key): any);

  const promise: Promise<ArrayBuffer> = backingEntry.arrayBuffer();

  // Since loading the buffer is an async operation we'll be blocking the parent
  // chunk.

  let handler: InitializationHandler;
  if (initializingHandler) {
    handler = initializingHandler;
    handler.deps++;
  } else {
    handler = initializingHandler = {
      chunk: null,
      value: null,
      reason: null,
      deps: 1,
      errored: false,
    };
  }

  function fulfill(buffer: ArrayBuffer): void {
    const resolvedValue: T =
      constructor === ArrayBuffer
        ? (buffer: any)
        : (new constructor(buffer): any);

    parentObject[parentKey] = resolvedValue;

    // If this is the root object for a model reference, where `handler.value`
    // is a stale `null`, the resolved value can be used directly.
    if (parentKey === '' && handler.value === null) {
      handler.value = resolvedValue;
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
      initializedChunk.reason = null;
      if (resolveListeners !== null) {
        wakeChunk(response, resolveListeners, handler.value);
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
    handler.errored = true;
    handler.value = null;
    handler.reason = error;
    const chunk = handler.chunk;
    if (chunk === null || chunk.status !== BLOCKED) {
      return;
    }
    triggerErrorOnChunk(response, chunk, error);
  }

  promise.then(fulfill, reject);

  return null;
}

function resolveStream<T: ReadableStream | $AsyncIterable<any, any, void>>(
  response: Response,
  id: number,
  stream: T,
  controller: FlightStreamController,
): void {
  const chunks = response._chunks;
  const chunk = createInitializedStreamChunk(response, stream, controller);
  chunks.set(id, chunk);

  const prefix = response._prefix;
  const key = prefix + id;
  const existingEntries = response._formData.getAll(key);
  for (let i = 0; i < existingEntries.length; i++) {
    const value = existingEntries[i];
    if (typeof value === 'string') {
      if (value[0] === 'C') {
        controller.close(value === 'C' ? '"$undefined"' : value.slice(1));
      } else {
        controller.enqueueModel(value);
      }
    }
  }
}

function parseReadableStream<T>(
  response: Response,
  reference: string,
  type: void | 'bytes',
  parentObject: Object,
  parentKey: string,
): ReadableStream {
  const id = parseInt(reference.slice(2), 16);
  const chunks = response._chunks;
  if (chunks.has(id)) {
    throw new Error('Already initialized stream.');
  }

  let controller: ReadableStreamController = (null: any);
  let closed = false;
  const stream = new ReadableStream({
    type: type,
    start(c) {
      controller = c;
    },
  });
  let previousBlockedChunk: SomeChunk<T> | null = null;
  const flightController = {
    enqueueModel(json: string): void {
      if (previousBlockedChunk === null) {
        // If we're not blocked on any other chunks, we can try to eagerly initialize
        // this as a fast-path to avoid awaiting them.
        const chunk: ResolvedModelChunk<T> = createResolvedModelChunk(
          response,
          json,
          -1,
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
          resolveModelChunk(response, chunk, json, -1);
        });
      }
    },
    close(json: string): void {
      if (closed) {
        return;
      }
      closed = true;
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
      if (closed) {
        return;
      }
      closed = true;
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
  return stream;
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

function parseAsyncIterable<T>(
  response: Response,
  reference: string,
  iterator: boolean,
  parentObject: Object,
  parentKey: string,
): $AsyncIterable<T, T, void> | $AsyncIterator<T, T, void> {
  const id = parseInt(reference.slice(2), 16);
  const chunks = response._chunks;
  if (chunks.has(id)) {
    throw new Error('Already initialized stream.');
  }

  const buffer: Array<SomeChunk<IteratorResult<T, T>>> = [];
  let closed = false;
  let nextWriteIndex = 0;
  const flightController = {
    enqueueModel(value: string): void {
      if (nextWriteIndex === buffer.length) {
        buffer[nextWriteIndex] = createResolvedIteratorResultChunk(
          response,
          value,
          false,
        );
      } else {
        resolveIteratorResultChunk(
          response,
          buffer[nextWriteIndex],
          value,
          false,
        );
      }
      nextWriteIndex++;
    },
    close(value: string): void {
      if (closed) {
        return;
      }
      closed = true;
      if (nextWriteIndex === buffer.length) {
        buffer[nextWriteIndex] = createResolvedIteratorResultChunk(
          response,
          value,
          true,
        );
      } else {
        resolveIteratorResultChunk(
          response,
          buffer[nextWriteIndex],
          value,
          true,
        );
      }
      nextWriteIndex++;
      while (nextWriteIndex < buffer.length) {
        // In generators, any extra reads from the iterator have the value undefined.
        resolveIteratorResultChunk(
          response,
          buffer[nextWriteIndex++],
          '"$undefined"',
          true,
        );
      }
    },
    error(error: Error): void {
      if (closed) {
        return;
      }
      closed = true;
      if (nextWriteIndex === buffer.length) {
        buffer[nextWriteIndex] =
          createPendingChunk<IteratorResult<T, T>>(response);
      }
      while (nextWriteIndex < buffer.length) {
        triggerErrorOnChunk(response, buffer[nextWriteIndex++], error);
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
  const stream = iterator ? iterable[ASYNC_ITERATOR]() : iterable;
  resolveStream(response, id, stream, flightController);
  return stream;
}

function parseModelString(
  response: Response,
  obj: Object,
  key: string,
  value: string,
  reference: void | string,
): any {
  if (value[0] === '$') {
    switch (value[1]) {
      case '$': {
        // This was an escaped string value.
        return value.slice(1);
      }
      case '@': {
        // Promise
        const id = parseInt(value.slice(2), 16);
        const chunk = getChunk(response, id);
        return chunk;
      }
      case 'h': {
        // Server Reference
        const ref = value.slice(2);
        return getOutlinedModel(response, ref, obj, key, loadServerReference);
      }
      case 'T': {
        // Temporary Reference
        if (
          reference === undefined ||
          response._temporaryReferences === undefined
        ) {
          throw new Error(
            'Could not reference an opaque temporary reference. ' +
              'This is likely due to misconfiguring the temporaryReferences options ' +
              'on the server.',
          );
        }
        return createTemporaryReference(
          response._temporaryReferences,
          reference,
        );
      }
      case 'Q': {
        // Map
        const ref = value.slice(2);
        return getOutlinedModel(response, ref, obj, key, createMap);
      }
      case 'W': {
        // Set
        const ref = value.slice(2);
        return getOutlinedModel(response, ref, obj, key, createSet);
      }
      case 'K': {
        // FormData
        const stringId = value.slice(2);
        const formPrefix = response._prefix + stringId + '_';
        const data = new FormData();
        const backingFormData = response._formData;
        // We assume that the reference to FormData always comes after each
        // entry that it references so we can assume they all exist in the
        // backing store already.
        // $FlowFixMe[prop-missing] FormData has forEach on it.
        backingFormData.forEach((entry: File | string, entryKey: string) => {
          if (entryKey.startsWith(formPrefix)) {
            // $FlowFixMe[incompatible-call]
            data.append(entryKey.slice(formPrefix.length), entry);
          }
        });
        return data;
      }
      case 'i': {
        // Iterator
        const ref = value.slice(2);
        return getOutlinedModel(response, ref, obj, key, extractIterator);
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
    }
    switch (value[1]) {
      case 'A':
        return parseTypedArray(response, value, ArrayBuffer, 1, obj, key);
      case 'O':
        return parseTypedArray(response, value, Int8Array, 1, obj, key);
      case 'o':
        return parseTypedArray(response, value, Uint8Array, 1, obj, key);
      case 'U':
        return parseTypedArray(response, value, Uint8ClampedArray, 1, obj, key);
      case 'S':
        return parseTypedArray(response, value, Int16Array, 2, obj, key);
      case 's':
        return parseTypedArray(response, value, Uint16Array, 2, obj, key);
      case 'L':
        return parseTypedArray(response, value, Int32Array, 4, obj, key);
      case 'l':
        return parseTypedArray(response, value, Uint32Array, 4, obj, key);
      case 'G':
        return parseTypedArray(response, value, Float32Array, 4, obj, key);
      case 'g':
        return parseTypedArray(response, value, Float64Array, 8, obj, key);
      case 'M':
        return parseTypedArray(response, value, BigInt64Array, 8, obj, key);
      case 'm':
        return parseTypedArray(response, value, BigUint64Array, 8, obj, key);
      case 'V':
        return parseTypedArray(response, value, DataView, 1, obj, key);
      case 'B': {
        // Blob
        const id = parseInt(value.slice(2), 16);
        const prefix = response._prefix;
        const blobKey = prefix + id;
        // We should have this backingEntry in the store already because we emitted
        // it before referencing it. It should be a Blob.
        const backingEntry: Blob = (response._formData.get(blobKey): any);
        return backingEntry;
      }
    }
    switch (value[1]) {
      case 'R': {
        return parseReadableStream(response, value, undefined, obj, key);
      }
      case 'r': {
        return parseReadableStream(response, value, 'bytes', obj, key);
      }
      case 'X': {
        return parseAsyncIterable(response, value, false, obj, key);
      }
      case 'x': {
        return parseAsyncIterable(response, value, true, obj, key);
      }
    }
    // We assume that anything else is a reference ID.
    const ref = value.slice(1);
    return getOutlinedModel(response, ref, obj, key, createModel);
  }
  return value;
}

export function createResponse(
  bundlerConfig: ServerManifest,
  formFieldPrefix: string,
  temporaryReferences: void | TemporaryReferenceSet,
  backingFormData?: FormData = new FormData(),
): Response {
  const chunks: Map<number, SomeChunk<any>> = new Map();
  const response: Response = {
    _bundlerConfig: bundlerConfig,
    _prefix: formFieldPrefix,
    _formData: backingFormData,
    _chunks: chunks,
    _closed: false,
    _closedReason: null,
    _temporaryReferences: temporaryReferences,
  };
  return response;
}

export function resolveField(
  response: Response,
  key: string,
  value: string,
): void {
  // Add this field to the backing store.
  response._formData.append(key, value);
  const prefix = response._prefix;
  if (key.startsWith(prefix)) {
    const chunks = response._chunks;
    const id = +key.slice(prefix.length);
    const chunk = chunks.get(id);
    if (chunk) {
      // We were waiting on this key so now we can resolve it.
      resolveModelChunk(response, chunk, value, id);
    }
  }
}

export function resolveFile(response: Response, key: string, file: File): void {
  // Add this field to the backing store.
  response._formData.append(key, file);
}

export opaque type FileHandle = {
  chunks: Array<Uint8Array>,
  filename: string,
  mime: string,
};

export function resolveFileInfo(
  response: Response,
  key: string,
  filename: string,
  mime: string,
): FileHandle {
  return {
    chunks: [],
    filename,
    mime,
  };
}

export function resolveFileChunk(
  response: Response,
  handle: FileHandle,
  chunk: Uint8Array,
): void {
  handle.chunks.push(chunk);
}

export function resolveFileComplete(
  response: Response,
  key: string,
  handle: FileHandle,
): void {
  // Add this file to the backing store.
  // Node.js doesn't expose a global File constructor so we need to use
  // the append() form that takes the file name as the third argument,
  // to create a File object.
  const blob = new Blob(handle.chunks, {type: handle.mime});
  response._formData.append(key, blob, handle.filename);
}

export function close(response: Response): void {
  // In case there are any remaining unresolved chunks, they won't
  // be resolved now. So we need to issue an error to those.
  // Ideally we should be able to early bail out if we kept a
  // ref count of pending chunks.
  reportGlobalError(response, new Error('Connection closed.'));
}
