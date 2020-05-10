/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type Destination = ReadableStreamController;

export function scheduleWork(callback: () => void) {
  callback();
}

export function flushBuffered(destination: Destination) {
  // WHATWG Streams do not yet have a way to flush the underlying
  // transform streams. https://github.com/whatwg/streams/issues/960
}

export function beginWriting(destination: Destination) {}

export function writeChunk(
  destination: Destination,
  buffer: Uint8Array,
): boolean {
  destination.enqueue(buffer);
  return destination.desiredSize > 0;
}

export function completeWriting(destination: Destination) {}

export function close(destination: Destination) {
  destination.close();
}

const textEncoder = new TextEncoder();

export function convertStringToBuffer(content: string): Uint8Array {
  return textEncoder.encode(content);
}
