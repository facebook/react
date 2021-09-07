/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Writable} from 'stream';

type MightBeFlushable = {
  flush?: () => void,
  ...
};

export type Destination = Writable & MightBeFlushable;

export type PrecomputedChunk = Uint8Array;
export type Chunk = string;

export function scheduleWork(callback: () => void) {
  setImmediate(callback);
}

export function flushBuffered(destination: Destination) {
  // If we don't have any more data to send right now.
  // Flush whatever is in the buffer to the wire.
  if (typeof destination.flush === 'function') {
    // By convention the Zlib streams provide a flush function for this purpose.
    // For Express, compression middleware adds this method.
    destination.flush();
  }
}

export function beginWriting(destination: Destination) {
  // Older Node streams like http.createServer don't have this.
  if (typeof destination.cork === 'function') {
    destination.cork();
  }
}

export function writeChunk(
  destination: Destination,
  chunk: Chunk | PrecomputedChunk,
): boolean {
  const nodeBuffer = ((chunk: any): Buffer | string); // close enough
  return destination.write(nodeBuffer);
}

export function completeWriting(destination: Destination) {
  // Older Node streams like http.createServer don't have this.
  if (typeof destination.uncork === 'function') {
    destination.uncork();
  }
}

export function close(destination: Destination) {
  destination.end();
}

export function stringToChunk(content: string): Chunk {
  return content;
}

export function stringToPrecomputedChunk(content: string): PrecomputedChunk {
  return Buffer.from(content, 'utf8');
}

export function closeWithError(destination: Destination, error: mixed): void {
  // $FlowFixMe: This is an Error object or the destination accepts other types.
  destination.destroy(error);
}
