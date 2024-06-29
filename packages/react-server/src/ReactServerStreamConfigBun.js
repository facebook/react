/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* global Bun */

type BunReadableStreamController = ReadableStreamController & {
  end(): mixed,
  write(data: Chunk | BinaryChunk): void,
  error(error: Error): void,
  flush?: () => void,
};
export type Destination = BunReadableStreamController;

export type PrecomputedChunk = string;
export opaque type Chunk = string;
export type BinaryChunk = $ArrayBufferView;

export function scheduleWork(callback: () => void) {
  setTimeout(callback, 0);
}

export const scheduleMicrotask = queueMicrotask;

export function flushBuffered(destination: Destination) {
  // Bun direct streams provide a flush function.
  // If we don't have any more data to send right now.
  // Flush whatever is in the buffer to the wire.
  if (typeof destination.flush === 'function') {
    destination.flush();
  }
}

export function beginWriting(destination: Destination) {}

export function writeChunk(
  destination: Destination,
  chunk: PrecomputedChunk | Chunk | BinaryChunk,
): void {
  if (chunk.length === 0) {
    return;
  }

  destination.write(chunk);
}

export function writeChunkAndReturn(
  destination: Destination,
  chunk: PrecomputedChunk | Chunk | BinaryChunk,
): boolean {
  return !!destination.write(chunk);
}

export function completeWriting(destination: Destination) {}

export function close(destination: Destination) {
  destination.end();
}

export function stringToChunk(content: string): Chunk {
  return content;
}

export function stringToPrecomputedChunk(content: string): PrecomputedChunk {
  return content;
}

export function typedArrayToBinaryChunk(
  content: $ArrayBufferView,
): BinaryChunk {
  // TODO: Does this needs to be cloned if it's transferred in enqueue()?
  return content;
}

export function byteLengthOfChunk(chunk: Chunk | PrecomputedChunk): number {
  return Buffer.byteLength(chunk, 'utf8');
}

export function byteLengthOfBinaryChunk(chunk: BinaryChunk): number {
  return chunk.byteLength;
}

export function closeWithError(destination: Destination, error: mixed): void {
  if (typeof destination.error === 'function') {
    // $FlowFixMe[incompatible-call]: This is an Error object or the destination accepts other types.
    destination.error(error);
  } else {
    // Earlier implementations doesn't support this method. In that environment you're
    // supposed to throw from a promise returned but we don't return a promise in our
    // approach. We could fork this implementation but this is environment is an edge
    // case to begin with. It's even less common to run this in an older environment.
    // Even then, this is not where errors are supposed to happen and they get reported
    // to a global callback in addition to this anyway. So it's fine just to close this.
    destination.close();
  }
}

export function createFastHash(input: string): string | number {
  return Bun.hash(input);
}
