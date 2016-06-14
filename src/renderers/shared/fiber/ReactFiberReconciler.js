/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberReconciler
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';
import type { PriorityLevel } from 'ReactPriorityLevel';

var ReactFiber = require('ReactFiber');
var { beginWork } = require('ReactFiberBeginWork');
var { completeWork } = require('ReactFiberCompleteWork');

var {
  NoWork,
  HighPriority,
  LowPriority,
  OffscreenPriority,
} = require('ReactPriorityLevel');

type ReactHostElement<T, P> = {
  type: T,
  props: P
};

type Deadline = {
  timeRemaining : () => number
};

var timeHeuristicForUnitOfWork = 1;

export type HostConfig<T, P, I> = {

  createHostInstance(element : ReactHostElement<T, P>) : I,
  scheduleHighPriCallback(callback : () => void) : void,
  scheduleLowPriCallback(callback : (deadline : Deadline) => void) : void

};

type OpaqueNode = Fiber;

export type Reconciler = {
  mountContainer(element : ReactElement<any>, containerInfo : ?Object) : OpaqueNode,
  updateContainer(element : ReactElement<any>, container : OpaqueNode) : void,
  unmountContainer(container : OpaqueNode) : void,

  // Used to extract the return value from the initial render. Legacy API.
  getPublicRootInstance(container : OpaqueNode) : ?Object,
};

module.exports = function<T, P, I>(config : HostConfig<T, P, I>) : Reconciler {

  // const scheduleHighPriCallback = config.scheduleHighPriCallback;
  const scheduleLowPriCallback = config.scheduleLowPriCallback;

  let nextUnitOfWork : ?Fiber = null;

  let currentRootsWithPendingWork : ?Fiber = null;

  function findNextUnitOfWork(priorityLevel : PriorityLevel) : ?Fiber {
    let current = currentRootsWithPendingWork;
    while (current) {
      if (current.pendingWorkPriority !== 0 &&
          current.pendingWorkPriority <= priorityLevel) {
        // This node has work to do that fits our priority level criteria.
        if (current.pendingProps !== null) {
          // We found some work to do. We need to return the "work in progress"
          // of this node which will be the alternate.
          return current.alternate;
        }
        // If we have a child let's see if any of our children has work to do.
        // Only bother doing this at all if the current priority level matches
        // because it is the highest priority for the whole subtree.
        if (current.child) {
          current = current.child;
          continue;
        }
        // If we match the priority but has no child and no work to do,
        // then we can safely reset the flag.
        current.pendingWorkPriority = NoWork;
      }
      while (!current.sibling) {
        // TODO: Stop using parent here. See below.
        // $FlowFixMe: This downcast is not safe. It is intentionally an error.
        current = current.parent;
        if (!current) {
          return null;
        }
        if (current.pendingWorkPriority <= priorityLevel) {
          // If this subtree had work left to do, we would have returned it by
          // now. This could happen if a child with pending work gets cleaned up
          // but we don't clear the flag then. It is safe to reset it now.
          current.pendingWorkPriority = NoWork;
        }
      }
      current = current.sibling;
    }
    return null;
  }

  function completeUnitOfWork(workInProgress : Fiber) : ?Fiber {
    while (true) {
      // The current, flushed, state of this fiber is the alternate.
      // Ideally nothing should rely on this, but relying on it here
      // means that we don't need an additional field on the work in
      // progress.
      const current = workInProgress.alternate;
      const next = completeWork(current, workInProgress);
      if (next) {
        // If completing this work spawned new work, do that next.
        return next;
      } else if (workInProgress.sibling) {
        // If there is more work to do in this parent, do that next.
        return workInProgress.sibling;
      } else if (workInProgress.parent) {
        // If there's no more work in this parent. Complete the parent.
        // TODO: Stop using the parent for this purpose. I think this will break
        // down in edge cases because when nodes are reused during bailouts, we
        // don't know which of two parents was used. Instead we should maintain
        // a temporary manual stack.
        // $FlowFixMe: This downcast is not safe. It is intentionally an error.
        workInProgress = workInProgress.parent;
      } else {
        // If we're at the root, there's no more work to do.
        currentRootsWithPendingWork = null;
        return null;
      }
    }
  }

  function performUnitOfWork(workInProgress : Fiber) : ?Fiber {
    // The current, flushed, state of this fiber is the alternate.
    // Ideally nothing should rely on this, but relying on it here
    // means that we don't need an additional field on the work in
    // progress.
    const current = workInProgress.alternate;
    const next = beginWork(current, workInProgress);
    if (next) {
      // If this spawns new work, do that next.
      return next;
    } else {
      // Otherwise, complete the current work.
      return completeUnitOfWork(workInProgress);
    }
  }

  function performLowPriWork(deadline : Deadline) {
    if (!nextUnitOfWork) {
      // Find the highest possible priority work to do.
      // This loop is unrolled just to satisfy Flow's enum constraint.
      // We could make arbitrary many idle priority levels but having
      // too many just means flushing changes too often.
      nextUnitOfWork = findNextUnitOfWork(HighPriority);
      if (!nextUnitOfWork) {
        nextUnitOfWork = findNextUnitOfWork(LowPriority);
        if (!nextUnitOfWork) {
          nextUnitOfWork = findNextUnitOfWork(OffscreenPriority);
        }
      }
    }
    while (nextUnitOfWork) {
      if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      } else {
        scheduleLowPriCallback(performLowPriWork);
        break;
      }
    }
  }

  function scheduleLowPriWork(root : Fiber) {
    // We must reset the current unit of work pointer so that we restart the
    // search from the root during the next tick.
    nextUnitOfWork = null;

    if (currentRootsWithPendingWork) {
      if (root === currentRootsWithPendingWork) {
        // We're already scheduled.
        return;
      }
      // We already have some work pending in another root. Add this to the
      // linked list.
      let previousSibling = currentRootsWithPendingWork;
      while (previousSibling.sibling) {
        previousSibling = previousSibling.sibling;
        if (root === previousSibling) {
          // We're already scheduled.
          return;
        }
      }
      previousSibling.sibling = root;
    } else {
      // We're the first and only root with new changes.
      currentRootsWithPendingWork = root;
      root.sibling = null;
      // Ensure we will get another callback to process the work.
      scheduleLowPriCallback(performLowPriWork);
    }
  }

  /*
  function performHighPriWork() {
    // There is no such thing as high pri work yet.
  }

  function ensureHighPriIsScheduled() {
    scheduleHighPriCallback(performHighPriWork);
  }
  */

  return {

    mountContainer(element : ReactElement<any>, containerInfo : ?Object) : OpaqueNode {
      const container = ReactFiber.createHostContainerFiber(containerInfo);
      container.alternate = container;
      container.pendingProps = element;
      container.pendingWorkPriority = LowPriority;

      scheduleLowPriWork(container);

      return container;
    },

    updateContainer(element : ReactElement<any>, container : OpaqueNode) : void {
      container.pendingProps = element;
      container.pendingWorkPriority = LowPriority;

      scheduleLowPriWork(container);
    },

    unmountContainer(container : OpaqueNode) : void {
      container.pendingProps = null;
      container.pendingWorkPriority = LowPriority;

      scheduleLowPriWork(container);
    },

    getPublicRootInstance(container : OpaqueNode) : ?Object {
      return null;
    },

  };

};
