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

type OpaqueResponse = {
  source: Source,
  modelRoot: ReactModelRoot<any>,
  partialRow: string,
  stringDecoder: StringDecoder,
  rootPing: () => void,
};

export function createResponse(source: Source): OpaqueResponse {
  let modelRoot = {};
  Object.defineProperty(
    modelRoot,
    'model',
    ({
      configurable: true,
      enumerable: true,
      get() {
        throw rootPromise;
      },
    }: any),
  );

  let rootPing;
  let rootPromise = new Promise(resolve => {
    rootPing = resolve;
  });

  let response: OpaqueResponse = ({
    source,
    modelRoot,
    partialRow: '',
    rootPing,
  }: any);
  if (supportsBinaryStreams) {
    response.stringDecoder = createStringDecoder();
  }
  return response;
}

// Report that any missing chunks in the model is now going to throw this
// error upon read. Also notify any pending promises.
export function reportGlobalError(
  response: OpaqueResponse,
  error: Error,
): void {
  Object.defineProperty(
    response.modelRoot,
    'model',
    ({
      configurable: true,
      enumerable: true,
      get() {
        throw error;
      },
    }: any),
  );
  response.rootPing();
}

export function processStringChunk(
  response: OpaqueResponse,
  chunk: string,
  offset: number,
): void {
  response.partialRow += chunk.substr(offset);
}

export function processBinaryChunk(
  response: OpaqueResponse,
  chunk: Uint8Array,
  offset: number,
): void {
  if (!supportsBinaryStreams) {
    throw new Error("This environment don't support binary chunks.");
  }
  response.partialRow += readPartialStringChunk(response.stringDecoder, chunk);
}

let emptyBuffer = new Uint8Array(0);
export function complete(response: OpaqueResponse): void {
  if (supportsBinaryStreams) {
    // This should never be needed since we're expected to have complete
    // code units at the end of JSON.
    response.partialRow += readFinalStringChunk(
      response.stringDecoder,
      emptyBuffer,
    );
  }
  let modelRoot = response.modelRoot;
  let model = JSON.parse(response.partialRow);
  Object.defineProperty(modelRoot, 'model', {
    value: model,
  });
  response.rootPing();
}

export function getModelRoot<T>(response: OpaqueResponse): ReactModelRoot<T> {
  return response.modelRoot;
}
