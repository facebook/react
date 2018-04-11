/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FiberRoot} from './ReactFiberRoot';
import type {ExpirationTime} from './ReactFiberExpirationTime';

import {NoWork} from './ReactFiberExpirationTime';

// Because we don't have a global queue of updates, we use this module to keep
// track of the pending levels of work that have yet to be flushed. You can
// think of a PendingWork object as representing a batch of work that will
// all flush at the same time. The actual updates are spread throughout the
// update queues of all the fibers in the tree, but those updates have
// priorities that correspond to a PendingWork batch.

export type PendingWork = {
  // We use `expirationTime` to represent both a priority and a timeout. There's
  // no inherent reason why they need to be the same, and we may split them
  // in the future.
  startTime: ExpirationTime,
  expirationTime: ExpirationTime,
  isSuspended: boolean,
  shouldTryResuming: boolean,
  isRenderPhaseWork: boolean,
  next: PendingWork | null,
};

function insertPendingWorkAtPosition(root, work, insertAfter, insertBefore) {
  work.next = insertBefore;
  if (insertAfter === null) {
    root.firstPendingWork = work;
  } else {
    insertAfter.next = work;
  }
}

export function addPendingWork(
  root: FiberRoot,
  startTime: ExpirationTime,
  expirationTime: ExpirationTime,
): void {
  let match = null;
  let insertAfter = null;
  let insertBefore = root.firstPendingWork;
  while (insertBefore !== null) {
    if (insertBefore.expirationTime >= expirationTime) {
      // Retry anything with an equal or lower expiration time
      insertBefore.shouldTryResuming = true;
    }
    if (insertBefore.expirationTime === expirationTime) {
      // Found a matching bucket. But we'll keep iterating so we can set
      // `shouldTryResuming` as needed.
      match = insertBefore;
      // Update the start time. We always measure from the most recently
      // added update.
      match.startTime = startTime;
    }
    if (match === null && insertBefore.expirationTime > expirationTime) {
      // Found the insertion position
      break;
    }
    insertAfter = insertBefore;
    insertBefore = insertBefore.next;
  }
  if (match === null) {
    const work: PendingWork = {
      startTime,
      expirationTime,
      isSuspended: false,
      shouldTryResuming: false,
      isRenderPhaseWork: false,
      next: null,
    };
    insertPendingWorkAtPosition(root, work, insertAfter, insertBefore);
  }
}
export function addRenderPhasePendingWork(
  root: FiberRoot,
  startTime: ExpirationTime,
  expirationTime: ExpirationTime,
): void {
  // Render-phase updates are treated differently because, while they
  // could potentially unblock earlier pending work, we assume that they won't.
  // They are also coalesced differently (see findNextExpirationTimeToWorkOn).
  let insertAfter = null;
  let insertBefore = root.firstPendingWork;
  while (insertBefore !== null) {
    if (insertBefore.expirationTime === expirationTime) {
      // Found a matching bucket
      return;
    }
    if (insertBefore.expirationTime > expirationTime) {
      // Found the insertion position
      break;
    }
    insertAfter = insertBefore;
    insertBefore = insertBefore.next;
  }
  // No matching level found. Create a new one.
  const work: PendingWork = {
    startTime,
    expirationTime,
    isSuspended: false,
    shouldTryResuming: false,
    isRenderPhaseWork: true,
    next: null,
  };
  insertPendingWorkAtPosition(root, work, insertAfter, insertBefore);
}

export function flushPendingWork(
  root: FiberRoot,
  currentTime: ExpirationTime,
  remainingExpirationTime: ExpirationTime,
) {
  // Pop all work that has higher priority than the remaining priority.
  let firstUnflushedWork = root.firstPendingWork;
  while (firstUnflushedWork !== null) {
    if (
      remainingExpirationTime !== NoWork &&
      firstUnflushedWork.expirationTime >= remainingExpirationTime
    ) {
      break;
    }
    firstUnflushedWork = firstUnflushedWork.next;
  }
  root.firstPendingWork = firstUnflushedWork;

  if (firstUnflushedWork === null) {
    if (remainingExpirationTime !== NoWork) {
      // There was an update during the render phase that wasn't flushed.
      addRenderPhasePendingWork(root, currentTime, remainingExpirationTime);
    }
  } else if (
    remainingExpirationTime !== NoWork &&
    firstUnflushedWork.expirationTime > remainingExpirationTime
  ) {
    // There was an update during the render phase that wasn't flushed.
    addRenderPhasePendingWork(root, currentTime, remainingExpirationTime);
  }
}

export function suspendPendingWork(
  root: FiberRoot,
  expirationTime: ExpirationTime,
): void {
  let work = root.firstPendingWork;
  while (work !== null) {
    if (work.expirationTime === expirationTime) {
      work.isSuspended = true;
      work.shouldTryResuming = false;
      return;
    }
    if (work.expirationTime > expirationTime) {
      return;
    }
    work = work.next;
  }
}

export function resumePendingWork(
  root: FiberRoot,
  expirationTime: ExpirationTime,
): void {
  // Called when a promise resolves
  let work = root.firstPendingWork;
  while (work !== null) {
    if (work.expirationTime === expirationTime) {
      work.shouldTryResuming = true;
    }
    if (work.expirationTime > expirationTime) {
      return;
    }
    work = work.next;
  }
}

export function findNextExpirationTimeToWorkOn(
  root: FiberRoot,
): ExpirationTime {
  // If there's a non-suspended interactive expiration time, return the first
  // one. If everything is suspended, return the last retry time that's either
  //   a) a render phase update
  //   b) later or equal to the last suspended time
  let lastSuspendedTime = NoWork;
  let lastRenderPhaseTime = NoWork;
  let lastRetryTime = NoWork;
  let work = root.firstPendingWork;
  while (work !== null) {
    if (
      !work.isSuspended &&
      (!work.isRenderPhaseWork || lastSuspendedTime === NoWork)
    ) {
      return work.expirationTime;
    }
    if (
      lastSuspendedTime === NoWork ||
      lastSuspendedTime < work.expirationTime
    ) {
      lastSuspendedTime = work.expirationTime;
    }
    if (work.shouldTryResuming) {
      if (lastRetryTime === NoWork || lastRetryTime < work.expirationTime) {
        lastRetryTime = work.expirationTime;
      }
      if (
        work.isRenderPhaseWork &&
        (lastRenderPhaseTime === NoWork ||
          lastRenderPhaseTime < work.expirationTime)
      ) {
        lastRenderPhaseTime = work.expirationTime;
      }
    }
    work = work.next;
  }
  // This has the effect of coalescing all async updates that occur while we're
  // in a suspended state. This prevents us from rendering an intermediate state
  // that is no longer valid. An example is a tab switching interface: if
  // switching to a new tab is suspended, we should only switch to the last
  // tab that was clicked. If the user switches to tab A and then tab B, we
  // should continue suspending until B is ready.
  if (lastRetryTime >= lastSuspendedTime) {
    return lastRetryTime;
  }
  return lastRenderPhaseTime;
}

export function findStartTime(root: FiberRoot, expirationTime: ExpirationTime) {
  let match = root.firstPendingWork;
  while (match !== null) {
    if (match.expirationTime === expirationTime) {
      return match.startTime;
    }
    match = match.next;
  }
  return NoWork;
}
