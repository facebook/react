/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactFiberGarbageCollection
 * @flow
 */

'use strict';

const {ClassComponent} = require('ReactTypeOfWork');
const {PreparedWork, NeedsCleanUp} = require('ReactTypeOfSideEffect');

function markForCleanUp(workInProgress: Fiber) {
  // Mark that this fiber prepared work that needs to be cleaned-up.
  workInProgress.effectTag |= PreparedWork;

  // Mark that the parents contain work that needs to be cleaned-up.
  let node = workInProgress;
  do {
    node.effectTag |= NeedsCleanUp;
    node = node.return;
  } while (node !== null && !(node.effectTag & NeedsCleanUp));
}
exports.markForCleanUp = markForCleanUp;

function dropTree(workInProgress: Fiber) {
  const rootOfDroppedTree = workInProgress;
  let previous = null;
  let next = rootOfDroppedTree;
  while (next !== null) {
    previous = next;
    next = beginCleanUp(previous);
    if (next === null) {
      next = completeCleanUp(rootOfDroppedTree, previous);
    }
  }
}
exports.dropTree = dropTree;

function beginCleanUp(workInProgress: Fiber): Fiber | null {
  if (!(workInProgress.effectTag & NeedsCleanUp)) {
    // This tree does not have any work to be cleaned up. Bail out.
    return null;
  }

  if (workInProgress.tag === ClassComponent) {
    const instance = workInProgress.stateNode;
    if (workInProgress.alternate === null) {
      if (typeof instance.unstable_abortMount === 'function') {
        instance.unstable_abortMount();
      }
    } else if (workInProgress.effectTag & PreparedWork) {
      if (typeof instance.unstable_abortUpdate === 'function') {
        instance.unstable_abortUpdate();
      }
    }
  }

  workInProgress.effectTag &= ~PreparedWork;

  // Continue on the child;
  const current = workInProgress.alternate;
  if (current !== null && current.child === workInProgress.child) {
    return null;
  }
  return workInProgress.child;
}

function completeCleanUp(
  rootOfDroppedTree: Fiber,
  workInProgress: Fiber,
): Fiber | null {
  let node = workInProgress;
  // Stop once we reach the root of the dropped tree
  while (node !== null && node !== rootOfDroppedTree) {
    if (node.sibling !== null) {
      // Clean-up the sibling next.
      return node.sibling;
    }
    // Finished this set of children. Go back to the parent.
    node = node.return;
  }
  return null;
}
