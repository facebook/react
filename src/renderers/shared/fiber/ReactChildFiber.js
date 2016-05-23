/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactChildFiber
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';

var ReactElement = require('ReactElement');

var ReactFiber = require('ReactFiber');

type ReactNode = ReactElement | ReactFragment | ReactText;

type ReactFragment = Iterable<ReactNode | ReactEmpty>;

type ReactNodeList = ReactNode | ReactEmpty;

type ReactText = string | number;

type ReactEmpty = null | void | boolean;

function createSubsequentChild(parent : Fiber, previousSibling : Fiber, newChildren) : Fiber {
  if (typeof newChildren !== 'object' || newChildren === null) {
    return previousSibling;
  }

  if (ReactElement.isValidElement(newChildren)) {
    var element = (newChildren : ReactElement);
    var child = ReactFiber.createFiberFromElement(element);
    previousSibling.sibling = child;
    child.parent = parent;
    return child;
  }

  if (Array.isArray(newChildren)) {
    let prev : Fiber = previousSibling;
    for (var i = 0; i < newChildren.length; i++) {
      prev = createSubsequentChild(parent, prev, newChildren[i]);
    }
    return prev;
  } else {
    return previousSibling;
  }
}

function createFirstChild(parent, newChildren) {
  if (typeof newChildren !== 'object' || newChildren === null) {
    parent.child = null;
    return null;
  }

  if (ReactElement.isValidElement(newChildren)) {
    var element = (newChildren : ReactElement);
    var child = ReactFiber.createFiberFromElement(element);
    parent.child = child;
    child.parent = parent;
    return child;
  }

  if (Array.isArray(newChildren)) {
    var prev : ?Fiber = null;
    for (var i = 0; i < newChildren.length; i++) {
      if (prev == null) {
        prev = createFirstChild(parent, newChildren[i]);
      } else {
        prev = createSubsequentChild(parent, prev, newChildren[i]);
      }
    }
  } else {
    parent.child = null;
    return null;
  }
}

exports.reconcileChildFibers = function(parent : Fiber, newChildren : ReactNodeList) : void {
  createFirstChild(parent, newChildren);
};
