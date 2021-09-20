/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type Destination = {
  write: (chunk: Uint8Array) => void,
  buffer: (shouldBuffer: boolean) => void,
  flush: () => void,
  close: (error: mixed) => void,
  schedule: (callback: () => void) => void,
  ready: boolean,
};

export type PrecomputedChunk = Uint8Array;
export type Chunk = Uint8Array;

export function scheduleWork(destination: Destination, callback: () => void) {
  destination.schedule(callback);
}

export function flushBuffered(destination: Destination) {
  destination.flush();
}

export function beginWriting(destination: Destination) {
  destination.buffer(true);
}

export function writeChunk(
  destination: Destination,
  chunk: PrecomputedChunk | Chunk,
): boolean {
  destination.write(chunk);
  return destination.ready;
}

export function completeWriting(destination: Destination) {
  destination.buffer(false);
}

export function close(destination: Destination) {
  destination.close();
}

const textEncoder = new TextEncoder();

export function stringToChunk(content: string): Chunk {
  return textEncoder.encode(content);
}

export function stringToPrecomputedChunk(content: string): PrecomputedChunk {
  return textEncoder.encode(content);
}

export function closeWithError(destination: Destination, error: mixed): void {
  destination.close(error);
}
