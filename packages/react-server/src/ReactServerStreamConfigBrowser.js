/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type Destination = ReadableStreamController;

export type PrecomputedChunk = Uint8Array;
export opaque type Chunk = Uint8Array;

export function scheduleWork(callback: () => void) {
  callback();
}

export function flushBuffered(destination: Destination) {
  // WHATWG Streams do not yet have a way to flush the underlying
  // transform streams. https://github.com/whatwg/streams/issues/960
}

export const supportsRequestStorage = false;
export const requestStorage: AsyncLocalStorage<Map<Function, mixed>> =
  (null: any);

const VIEW_SIZE = 512;
let currentView = null;
let writtenBytes = 0;

export function beginWriting(destination: Destination) {
  currentView = new Uint8Array(VIEW_SIZE);
  writtenBytes = 0;
}

export function writeChunk(
  destination: Destination,
  chunk: PrecomputedChunk | Chunk,
): void {
  if (chunk.length === 0) {
    return;
  }

  if (chunk.length > VIEW_SIZE) {
    if (__DEV__) {
      if (precomputedChunkSet.has(chunk)) {
        console.error(
          'A large precomputed chunk was passed to writeChunk without being copied.' +
            ' Large chunks get enqueued directly and are not copied. This is incompatible with precomputed chunks because you cannot enqueue the same precomputed chunk twice.' +
            ' Use "cloneChunk" to make a copy of this large precomputed chunk before writing it. This is a bug in React.',
        );
      }
    }
    // this chunk may overflow a single view which implies it was not
    // one that is cached by the streaming renderer. We will enqueu
    // it directly and expect it is not re-used
    if (writtenBytes > 0) {
      destination.enqueue(
        new Uint8Array(
          ((currentView: any): Uint8Array).buffer,
          0,
          writtenBytes,
        ),
      );
      currentView = new Uint8Array(VIEW_SIZE);
      writtenBytes = 0;
    }
    destination.enqueue(chunk);
    return;
  }

  let bytesToWrite = chunk;
  const allowableBytes = ((currentView: any): Uint8Array).length - writtenBytes;
  if (allowableBytes < bytesToWrite.length) {
    // this chunk would overflow the current view. We enqueue a full view
    // and start a new view with the remaining chunk
    if (allowableBytes === 0) {
      // the current view is already full, send it
      destination.enqueue(currentView);
    } else {
      // fill up the current view and apply the remaining chunk bytes
      // to a new view.
      ((currentView: any): Uint8Array).set(
        bytesToWrite.subarray(0, allowableBytes),
        writtenBytes,
      );
      // writtenBytes += allowableBytes; // this can be skipped because we are going to immediately reset the view
      destination.enqueue(currentView);
      bytesToWrite = bytesToWrite.subarray(allowableBytes);
    }
    currentView = new Uint8Array(VIEW_SIZE);
    writtenBytes = 0;
  }
  ((currentView: any): Uint8Array).set(bytesToWrite, writtenBytes);
  writtenBytes += bytesToWrite.length;
}

export function writeChunkAndReturn(
  destination: Destination,
  chunk: PrecomputedChunk | Chunk,
): boolean {
  writeChunk(destination, chunk);
  // in web streams there is no backpressure so we can alwas write more
  return true;
}

export function completeWriting(destination: Destination) {
  if (currentView && writtenBytes > 0) {
    destination.enqueue(new Uint8Array(currentView.buffer, 0, writtenBytes));
    currentView = null;
    writtenBytes = 0;
  }
}

export function close(destination: Destination) {
  destination.close();
}

const textEncoder = new TextEncoder();

export function stringToChunk(content: string): Chunk {
  return textEncoder.encode(content);
}

const precomputedChunkSet: Set<Chunk> = __DEV__ ? new Set() : (null: any);

export function stringToPrecomputedChunk(content: string): PrecomputedChunk {
  const precomputedChunk = textEncoder.encode(content);

  if (__DEV__) {
    precomputedChunkSet.add(precomputedChunk);
  }

  return precomputedChunk;
}

export function clonePrecomputedChunk(
  precomputedChunk: PrecomputedChunk,
): PrecomputedChunk {
  return precomputedChunk.length > VIEW_SIZE
    ? precomputedChunk.slice()
    : precomputedChunk;
}

export function closeWithError(destination: Destination, error: mixed): void {
  // $FlowFixMe[method-unbinding]
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
