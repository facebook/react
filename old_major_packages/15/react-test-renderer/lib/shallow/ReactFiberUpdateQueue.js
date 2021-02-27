/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var _assign = require('object-assign');

exports.createUpdateQueue = function (partialState) {
  var queue = {
    partialState: partialState,
    callback: null,
    callbackWasCalled: false,
    next: null,
    isReplace: false,
    isForced: false,
    tail: null
  };
  queue.tail = queue;
  return queue;
};

exports.addToQueue = function (queue, partialState) {
  var node = {
    partialState: partialState,
    callback: null,
    callbackWasCalled: false,
    next: null
  };
  queue.tail.next = node;
  queue.tail = node;
  return queue;
};

exports.addCallbackToQueue = function (queue, callback) {
  if (queue.tail.callback) {
    // If the tail already as a callback, add an empty node to queue
    exports.addToQueue(queue, null);
  }
  queue.tail.callback = callback;
  return queue;
};

exports.callCallbacks = function (queue, context) {
  var node = queue;
  while (node) {
    if (node.callback && !node.callbackWasCalled) {
      node.callbackWasCalled = true;
      node.callback.call(context);
    }
    node = node.next;
  }
};

exports.mergeUpdateQueue = function (queue, prevState, props) {
  var node = queue;
  var state = queue.isReplace ? null : _assign({}, prevState);
  while (node) {
    var _partialState = void 0;
    if (typeof node.partialState === 'function') {
      var updateFn = node.partialState;
      _partialState = updateFn(state, props);
    } else {
      _partialState = node.partialState;
    }
    state = _assign(state || {}, _partialState);
    node = node.next;
  }
  return state;
};