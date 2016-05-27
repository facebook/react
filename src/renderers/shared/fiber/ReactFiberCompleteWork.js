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
var ReactTypesOfWork = require('ReactTypesOfWork');
var {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostComponent,
  CoroutineComponent,
  YieldComponent,
} = ReactTypesOfWork;

function transferOutput(child : ?Fiber, parent : Fiber) {
  // If we have a single result, we just pass that through as the output to
  // avoid unnecessary traversal. When we have multiple output, we just pass
  // the linked list of fibers that has the individual output values.
  parent.output = (child && !child.sibling) ? child.output : child;
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

function handleCoroutine(unitOfWork : Fiber) {
  var coroutine = (unitOfWork.input : ?ReactCoroutine);
  if (!coroutine) {
    throw new Error('Should be resolved by now');
  }

  if (unitOfWork.stage === 0) {
    // First step of the coroutine has completed. Now we need to do the second.
    // TODO: It would be nice to have a multi stage coroutine represented by a
    // single component, or at least tail call optimize nested ones.
    // TODO: If we end up not using multi stage coroutines, we could also reuse
    // the tag field to switch between the two stages.
    unitOfWork.stage = 1;

    // Build up the yields.
    // TODO: Compare this to a generator or opaque helpers like Children.
    var yields : Array<ReifiedYield> = [];
    var child = unitOfWork.child;
    while (child) {
      recursivelyFillYields(yields, child.output);
      child = child.sibling;
    }
    var fn = coroutine.handler;
    var props = coroutine.props;
    var nextChildren = fn(props, yields);

    unitOfWork.stateNode = ReactChildFiber.reconcileChildFibers(
      unitOfWork,
      unitOfWork.stateNode,
      nextChildren
    );
    return unitOfWork.stateNode;
  } else {
    // The coroutine is now complete.
    transferOutput(unitOfWork.stateNode, unitOfWork);
    return null;
  }
}

exports.completeWork = function(unitOfWork : Fiber) : ?Fiber {
  switch (unitOfWork.tag) {
    case FunctionalComponent:
      console.log('/functional component', unitOfWork.input.type.name);
      transferOutput(unitOfWork.child, unitOfWork);
      break;
    case ClassComponent:
      console.log('/class component', unitOfWork.input.type.name);
      transferOutput(unitOfWork.child, unitOfWork);
      break;
    case HostComponent:
      console.log('/host component', unitOfWork.input.type);
      break;
    case CoroutineComponent:
      console.log('/coroutine component', unitOfWork.input.handler.name);
      return handleCoroutine(unitOfWork);
    case YieldComponent:
      // Does nothing.
      break;

    // Error cases
    case IndeterminateComponent:
      throw new Error('An indeterminate component should have become determinate before completing.');
    default:
      throw new Error('Unknown unit of work tag');
  }
  return null;
};
