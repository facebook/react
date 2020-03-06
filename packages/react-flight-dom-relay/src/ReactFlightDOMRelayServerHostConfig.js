/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type Destination = Array<string>;

export function scheduleWork(callback: () => void) {
  callback();
}

export function flushBuffered(destination: Destination) {}

export function beginWriting(destination: Destination) {}

export function writeChunk(
  destination: Destination,
  buffer: Uint8Array,
): boolean {
  destination.push(Buffer.from((buffer: any)).toString('utf8'));
  return true;
}

export function completeWriting(destination: Destination) {}

export function close(destination: Destination) {}

export function convertStringToBuffer(content: string): Uint8Array {
  return Buffer.from(content, 'utf8');
}
