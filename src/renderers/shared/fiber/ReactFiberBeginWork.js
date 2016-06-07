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

function updateFunctionalComponent(workInProgress) {
  var fn = workInProgress.type;
  var props = workInProgress.input;
  console.log('update fn:', fn.name);
  var nextChildren = fn(props);

  workInProgress.child = ReactChildFiber.reconcileChildFibers(
    workInProgress,
    workInProgress.child,
    nextChildren
  );
}

function updateHostComponent(workInProgress) {
  console.log('host component', workInProgress.type, typeof workInProgress.input.children === 'string' ? workInProgress.input.children : '');

  var nextChildren = workInProgress.input.children;
  workInProgress.child = ReactChildFiber.reconcileChildFibers(
    workInProgress,
    workInProgress.child,
    nextChildren
  );
}

function mountIndeterminateComponent(workInProgress) {
  var fn = workInProgress.type;
  var props = workInProgress.input;
  var value = fn(props);
  if (typeof value === 'object' && value && typeof value.render === 'function') {
    console.log('performed work on class:', fn.name);
    // Proceed under the assumption that this is a class instance
    workInProgress.tag = ClassComponent;
  } else {
    console.log('performed work on fn:', fn.name);
    // Proceed under the assumption that this is a functional component
    workInProgress.tag = FunctionalComponent;
  }
  workInProgress.child = ReactChildFiber.reconcileChildFibers(
    workInProgress,
    workInProgress.child,
    value
  );
}

function updateCoroutineComponent(workInProgress) {
  var coroutine = (workInProgress.input : ?ReactCoroutine);
  if (!coroutine) {
    throw new Error('Should be resolved by now');
  }
  console.log('begin coroutine', workInProgress.type.name);
  workInProgress.child = ReactChildFiber.reconcileChildFibers(
    workInProgress,
    workInProgress.child,
    coroutine.children
  );
}

function beginWork(workInProgress : Fiber) : ?Fiber {
  const alt = workInProgress.alternate;
  if (alt && workInProgress.input === alt.memoizedInput) {
    // The most likely scenario is that the previous copy of the tree contains
    // the same input as the new one. In that case, we can just copy the output
    // and children from that node.
    workInProgress.output = alt.output;
    workInProgress.child = alt.child;
    return null;
  }
  if (workInProgress.input === workInProgress.memoizedInput) {
    // In a ping-pong scenario, this version could actually contain the
    // old input. In that case, we can just bail out.
    return null;
  }
  switch (workInProgress.tag) {
    case IndeterminateComponent:
      mountIndeterminateComponent(workInProgress);
      break;
    case FunctionalComponent:
      updateFunctionalComponent(workInProgress);
      break;
    case ClassComponent:
      console.log('class component', workInProgress.input.type.name);
      break;
    case HostComponent:
      updateHostComponent(workInProgress);
      break;
    case CoroutineHandlerPhase:
      // This is a restart. Reset the tag to the initial phase.
      workInProgress.tag = CoroutineComponent;
      // Intentionally fall through since this is now the same.
    case CoroutineComponent:
      updateCoroutineComponent(workInProgress);
      // This doesn't take arbitrary time so we could synchronously just begin
      // eagerly do the work of workInProgress.child as an optimization.
      if (workInProgress.child) {
        return beginWork(workInProgress.child);
      }
      break;
    case YieldComponent:
      // A yield component is just a placeholder, we can just run through the
      // next one immediately.
      if (workInProgress.sibling) {
        return beginWork(workInProgress.sibling);
      }
      return null;
    default:
      throw new Error('Unknown unit of work tag');
  }
  return workInProgress.child;
}

exports.beginWork = beginWork;
