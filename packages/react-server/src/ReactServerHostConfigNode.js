/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Writable} from 'stream';

type MightBeFlushable = {flush?: () => void};

export type Destination = Writable & MightBeFlushable;

export function scheduleWork(callback: () => void) {
  setImmediate(callback);
}

export function flushBuffered(destination: Destination) {
  // If we don't have any more data to send right now.
  // Flush whatever is in the buffer to the wire.
  if (typeof destination.flush === 'function') {
    // By convention the Zlib streams provide a flush function for this purpose.
    destination.flush();
  }
}

export function beginWriting(destination: Destination) {
  destination.cork();
}

export function writeChunk(destination: Destination, buffer: Uint8Array) {
  let nodeBuffer = ((buffer: any): Buffer); // close enough
  destination.write(nodeBuffer);
}

export function completeWriting(destination: Destination) {
  destination.uncork();
}

export function close(destination: Destination) {
  destination.end();
}

export function convertStringToBuffer(content: string): Uint8Array {
  return Buffer.from(content, 'utf8');
}
