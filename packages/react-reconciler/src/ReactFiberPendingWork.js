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

import {enableSuspense} from 'shared/ReactFeatureFlags';

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
  next: PendingWork | null,
};

function insertPendingWorkAtPosition(root, work, insertAfter, insertBefore) {
  if (enableSuspense) {
    work.next = insertBefore;
    if (insertAfter === null) {
      root.firstPendingWork = work;
    } else {
      insertAfter.next = work;
    }
  }
}

export function addPendingWork(
  root: FiberRoot,
  startTime: ExpirationTime,
  expirationTime: ExpirationTime,
): void {
  if (enableSuspense) {
    let match = null;
    let insertAfter = null;
    let insertBefore = root.firstPendingWork;
    while (insertBefore !== null) {
      if (insertBefore.expirationTime >= expirationTime) {
        // Retry anything with an equal or lower expiration time, since it may
        // be unblocked by the new work.
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
        next: null,
      };
      insertPendingWorkAtPosition(root, work, insertAfter, insertBefore);
    }
  }
}

export function flushPendingWork(
  root: FiberRoot,
  currentTime: ExpirationTime,
  remainingExpirationTime: ExpirationTime,
) {
  if (enableSuspense) {
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
        addPendingWork(root, currentTime, remainingExpirationTime);
      }
    } else if (
      remainingExpirationTime !== NoWork &&
      firstUnflushedWork.expirationTime > remainingExpirationTime
    ) {
      // There was an update during the render phase that wasn't flushed.
      addPendingWork(root, currentTime, remainingExpirationTime);
    }
  }
}

export function suspendPendingWork(
  root: FiberRoot,
  expirationTime: ExpirationTime,
): void {
  if (enableSuspense) {
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
}

export function resumePendingWork(
  root: FiberRoot,
  expirationTime: ExpirationTime,
): void {
  if (enableSuspense) {
    // Called when a promise resolves. This "pings" React to retry the previously
    // suspended render.
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
}

export function findNextExpirationTimeToWorkOn(
  root: FiberRoot,
): ExpirationTime {
  if (enableSuspense) {
    // Return the earliest time that either isn't suspended or has been pinged.
    let lastSuspendedTime = NoWork;
    let lastRetryTime = NoWork;
    let work = root.firstPendingWork;
    while (work !== null) {
      if (!work.isSuspended) {
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
    return NoWork;
  } else {
    return root.current.expirationTime;
  }
}

export function findStartTime(root: FiberRoot, expirationTime: ExpirationTime) {
  if (enableSuspense) {
    let match = root.firstPendingWork;
    while (match !== null) {
      if (match.expirationTime === expirationTime) {
        return match.startTime;
      }
      match = match.next;
    }
    return NoWork;
  } else {
    return NoWork;
  }
}
