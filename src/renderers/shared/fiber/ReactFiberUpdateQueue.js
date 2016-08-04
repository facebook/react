/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberUpdateQueue
 * @flow
 */

'use strict';

type UpdateQueueNode = {
  partialState: any,
  callback: ?Function,
  next: ?UpdateQueueNode,
};

export type UpdateQueue = UpdateQueueNode & {
  tail: UpdateQueueNode
};

exports.createUpdateQueue = function(partialState : mixed) : UpdateQueue {
  const queue = {
    partialState,
    callback: null,
    next: null,
    tail: (null : any),
  };
  queue.tail = queue;
  return queue;
};

exports.addToQueue = function(queue : UpdateQueue, partialState : mixed) : UpdateQueue {
  const node = {
    partialState,
    callback: null,
    next: null,
  };
  queue.tail.next = node;
  queue.tail = node;
  return queue;
};

exports.callCallbacks = function(queue : UpdateQueue, partialState : mixed) {
  let node : ?UpdateQueueNode = queue;
  while (node) {
    if (node.callback) {
      const { callback } = node;
      callback();
    }
    node = node.next;
  }
};

exports.mergeUpdateQueue = function(queue : UpdateQueue, prevState : any, props : any) : any {
  let node : ?UpdateQueueNode = queue;
  let state = Object.assign({}, prevState);
  while (node) {
    let partialState;
    if (typeof node.partialState === 'function') {
      const updateFn = node.partialState;
      partialState = updateFn(state, props);
    } else {
      partialState = node.partialState;
    }
    state = Object.assign(state, partialState);
    node = node.next;
  }
  return state;
};
