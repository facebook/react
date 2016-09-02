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

var {
  reconcileChildFibers,
  reconcileChildFibersInPlace,
  cloneChildFibers,
} = require('ReactChildFiber');
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

module.exports = function<T, P, I, C>(config : HostConfig<T, P, I, C>) {

  function reconcileChildren(current, workInProgress, nextChildren) {
    const priorityLevel = workInProgress.pendingWorkPriority;
    // At this point any memoization is no longer valid since we'll have changed
    // the children.
    workInProgress.memoizedProps = null;
    if (current && current.child === workInProgress.child) {
      // If the current child is the same as the work in progress, it means that
      // we haven't yet started any work on these children. Therefore, we use
      // the clone algorithm to create a copy of all the current children.
      workInProgress.child = reconcileChildFibers(
        workInProgress,
        workInProgress.child,
        nextChildren,
        priorityLevel
      );
    } else {
      // If, on the other hand, we don't have a current fiber or if it is
      // already using a clone, that means we've already begun some work on this
      // tree and we can continue where we left off by reconciling against the
      // existing children.
      workInProgress.child = reconcileChildFibersInPlace(
        workInProgress,
        workInProgress.child,
        nextChildren,
        priorityLevel
      );
    }
  }

  function updateFunctionalComponent(current, workInProgress) {
    var fn = workInProgress.type;
    var props = workInProgress.pendingProps;

    // TODO: Disable this before release, since it is not part of the public API
    // I use this for testing to compare the relative overhead of classes.
    if (typeof fn.shouldComponentUpdate === 'function') {
      if (workInProgress.memoizedProps !== null) {
        if (!fn.shouldComponentUpdate(workInProgress.memoizedProps, props)) {
          return bailoutOnAlreadyFinishedWork(current, workInProgress);
        }
      }
    }

    var nextChildren = fn(props);
    reconcileChildren(current, workInProgress, nextChildren);
    return workInProgress.child;
  }

  function updateClassComponent(current : ?Fiber, workInProgress : Fiber) {
    var props = workInProgress.pendingProps;
    var instance = workInProgress.stateNode;
    if (!instance) {
      var ctor = workInProgress.type;
      workInProgress.stateNode = instance = new ctor(props);
    } else if (typeof instance.shouldComponentUpdate === 'function') {
      if (current && current.memoizedProps) {
        // Revert to the last flushed props, incase we aborted an update.
        instance.props = current.memoizedProps;
        if (!instance.shouldComponentUpdate(props)) {
          return bailoutOnCurrent(current, workInProgress);
        }
      }
      if (workInProgress.memoizedProps) {
        // Reset the props, in case this is a ping-pong case rather than a
        // completed update case. For the completed update case, the instance
        // props will already be the memoizedProps.
        instance.props = workInProgress.memoizedProps;
        if (!instance.shouldComponentUpdate(props)) {
          // return bailoutOnAlreadyFinishedWork(current, workInProgress);
        }
      }
    }

    instance.props = props;
    var nextChildren = instance.render();
    reconcileChildren(current, workInProgress, nextChildren);

    return workInProgress.child;
  }

  function updateHostComponent(current, workInProgress) {
    if (workInProgress.pendingProps.hidden &&
        workInProgress.pendingWorkPriority !== OffscreenPriority) {
      // If this host component is hidden, we can bail out and ignore this.
      // We'll rerender it later at the lower priority.
      workInProgress.pendingWorkPriority = OffscreenPriority;
      return bailoutOnLowPriority(current, workInProgress);
    } else {
      var nextChildren = workInProgress.pendingProps.children;
      reconcileChildren(current, workInProgress, nextChildren);
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
    return workInProgress.child;
  }

  function updateCoroutineComponent(current, workInProgress) {
    var coroutine = (workInProgress.pendingProps : ?ReactCoroutine);
    if (!coroutine) {
      throw new Error('Should be resolved by now');
    }
    reconcileChildren(current, workInProgress, coroutine.children);
  }

  function reuseChildren(returnFiber : Fiber, firstChild : Fiber) {
    // TODO on the TODO: Is this not necessary anymore because I moved the
    // priority reset?
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
      /*if (child.pendingWorkPriority !== NoWork &&
          (returnFiber.pendingWorkPriority === NoWork ||
          returnFiber.pendingWorkPriority > child.pendingWorkPriority)) {
        returnFiber.pendingWorkPriority = child.pendingWorkPriority;
      }*/
      if (!child.pendingProps && !child.memoizedProps) {
        throw new Error('Should have memoized props by now');
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

/*
  function bailoutOnCurrent(current : Fiber, workInProgress : Fiber) : ?Fiber {
    // The most likely scenario is that the previous copy of the tree contains
    // the same props as the new one. In that case, we can just copy the output
    // and children from that node.
    workInProgress.memoizedProps = workInProgress.pendingProps;
    workInProgress.output = current.output;
    const priorityLevel = workInProgress.pendingWorkPriority;
    // workInProgress.pendingProps = null;
    workInProgress.stateNode = current.stateNode;

    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;

    workInProgress.child = current.child;

    cloneChildFibers(workInProgress);

      // TODO: Maybe bailout with null if the children priority flag indicate
      // that there is no nested work.
    return workInProgress.child;
  }
*/

  function bailoutOnAlreadyFinishedWork(current, workInProgress : Fiber) : ?Fiber {
    // If we started this work before, and finished it, or if we're in a
    // ping-pong update scenario, this version could already be what we're
    // looking for. In that case, we should be able to just bail out.
    const priorityLevel = workInProgress.pendingWorkPriority;
    // workInProgress.pendingProps = null;

    workInProgress.firstEffect = null;
    workInProgress.nextEffect = null;
    workInProgress.lastEffect = null;

    const child = workInProgress.child;
    if (child) {
      // Ensure that the effects of reused work are preserved.
      reuseChildrenEffects(workInProgress, child);
      // If we bail out but still has work with the current priority in this
      // subtree, we need to go find it right now. If we don't, we won't flush
      // it until the next tick.
      reuseChildren(workInProgress, child);
      // TODO: Maybe bailout with null if the children priority flag indicate
      // that there is no nested work.
      return workInProgress.child;
    }
    return null;
  }

  function bailoutOnLowPriority(current, workInProgress) {
    if (current) {
      workInProgress.child = current.child;
      workInProgress.memoizedProps = current.memoizedProps;
      workInProgress.output = current.output;
    }
    return null;
  }

  function beginWork(current : ?Fiber, workInProgress : Fiber, priorityLevel) : ?Fiber {
    if (!workInProgress.pendingProps) {
      throw new Error('should have pending props here');
    }

    if (workInProgress.pendingWorkPriority === NoWork ||
        workInProgress.pendingWorkPriority > priorityLevel) {
      return bailoutOnLowPriority(current, workInProgress);
    }

    // The current, flushed, state of this fiber is the alternate.
    // Ideally nothing should rely on this, but relying on it here
    // means that we don't need an additional field on the work in
    // progress.
    if (current && workInProgress.pendingProps === current.memoizedProps) {
      return bailoutOnCurrent(current, workInProgress);
    }

    if (workInProgress.memoizedProps &&
        workInProgress.pendingProps === workInProgress.memoizedProps) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    switch (workInProgress.tag) {
      case IndeterminateComponent:
        return mountIndeterminateComponent(current, workInProgress);
      case FunctionalComponent:
        return updateFunctionalComponent(current, workInProgress);
      case ClassComponent:
        return updateClassComponent(current, workInProgress);
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
        if (workInProgress.stateNode && config.beginUpdate) {
          config.beginUpdate(workInProgress.stateNode);
        }
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
