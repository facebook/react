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
  awaited: null, // I/O is only blocked on external.
  previous: null | AwaitNode, // the preceeding await that spawned this new work
};

export type PromiseNode = {
  tag: 1,
  stack: Error, // callsite that created the Promise. Only used if the I/O callsite is not in user space.
  timestamp: number, // start time of the promise. Only used if the I/O was not relevant.
  awaited: null | AsyncSequence, // the thing that ended up resolving this promise
  previous: null, // where we created the promise is not interesting since creating it doesn't mean waiting.
};

export type AwaitNode = {
  tag: 2,
  stack: Error, // callsite that awaited (using await, .then(), Promise.all(), ...)
  timestamp: number, // the end time of the preceeding I/O operation (or -1.1 before it ends)
  awaited: null | AsyncSequence, // the promise we were waiting on
  previous: null | AsyncSequence, // the sequence that was blocking us from awaiting in the first place
};

export type AsyncSequence = IONode | PromiseNode | AwaitNode;
