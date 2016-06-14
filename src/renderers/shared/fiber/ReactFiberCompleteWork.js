/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberCompleteWork
 * @flow
 */

'use strict';

import type { ReactCoroutine } from 'ReactCoroutine';
import type { Fiber } from 'ReactFiber';

import type { ReifiedYield } from 'ReactReifiedYield';

var ReactChildFiber = require('ReactChildFiber');
var ReactTypeOfWork = require('ReactTypeOfWork');
var {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostContainer,
  HostComponent,
  CoroutineComponent,
  CoroutineHandlerPhase,
  YieldComponent,
} = ReactTypeOfWork;

function transferOutput(child : ?Fiber, parent : Fiber) {
  // If we have a single result, we just pass that through as the output to
  // avoid unnecessary traversal. When we have multiple output, we just pass
  // the linked list of fibers that has the individual output values.
  parent.output = (child && !child.sibling) ? child.output : child;
  parent.memoizedProps = parent.pendingProps;
}

function recursivelyFillYields(yields, output : ?Fiber | ?ReifiedYield) {
  if (!output) {
    // Ignore nulls etc.
  } else if (output.tag !== undefined) { // TODO: Fix this fragile duck test.
    // Detect if this is a fiber, if so it is a fragment result.
    // $FlowFixMe: Refinement issue.
    var item = (output : Fiber);
    do {
      recursivelyFillYields(yields, item.output);
      item = item.sibling;
    } while (item);
  } else {
    // $FlowFixMe: Refinement issue. If it is not a Fiber or null, it is a yield
    yields.push(output);
  }
}

function moveCoroutineToHandlerPhase(current : ?Fiber, workInProgress : Fiber) {
  var coroutine = (workInProgress.pendingProps : ?ReactCoroutine);
  if (!coroutine) {
    throw new Error('Should be resolved by now');
  }

  // First step of the coroutine has completed. Now we need to do the second.
  // TODO: It would be nice to have a multi stage coroutine represented by a
  // single component, or at least tail call optimize nested ones. Currently
  // that requires additional fields that we don't want to add to the fiber.
  // So this requires nested handlers.
  // Note: This doesn't mutate the alternate node. I don't think it needs to
  // since this stage is reset for every pass.
  workInProgress.tag = CoroutineHandlerPhase;

  // Build up the yields.
  // TODO: Compare this to a generator or opaque helpers like Children.
  var yields : Array<ReifiedYield> = [];
  var child = workInProgress.child;
  while (child) {
    recursivelyFillYields(yields, child.output);
    child = child.sibling;
  }
  var fn = coroutine.handler;
  var props = coroutine.props;
  var nextChildren = fn(props, yields);

  var currentFirstChild = current ? current.stateNode : null;
  workInProgress.stateNode = ReactChildFiber.reconcileChildFibers(
    workInProgress,
    currentFirstChild,
    nextChildren
  );
  return workInProgress.stateNode;
}

exports.completeWork = function(current : ?Fiber, workInProgress : Fiber) : ?Fiber {
  switch (workInProgress.tag) {
    case FunctionalComponent:
      console.log('/functional component', workInProgress.type.name);
      transferOutput(workInProgress.child, workInProgress);
      return null;
    case ClassComponent:
      console.log('/class component', workInProgress.type.name);
      transferOutput(workInProgress.child, workInProgress);
      return null;
    case HostContainer:
      return null;
    case HostComponent:
      console.log('/host component', workInProgress.type);
      return null;
    case CoroutineComponent:
      console.log('/coroutine component', workInProgress.pendingProps.handler.name);
      return moveCoroutineToHandlerPhase(current, workInProgress);
    case CoroutineHandlerPhase:
      transferOutput(workInProgress.stateNode, workInProgress);
      // Reset the tag to now be a first phase coroutine.
      workInProgress.tag = CoroutineComponent;
      return null;
    case YieldComponent:
      // Does nothing.
      return null;

    // Error cases
    case IndeterminateComponent:
      throw new Error('An indeterminate component should have become determinate before completing.');
    default:
      throw new Error('Unknown unit of work tag');
  }
};
