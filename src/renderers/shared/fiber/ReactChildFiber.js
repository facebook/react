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
            // TODO: This might be lowering the priority of nested unfinished work.
            clone.pendingWorkPriority = priority;
          }
          clone.pendingProps = element.props;
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
            // TODO: This might be lowering the priority of nested unfinished work.
            clone.pendingWorkPriority = priority;
          }
          clone.pendingProps = element.props;
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


function cloneSiblings(current : Fiber, workInProgress : Fiber, returnFiber : Fiber) {
  workInProgress.return = returnFiber;
  while (current.sibling) {
    current = current.sibling;
    workInProgress = workInProgress.sibling = cloneFiber(
      current,
      current.pendingWorkPriority
    );
    workInProgress.return = returnFiber;
  }
  workInProgress.sibling = null;
}

exports.cloneChildFibers = function(current : ?Fiber, workInProgress : Fiber) {
  if (!workInProgress.child) {
    return;
  }
  if (current && workInProgress.child === current.child) {
    // We use workInProgress.child since that lets Flow know that it can't be
    // null since we validated that already. However, as the line above suggests
    // they're actually the same thing.
    const currentChild = workInProgress.child;
    // TODO: This used to reset the pending priority. Not sure if that is needed.
    // workInProgress.pendingWorkPriority = current.pendingWorkPriority;
    // TODO: The below priority used to be set to NoWork which would've
    // dropped work. This is currently unobservable but will become
    // observable when the first sibling has lower priority work remaining
    // than the next sibling. At that point we should add tests that catches
    // this.
    const newChild = cloneFiber(currentChild, currentChild.pendingWorkPriority);
    workInProgress.child = newChild;
    cloneSiblings(currentChild, newChild, workInProgress);
  }

  // If there is no alternate, then we don't need to clone the children.
  // If the children of the alternate fiber is a different set, then we don't
  // need to clone. We need to reset the return fiber though since we'll
  // traverse down into them.
  let child = workInProgress.child;
  while (child) {
    child.return = workInProgress;
    child = child.sibling;
  }
};
