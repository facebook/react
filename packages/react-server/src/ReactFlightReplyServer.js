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
} from 'react-client/src/ReactFlightClientHostConfig';

import {
  resolveServerReference,
  preloadModule,
  requireModule,
} from 'react-client/src/ReactFlightClientHostConfig';

export type JSONValue =
  | number
  | null
  | boolean
  | string
  | {+[key: string]: JSONValue}
  | $ReadOnlyArray<JSONValue>;

const PENDING = 'pending';
const BLOCKED = 'blocked';
const RESOLVED_VALUE = 'resolved_value';
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
type ResolvedValueChunk<T> = {
  status: 'resolved_value',
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
  | ResolvedValueChunk<T>
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
    case RESOLVED_VALUE:
      initializeValueChunk(chunk);
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
  _serverManifest: ServerManifest,
  _chunks: Map<number, SomeChunk<any>>,
  _fromJSON: (key: string, value: JSONValue) => any,
};

export function getRoot<T>(response: Response): Thenable<T> {
  const chunk = getChunk(response, 0);
  return (chunk: any);
}

function createPendingChunk<T>(response: Response): PendingChunk<T> {
  // $FlowFixMe Flow doesn't support functions as constructors
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

function createResolvedValueChunk<T>(
  response: Response,
  value: string,
): ResolvedValueChunk<T> {
  // $FlowFixMe Flow doesn't support functions as constructors
  return new Chunk(RESOLVED_VALUE, value, null, response);
}

function resolveValueChunk<T>(chunk: SomeChunk<T>, value: string): void {
  if (chunk.status !== PENDING) {
    // We already resolved. We didn't expect to see this.
    return;
  }
  const resolveListeners = chunk.value;
  const rejectListeners = chunk.reason;
  const resolvedChunk: ResolvedValueChunk<T> = (chunk: any);
  resolvedChunk.status = RESOLVED_VALUE;
  resolvedChunk.value = value;
  if (resolveListeners !== null) {
    // This is unfortunate that we're reading this eagerly if
    // we already have listeners attached since they might no
    // longer be rendered or might not be the highest pri.
    initializeValueChunk(resolvedChunk);
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
    resolveServerReference<$FlowFixMe>(response._serverManifest, id);
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
    createValueResolver(parentChunk, parentObject, key),
    createValueReject(parentChunk),
  );
  // We need a placeholder value that will be replaced later.
  return (null: any);
}

let initializingChunk: ResolvedValueChunk<any> = (null: any);
let initializingChunkBlockedValue: null | {deps: number, value: any} = null;
function initializeValueChunk<T>(chunk: ResolvedValueChunk<T>): void {
  const prevChunk = initializingChunk;
  const prevBlocked = initializingChunkBlockedValue;
  initializingChunk = chunk;
  initializingChunkBlockedValue = null;
  try {
    const value: T = JSON.parse(chunk.value, chunk._response._fromJSON);
    if (
      initializingChunkBlockedValue !== null &&
      initializingChunkBlockedValue.deps > 0
    ) {
      initializingChunkBlockedValue.value = value;
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
    initializingChunkBlockedValue = prevBlocked;
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
    chunk = createPendingChunk(response);
    chunks.set(id, chunk);
  }
  return chunk;
}

function createValueResolver<T>(
  chunk: SomeChunk<T>,
  parentObject: Object,
  key: string,
): (value: any) => void {
  let blocked;
  if (initializingChunkBlockedValue) {
    blocked = initializingChunkBlockedValue;
    blocked.deps++;
  } else {
    blocked = initializingChunkBlockedValue = {
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

function createValueReject<T>(chunk: SomeChunk<T>): (error: mixed) => void {
  return (error: mixed) => triggerErrorOnChunk(chunk, error);
}

function parseValueString(
  response: Response,
  parentObject: Object,
  key: string,
  value: string,
): any {
  if (value[0] === '$') {
    switch (value[1]) {
      case '$': {
        // This was an escaped string value.
        return value.substring(1);
      }
      case '@': {
        // Promise
        const id = parseInt(value.substring(2), 16);
        const chunk = getChunk(response, id);
        return chunk;
      }
      case 'S': {
        // Symbol
        return Symbol.for(value.substring(2));
      }
      case 'F': {
        // Server Reference
        const id = parseInt(value.substring(2), 16);
        const chunk = getChunk(response, id);
        if (chunk.status === RESOLVED_VALUE) {
          initializeValueChunk(chunk);
        }
        if (chunk.status !== INITIALIZED) {
          // We know that this is emitted earlier so otherwise it's an error.
          throw chunk.reason;
        }
        // TODO: Just encode this in the reference inline instead of as a value.
        const metaData: {id: ServerReferenceId, bound: Thenable<Array<any>>} =
          chunk.value;
        return loadServerReference(
          response,
          metaData.id,
          metaData.bound,
          initializingChunk,
          parentObject,
          key,
        );
      }
      case 'u': {
        // matches "$undefined"
        // Special encoding for `undefined` which can't be serialized as JSON otherwise.
        return undefined;
      }
      default: {
        // We assume that anything else is a reference ID.
        const id = parseInt(value.substring(1), 16);
        const chunk = getChunk(response, id);
        switch (chunk.status) {
          case RESOLVED_VALUE:
            initializeValueChunk(chunk);
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
              createValueResolver(parentChunk, parentObject, key),
              createValueReject(parentChunk),
            );
            return null;
          default:
            throw chunk.reason;
        }
      }
    }
  }
  return value;
}

export function createResponse(serverManifest: ServerManifest): Response {
  const chunks: Map<number, SomeChunk<any>> = new Map();
  const response: Response = {
    _serverManifest: serverManifest,
    _chunks: chunks,
    _fromJSON: function (this: any, key: string, value: JSONValue) {
      if (typeof value === 'string') {
        // We can't use .bind here because we need the "this" value.
        return parseValueString(response, this, key, value);
      }
      return value;
    },
  };
  return response;
}

export function resolveField(
  response: Response,
  id: number,
  value: string,
): void {
  const chunks = response._chunks;
  const chunk = chunks.get(id);
  if (!chunk) {
    chunks.set(id, createResolvedValueChunk(response, value));
  } else {
    resolveValueChunk(chunk, value);
  }
}

export function resolveFile(response: Response, id: number, file: File): void {
  throw new Error('Not implemented.');
}

export opaque type FileHandle = {};

export function resolveFileInfo(
  response: Response,
  id: number,
  filename: string,
  mime: string,
): FileHandle {
  throw new Error('Not implemented.');
}

export function resolveFileChunk(
  response: Response,
  handle: FileHandle,
  chunk: Uint8Array,
): void {
  throw new Error('Not implemented.');
}

export function resolveFileComplete(
  response: Response,
  handle: FileHandle,
): void {
  throw new Error('Not implemented.');
}

export function close(response: Response): void {
  // In case there are any remaining unresolved chunks, they won't
  // be resolved now. So we need to issue an error to those.
  // Ideally we should be able to early bail out if we kept a
  // ref count of pending chunks.
  reportGlobalError(response, new Error('Connection closed.'));
}
