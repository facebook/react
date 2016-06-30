/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberPendingWork
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';
import type { PriorityLevel } from 'ReactPriorityLevel';

var ReactFiber = require('ReactFiber');

var {
  NoWork,
} = require('ReactPriorityLevel');

function cloneSiblings(current : Fiber, workInProgress : Fiber, returnFiber : Fiber) {
  while (current.sibling) {
    current = current.sibling;
    workInProgress = workInProgress.sibling = ReactFiber.cloneFiber(
      current,
      current.pendingWorkPriority
    );
    workInProgress.return = returnFiber;
  }
  workInProgress.sibling = null;
}

exports.findNextUnitOfWorkAtPriority = function(currentRoot : Fiber, priorityLevel : PriorityLevel) : ?Fiber {
  let current = currentRoot;
  while (current) {
    if (current.pendingWorkPriority !== NoWork &&
        current.pendingWorkPriority <= priorityLevel) {
      // This node has work to do that fits our priority level criteria.
      if (current.pendingProps !== null) {
        // We found some work to do. We need to return the "work in progress"
        // of this node which will be the alternate.
        const workInProgress = current.alternate;
        if (!workInProgress) {
          throw new Error('Should have wip now');
        }
        workInProgress.pendingProps = current.pendingProps;
        return workInProgress;
      }
      // If we have a child let's see if any of our children has work to do.
      // Only bother doing this at all if the current priority level matches
      // because it is the highest priority for the whole subtree.
      // TODO: Coroutines can have work in their stateNode which is another
      // type of child that needs to be searched for work.
      if (current.child) {
        // Ensure we have a work in progress copy to backtrack through.
        let currentChild = current.child;
        let workInProgress = current.alternate;
        if (!workInProgress) {
          throw new Error('Should have wip now');
        }
        workInProgress.pendingWorkPriority = current.pendingWorkPriority;
        workInProgress.child = ReactFiber.cloneFiber(currentChild, NoWork);
        workInProgress.child.return = workInProgress;
        cloneSiblings(currentChild, workInProgress.child, workInProgress);
        current = current.child;
        continue;
      }
      // If we match the priority but has no child and no work to do,
      // then we can safely reset the flag.
      current.pendingWorkPriority = NoWork;
    }
    if (current === currentRoot) {
      return null;
    }
    while (!current.sibling) {
      current = current.return;
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
};
