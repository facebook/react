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

function reconcileChildren(current, workInProgress, nextChildren) {
  workInProgress.child = ReactChildFiber.reconcileChildFibers(
    workInProgress,
    current ? current.child : null,
    nextChildren
  );
}

function updateFunctionalComponent(current, workInProgress) {
  var fn = workInProgress.type;
  var props = workInProgress.pendingProps;
  console.log('update fn:', fn.name);
  var nextChildren = fn(props);
  reconcileChildren(current, workInProgress, nextChildren);
}

function updateHostComponent(current, workInProgress) {
  console.log('host component', workInProgress.type, typeof workInProgress.pendingProps.children === 'string' ? workInProgress.pendingProps.children : '');

  var nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren);
}

function mountIndeterminateComponent(current, workInProgress) {
  var fn = workInProgress.type;
  var props = workInProgress.pendingProps;
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
  reconcileChildren(current, workInProgress, value);
}

function updateCoroutineComponent(current, workInProgress) {
  var coroutine = (workInProgress.pendingProps : ?ReactCoroutine);
  if (!coroutine) {
    throw new Error('Should be resolved by now');
  }
  console.log('begin coroutine', workInProgress.type.name);
  reconcileChildren(current, workInProgress, coroutine.children);
}

function beginWork(current : ?Fiber, workInProgress : Fiber) : ?Fiber {
  // The current, flushed, state of this fiber is the alternate.
  // Ideally nothing should rely on this, but relying on it here
  // means that we don't need an additional field on the work in
  // progress.
  if (current && workInProgress.pendingProps === current.memoizedProps) {
    // The most likely scenario is that the previous copy of the tree contains
    // the same props as the new one. In that case, we can just copy the output
    // and children from that node.
    workInProgress.output = current.output;
    workInProgress.child = current.child;
    workInProgress.stateNode = current.stateNode;
    return null;
  }
  if (workInProgress.pendingProps === workInProgress.memoizedProps) {
    // In a ping-pong scenario, this version could actually contain the
    // old props. In that case, we can just bail out.
    return null;
  }
  switch (workInProgress.tag) {
    case IndeterminateComponent:
      mountIndeterminateComponent(current, workInProgress);
      return workInProgress.child;
    case FunctionalComponent:
      updateFunctionalComponent(current, workInProgress);
      return workInProgress.child;
    case ClassComponent:
      console.log('class component', workInProgress.pendingProps.type.name);
      return workInProgress.child;
    case HostContainer:
      reconcileChildren(current, workInProgress, workInProgress.pendingProps);
      // A yield component is just a placeholder, we can just run through the
      // next one immediately.
      if (workInProgress.child) {
        return beginWork(
          workInProgress.child.alternate,
          workInProgress.child
        );
      }
      return null;
    case HostComponent:
      updateHostComponent(current, workInProgress);
      return workInProgress.child;
    case CoroutineHandlerPhase:
      // This is a restart. Reset the tag to the initial phase.
      workInProgress.tag = CoroutineComponent;
      // Intentionally fall through since this is now the same.
    case CoroutineComponent:
      updateCoroutineComponent(current, workInProgress);
      // This doesn't take arbitrary time so we could synchronously just begin
      // eagerly do the work of workInProgress.child as an optimization.
      if (workInProgress.child) {
        return beginWork(
          workInProgress.child.alternate,
          workInProgress.child
        );
      }
      return workInProgress.child;
    case YieldComponent:
      // A yield component is just a placeholder, we can just run through the
      // next one immediately.
      if (workInProgress.sibling) {
        return beginWork(
          workInProgress.sibling.alternate,
          workInProgress.sibling
        );
      }
      return null;
    default:
      throw new Error('Unknown unit of work tag');
  }
}

exports.beginWork = beginWork;
