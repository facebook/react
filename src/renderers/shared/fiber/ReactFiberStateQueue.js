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

type StateQueueNode = {
  partialState: any,
  callback: ?Function,
  next: ?StateQueueNode,
};

export type StateQueue = StateQueueNode & {
  tail: ?StateQueueNode
};

exports.createStateQueue = function(partialState : mixed) : StateQueue {
  return {
    partialState,
    callback: null,
    next: null,
    tail: null,
  };
};

exports.addToQueue = function(queue : StateQueue, partialState : mixed) : StateQueue {
  const node = {
    partialState,
    callback: null,
    next: null,
  };
  if (!queue.tail) {
    queue.next = node;
  } else {
    queue.tail.next = node;
  }
  queue.tail = node;
  return queue;
};

exports.mergeStateQueue = function(queue : ?StateQueue, prevState : any, props : any) : any {
  let node : ?StateQueueNode = queue;
  if (!node) {
    return prevState;
  }
  let state = Object.assign({}, prevState);
  do {
    let partialState;
    if (typeof node.partialState === 'function') {
      const updateFn = node.partialState;
      partialState = updateFn(state, props);
    } else {
      partialState = node.partialState;
    }
    state = Object.assign(state, partialState);
  } while (node = node.next);
  return state;
};
