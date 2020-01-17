/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Source, StringDecoder} from './ReactFlightClientHostConfig';

import {
  supportsBinaryStreams,
  createStringDecoder,
  readPartialStringChunk,
  readFinalStringChunk,
} from './ReactFlightClientHostConfig';

export type ReactModelRoot<T> = {|
  model: T,
|};

type JSONValue =
  | number
  | null
  | boolean
  | string
  | {[key: string]: JSONValue, ...};

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

type OpaqueResponseWithoutDecoder = {
  source: Source,
  partialRow: string,
  modelRoot: ReactModelRoot<any>,
  chunks: Map<number, Chunk>,
  fromJSON: (key: string, value: JSONValue) => any,
  ...
};

type OpaqueResponse = OpaqueResponseWithoutDecoder & {
  stringDecoder: StringDecoder,
  ...
};

export function createResponse(source: Source): OpaqueResponse {
  let modelRoot: ReactModelRoot<any> = ({}: any);
  let rootChunk: Chunk = createPendingChunk();
  definePendingProperty(modelRoot, 'model', rootChunk);
  let chunks: Map<number, Chunk> = new Map();
  chunks.set(0, rootChunk);

  let response: OpaqueResponse = (({
    source,
    partialRow: '',
    modelRoot,
    chunks: chunks,
    fromJSON: function(key, value) {
      return parseFromJSON(response, this, key, value);
    },
  }: OpaqueResponseWithoutDecoder): any);
  if (supportsBinaryStreams) {
    response.stringDecoder = createStringDecoder();
  }
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
export function reportGlobalError(
  response: OpaqueResponse,
  error: Error,
): void {
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

function parseFromJSON(
  response: OpaqueResponse,
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

function resolveJSONRow(
  response: OpaqueResponse,
  id: number,
  json: string,
): void {
  let model = JSON.parse(json, response.fromJSON);
  let chunks = response.chunks;
  let chunk = chunks.get(id);
  if (!chunk) {
    chunks.set(id, createResolvedChunk(model));
  } else {
    resolveChunk(chunk, model);
  }
}

function processFullRow(response: OpaqueResponse, row: string): void {
  if (row === '') {
    return;
  }
  let tag = row[0];
  switch (tag) {
    case 'J': {
      let colon = row.indexOf(':', 1);
      let id = parseInt(row.substring(1, colon), 16);
      let json = row.substring(colon + 1);
      resolveJSONRow(response, id, json);
      return;
    }
    case 'E': {
      let colon = row.indexOf(':', 1);
      let id = parseInt(row.substring(1, colon), 16);
      let json = row.substring(colon + 1);
      let errorInfo = JSON.parse(json);
      let error = new Error(errorInfo.message);
      error.stack = errorInfo.stack;
      let chunks = response.chunks;
      let chunk = chunks.get(id);
      if (!chunk) {
        chunks.set(id, createErrorChunk(error));
      } else {
        triggerErrorOnChunk(chunk, error);
      }
      return;
    }
    default: {
      // Assume this is the root model.
      resolveJSONRow(response, 0, row);
      return;
    }
  }
}

export function processStringChunk(
  response: OpaqueResponse,
  chunk: string,
  offset: number,
): void {
  let linebreak = chunk.indexOf('\n', offset);
  while (linebreak > -1) {
    let fullrow = response.partialRow + chunk.substring(offset, linebreak);
    processFullRow(response, fullrow);
    response.partialRow = '';
    offset = linebreak + 1;
    linebreak = chunk.indexOf('\n', offset);
  }
  response.partialRow += chunk.substring(offset);
}

export function processBinaryChunk(
  response: OpaqueResponse,
  chunk: Uint8Array,
): void {
  if (!supportsBinaryStreams) {
    throw new Error("This environment don't support binary chunks.");
  }
  let stringDecoder = response.stringDecoder;
  let linebreak = chunk.indexOf(10); // newline
  while (linebreak > -1) {
    let fullrow =
      response.partialRow +
      readFinalStringChunk(stringDecoder, chunk.subarray(0, linebreak));
    processFullRow(response, fullrow);
    response.partialRow = '';
    chunk = chunk.subarray(linebreak + 1);
    linebreak = chunk.indexOf(10); // newline
  }
  response.partialRow += readPartialStringChunk(stringDecoder, chunk);
}

export function complete(response: OpaqueResponse): void {
  // In case there are any remaining unresolved chunks, they won't
  // be resolved now. So we need to issue an error to those.
  // Ideally we should be able to early bail out if we kept a
  // ref count of pending chunks.
  reportGlobalError(response, new Error('Connection closed.'));
}

export function getModelRoot<T>(response: OpaqueResponse): ReactModelRoot<T> {
  return response.modelRoot;
}
