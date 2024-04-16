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

import {
  resolveServerReference,
  preloadModule,
  requireModule,
} from 'react-client/src/ReactFlightClientConfig';

import {createTemporaryReference} from './ReactFlightServerTemporaryReferences';
import {enableBinaryFlight} from 'shared/ReactFeatureFlags';

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

type PendingChunk<T> = {
  status: 'pending',
  value: null | Array<(T) => mixed>,
  reason: null | Array<(mixed) => mixed>,
  _response: Response,
  then(resolve: (T) => mixed, reject: (mixed) => mixed): void,
};
type BlockedChunk<T> = {
  status: 'blocked',
  value: null | Array<(T) => mixed>,
  reason: null | Array<(mixed) => mixed>,
  _response: Response,
  then(resolve: (T) => mixed, reject: (mixed) => mixed): void,
};
type ResolvedModelChunk<T> = {
  status: 'resolved_model',
  value: string,
  reason: null,
  _response: Response,
  then(resolve: (T) => mixed, reject: (mixed) => mixed): void,
};
type InitializedChunk<T> = {
  status: 'fulfilled',
  value: T,
  reason: null,
  _response: Response,
  then(resolve: (T) => mixed, reject: (mixed) => mixed): void,
};
type ErroredChunk<T> = {
  status: 'rejected',
  value: null,
  reason: mixed,
  _response: Response,
  then(resolve: (T) => mixed, reject: (mixed) => mixed): void,
};
type SomeChunk<T> =
  | PendingChunk<T>
  | BlockedChunk<T>
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
  _fromJSON: (key: string, value: JSONValue) => any,
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
      chunk.value = resolveListeners;
      chunk.reason = rejectListeners;
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
    // We already resolved. We didn't expect to see this.
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
): ResolvedModelChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new Chunk(RESOLVED_MODEL, value, null, response);
}

function resolveModelChunk<T>(chunk: SomeChunk<T>, value: string): void {
  if (chunk.status !== PENDING) {
    // We already resolved. We didn't expect to see this.
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
    createModelResolver(parentChunk, parentObject, key),
    createModelReject(parentChunk),
  );
  // We need a placeholder value that will be replaced later.
  return (null: any);
}

let initializingChunk: ResolvedModelChunk<any> = (null: any);
let initializingChunkBlockedModel: null | {deps: number, value: any} = null;
function initializeModelChunk<T>(chunk: ResolvedModelChunk<T>): void {
  const prevChunk = initializingChunk;
  const prevBlocked = initializingChunkBlockedModel;
  initializingChunk = chunk;
  initializingChunkBlockedModel = null;
  try {
    const value: T = JSON.parse(chunk.value, chunk._response._fromJSON);
    if (
      initializingChunkBlockedModel !== null &&
      initializingChunkBlockedModel.deps > 0
    ) {
      initializingChunkBlockedModel.value = value;
      // We discovered new dependencies on modules that are not yet resolved.
      // We have to go the BLOCKED state until they're resolved.
      const blockedChunk: BlockedChunk<T> = (chunk: any);
      blockedChunk.status = BLOCKED;
      blockedChunk.value = null;
      blockedChunk.reason = null;
    } else {
      const initializedChunk: InitializedChunk<T> = (chunk: any);
      initializedChunk.status = INITIALIZED;
      initializedChunk.value = value;
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
      chunk = createResolvedModelChunk(response, (backingEntry: any));
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
): (value: any) => void {
  let blocked;
  if (initializingChunkBlockedModel) {
    blocked = initializingChunkBlockedModel;
    blocked.deps++;
  } else {
    blocked = initializingChunkBlockedModel = {
      deps: 1,
      value: null,
    };
  }
  return value => {
    parentObject[key] = value;
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

function getOutlinedModel(response: Response, id: number): any {
  const chunk = getChunk(response, id);
  if (chunk.status === RESOLVED_MODEL) {
    initializeModelChunk(chunk);
  }
  if (chunk.status !== INITIALIZED) {
    // We know that this is emitted earlier so otherwise it's an error.
    throw chunk.reason;
  }
  return chunk.value;
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
  // chunk. TODO: This is not safe if the parent chunk needs a mapper like Map.
  const parentChunk = initializingChunk;
  promise.then(
    createModelResolver(parentChunk, parentObject, parentKey),
    createModelReject(parentChunk),
  );
  return null;
}

function parseModelString(
  response: Response,
  obj: Object,
  key: string,
  value: string,
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
        const id = parseInt(value.slice(2), 16);
        // TODO: Just encode this in the reference inline instead of as a model.
        const metaData: {id: ServerReferenceId, bound: Thenable<Array<any>>} =
          getOutlinedModel(response, id);
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
        return createTemporaryReference(value.slice(2));
      }
      case 'Q': {
        // Map
        const id = parseInt(value.slice(2), 16);
        const data = getOutlinedModel(response, id);
        return new Map(data);
      }
      case 'W': {
        // Set
        const id = parseInt(value.slice(2), 16);
        const data = getOutlinedModel(response, id);
        return new Set(data);
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

    // We assume that anything else is a reference ID.
    const id = parseInt(value.slice(1), 16);
    const chunk = getChunk(response, id);
    switch (chunk.status) {
      case RESOLVED_MODEL:
        initializeModelChunk(chunk);
        break;
    }
    // The status might have changed after initialization.
    switch (chunk.status) {
      case INITIALIZED:
        return chunk.value;
      case PENDING:
      case BLOCKED:
        const parentChunk = initializingChunk;
        chunk.then(
          createModelResolver(parentChunk, obj, key),
          createModelReject(parentChunk),
        );
        return null;
      default:
        throw chunk.reason;
    }
  }
  return value;
}

export function createResponse(
  bundlerConfig: ServerManifest,
  formFieldPrefix: string,
  backingFormData?: FormData = new FormData(),
): Response {
  const chunks: Map<number, SomeChunk<any>> = new Map();
  const response: Response = {
    _bundlerConfig: bundlerConfig,
    _prefix: formFieldPrefix,
    _formData: backingFormData,
    _chunks: chunks,
    _fromJSON: function (this: any, key: string, value: JSONValue) {
      if (typeof value === 'string') {
        // We can't use .bind here because we need the "this" value.
        return parseModelString(response, this, key, value);
      }
      return value;
    },
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
      resolveModelChunk(chunk, value);
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
