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

var { cloneFiber } = require('ReactFiber');

var {
  NoWork,
} = require('ReactPriorityLevel');

function cloneSiblings(current : Fiber, workInProgress : Fiber, returnFiber : Fiber) {
  workInProgress.return = returnFiber;
  while (current.sibling) {
    current = current.sibling;
    workInProgress = workInProgress.sibling = cloneFiber(
      current,
      current.pendingWorkPriority
    );
    workInProgress.return = returnFiber;
  }
  workInProgress.sibling = null;
}

function cloneChildrenIfNeeded(workInProgress : Fiber) {
  const current = workInProgress.alternate;
  if (!current || workInProgress.child !== current.child) {
    // If there is no alternate, then we don't need to clone the children.
    // If the children of the alternate fiber is a different set, then we don't
    // need to clone. We need to reset the return fiber though since we'll
    // traverse down into them.
    // TODO: I don't think it is actually possible for them to be anything but
    // equal at this point because this fiber was just cloned. Can we skip this
    // check? Similar question about the return fiber.
    let child = workInProgress.child;
    while (child) {
      child.return = workInProgress;
      child = child.sibling;
    }
    return;
  }
  // TODO: This used to reset the pending priority. Not sure if that is needed.
  // workInProgress.pendingWorkPriority = current.pendingWorkPriority;

  // TODO: The below priority used to be set to NoWork which would've
  // dropped work. This is currently unobservable but will become
  // observable when the first sibling has lower priority work remaining
  // than the next sibling. At that point we should add tests that catches
  // this.

  const currentChild = current.child;
  if (!currentChild) {
    return;
  }
  workInProgress.child = cloneFiber(
    currentChild,
    currentChild.pendingWorkPriority
  );
  cloneSiblings(currentChild, workInProgress.child, workInProgress);
}

exports.findNextUnitOfWorkAtPriority = function(workRoot : Fiber, priorityLevel : PriorityLevel) : ?Fiber {
  let workInProgress = workRoot;
  while (workInProgress) {
    if (workInProgress.pendingWorkPriority !== NoWork &&
        workInProgress.pendingWorkPriority <= priorityLevel) {
      // This node has work to do that fits our priority level criteria.
      if (workInProgress.pendingProps !== null) {
        return workInProgress;
      }

      // If we have a child let's see if any of our children has work to do.
      // Only bother doing this at all if the current priority level matches
      // because it is the highest priority for the whole subtree.
      // TODO: Coroutines can have work in their stateNode which is another
      // type of child that needs to be searched for work.
      if (workInProgress.childInProgress) {
        let child = workInProgress.childInProgress;
        while (child) {
          child.return = workInProgress;
          child = child.sibling;
        }
        child = workInProgress.childInProgress;
        while (child) {
          // Don't bother drilling further down this tree if there is no child
          // with more content.
          // TODO: Shouldn't this still drill down even though the first
          // shallow level doesn't have anything pending on it.
          if (child.pendingWorkPriority !== NoWork &&
              child.pendingWorkPriority <= priorityLevel &&
              child.pendingProps !== null) {
            return child;
          }
          child = child.sibling;
        }
      } else if (workInProgress.child) {
        cloneChildrenIfNeeded(workInProgress);
        workInProgress = workInProgress.child;
        continue;
      }
      // If we match the priority but has no child and no work to do,
      // then we can safely reset the flag.
      workInProgress.pendingWorkPriority = NoWork;
    }
    if (workInProgress === workRoot) {
      if (workInProgress.pendingWorkPriority <= priorityLevel) {
        // If this subtree had work left to do, we would have returned it by
        // now. This could happen if a child with pending work gets cleaned up
        // but we don't clear the flag then. It is safe to reset it now.
        workInProgress.pendingWorkPriority = NoWork;
      }
      return null;
    }
    while (!workInProgress.sibling) {
      workInProgress = workInProgress.return;
      if (!workInProgress || workInProgress === workRoot) {
        return null;
      }
      if (workInProgress.pendingWorkPriority <= priorityLevel) {
        // If this subtree had work left to do, we would have returned it by
        // now. This could happen if a child with pending work gets cleaned up
        // but we don't clear the flag then. It is safe to reset it now.
        workInProgress.pendingWorkPriority = NoWork;
      }
    }
    workInProgress.sibling.return = workInProgress.return;
    workInProgress = workInProgress.sibling;
  }
  return null;
};
