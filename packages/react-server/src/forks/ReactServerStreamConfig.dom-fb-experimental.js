/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export * from '../ReactServerStreamConfigFB';

import type {
  PrecomputedChunk,
  Chunk,
  BinaryChunk,
} from '../ReactServerStreamConfigFB';

export type Destination = {
  write(chunk: Chunk | PrecomputedChunk | BinaryChunk): void,
  onComplete(): void,
  onError(error: mixed): void,
  close(): void,
};

export function scheduleWork(callback: () => void) {
  callback();
}

export function flushBuffered(destination: Destination) {}
export function beginWriting(destination: Destination) {}

export function writeChunk(
  destination: Destination,
  chunk: Chunk | PrecomputedChunk | BinaryChunk,
): void {
  destination.write(chunk);
}

export function writeChunkAndReturn(
  destination: Destination,
  chunk: Chunk | PrecomputedChunk | BinaryChunk,
): boolean {
  destination.write(chunk);
  return true;
}

export function completeWriting(destination: Destination) {
  destination.onComplete();
}

export function close(destination: Destination) {
  destination.close();
}

export function closeWithError(destination: Destination, error: mixed): void {
  destination.onError(error);
  destination.close();
}
