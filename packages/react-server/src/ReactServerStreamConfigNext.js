/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const INIT: 0 = 0;
const WRITE: 1 = 1;
const BUFFER: 2 = 2;
const FLUSH: 3 = 3;
const CLOSE: 4 = 4;
const SCHEDULE: 5 = 5;

type NextExecutorCommand =
  | [typeof INIT, {full: boolean, update: () => void}]
  | [typeof WRITE, Uint8Array]
  | [typeof BUFFER, boolean]
  | [typeof FLUSH]
  | [typeof CLOSE]
  | [typeof CLOSE, mixed]
  | [typeof SCHEDULE, () => void];

export type NextExecutor = (...args: NextExecutorCommand) => void;

export type Destination = {
  exec: NextExecutor,
  state: {
    full: boolean,
    update: () => void,
  },
};

export type PrecomputedChunk = Uint8Array;
export type Chunk = Uint8Array;

export function scheduleWork(destination: Destination, callback: () => void) {
  destination.exec(SCHEDULE, callback);
}

export function flushBuffered(destination: Destination) {
  destination.exec(FLUSH);
}

export function beginWriting(destination: Destination) {
  destination.exec(BUFFER, true);
}

export function writeChunk(
  destination: Destination,
  chunk: PrecomputedChunk | Chunk,
): boolean {
  destination.exec(WRITE, chunk);
  return destination.state.full;
}

export function completeWriting(destination: Destination) {
  destination.exec(BUFFER, false);
}

export function close(destination: Destination) {
  destination.exec(CLOSE);
}

const textEncoder = new TextEncoder();

export function stringToChunk(content: string): Chunk {
  return textEncoder.encode(content);
}

export function stringToPrecomputedChunk(content: string): PrecomputedChunk {
  return textEncoder.encode(content);
}

export function closeWithError(destination: Destination, error: mixed): void {
  destination.exec(CLOSE, error);
}
