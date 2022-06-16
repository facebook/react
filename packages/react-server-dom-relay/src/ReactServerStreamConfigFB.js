/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type Destination = {
  buffer: string,
  done: boolean,
  fatal: boolean,
  error: mixed,
};

export type PrecomputedChunk = string;
export type Chunk = string;

export function scheduleWork(callback: () => void) {
  // We don't schedule work in this model, and instead expect performWork to always be called repeatedly.
}

export function flushBuffered(destination: Destination) {}

export function beginWriting(destination: Destination) {}

export function writeChunk(
  destination: Destination,
  chunk: Chunk | PrecomputedChunk,
): void {
  destination.buffer += chunk;
}

export function writeChunkAndReturn(
  destination: Destination,
  chunk: Chunk | PrecomputedChunk,
): boolean {
  destination.buffer += chunk;
  return true;
}

export function completeWriting(destination: Destination) {}

export function close(destination: Destination) {
  destination.done = true;
}

export function stringToChunk(content: string): Chunk {
  return content;
}

export function stringToPrecomputedChunk(content: string): PrecomputedChunk {
  return content;
}

export function closeWithError(destination: Destination, error: mixed): void {
  destination.done = true;
  destination.fatal = true;
  destination.error = error;
}
