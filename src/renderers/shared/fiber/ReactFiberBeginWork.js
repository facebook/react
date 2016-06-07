/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberBeginWork
 * @flow
 */

'use strict';

import type { ReactCoroutine } from 'ReactCoroutine';
import type { Fiber } from 'ReactFiber';

var ReactChildFiber = require('ReactChildFiber');
var ReactTypesOfWork = require('ReactTypesOfWork');
var {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostComponent,
  CoroutineComponent,
  CoroutineHandlerPhase,
  YieldComponent,
} = ReactTypesOfWork;

function updateFunctionalComponent(unitOfWork) {
  var fn = unitOfWork.type;
  var props = unitOfWork.input;
  console.log('update fn:', fn.name);
  var nextChildren = fn(props);

  unitOfWork.child = ReactChildFiber.reconcileChildFibers(
    unitOfWork,
    unitOfWork.child,
    nextChildren
  );
}

function updateHostComponent(unitOfWork) {
  console.log('host component', unitOfWork.type, typeof unitOfWork.input.children === 'string' ? unitOfWork.input.children : '');

  var nextChildren = unitOfWork.input.children;
  unitOfWork.child = ReactChildFiber.reconcileChildFibers(
    unitOfWork,
    unitOfWork.child,
    nextChildren
  );
}

function mountIndeterminateComponent(unitOfWork) {
  var fn = unitOfWork.type;
  var props = unitOfWork.input;
  var value = fn(props);
  if (typeof value === 'object' && value && typeof value.render === 'function') {
    console.log('performed work on class:', fn.name);
    // Proceed under the assumption that this is a class instance
    unitOfWork.tag = ClassComponent;
  } else {
    console.log('performed work on fn:', fn.name);
    // Proceed under the assumption that this is a functional component
    unitOfWork.tag = FunctionalComponent;
  }
  unitOfWork.child = ReactChildFiber.reconcileChildFibers(
    unitOfWork,
    unitOfWork.child,
    value
  );
}

function updateCoroutineComponent(unitOfWork) {
  var coroutine = (unitOfWork.input : ?ReactCoroutine);
  if (!coroutine) {
    throw new Error('Should be resolved by now');
  }
  console.log('begin coroutine', unitOfWork.type.name);
  unitOfWork.child = ReactChildFiber.reconcileChildFibers(
    unitOfWork,
    unitOfWork.child,
    coroutine.children
  );
}

function beginWork(unitOfWork : Fiber) : ?Fiber {
  const alt = unitOfWork.alternate;
  if (alt && unitOfWork.input === alt.memoizedInput) {
    // The most likely scenario is that the previous copy of the tree contains
    // the same input as the new one. In that case, we can just copy the output
    // and children from that node.
    unitOfWork.output = alt.output;
    unitOfWork.child = alt.child;
    return null;
  }
  if (unitOfWork.input === unitOfWork.memoizedInput) {
    // In a ping-pong scenario, this version could actually contain the
    // old input. In that case, we can just bail out.
    return null;
  }
  switch (unitOfWork.tag) {
    case IndeterminateComponent:
      mountIndeterminateComponent(unitOfWork);
      break;
    case FunctionalComponent:
      updateFunctionalComponent(unitOfWork);
      break;
    case ClassComponent:
      console.log('class component', unitOfWork.input.type.name);
      break;
    case HostComponent:
      updateHostComponent(unitOfWork);
      break;
    case CoroutineHandlerPhase:
      // This is a restart. Reset the tag to the initial phase.
      unitOfWork.tag = CoroutineComponent;
      // Intentionally fall through since this is now the same.
    case CoroutineComponent:
      updateCoroutineComponent(unitOfWork);
      // This doesn't take arbitrary time so we could synchronously just begin
      // eagerly do the work of unitOfWork.child as an optimization.
      if (unitOfWork.child) {
        return beginWork(unitOfWork.child);
      }
      break;
    case YieldComponent:
      // A yield component is just a placeholder, we can just run through the
      // next one immediately.
      if (unitOfWork.sibling) {
        return beginWork(unitOfWork.sibling);
      }
      return null;
    default:
      throw new Error('Unknown unit of work tag');
  }
  return unitOfWork.child;
}

exports.beginWork = beginWork;
