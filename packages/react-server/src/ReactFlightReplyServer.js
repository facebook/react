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
import {
  enableBinaryFlight,
  enableFlightReadableStream,
} from 'shared/ReactFeatureFlags';
import {ASYNC_ITERATOR} from 'shared/ReactSymbols';

import hasOwnProperty from 'shared/hasOwnProperty';

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
const CYCLIC = 'cyclic';
const RESOLVED_MODEL = 'resolved_model';
const INITIALIZED = 'fulfilled';
const ERRORED = 'rejected';

type PendingChunk<T> = {
  status: 'pending',
  value: null | Array<(T) => mixed>,
  reason: null | Array<(mixed) => mixed>,
  _response: Response,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type BlockedChunk<T> = {
  status: 'blocked',
  value: null | Array<(T) => mixed>,
  reason: null | Array<(mixed) => mixed>,
  _response: Response,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type CyclicChunk<T> = {
  status: 'cyclic',
  value: null | Array<(T) => mixed>,
  reason: null | Array<(mixed) => mixed>,
  _response: Response,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type ResolvedModelChunk<T> = {
  status: 'resolved_model',
  value: string,
  reason: number,
  _response: Response,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type InitializedChunk<T> = {
  status: 'fulfilled',
  value: T,
  reason: null,
  _response: Response,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type InitializedStreamChunk<
  T: ReadableStream | $AsyncIterable<any, any, void>,
> = {
  status: 'fulfilled',
  value: T,
  reason: FlightStreamController,
  _response: Response,
  then(resolve: (ReadableStream) => mixed, reject?: (mixed) => mixed): void,
};
type ErroredChunk<T> = {
  status: 'rejected',
  value: null,
  reason: mixed,
  _response: Response,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};
type SomeChunk<T> =
  | PendingChunk<T>
  | BlockedChunk<T>
  | CyclicChunk<T>
  | ResolvedModelChunk<T>
  | InitializedChunk<T>
  | ErroredChunk<T>;

// $FlowFixMe[missing-this-annot]
function Chunk(status: any, value: any, reason: any, response: Response) {
  this.status = status;
  this.value = value;
  this.reason = reason;
  this._response = response;
}
// We subclass Promise.prototype so that we get other methods like .catch
Chunk.prototype = (Object.create(Promise.prototype): any);
// TODO: This doesn't return a new Promise chain unlike the real .then
Chunk.prototype.then = function <T>(
  this: SomeChunk<T>,
  resolve: (value: T) => mixed,
  reject: (reason: mixed) => mixed,
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
      resolve(chunk.value);
      break;
    case PENDING:
    case BLOCKED:
    case CYCLIC:
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
      reject(chunk.reason);
      break;
  }
};

export type Response = {
  _bundlerConfig: ServerManifest,
  _prefix: string,
  _formData: FormData,
  _chunks: Map<number, SomeChunk<any>>,
  _temporaryReferences: void | TemporaryReferenceSet,
};

export function getRoot<T>(response: Response): Thenable<T> {
  const chunk = getChunk(response, 0);
  return (chunk: any);
}

function createPendingChunk<T>(response: Response): PendingChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new Chunk(PENDING, null, null, response);
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
    case CYCLIC:
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
  value: string,
  id: number,
): ResolvedModelChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new Chunk(RESOLVED_MODEL, value, id, response);
}

function resolveModelChunk<T>(
  chunk: SomeChunk<T>,
  value: string,
  id: number,
): void {
  if (chunk.status !== PENDING) {
    if (enableFlightReadableStream) {
      // If we get more data to an already resolved ID, we assume that it's
      // a stream chunk since any other row shouldn't have more than one entry.
      const streamChunk: InitializedStreamChunk<any> = (chunk: any);
      const controller = streamChunk.reason;
      if (value[0] === 'C') {
        controller.close(value === 'C' ? '"$undefined"' : value.slice(1));
      } else {
        controller.enqueueModel(value);
      }
    }
    return;
  }
  const resolveListeners = chunk.value;
  const rejectListeners = chunk.reason;
  const resolvedChunk: ResolvedModelChunk<T> = (chunk: any);
  resolvedChunk.status = RESOLVED_MODEL;
  resolvedChunk.value = value;
  resolvedChunk.reason = id;
  if (resolveListeners !== null) {
    // This is unfortunate that we're reading this eagerly if
    // we already have listeners attached since they might no
    // longer be rendered or might not be the highest pri.
    initializeModelChunk(resolvedChunk);
    // The status might have changed after initialization.
    wakeChunkIfInitialized(chunk, resolveListeners, rejectListeners);
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
  return new Chunk(INITIALIZED, value, controller, response);
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
  return new Chunk(RESOLVED_MODEL, iteratorResultJSON, -1, response);
}

function resolveIteratorResultChunk<T>(
  chunk: SomeChunk<IteratorResult<T, T>>,
  value: string,
  done: boolean,
): void {
  // To reuse code as much code as possible we add the wrapper element as part of the JSON.
  const iteratorResultJSON =
    (done ? '{"done":true,"value":' : '{"done":false,"value":') + value + '}';
  resolveModelChunk(chunk, iteratorResultJSON, -1);
}

function bindArgs(fn: any, args: any) {
  return fn.bind.apply(fn, [null].concat(args));
}

function loadServerReference<T>(
  response: Response,
  id: ServerReferenceId,
  bound: null | Thenable<Array<any>>,
  parentChunk: SomeChunk<T>,
  parentObject: Object,
  key: string,
): T {
  const serverReference: ServerReference<T> =
    resolveServerReference<$FlowFixMe>(response._bundlerConfig, id);
  // We expect most servers to not really need this because you'd just have all
  // the relevant modules already loaded but it allows for lazy loading of code
  // if needed.
  const preloadPromise = preloadModule(serverReference);
  let promise: Promise<T>;
  if (bound) {
    promise = Promise.all([(bound: any), preloadPromise]).then(
      ([args]: Array<any>) => bindArgs(requireModule(serverReference), args),
    );
  } else {
    if (preloadPromise) {
      promise = Promise.resolve(preloadPromise).then(() =>
        requireModule(serverReference),
      );
    } else {
      // Synchronously available
      return requireModule(serverReference);
    }
  }
  promise.then(
    createModelResolver(
      parentChunk,
      parentObject,
      key,
      false,
      response,
      createModel,
      [],
    ),
    createModelReject(parentChunk),
  );
  // We need a placeholder value that will be replaced later.
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
          if (newValue !== undefined) {
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

let initializingChunk: ResolvedModelChunk<any> = (null: any);
let initializingChunkBlockedModel: null | {deps: number, value: any} = null;
function initializeModelChunk<T>(chunk: ResolvedModelChunk<T>): void {
  const prevChunk = initializingChunk;
  const prevBlocked = initializingChunkBlockedModel;
  initializingChunk = chunk;
  initializingChunkBlockedModel = null;

  const rootReference =
    chunk.reason === -1 ? undefined : chunk.reason.toString(16);

  const resolvedModel = chunk.value;

  // We go to the CYCLIC state until we've fully resolved this.
  // We do this before parsing in case we try to initialize the same chunk
  // while parsing the model. Such as in a cyclic reference.
  const cyclicChunk: CyclicChunk<T> = (chunk: any);
  cyclicChunk.status = CYCLIC;
  cyclicChunk.value = null;
  cyclicChunk.reason = null;

  try {
    const rawModel = JSON.parse(resolvedModel);

    const value: T = reviveModel(
      chunk._response,
      {'': rawModel},
      '',
      rawModel,
      rootReference,
    );
    if (
      initializingChunkBlockedModel !== null &&
      initializingChunkBlockedModel.deps > 0
    ) {
      initializingChunkBlockedModel.value = value;
      // We discovered new dependencies on modules that are not yet resolved.
      // We have to go the BLOCKED state until they're resolved.
      const blockedChunk: BlockedChunk<T> = (chunk: any);
      blockedChunk.status = BLOCKED;
    } else {
      const resolveListeners = cyclicChunk.value;
      const initializedChunk: InitializedChunk<T> = (chunk: any);
      initializedChunk.status = INITIALIZED;
      initializedChunk.value = value;
      if (resolveListeners !== null) {
        wakeChunk(resolveListeners, value);
      }
    }
  } catch (error) {
    const erroredChunk: ErroredChunk<T> = (chunk: any);
    erroredChunk.status = ERRORED;
    erroredChunk.reason = error;
  } finally {
    initializingChunk = prevChunk;
    initializingChunkBlockedModel = prevBlocked;
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

function getChunk(response: Response, id: number): SomeChunk<any> {
  const chunks = response._chunks;
  let chunk = chunks.get(id);
  if (!chunk) {
    const prefix = response._prefix;
    const key = prefix + id;
    // Check if we have this field in the backing store already.
    const backingEntry = response._formData.get(key);
    if (backingEntry != null) {
      // We assume that this is a string entry for now.
      chunk = createResolvedModelChunk(response, (backingEntry: any), id);
    } else {
      // We're still waiting on this entry to stream in.
      chunk = createPendingChunk(response);
    }
    chunks.set(id, chunk);
  }
  return chunk;
}

function createModelResolver<T>(
  chunk: SomeChunk<T>,
  parentObject: Object,
  key: string,
  cyclic: boolean,
  response: Response,
  map: (response: Response, model: any) => T,
  path: Array<string>,
): (value: any) => void {
  let blocked;
  if (initializingChunkBlockedModel) {
    blocked = initializingChunkBlockedModel;
    if (!cyclic) {
      blocked.deps++;
    }
  } else {
    blocked = initializingChunkBlockedModel = {
      deps: cyclic ? 0 : 1,
      value: (null: any),
    };
  }
  return value => {
    for (let i = 1; i < path.length; i++) {
      value = value[path[i]];
    }
    parentObject[key] = map(response, value);

    // If this is the root object for a model reference, where `blocked.value`
    // is a stale `null`, the resolved value can be used directly.
    if (key === '' && blocked.value === null) {
      blocked.value = parentObject[key];
    }

    blocked.deps--;
    if (blocked.deps === 0) {
      if (chunk.status !== BLOCKED) {
        return;
      }
      const resolveListeners = chunk.value;
      const initializedChunk: InitializedChunk<T> = (chunk: any);
      initializedChunk.status = INITIALIZED;
      initializedChunk.value = blocked.value;
      if (resolveListeners !== null) {
        wakeChunk(resolveListeners, blocked.value);
      }
    }
  };
}

function createModelReject<T>(chunk: SomeChunk<T>): (error: mixed) => void {
  return (error: mixed) => triggerErrorOnChunk(chunk, error);
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
  }
  // The status might have changed after initialization.
  switch (chunk.status) {
    case INITIALIZED:
      let value = chunk.value;
      for (let i = 1; i < path.length; i++) {
        value = value[path[i]];
      }
      return map(response, value);
    case PENDING:
    case BLOCKED:
    case CYCLIC:
      const parentChunk = initializingChunk;
      chunk.then(
        createModelResolver(
          parentChunk,
          parentObject,
          key,
          chunk.status === CYCLIC,
          response,
          map,
          path,
        ),
        createModelReject(parentChunk),
      );
      return (null: any);
    default:
      throw chunk.reason;
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

function createModel(response: Response, model: any): any {
  return model;
}

function parseTypedArray(
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
  // We should have this backingEntry in the store already because we emitted
  // it before referencing it. It should be a Blob.
  const backingEntry: Blob = (response._formData.get(key): any);

  const promise =
    constructor === ArrayBuffer
      ? backingEntry.arrayBuffer()
      : backingEntry.arrayBuffer().then(function (buffer) {
          return new constructor(buffer);
        });

  // Since loading the buffer is an async operation we'll be blocking the parent
  // chunk.
  const parentChunk = initializingChunk;
  promise.then(
    createModelResolver(
      parentChunk,
      parentObject,
      parentKey,
      false,
      response,
      createModel,
      [],
    ),
    createModelReject(parentChunk),
  );
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
    // We assume that this is a string entry for now.
    const value: string = (existingEntries[i]: any);
    if (value[0] === 'C') {
      controller.close(value === 'C' ? '"$undefined"' : value.slice(1));
    } else {
      controller.enqueueModel(value);
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

  let controller: ReadableStreamController = (null: any);
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
          resolveModelChunk(chunk, json, -1);
        });
      }
    },
    close(json: string): void {
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
        resolveIteratorResultChunk(buffer[nextWriteIndex], value, false);
      }
      nextWriteIndex++;
    },
    close(value: string): void {
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
            return new Chunk(
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
      case 'F': {
        // Server Reference
        const ref = value.slice(2);
        // TODO: Just encode this in the reference inline instead of as a model.
        const metaData: {id: ServerReferenceId, bound: Thenable<Array<any>>} =
          getOutlinedModel(response, ref, obj, key, createModel);
        return loadServerReference(
          response,
          metaData.id,
          metaData.bound,
          initializingChunk,
          obj,
          key,
        );
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
    if (enableBinaryFlight) {
      switch (value[1]) {
        case 'A':
          return parseTypedArray(response, value, ArrayBuffer, 1, obj, key);
        case 'O':
          return parseTypedArray(response, value, Int8Array, 1, obj, key);
        case 'o':
          return parseTypedArray(response, value, Uint8Array, 1, obj, key);
        case 'U':
          return parseTypedArray(
            response,
            value,
            Uint8ClampedArray,
            1,
            obj,
            key,
          );
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
    }
    if (enableFlightReadableStream) {
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
      resolveModelChunk(chunk, value, id);
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
