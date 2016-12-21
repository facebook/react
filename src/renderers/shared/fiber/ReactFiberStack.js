/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberStack
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';

export type StackCursor<T> = {|
  current: T
|};

const warning = require('warning');

const valueStack : Array<any> = [];

if (__DEV__) {
  var fiberStack : Array<Fiber | null> = [];
}

let index = -1;

exports.createCursor = function<T>(defaultValue : T) : StackCursor<T> {
  return {
    current: defaultValue,
  };
};

exports.isEmpty = function() : boolean {
  return index === -1;
};

exports.pop = function<T>(
  cursor : StackCursor<T>,
  fiber: Fiber,
) : void {
  if (index < 0) {
    if (__DEV__) {
      warning(false, 'Unexpected pop.');
    }
    return;
  }

  if (__DEV__) {
    if (fiber !== fiberStack[index]) {
      warning(false, 'Unexpected Fiber popped.');
    }
  }

  cursor.current = index > 0
    ? valueStack[index]
    : (null : any);

  valueStack[index] = null;

  if (__DEV__) {
    fiberStack[index] = null;
  }

  index--;
};

exports.push = function<T>(
  cursor : StackCursor<T>,
  value : any,
  fiber: Fiber,
) : void {
  index++;

  valueStack[index] = cursor.current;

  if (__DEV__) {
    fiberStack[index] = fiber;
  }

  cursor.current = value;
};

exports.reset = function<T>(
  cursor : StackCursor<T>,
) : void {
  while (index > -1) {
    valueStack[index] = null;

    if (__DEV__) {
      fiberStack[index] = null;
    }

    index--;
  }

  cursor.current = (null : any);
};
