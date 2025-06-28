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
export type BinaryChunk = Uint8Array;

const channel = new MessageChannel();
const taskQueue = [];
channel.port1.onmessage = () => {
  const task = taskQueue.shift();
  if (task) {
    task();
  }
};

export function scheduleWork(callback: () => void) {
  taskQueue.push(callback);
  channel.port2.postMessage(null);
}

function handleErrorInNextTick(error: any) {
  setTimeout(() => {
    throw error;
  });
}

const LocalPromise = Promise;

export const scheduleMicrotask: (callback: () => void) => void =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : callback => {
        LocalPromise.resolve(null).then(callback).catch(handleErrorInNextTick);
      };

export function flushBuffered(destination: Destination) {
  // WHATWG Streams do not yet have a way to flush the underlying
  // transform streams. https://github.com/whatwg/streams/issues/960
}

const VIEW_SIZE = 2048;
let currentView = null;
let writtenBytes = 0;

export function beginWriting(destination: Destination) {
  currentView = new Uint8Array(VIEW_SIZE);
  writtenBytes = 0;
}

export function writeChunk(
  destination: Destination,
  chunk: PrecomputedChunk | Chunk | BinaryChunk,
): void {
  if (chunk.byteLength === 0) {
    return;
  }

  if (chunk.byteLength > VIEW_SIZE) {
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
  if (allowableBytes < bytesToWrite.byteLength) {
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
  writtenBytes += bytesToWrite.byteLength;
}

export function writeChunkAndReturn(
  destination: Destination,
  chunk: PrecomputedChunk | Chunk | BinaryChunk,
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

export function stringToPrecomputedChunk(content: string): PrecomputedChunk {
  const precomputedChunk = textEncoder.encode(content);

  if (__DEV__) {
    if (precomputedChunk.byteLength > VIEW_SIZE) {
      console.error(
        'precomputed chunks must be smaller than the view size configured for this host. This is a bug in React.',
      );
    }
  }

  return precomputedChunk;
}

export function typedArrayToBinaryChunk(
  content: $ArrayBufferView,
): BinaryChunk {
  // Convert any non-Uint8Array array to Uint8Array. We could avoid this for Uint8Arrays.
  // If we passed through this straight to enqueue we wouldn't have to convert it but since
  // we need to copy the buffer in that case, we need to convert it to copy it.
  // When we copy it into another array using set() it needs to be a Uint8Array.
  const buffer = new Uint8Array(
    content.buffer,
    content.byteOffset,
    content.byteLength,
  );
  // We clone large chunks so that we can transfer them when we write them.
  // Others get copied into the target buffer.
  return content.byteLength > VIEW_SIZE ? buffer.slice() : buffer;
}

export function byteLengthOfChunk(chunk: Chunk | PrecomputedChunk): number {
  return chunk.byteLength;
}

export function byteLengthOfBinaryChunk(chunk: BinaryChunk): number {
  return chunk.byteLength;
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

export {createFastHashJS as createFastHash} from 'react-server/src/createFastHashJS';

export function readAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // $FlowFixMe[incompatible-call]: We always expect a string result with readAsDataURL.
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
