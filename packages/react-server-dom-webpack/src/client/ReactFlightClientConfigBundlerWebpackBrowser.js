/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const chunkMap: Map<string, string> = new Map();

/**
 * We patch the chunk filename function in webpack to insert our own resolution
 * of chunks that come from Flight and may not be known to the webpack runtime
 */
const webpackGetChunkFilename = __webpack_require__.u;
__webpack_require__.u = function (chunkId: string) {
  const flightChunk = chunkMap.get(chunkId);
  if (flightChunk !== undefined) {
    return flightChunk;
  }
  return webpackGetChunkFilename(chunkId);
};

export function loadChunk(chunkId: string, filename: string): Promise<mixed> {
  chunkMap.set(chunkId, filename);
  return __webpack_chunk_load__(chunkId);
}
