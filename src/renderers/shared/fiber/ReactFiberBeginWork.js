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
import type { HostConfig } from 'ReactFiberReconciler';

var { reconcileChildFibers } = require('ReactChildFiber');
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
var {
  NoWork,
  OffscreenPriority,
} = require('ReactPriorityLevel');
var { findNextUnitOfWorkAtPriority } = require('ReactFiberPendingWork');

module.exports = function<T, P, I, C>(config : HostConfig<T, P, I, C>) {

  function reconcileChildren(current, workInProgress, nextChildren) {
    const priority = workInProgress.pendingWorkPriority;
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current ? current.child : null,
      nextChildren,
      priority
    );
  }

  function updateFunctionalComponent(current, workInProgress) {
    var fn = workInProgress.type;
    var props = workInProgress.pendingProps;
    var nextChildren = fn(props);
    reconcileChildren(current, workInProgress, nextChildren);
    workInProgress.pendingWorkPriority = NoWork;
  }

  function updateClassComponent(current, workInProgress) {
    var props = workInProgress.pendingProps;
    if (!workInProgress.stateNode) {
      var ctor = workInProgress.type;
      workInProgress.stateNode = new ctor(props);
    }
    var instance = workInProgress.stateNode;
    instance.props = props;
    var nextChildren = instance.render();
    reconcileChildren(current, workInProgress, nextChildren);
    workInProgress.pendingWorkPriority = NoWork;
  }

  function updateHostComponent(current, workInProgress) {
    var nextChildren = workInProgress.pendingProps.children;

    let priority = workInProgress.pendingWorkPriority;
    if (workInProgress.pendingProps.hidden && priority !== OffscreenPriority) {
      // If this host component is hidden, we can reconcile its children at
      // the lowest priority and bail out from this particular pass. Unless, we're
      // currently reconciling the lowest priority.
      workInProgress.child = reconcileChildFibers(
        workInProgress,
        current ? current.child : null,
        nextChildren,
        OffscreenPriority
      );
      workInProgress.pendingWorkPriority = OffscreenPriority;
      workInProgress.wasDeprioritized = true;
      return null;
    } else {
      workInProgress.child = reconcileChildFibers(
        workInProgress,
        current ? current.child : null,
        nextChildren,
        priority
      );
      workInProgress.pendingWorkPriority = NoWork;
      workInProgress.wasDeprioritized = false;
      return workInProgress.child;
    }
  }

  function mountIndeterminateComponent(current, workInProgress) {
    var fn = workInProgress.type;
    var props = workInProgress.pendingProps;
    var value = fn(props);
    if (typeof value === 'object' && value && typeof value.render === 'function') {
      // Proceed under the assumption that this is a class instance
      workInProgress.tag = ClassComponent;
      if (workInProgress.alternate) {
        workInProgress.alternate.tag = ClassComponent;
      }
      value = value.render();
    } else {
      // Proceed under the assumption that this is a functional component
      workInProgress.tag = FunctionalComponent;
      if (workInProgress.alternate) {
        workInProgress.alternate.tag = FunctionalComponent;
      }
    }
    reconcileChildren(current, workInProgress, value);
    workInProgress.pendingWorkPriority = NoWork;
  }

  function updateCoroutineComponent(current, workInProgress) {
    var coroutine = (workInProgress.pendingProps : ?ReactCoroutine);
    if (!coroutine) {
      throw new Error('Should be resolved by now');
    }
    reconcileChildren(current, workInProgress, coroutine.children);
    workInProgress.pendingWorkPriority = NoWork;
  }

  function reuseChildren(returnFiber : Fiber, firstChild : Fiber) {
    // TODO: None of this should be necessary if structured better.
    // The returnFiber pointer only needs to be updated when we walk into this child
    // which we don't do right now. If the pending work priority indicated only
    // if a child has work rather than if the node has work, then we would know
    // by a single lookup on workInProgress rather than having to go through
    // each child.
    let child = firstChild;
    do {
      // Update the returnFiber of the child to the newest fiber.
      child.return = returnFiber;
      // Retain the priority if there's any work left to do in the children.
      if (child.pendingWorkPriority !== NoWork &&
          (returnFiber.pendingWorkPriority === NoWork ||
          returnFiber.pendingWorkPriority > child.pendingWorkPriority)) {
        returnFiber.pendingWorkPriority = child.pendingWorkPriority;
      }
    } while (child = child.sibling);
  }

  function reuseChildrenEffects(returnFiber : Fiber, firstChild : Fiber) {
    let child = firstChild;
    do {
      // Ensure that the first and last effect of the parent corresponds
      // to the children's first and last effect.
      if (!returnFiber.firstEffect) {
        returnFiber.firstEffect = child.firstEffect;
      }
      if (child.lastEffect) {
        if (returnFiber.lastEffect) {
          returnFiber.lastEffect.nextEffect = child.firstEffect;
        }
        returnFiber.lastEffect = child.lastEffect;
      }
    } while (child = child.sibling);
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
      workInProgress.memoizedProps = workInProgress.pendingProps;
      workInProgress.output = current.output;
      const priorityLevel = workInProgress.pendingWorkPriority;
      workInProgress.pendingProps = null;
      workInProgress.pendingWorkPriority = NoWork;
      workInProgress.stateNode = current.stateNode;
      if (current.child) {
        // If we bail out but still has work with the current priority in this
        // subtree, we need to go find it right now. If we don't, we won't flush
        // it until the next tick.
        workInProgress.child = current.child;
        reuseChildren(workInProgress, workInProgress.child);
        if (workInProgress.pendingWorkPriority !== NoWork && workInProgress.pendingWorkPriority <= priorityLevel) {
          // TODO: This passes the current node and reads the priority level and
          // pending props from that. We want it to read our priority level and
          // pending props from the work in progress. Needs restructuring.
          return findNextUnitOfWorkAtPriority(workInProgress.alternate, priorityLevel);
        } else {
          return null;
        }
      } else {
        workInProgress.child = null;
        return null;
      }
    }

    if (!workInProgress.hasWorkInProgress &&
        workInProgress.pendingProps === workInProgress.memoizedProps) {
      // If we started this work before, and finished it, or if we're in a
      // ping-pong update scenario, this version could already be what we're
      // looking for. In that case, we should be able to just bail out.
      const priorityLevel = workInProgress.pendingWorkPriority;
      workInProgress.pendingProps = null;
      workInProgress.pendingWorkPriority = NoWork;

      workInProgress.firstEffect = null;
      workInProgress.nextEffect = null;
      workInProgress.lastEffect = null;

      if (workInProgress.child && workInProgress.child.alternate) {
        // On the way up here, we reset the child node to be the current one.
        // Therefore we have to reuse the alternate. This is super weird.
        workInProgress.child = workInProgress.child.alternate;
        // Ensure that the effects of reused work are preserved.
        reuseChildrenEffects(workInProgress, workInProgress.child);
        // If we bail out but still has work with the current priority in this
        // subtree, we need to go find it right now. If we don't, we won't flush
        // it until the next tick.
        reuseChildren(workInProgress, workInProgress.child);
        if (workInProgress.pendingWorkPriority !== NoWork && workInProgress.pendingWorkPriority <= priorityLevel) {
          // TODO: This passes the current node and reads the priority level and
          // pending props from that. We want it to read our priority level and
          // pending props from the work in progress. Needs restructuring.
          return findNextUnitOfWorkAtPriority(workInProgress, priorityLevel);
        }
      }
      return null;
    }

    workInProgress.hasWorkInProgress = true;

    switch (workInProgress.tag) {
      case IndeterminateComponent:
        mountIndeterminateComponent(current, workInProgress);
        return workInProgress.child;
      case FunctionalComponent:
        updateFunctionalComponent(current, workInProgress);
        return workInProgress.child;
      case ClassComponent:
        updateClassComponent(current, workInProgress);
        return workInProgress.child;
      case HostContainer:
        reconcileChildren(current, workInProgress, workInProgress.pendingProps);
        // A yield component is just a placeholder, we can just run through the
        // next one immediately.
        workInProgress.pendingWorkPriority = NoWork;
        if (workInProgress.child) {
          return beginWork(
            workInProgress.child.alternate,
            workInProgress.child
          );
        }
        return null;
      case HostComponent:
        return updateHostComponent(current, workInProgress);
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
        workInProgress.pendingWorkPriority = NoWork;
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

  return {
    beginWork,
  };

};
