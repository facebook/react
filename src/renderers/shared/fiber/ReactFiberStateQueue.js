/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberStateQueue
 * @flow
 */

'use strict';

export type StateQueue = {
  partialState: any,
  next: StateQueue,
  tail: StateQueue
} | null;

exports.createStateQueue = function(partialState : mixed) : StateQueue {
  return {
    partialState,
    next: null,
    tail: null,
  };
};

exports.addToQueue = function(queue : StateQueue, partialState : mixed): StateQueue {
  const node = exports.createStateQueue(partialState);
  if (queue === null) {
    return node;
  }
  if (queue.tail === null) {
    queue.next = node;
  } else {
    queue.tail.next = node;
  }
  queue.tail = node;
  return queue;
};

exports.mergeStateQueue = function(prevState : any, props : any, queue : StateQueue) : any {
  if (queue === null) {
    return prevState;
  }
  let state = Object.assign({}, prevState);
  do {
    const partialState = typeof queue.partialState === 'function' ?
      queue.partialState(state, props) :
      queue.partialState;
    state = Object.assign(state, partialState);
  } while (queue = queue.next);
  return state;
};
