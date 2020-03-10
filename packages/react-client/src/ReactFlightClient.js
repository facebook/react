/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type ReactModelRoot<T> = {|
  model: T,
|};

export type JSONValue =
  | number
  | null
  | boolean
  | string
  | {[key: string]: JSONValue}
  | Array<JSONValue>;

const PENDING = 0;
const RESOLVED = 1;
const ERRORED = 2;

type PendingChunk = {|
  status: 0,
  value: Promise<void>,
  resolve: () => void,
|};
type ResolvedChunk = {|
  status: 1,
  value: mixed,
  resolve: null,
|};
type ErroredChunk = {|
  status: 2,
  value: Error,
  resolve: null,
|};
type Chunk = PendingChunk | ResolvedChunk | ErroredChunk;

export type Response = {
  partialRow: string,
  modelRoot: ReactModelRoot<any>,
  chunks: Map<number, Chunk>,
};

export function createResponse(): Response {
  let modelRoot: ReactModelRoot<any> = ({}: any);
  let rootChunk: Chunk = createPendingChunk();
  definePendingProperty(modelRoot, 'model', rootChunk);
  let chunks: Map<number, Chunk> = new Map();
  chunks.set(0, rootChunk);
  let response = {
    partialRow: '',
    modelRoot,
    chunks: chunks,
  };
  return response;
}

function createPendingChunk(): PendingChunk {
  let resolve: () => void = (null: any);
  let promise = new Promise(r => (resolve = r));
  return {
    status: PENDING,
    value: promise,
    resolve: resolve,
  };
}

function createErrorChunk(error: Error): ErroredChunk {
  return {
    status: ERRORED,
    value: error,
    resolve: null,
  };
}

function triggerErrorOnChunk(chunk: Chunk, error: Error): void {
  if (chunk.status !== PENDING) {
    // We already resolved. We didn't expect to see this.
    return;
  }
  let resolve = chunk.resolve;
  let erroredChunk: ErroredChunk = (chunk: any);
  erroredChunk.status = ERRORED;
  erroredChunk.value = error;
  erroredChunk.resolve = null;
  resolve();
}

function createResolvedChunk(value: mixed): ResolvedChunk {
  return {
    status: RESOLVED,
    value: value,
    resolve: null,
  };
}

function resolveChunk(chunk: Chunk, value: mixed): void {
  if (chunk.status !== PENDING) {
    // We already resolved. We didn't expect to see this.
    return;
  }
  let resolve = chunk.resolve;
  let resolvedChunk: ResolvedChunk = (chunk: any);
  resolvedChunk.status = RESOLVED;
  resolvedChunk.value = value;
  resolvedChunk.resolve = null;
  resolve();
}

// Report that any missing chunks in the model is now going to throw this
// error upon read. Also notify any pending promises.
export function reportGlobalError(response: Response, error: Error): void {
  response.chunks.forEach(chunk => {
    // If this chunk was already resolved or errored, it won't
    // trigger an error but if it wasn't then we need to
    // because we won't be getting any new data to resolve it.
    triggerErrorOnChunk(chunk, error);
  });
}

function definePendingProperty(
  object: Object,
  key: string,
  chunk: Chunk,
): void {
  Object.defineProperty(object, key, {
    configurable: false,
    enumerable: true,
    get() {
      if (chunk.status === RESOLVED) {
        return chunk.value;
      } else {
        throw chunk.value;
      }
    },
  });
}

export function parseModelFromJSON(
  response: Response,
  targetObj: Object,
  key: string,
  value: JSONValue,
): any {
  if (typeof value === 'string' && value[0] === '$') {
    if (value[1] === '$') {
      // This was an escaped string value.
      return value.substring(1);
    } else {
      let id = parseInt(value.substring(1), 16);
      let chunks = response.chunks;
      let chunk = chunks.get(id);
      if (!chunk) {
        chunk = createPendingChunk();
        chunks.set(id, chunk);
      } else if (chunk.status === RESOLVED) {
        return chunk.value;
      }
      definePendingProperty(targetObj, key, chunk);
      return undefined;
    }
  }
  return value;
}

export function resolveModelChunk<T>(
  response: Response,
  id: number,
  model: T,
): void {
  let chunks = response.chunks;
  let chunk = chunks.get(id);
  if (!chunk) {
    chunks.set(id, createResolvedChunk(model));
  } else {
    resolveChunk(chunk, model);
  }
}

export function resolveErrorChunk(
  response: Response,
  id: number,
  message: string,
  stack: string,
): void {
  let error = new Error(message);
  error.stack = stack;
  let chunks = response.chunks;
  let chunk = chunks.get(id);
  if (!chunk) {
    chunks.set(id, createErrorChunk(error));
  } else {
    triggerErrorOnChunk(chunk, error);
  }
}

export function close(response: Response): void {
  // In case there are any remaining unresolved chunks, they won't
  // be resolved now. So we need to issue an error to those.
  // Ideally we should be able to early bail out if we kept a
  // ref count of pending chunks.
  reportGlobalError(response, new Error('Connection closed.'));
}

export function getModelRoot<T>(response: Response): ReactModelRoot<T> {
  return response.modelRoot;
}
