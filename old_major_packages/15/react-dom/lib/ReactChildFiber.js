/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var REACT_ELEMENT_TYPE = require('./ReactElementSymbol');

var _require = require('./ReactCoroutine'),
    REACT_COROUTINE_TYPE = _require.REACT_COROUTINE_TYPE,
    REACT_YIELD_TYPE = _require.REACT_YIELD_TYPE;

var ReactFiber = require('./ReactFiber');
var ReactReifiedYield = require('./ReactReifiedYield');

var cloneFiber = ReactFiber.cloneFiber,
    createFiberFromElement = ReactFiber.createFiberFromElement,
    createFiberFromCoroutine = ReactFiber.createFiberFromCoroutine,
    createFiberFromYield = ReactFiber.createFiberFromYield;
var createReifiedYield = ReactReifiedYield.createReifiedYield;


var isArray = Array.isArray;

function ChildReconciler(shouldClone) {
  function createSubsequentChild(returnFiber, existingChild, previousSibling, newChildren, priority) {
    if (typeof newChildren !== 'object' || newChildren === null) {
      return previousSibling;
    }

    switch (newChildren.$$typeof) {
      case REACT_ELEMENT_TYPE:
        {
          var element = newChildren;
          if (existingChild && element.type === existingChild.type && element.key === existingChild.key) {
            // TODO: This is not sufficient since previous siblings could be new.
            // Will fix reconciliation properly later.
            var clone = shouldClone ? cloneFiber(existingChild, priority) : existingChild;
            if (!shouldClone) {
              // TODO: This might be lowering the priority of nested unfinished work.
              clone.pendingWorkPriority = priority;
            }
            clone.pendingProps = element.props;
            clone.sibling = null;
            clone['return'] = returnFiber;
            previousSibling.sibling = clone;
            return clone;
          }
          var child = createFiberFromElement(element, priority);
          previousSibling.sibling = child;
          child['return'] = returnFiber;
          return child;
        }

      case REACT_COROUTINE_TYPE:
        {
          var coroutine = newChildren;
          var _child = createFiberFromCoroutine(coroutine, priority);
          previousSibling.sibling = _child;
          _child['return'] = returnFiber;
          return _child;
        }

      case REACT_YIELD_TYPE:
        {
          var yieldNode = newChildren;
          var reifiedYield = createReifiedYield(yieldNode);
          var _child2 = createFiberFromYield(yieldNode, priority);
          _child2.output = reifiedYield;
          previousSibling.sibling = _child2;
          _child2['return'] = returnFiber;
          return _child2;
        }
    }

    if (isArray(newChildren)) {
      var prev = previousSibling;
      var existing = existingChild;
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
      case REACT_ELEMENT_TYPE:
        {
          /* $FlowFixMe(>=0.31.0): This is an unsafe cast. Consider adding a type
           *                       annotation to the `newChildren` param of this
           *                       function.
           */
          var element = newChildren;
          if (existingChild && element.type === existingChild.type && element.key === existingChild.key) {
            // Get the clone of the existing fiber.
            var clone = shouldClone ? cloneFiber(existingChild, priority) : existingChild;
            if (!shouldClone) {
              // TODO: This might be lowering the priority of nested unfinished work.
              clone.pendingWorkPriority = priority;
            }
            clone.pendingProps = element.props;
            clone.sibling = null;
            clone['return'] = returnFiber;
            return clone;
          }
          var child = createFiberFromElement(element, priority);
          child['return'] = returnFiber;
          return child;
        }

      case REACT_COROUTINE_TYPE:
        {
          /* $FlowFixMe(>=0.31.0): No 'handler' property found in object type
           */
          var coroutine = newChildren;
          var _child3 = createFiberFromCoroutine(coroutine, priority);
          _child3['return'] = returnFiber;
          return _child3;
        }

      case REACT_YIELD_TYPE:
        {
          // A yield results in a fragment fiber whose output is the continuation.
          // TODO: When there is only a single child, we can optimize this to avoid
          // the fragment.
          /* $FlowFixMe(>=0.31.0): No 'continuation' property found in object
           * type
           */
          var yieldNode = newChildren;
          var reifiedYield = createReifiedYield(yieldNode);
          var _child4 = createFiberFromYield(yieldNode, priority);
          _child4.output = reifiedYield;
          _child4['return'] = returnFiber;
          return _child4;
        }
    }

    if (isArray(newChildren)) {
      var first = null;
      var prev = null;
      var existing = existingChild;
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
  function reconcileChildFibers(returnFiber, currentFirstChild, newChildren, priority) {
    return createFirstChild(returnFiber, currentFirstChild, newChildren, priority);
  }

  return reconcileChildFibers;
}

exports.reconcileChildFibers = ChildReconciler(true);

exports.reconcileChildFibersInPlace = ChildReconciler(false);

function cloneSiblings(current, workInProgress, returnFiber) {
  workInProgress['return'] = returnFiber;
  while (current.sibling) {
    current = current.sibling;
    workInProgress = workInProgress.sibling = cloneFiber(current, current.pendingWorkPriority);
    workInProgress['return'] = returnFiber;
  }
  workInProgress.sibling = null;
}

exports.cloneChildFibers = function (current, workInProgress) {
  if (!workInProgress.child) {
    return;
  }
  if (current && workInProgress.child === current.child) {
    // We use workInProgress.child since that lets Flow know that it can't be
    // null since we validated that already. However, as the line above suggests
    // they're actually the same thing.
    var currentChild = workInProgress.child;
    // TODO: This used to reset the pending priority. Not sure if that is needed.
    // workInProgress.pendingWorkPriority = current.pendingWorkPriority;
    // TODO: The below priority used to be set to NoWork which would've
    // dropped work. This is currently unobservable but will become
    // observable when the first sibling has lower priority work remaining
    // than the next sibling. At that point we should add tests that catches
    // this.
    var newChild = cloneFiber(currentChild, currentChild.pendingWorkPriority);
    workInProgress.child = newChild;
    cloneSiblings(currentChild, newChild, workInProgress);
  }

  // If there is no alternate, then we don't need to clone the children.
  // If the children of the alternate fiber is a different set, then we don't
  // need to clone. We need to reset the return fiber though since we'll
  // traverse down into them.
  var child = workInProgress.child;
  while (child) {
    child['return'] = workInProgress;
    child = child.sibling;
  }
};