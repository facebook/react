/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type Destination = {
  push(chunk: string | null): boolean,
  destroy(error: Error): mixed,
  ...
};

export type PrecomputedChunk = string;
export type Chunk = string;

export function scheduleWork(callback: () => void) {
  callback();
}

export function flushBuffered(destination: Destination) {}

export function beginWriting(destination: Destination) {}

let prevWasCommentSegmenter = false;
export function writeChunk(
  destination: Destination,
  chunk: Chunk | PrecomputedChunk,
): void {
  writeChunkAndReturn(destination, chunk);
}

export function writeChunkAndReturn(
  destination: Destination,
  chunk: Chunk | PrecomputedChunk,
): boolean {
  if (prevWasCommentSegmenter) {
    prevWasCommentSegmenter = false;
    if (chunk[0] !== '<') {
      destination.push('<!-- -->');
    }
  }
  if (chunk === '<!-- -->') {
    prevWasCommentSegmenter = true;
    return true;
  }
  return destination.push(chunk);
}

export function completeWriting(destination: Destination) {}

export function close(destination: Destination) {
  destination.push(null);
}

export function stringToChunk(content: string): Chunk {
  return content;
}

export function stringToPrecomputedChunk(content: string): PrecomputedChunk {
  return content;
}

export function closeWithError(destination: Destination, error: mixed): void {
  // $FlowFixMe: This is an Error object or the destination accepts other types.
  destination.destroy(error);
}
