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

export type StackCursor = {|
  current: any
|};

const emptyObject = require('emptyObject');
const warning = require('warning');

const valueStack : Array<Object> = [];

if (__DEV__) {
  var fiberStack : Array<Fiber | null> = [];
}

let index = -1;

exports.createCursor = function() : StackCursor {
  return {
    current: null,
  };
};

exports.isEmpty = function() : boolean {
  return index === -1;
};

exports.pop = function(
  cursor : StackCursor,
  fiber: Fiber | null, // TODO (bvaughn) Tighten up this type to only accept Fiber
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

  valueStack[index] = emptyObject;

  if (__DEV__) {
    fiberStack[index] = emptyObject;
  }

  index--;

  cursor.current = index > -1
    ? valueStack[index]
    : null;
};

exports.push = function(
  cursor : StackCursor,
  value : any,
  fiber: Fiber | null, // TODO (bvaughn) Tighten up this type to only accept Fiber
) : void {
  cursor.current = value;

  index++;

  valueStack[index] = value;

  if (__DEV__) {
    fiberStack[index] = fiber;
  }
};

exports.reset = function(
  cursor : StackCursor,
) : void {
  while (index > -1) {
    valueStack[index] = emptyObject;

    if (__DEV__) {
      fiberStack[index] = emptyObject;
    }

    index--;
  }

  cursor.current = null;
};
