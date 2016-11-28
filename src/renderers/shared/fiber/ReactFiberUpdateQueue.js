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

var invariant = require('invariant');

type UpdateQueueNode = {
  partialState: any,
  callback: ?Function,
  isReplace: boolean,
  next: ?UpdateQueueNode,
};

export type UpdateQueue = UpdateQueueNode & {
  isForced: boolean,
  hasUpdate: boolean,
  hasCallback: boolean,
  tail: UpdateQueueNode
};

function formatUnexpectedArgument(arg) {
  var type = typeof arg;
  if (type !== 'object') {
    return type;
  }
  var displayName = arg.constructor && arg.constructor.name || type;
  var keys = Object.keys(arg);
  if (keys.length > 0 && keys.length < 20) {
    return `${displayName} (keys: ${keys.join(', ')})`;
  }
  return displayName;
}

function validateCallback(callback, callerName) {
  invariant(
    !callback || typeof callback === 'function',
    '%s(...): Expected the last optional `callback` argument to be a ' +
    'function. Instead received: %s.',
    callerName,
    formatUnexpectedArgument(callback)
  );
}

exports.createUpdateQueue = function(partialState : mixed) : UpdateQueue {
  const queue = {
    partialState,
    callback: null,
    isReplace: false,
    next: null,
    isForced: false,
    hasUpdate: partialState != null,
    hasCallback: false,
    tail: (null : any),
  };
  queue.tail = queue;
  return queue;
};

function addToQueue(queue : UpdateQueue, partialState : mixed) : UpdateQueue {
  const node = {
    partialState,
    callback: null,
    isReplace: false,
    next: null,
  };
  queue.tail.next = node;
  queue.tail = node;
  queue.hasUpdate = queue.hasUpdate || (partialState != null);
  return queue;
}

exports.addToQueue = addToQueue;

exports.addCallbackToQueue = function(queue : UpdateQueue, callback: Function, callerName: string) : UpdateQueue {
  validateCallback(callback, callerName);
  if (queue.tail.callback) {
    // If the tail already as a callback, add an empty node to queue
    addToQueue(queue, null);
  }
  queue.tail.callback = callback;
  queue.hasCallback = true;
  return queue;
};

exports.callCallbacks = function(queue : UpdateQueue, context : any) : Error | null {
  let node : ?UpdateQueueNode = queue;
  let firstError = null;
  while (node) {
    const callback = node.callback;
    if (callback) {
      try {
        if (typeof context !== 'undefined') {
          callback.call(context);
        } else {
          callback();
        }
      } catch (error) {
        firstError = firstError || error;
      }
    }
    node = node.next;
  }
  return firstError;
};

function getStateFromNode(node, instance, state, props) {
  if (typeof node.partialState === 'function') {
    const updateFn = node.partialState;
    return updateFn.call(instance, state, props);
  } else {
    return node.partialState;
  }
}

exports.mergeUpdateQueue = function(queue : UpdateQueue, instance : any, prevState : any, props : any) : any {
  let node : ?UpdateQueueNode = queue;
  if (queue.isReplace) {
    // replaceState is always first in the queue.
    prevState = getStateFromNode(queue, instance, prevState, props);
    node = queue.next;
    if (!node) {
      // If there is no more work, we replace the raw object instead of cloning.
      return prevState;
    }
  }
  let state = Object.assign({}, prevState);
  while (node) {
    let partialState = getStateFromNode(node, instance, state, props);
    Object.assign(state, partialState);
    node = node.next;
  }
  return state;
};

