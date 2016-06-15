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
import type { FiberRoot } from 'ReactFiberRoot';

var ReactFiber = require('ReactFiber');
var { beginWork } = require('ReactFiberBeginWork');
var { completeWork } = require('ReactFiberCompleteWork');
var { createFiberRoot } = require('ReactFiberRoot');

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

  // The next work in progress fiber that we're currently working on.
  let nextUnitOfWork : ?Fiber = null;

  // Linked list of roots with scheduled work on them.
  let nextScheduledRoot : ?FiberRoot = null;
  let lastScheduledRoot : ?FiberRoot = null;

  function findNextUnitOfWorkAtPriority(root : FiberRoot, priorityLevel : PriorityLevel) : ?Fiber {
    let current = root.current;
    while (current) {
      if (current.pendingWorkPriority !== 0 &&
          current.pendingWorkPriority <= priorityLevel) {
        // This node has work to do that fits our priority level criteria.
        if (current.pendingProps !== null) {
          // We found some work to do. We need to return the "work in progress"
          // of this node which will be the alternate.
          const clone = ReactFiber.cloneFiber(current, current.pendingWorkPriority);
          clone.pendingProps = current.pendingProps;
          return clone;
        }
        // If we have a child let's see if any of our children has work to do.
        // Only bother doing this at all if the current priority level matches
        // because it is the highest priority for the whole subtree.
        // TODO: Coroutines can have work in their stateNode which is another
        // type of child that needs to be searched for work.
        if (current.child) {
          // Ensure we have a work in progress copy to backtrack through.
          ReactFiber.cloneFiber(current, NoWork);
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

  function findNextUnitOfWork() {
    // Clear out roots with no more work on them.
    while (nextScheduledRoot && nextScheduledRoot.current.pendingWorkPriority === NoWork) {
      nextScheduledRoot.isScheduled = false;
      if (nextScheduledRoot === lastScheduledRoot) {
        nextScheduledRoot = null;
        lastScheduledRoot = null;
        return null;
      }
      nextScheduledRoot = nextScheduledRoot.nextScheduledRoot;
    }
    let root = nextScheduledRoot;
    while (root) {
      // Find the highest possible priority work to do.
      // This loop is unrolled just to satisfy Flow's enum constraint.
      // We could make arbitrary many idle priority levels but having
      // too many just means flushing changes too often.
      let work = findNextUnitOfWorkAtPriority(root, HighPriority);
      if (work) {
        return work;
      }
      work = findNextUnitOfWorkAtPriority(root, LowPriority);
      if (work) {
        return work;
      }
      work = findNextUnitOfWorkAtPriority(root, OffscreenPriority);
      if (work) {
        return work;
      }
      // We didn't find anything to do in this root, so let's try the next one.
      root = root.nextScheduledRoot;
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

      // The work is now done. We don't need this anymore. This flags
      // to the system not to redo any work here.
      workInProgress.pendingProps = null;

      // TODO: Stop using the parent for this purpose. I think this will break
      // down in edge cases because when nodes are reused during bailouts, we
      // don't know which of two parents was used. Instead we should maintain
      // a temporary manual stack.
      // $FlowFixMe: This downcast is not safe. It is intentionally an error.
      const parent = workInProgress.parent;

      // Ensure that remaining work priority bubbles up.
      if (parent && workInProgress.pendingWorkPriority !== NoWork &&
          (parent.pendingWorkPriority === NoWork ||
          parent.pendingWorkPriority > workInProgress.pendingWorkPriority)) {
        parent.pendingWorkPriority = workInProgress.pendingWorkPriority;
      }

      if (next) {
        // If completing this work spawned new work, do that next.
        return next;
      } else if (workInProgress.sibling) {
        // If there is more work to do in this parent, do that next.
        return workInProgress.sibling;
      } else if (parent) {
        // If there's no more work in this parent. Complete the parent.
        workInProgress = parent;
      } else {
        // If we're at the root, there's no more work to do. We can flush it.
        const root : FiberRoot = (workInProgress.stateNode : any);
        root.current = workInProgress;
        console.log('completed one root flush with remaining work at priority', workInProgress.pendingWorkPriority);
        const hasMoreWork = workInProgress.pendingWorkPriority !== NoWork;
        // TODO: We can be smarter here and only look for more work in the
        // "next" scheduled work since we've already scanned passed. That
        // also ensures that work scheduled during reconciliation gets deferred.
        const nextWork = findNextUnitOfWork();
        if (!nextWork && hasMoreWork) {
          throw new Error('FiberRoots should not have flagged more work if there is none.');
        }
        return nextWork;
      }
    }
  }

  function performUnitOfWork(workInProgress : Fiber) : ?Fiber {
    // Ignore work if there is nothing to do.
    if (workInProgress.pendingProps === null) {
      return null;
    }
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
      nextUnitOfWork = findNextUnitOfWork();
    }
    while (nextUnitOfWork) {
      if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        if (!nextUnitOfWork) {
          // Find more work. We might have time to complete some more.
          nextUnitOfWork = findNextUnitOfWork();
        }
      } else {
        scheduleLowPriCallback(performLowPriWork);
        return;
      }
    }
  }

  function scheduleLowPriWork(root : FiberRoot) {
    // We must reset the current unit of work pointer so that we restart the
    // search from the root during the next tick, in case there is now higher
    // priority work somewhere earlier than before.
    nextUnitOfWork = null;

    if (root.isScheduled) {
      // If we're already scheduled, we can bail out.
      return;
    }
    root.isScheduled = true;
    if (lastScheduledRoot) {
      // Schedule ourselves to the end.
      lastScheduledRoot.nextScheduledRoot = root;
      lastScheduledRoot = root;
    } else {
      // We're the only work scheduled.
      nextScheduledRoot = root;
      lastScheduledRoot = root;
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
      const root = createFiberRoot(containerInfo);
      const container = root.current;
      // TODO: Use pending work/state instead of props.
      container.pendingProps = element;
      container.pendingWorkPriority = LowPriority;

      scheduleLowPriWork(root);

      // It may seem strange that we don't return the root here, but that will
      // allow us to have containers that are in the middle of the tree instead
      // of being roots.
      return container;
    },

    updateContainer(element : ReactElement<any>, container : OpaqueNode) : void {
      // TODO: If this is a nested container, this won't be the root.
      const root : FiberRoot = (container.stateNode : any);
      // TODO: Use pending work/state instead of props.
      root.current.pendingProps = element;
      root.current.pendingWorkPriority = LowPriority;

      scheduleLowPriWork(root);
    },

    unmountContainer(container : OpaqueNode) : void {
      // TODO: If this is a nested container, this won't be the root.
      const root : FiberRoot = (container.stateNode : any);
      // TODO: Use pending work/state instead of props.
      root.current.pendingProps = [];
      root.current.pendingWorkPriority = LowPriority;

      scheduleLowPriWork(root);
    },

    getPublicRootInstance(container : OpaqueNode) : ?Object {
      return null;
    },

  };

};
