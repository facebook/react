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

export function byteLengthOfChunk(chunk: Chunk | PrecomputedChunk): number {
  if (typeof chunk !== 'string') {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error('byteLengthOfChunk: binary chunks are not supported.');
  }
  return byteLengthImpl(chunk);
}

// TODO: We need to replace this with native implementation, once its available on Hermes
function byteLengthImpl(chunk: string) {
  /**
  From: https://datatracker.ietf.org/doc/html/rfc3629
  Char. number range  |        UTF-8 octet sequence
      (hexadecimal)    |              (binary)
   --------------------+---------------------------------------------
   0000 0000-0000 007F | 0xxxxxxx
   0000 0080-0000 07FF | 110xxxxx 10xxxxxx
   0000 0800-0000 FFFF | 1110xxxx 10xxxxxx 10xxxxxx
   0001 0000-0010 FFFF | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
 */
  let byteLength = chunk.length;
  for (let i = chunk.length - 1; i >= 0; i--) {
    const code = chunk.charCodeAt(i);
    if (code > 0x7f && code <= 0x7ff) {
      byteLength++;
    } else if (code > 0x7ff && code <= 0xffff) {
      byteLength += 2;
    }
    if (code >= 0xdc00 && code <= 0xdfff) {
      // It is a trail surrogate character.
      // In this case, the code decrements the loop counter i so
      // that the previous character (which should be a lead surrogate character)
      // is also included in the calculation.
      i--;
    }
  }
  return byteLength;
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
