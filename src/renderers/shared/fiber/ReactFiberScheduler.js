/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberScheduler
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';
import type { FiberRoot } from 'ReactFiberRoot';
import type { HostConfig } from 'ReactFiberReconciler';

var { cloneFiber } = require('ReactFiber');
var { beginWork } = require('ReactFiberBeginWork');
var { completeWork } = require('ReactFiberCompleteWork');
var { findNextUnitOfWorkAtPriority } = require('ReactFiberPendingWork');

var {
  NoWork,
  HighPriority,
  LowPriority,
  OffscreenPriority,
} = require('ReactPriorityLevel');

var timeHeuristicForUnitOfWork = 1;

module.exports = function<T, P, I>(config : HostConfig<T, P, I>) {

  // const scheduleHighPriCallback = config.scheduleHighPriCallback;
  const scheduleLowPriCallback = config.scheduleLowPriCallback;

  // The next work in progress fiber that we're currently working on.
  let nextUnitOfWork : ?Fiber = null;

  // Linked list of roots with scheduled work on them.
  let nextScheduledRoot : ?FiberRoot = null;
  let lastScheduledRoot : ?FiberRoot = null;

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
      cloneFiber(root.current, root.current.pendingWorkPriority);
      // Find the highest possible priority work to do.
      // This loop is unrolled just to satisfy Flow's enum constraint.
      // We could make arbitrary many idle priority levels but having
      // too many just means flushing changes too often.
      let work = findNextUnitOfWorkAtPriority(root.current, HighPriority);
      if (work) {
        return work;
      }
      work = findNextUnitOfWorkAtPriority(root.current, LowPriority);
      if (work) {
        return work;
      }
      work = findNextUnitOfWorkAtPriority(root.current, OffscreenPriority);
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
      if (workInProgress.pendingWorkPriority === NoWork) {
        workInProgress.hasWorkInProgress = false;
      }

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
        // TODO: We can be smarter here and only look for more work in the
        // "next" scheduled work since we've already scanned passed. That
        // also ensures that work scheduled during reconciliation gets deferred.
        // const hasMoreWork = workInProgress.pendingWorkPriority !== NoWork;
        console.log('----- COMPLETED with remaining work:', workInProgress.pendingWorkPriority);
        const nextWork = findNextUnitOfWork();
        // if (!nextWork && hasMoreWork) {
          // TODO: This can happen when some deep work completes and we don't
          // know if this was the last one. We should be able to keep track of
          // the highest priority still in the tree for one pass. But if we
          // terminate an update we don't know.
          // throw new Error('FiberRoots should not have flagged more work if there is none.');
        // }
        return nextWork;
      }
    }
  }

  function performUnitOfWork(workInProgress : Fiber) : ?Fiber {
    // Ignore work if there is nothing to do.
    if (workInProgress.pendingProps === null) {
      return completeUnitOfWork(workInProgress);
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

  function performLowPriWork(deadline) {
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
    scheduleLowPriWork: scheduleLowPriWork,
  };
};
