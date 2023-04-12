/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type BunReadableStreamController = ReadableStreamController & {
  end(): mixed,
  write(data: Chunk): void,
  error(error: Error): void,
};
export type Destination = BunReadableStreamController;

export type PrecomputedChunk = string;
export opaque type Chunk = string;

export function scheduleWork(callback: () => void) {
  callback();
}

export function flushBuffered(destination: Destination) {
  // WHATWG Streams do not yet have a way to flush the underlying
  // transform streams. https://github.com/whatwg/streams/issues/960
}

// AsyncLocalStorage is not available in bun
export const supportsRequestStorage = false;
export const requestStorage = (null: any);

export function beginWriting(destination: Destination) {}

export function writeChunk(
  destination: Destination,
  chunk: PrecomputedChunk | Chunk,
): void {
  if (chunk.length === 0) {
    return;
  }

  destination.write(chunk);
}

export function writeChunkAndReturn(
  destination: Destination,
  chunk: PrecomputedChunk | Chunk,
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

export function clonePrecomputedChunk(
  chunk: PrecomputedChunk,
): PrecomputedChunk {
  return chunk;
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
