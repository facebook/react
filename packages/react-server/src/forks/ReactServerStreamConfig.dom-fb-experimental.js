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

let byteLengthImpl: null | ((chunk: Chunk | PrecomputedChunk) => number) = null;

export function setByteLengthOfChunkImplementation(
  impl: (chunk: Chunk | PrecomputedChunk) => number,
): void {
  byteLengthImpl = impl;
}

export function byteLengthOfChunk(chunk: Chunk | PrecomputedChunk): number {
  if (byteLengthImpl == null) {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'byteLengthOfChunk implementation is not configured. Please, provide the implementation via ReactFlightDOMServer.setConfig(...);',
    );
  }
  return byteLengthImpl(chunk);
}

export interface Destination {
  beginWriting(): void;
  write(chunk: Chunk | PrecomputedChunk | BinaryChunk): void;
  completeWriting(): void;
  flushBuffered(): void;
  close(): void;
  onError(error: mixed): void;
}

export function scheduleWork(callback: () => void) {
  callback();
}

export function beginWriting(destination: Destination) {
  destination.beginWriting();
}

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
  destination.completeWriting();
}

export function flushBuffered(destination: Destination) {
  destination.flushBuffered();
}

export function close(destination: Destination) {
  destination.close();
}

export function closeWithError(destination: Destination, error: mixed): void {
  destination.onError(error);
  destination.close();
}
