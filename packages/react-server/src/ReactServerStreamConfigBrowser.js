/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type Destination = ReadableByteStreamController;

export type PrecomputedChunk = Uint8Array;
export type Chunk = Uint8Array;

export function scheduleWork(callback: () => void) {
  callback();
}

export function flushBuffered(destination: Destination) {
  // WHATWG Streams do not yet have a way to flush the underlying
  // transform streams. https://github.com/whatwg/streams/issues/960
}

const VIEW_SIZE = 512;
let currentView = null;
let writtenBytes = 0;

function flushCurrentView(destination, lastFlush) {
  if (currentView) {
    const byobRequest = destination.byobRequest;
    if (writtenBytes === 0) {
      // Do nothing unless this is the last flush and we have an open byobRequest
      if (lastFlush && byobRequest && byobRequest.view) {
        // we aren't going to write any more but a byobView needs to be responded to
        byobRequest.respond(0);
      }
    } else if (writtenBytes << 2 < currentView.byteLength && !lastFlush) {
      // the currentView is less than a quarter full, let's copy it to a new view to flush
      // this threshold is arbitrary and we expect to come up with new hueristics on when
      // to copy & write vs send the current buffer.
      destination.enqueue(currentView.slice(0, writtenBytes));
    } else {
      if (byobRequest && byobRequest.view === currentView) {
        // this request is using a byob reader and we have not yet responded with
        // the
        byobRequest.respond(writtenBytes);
      } else {
        if (writtenBytes === currentView.byteLength) {
          destination.enqueue(currentView);
        } else {
          destination.enqueue(currentView.subarray(0, writtenBytes));
        }
      }
      if (lastFlush) {
        currentView = null;
      } else {
        currentView = new Uint8Array(VIEW_SIZE);
      }
    }
    writtenBytes = 0;
  } else {
    throw new Error(
      '`flushCurrentView` for streaming server rendering was called but there is no current view. This is a bug in React. Please file an issue',
    );
  }
}

export function beginWriting(destination: Destination) {
  if (destination.byobRequest) {
    currentView = destination.byobRequest.view;
  } else {
    currentView = new Uint8Array(VIEW_SIZE);
  }
  writtenBytes = 0;
}

export function writeChunk(
  destination: Destination,
  chunk: PrecomputedChunk | Chunk,
): void {
  const chunkLength = chunk.byteLength;
  if (chunkLength === 0) {
    return;
  }

  // check whether the chunk is too big for the current view and VIEW_SIZE
  // we check both becuase the current view could be a byob view with a larger
  // size than subsequent views we create. If so we should try to fit even
  // large chunks into the byob view. While we don't explicitly check for it
  // the only way the current view would be larger than VIEW_SIZE is when we
  // are in byob mode.
  if (
    chunkLength > ((currentView: any): Uint8Array).byteLength &&
    chunkLength > VIEW_SIZE
  ) {
    // this chunk may overflow a single view which implies it was not
    // one that is cached by the streaming renderer. We will enqueu
    // it directly and expect it is not re-used
    flushCurrentView(destination, false);
    destination.enqueue(chunk);
    return;
  }

  let bytesToWrite = chunk;
  const allowableBytes =
    ((currentView: any): Uint8Array).byteLength - writtenBytes;
  if (allowableBytes < bytesToWrite.byteLength) {
    // this chunk would overflow the current view. We enqueue a full view
    // and start a new view with the remaining chunk
    // in practice allowableBytes is never zero because eagerly flush at the
    // end of writeChunk if we have exhausted the view
    ((currentView: any): Uint8Array).set(
      bytesToWrite.subarray(0, allowableBytes),
      writtenBytes,
    );
    writtenBytes += allowableBytes; // this can be skipped because we are going to immediately reset the view
    bytesToWrite = bytesToWrite.subarray(allowableBytes);
    flushCurrentView(destination, false);
  }

  // remaining bytesToWrite may still be too large. this can happen if the original currentView
  // was byob and was larger than VIEW_SIZE but there wasn't enough room to reduce bytesToWrite
  // below VIEW_SIZE
  if (bytesToWrite.byteLength > VIEW_SIZE) {
    // we flush here for safety but writtenBytes should be zero already because
    // we just finished the branch above where flush was called in tail position
    flushCurrentView(destination, false);
    // enqueue bytesToWrite
    destination.enqueue(bytesToWrite);
    return;
  } else {
    // copy bytes to current view
    ((currentView: any): Uint8Array).set(bytesToWrite, writtenBytes);
    writtenBytes += bytesToWrite.byteLength;
  }

  // eagerly flush if we have fully filled the currentView
  const remainingBytes =
    ((currentView: any): Uint8Array).byteLength - writtenBytes;
  if (remainingBytes === 0) {
    flushCurrentView(destination, false);
  }
}

export function writeChunkAndReturn(
  destination: Destination,
  chunk: PrecomputedChunk | Chunk,
): boolean {
  writeChunk(destination, chunk);
  // allow yielding if the current view is mostly full
  const length = ((currentView: any): Uint8Array).byteLength;
  if ((length - writtenBytes) << 2 < length) {
    // The view is mostly full, we can yield and let the view flush
    // it is possible that if required writes to complete a boundary overflow to
    // a new view then we will start to return true again and not end up yielding
    return false;
  }
  return true;
}

export function completeWriting(destination: Destination) {
  flushCurrentView(destination, true);
  currentView = null;
}

export function close(destination: Destination) {
  destination.close();
  if (destination.byobRequest && destination.byobRequest.view !== null) {
    // based on how the streams spec is written it is possible for a stream
    // to be closed but for a curernt byobRequest to still be active.
    // when a stream is closed you can respond to the request with 0 bytes written
    // @TODO determine if the fact that close is not always synchronously executed
    // can lead to buggy behavior here. If the stream is not yet closed respond(0)
    // will error because it expects more than zero bytes to be written
    destination.byobRequest.respond(0);
  }
}

const textEncoder = new TextEncoder();

export function stringToChunk(content: string): Chunk {
  return textEncoder.encode(content);
}

export function stringToPrecomputedChunk(content: string): PrecomputedChunk {
  return textEncoder.encode(content);
}

export function closeWithError(destination: Destination, error: mixed): void {
  if (typeof destination.error === 'function') {
    // $FlowFixMe: This is an Error object or the destination accepts other types.
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
