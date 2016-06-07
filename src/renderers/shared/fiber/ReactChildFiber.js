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

import type { ReactCoroutine, ReactYield } from 'ReactCoroutine';
import type { Fiber } from 'ReactFiber';

import type { ReactNodeList } from 'ReactTypes';

var {
  REACT_ELEMENT_TYPE,
} = require('ReactElement');
var {
  REACT_COROUTINE_TYPE,
  REACT_YIELD_TYPE,
} = require('ReactCoroutine');

var ReactFiber = require('ReactFiber');
var ReactReifiedYield = require('ReactReifiedYield');

function createSubsequentChild(parent : Fiber, nextReusable : ?Fiber, previousSibling : Fiber, newChildren) : Fiber {
  if (typeof newChildren !== 'object' || newChildren === null) {
    return previousSibling;
  }

  switch (newChildren.$$typeof) {
    case REACT_ELEMENT_TYPE: {
      const element = (newChildren : ReactElement<any>);
      if (nextReusable &&
          element.type === nextReusable.type &&
          element.key === nextReusable.key) {
        // TODO: This is not sufficient since previous siblings could be new.
        // Will fix reconciliation properly later.
        const clone = ReactFiber.cloneFiber(nextReusable);
        clone.input = element.props;
        clone.child = nextReusable.child;
        clone.sibling = null;
        previousSibling.sibling = clone;
        return clone;
      }
      const child = ReactFiber.createFiberFromElement(element);
      previousSibling.sibling = child;
      child.parent = parent;
      return child;
    }

    case REACT_COROUTINE_TYPE: {
      const coroutine = (newChildren : ReactCoroutine);
      const child = ReactFiber.createFiberFromCoroutine(coroutine);
      previousSibling.sibling = child;
      child.parent = parent;
      return child;
    }

    case REACT_YIELD_TYPE: {
      const yieldNode = (newChildren : ReactYield);
      const reifiedYield = ReactReifiedYield.createReifiedYield(yieldNode);
      const child = ReactFiber.createFiberFromYield(yieldNode);
      child.output = reifiedYield;
      previousSibling.sibling = child;
      child.parent = parent;
      return child;
    }
  }

  if (Array.isArray(newChildren)) {
    let prev : Fiber = previousSibling;
    for (var i = 0; i < newChildren.length; i++) {
      let reusable = null;
      if (prev.alternate) {
        reusable = prev.alternate.sibling;
      }
      prev = createSubsequentChild(parent, reusable, prev, newChildren[i]);
    }
    return prev;
  } else {
    console.log('Unknown child', newChildren);
    return previousSibling;
  }
}

function createFirstChild(parent, newChildren) {
  if (typeof newChildren !== 'object' || newChildren === null) {
    return null;
  }

  switch (newChildren.$$typeof) {
    case REACT_ELEMENT_TYPE: {
      const element = (newChildren : ReactElement<any>);
      const existingChild : ?Fiber = parent.child;
      if (existingChild &&
          element.type === existingChild.type &&
          element.key === existingChild.key) {
        // Get the clone of the existing fiber.
        const clone = ReactFiber.cloneFiber(existingChild);
        clone.input = element.props;
        clone.child = existingChild.child;
        clone.sibling = null;
        return clone;
      }
      const child = ReactFiber.createFiberFromElement(element);
      child.parent = parent;
      return child;
    }

    case REACT_COROUTINE_TYPE: {
      const coroutine = (newChildren : ReactCoroutine);
      const child = ReactFiber.createFiberFromCoroutine(coroutine);
      child.parent = parent;
      return child;
    }

    case REACT_YIELD_TYPE: {
      // A yield results in a fragment fiber whose output is the continuation.
      // TODO: When there is only a single child, we can optimize this to avoid
      // the fragment.
      const yieldNode = (newChildren : ReactYield);
      const reifiedYield = ReactReifiedYield.createReifiedYield(yieldNode);
      const child = ReactFiber.createFiberFromYield(yieldNode);
      child.output = reifiedYield;
      child.parent = parent;
      return child;
    }
  }

  if (Array.isArray(newChildren)) {
    var first : ?Fiber = null;
    var prev : ?Fiber = null;
    for (var i = 0; i < newChildren.length; i++) {
      if (prev == null) {
        prev = createFirstChild(parent, newChildren[i]);
        first = prev;
      } else {
        let reusable = null;
        if (prev.alternate) {
          reusable = prev.alternate.sibling;
        }
        prev = createSubsequentChild(parent, reusable, prev, newChildren[i]);
      }
    }
    return first;
  } else {
    console.log('Unknown child', newChildren);
    return null;
  }
}

exports.reconcileChildFibers = function(parent : Fiber, firstChild : ?Fiber, newChildren : ReactNodeList) : ?Fiber {
  return createFirstChild(parent, newChildren);
};
