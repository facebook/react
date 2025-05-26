/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export const IO_NODE = 0;
export const PROMISE_NODE = 1;
export const AWAIT_NODE = 2;

export type IONode = {
  tag: 0,
  stack: Error, // callsite that spawned the I/O
  timestamp: number, // start time when the first part of the I/O sequence started
  trigger: null | AwaitNode, // the preceeding await that spawned this new work
};

export type PromiseNode = {
  tag: 1,
  stack: null,
  timestamp: number, // resolve time of the promise. not used.
  trigger: null | AsyncSequence,
};

export type AwaitNode = {
  tag: 2,
  stack: Error, // callsite that awaited (using await, .then(), Promise.all(), ...)
  timestamp: number, // the end time of the preceeding I/O operation (or -1.1 before it ends)
  trigger: null | AsyncSequence, // the thing we were waiting on
};

export type AsyncSequence = IONode | PromiseNode | AwaitNode;
