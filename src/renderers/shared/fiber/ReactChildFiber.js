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
import type { PriorityLevel } from 'ReactPriorityLevel';

import type { ReactNodeList } from 'ReactTypes';

var REACT_ELEMENT_TYPE = require('ReactElementSymbol');
var {
  REACT_COROUTINE_TYPE,
  REACT_YIELD_TYPE,
} = require('ReactCoroutine');

var ReactFiber = require('ReactFiber');
var ReactReifiedYield = require('ReactReifiedYield');

const {
  cloneFiber,
  createFiberFromElement,
  createFiberFromCoroutine,
  createFiberFromYield,
} = ReactFiber;

const {
  createReifiedYield,
} = ReactReifiedYield;

const isArray = Array.isArray;

function ChildReconciler(shouldClone) {

  function createSubsequentChild(
    returnFiber : Fiber,
    existingChild : ?Fiber,
    previousSibling : Fiber,
    newChildren,
    priority : PriorityLevel
  ) : Fiber {
    if (typeof newChildren !== 'object' || newChildren === null) {
      return previousSibling;
    }

    switch (newChildren.$$typeof) {
      case REACT_ELEMENT_TYPE: {
        const element = (newChildren : ReactElement<any>);
        if (existingChild &&
            element.type === existingChild.type &&
            element.key === existingChild.key) {
          // TODO: This is not sufficient since previous siblings could be new.
          // Will fix reconciliation properly later.
          const clone = shouldClone ? cloneFiber(existingChild, priority) : existingChild;
          if (!shouldClone) {
            clone.pendingWorkPriority = priority;
          }
          clone.pendingProps = element.props;
          clone.child = existingChild.child;
          clone.sibling = null;
          clone.return = returnFiber;
          previousSibling.sibling = clone;
          return clone;
        }
        const child = createFiberFromElement(element, priority);
        previousSibling.sibling = child;
        child.return = returnFiber;
        return child;
      }

      case REACT_COROUTINE_TYPE: {
        const coroutine = (newChildren : ReactCoroutine);
        const child = createFiberFromCoroutine(coroutine, priority);
        previousSibling.sibling = child;
        child.return = returnFiber;
        return child;
      }

      case REACT_YIELD_TYPE: {
        const yieldNode = (newChildren : ReactYield);
        const reifiedYield = createReifiedYield(yieldNode);
        const child = createFiberFromYield(yieldNode, priority);
        child.output = reifiedYield;
        previousSibling.sibling = child;
        child.return = returnFiber;
        return child;
      }
    }

    if (isArray(newChildren)) {
      let prev : Fiber = previousSibling;
      let existing : ?Fiber = existingChild;
      for (var i = 0; i < newChildren.length; i++) {
        var nextExisting = existing && existing.sibling;
        prev = createSubsequentChild(returnFiber, existing, prev, newChildren[i], priority);
        if (prev && existing) {
          // TODO: This is not correct because there could've been more
          // than one sibling consumed but I don't want to return a tuple.
          existing = nextExisting;
        }
      }
      return prev;
    } else {
      // TODO: Throw for unknown children.
      return previousSibling;
    }
  }

  function createFirstChild(returnFiber, existingChild, newChildren, priority) {
    if (typeof newChildren !== 'object' || newChildren === null) {
      return null;
    }

    switch (newChildren.$$typeof) {
      case REACT_ELEMENT_TYPE: {
        /* $FlowFixMe(>=0.31.0): This is an unsafe cast. Consider adding a type
         *                       annotation to the `newChildren` param of this
         *                       function.
         */
        const element = (newChildren : ReactElement<any>);
        if (existingChild &&
            element.type === existingChild.type &&
            element.key === existingChild.key) {
          // Get the clone of the existing fiber.
          const clone = shouldClone ? cloneFiber(existingChild, priority) : existingChild;
          if (!shouldClone) {
            clone.pendingWorkPriority = priority;
          }
          clone.pendingProps = element.props;
          clone.child = existingChild.child;
          clone.sibling = null;
          clone.return = returnFiber;
          return clone;
        }
        const child = createFiberFromElement(element, priority);
        child.return = returnFiber;
        return child;
      }

      case REACT_COROUTINE_TYPE: {
        /* $FlowFixMe(>=0.31.0): No 'handler' property found in object type
         */
        const coroutine = (newChildren : ReactCoroutine);
        const child = createFiberFromCoroutine(coroutine, priority);
        child.return = returnFiber;
        return child;
      }

      case REACT_YIELD_TYPE: {
        // A yield results in a fragment fiber whose output is the continuation.
        // TODO: When there is only a single child, we can optimize this to avoid
        // the fragment.
        /* $FlowFixMe(>=0.31.0): No 'continuation' property found in object
         * type
         */
        const yieldNode = (newChildren : ReactYield);
        const reifiedYield = createReifiedYield(yieldNode);
        const child = createFiberFromYield(yieldNode, priority);
        child.output = reifiedYield;
        child.return = returnFiber;
        return child;
      }
    }

    if (isArray(newChildren)) {
      var first : ?Fiber = null;
      var prev : ?Fiber = null;
      var existing : ?Fiber = existingChild;
      /* $FlowIssue(>=0.31.0) #12747709
       *
       * `Array.isArray` is matched syntactically for now until predicate
       * support is complete.
       */
      for (var i = 0; i < newChildren.length; i++) {
        var nextExisting = existing && existing.sibling;
        if (prev == null) {
          prev = createFirstChild(returnFiber, existing, newChildren[i], priority);
          first = prev;
        } else {
          prev = createSubsequentChild(returnFiber, existing, prev, newChildren[i], priority);
        }
        if (prev && existing) {
          // TODO: This is not correct because there could've been more
          // than one sibling consumed but I don't want to return a tuple.
          existing = nextExisting;
        }
      }
      return first;
    } else {
      // TODO: Throw for unknown children.
      return null;
    }
  }

  // TODO: This API won't work because we'll need to transfer the side-effects of
  // unmounting children to the returnFiber.
  function reconcileChildFibers(
    returnFiber : Fiber,
    currentFirstChild : ?Fiber,
    newChildren : ReactNodeList,
    priority : PriorityLevel
  ) : ?Fiber {
    return createFirstChild(returnFiber, currentFirstChild, newChildren, priority);
  }

  return reconcileChildFibers;
}

exports.reconcileChildFibers = ChildReconciler(true);

exports.reconcileChildFibersInPlace = ChildReconciler(false);
