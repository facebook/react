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

import {NoWork, Sync} from './ReactFiberExpirationTime';

// TODO: Offscreen updates

export function markPendingPriorityLevel(
  root: FiberRoot,
  expirationTime: ExpirationTime,
): void {
  // If there's a gap between completing a failed root and retrying it,
  // additional updates may be scheduled. Clear `didError`, in case the update
  // is sufficient to fix the error.
  root.didError = false;

  // Update the latest and earliest pending times
  const earliestPendingTime = root.earliestPendingTime;
  if (earliestPendingTime === NoWork) {
    // No other pending updates.
    root.earliestPendingTime = root.latestPendingTime = expirationTime;
  } else {
    if (earliestPendingTime > expirationTime) {
      // This is the earliest pending update.
      root.earliestPendingTime = expirationTime;
    } else {
      const latestPendingTime = root.latestPendingTime;
      if (latestPendingTime < expirationTime) {
        // This is the latest pending update
        root.latestPendingTime = expirationTime;
      }
    }
  }
  findNextPendingPriorityLevel(root);
}

export function markCommittedPriorityLevels(
  root: FiberRoot,
  currentTime: ExpirationTime,
  earliestRemainingTime: ExpirationTime,
): void {
  root.didError = false;

  if (earliestRemainingTime === NoWork) {
    // Fast path. There's no remaining work. Clear everything.
    root.earliestPendingTime = NoWork;
    root.latestPendingTime = NoWork;
    root.earliestSuspendedTime = NoWork;
    root.latestSuspendedTime = NoWork;
    root.latestPingedTime = NoWork;
    findNextPendingPriorityLevel(root);
    return;
  }

  // Let's see if the previous latest known pending level was just flushed.
  const latestPendingTime = root.latestPendingTime;
  if (latestPendingTime !== NoWork) {
    if (latestPendingTime < earliestRemainingTime) {
      // We've flushed all the known pending levels.
      root.earliestPendingTime = root.latestPendingTime = NoWork;
    } else {
      const earliestPendingTime = root.earliestPendingTime;
      if (earliestPendingTime < earliestRemainingTime) {
        // We've flushed the earliest known pending level. Set this to the
        // latest pending time.
        root.earliestPendingTime = root.latestPendingTime;
      }
    }
  }

  // Now let's handle the earliest remaining level in the whole tree. We need to
  // decide whether to treat it as a pending level or as suspended. Check
  // it falls within the range of known suspended levels.

  const earliestSuspendedTime = root.earliestSuspendedTime;
  if (earliestSuspendedTime === NoWork) {
    // There's no suspended work. Treat the earliest remaining level as a
    // pending level.
    markPendingPriorityLevel(root, earliestRemainingTime);
    findNextPendingPriorityLevel(root);
    return;
  }

  const latestSuspendedTime = root.latestSuspendedTime;
  if (earliestRemainingTime > latestSuspendedTime) {
    // The earliest remaining level is later than all the suspended work. That
    // means we've flushed all the suspended work.
    root.earliestSuspendedTime = NoWork;
    root.latestSuspendedTime = NoWork;
    root.latestPingedTime = NoWork;

    // There's no suspended work. Treat the earliest remaining level as a
    // pending level.
    markPendingPriorityLevel(root, earliestRemainingTime);
    findNextPendingPriorityLevel(root);
    return;
  }

  if (earliestRemainingTime < earliestSuspendedTime) {
    // The earliest remaining time is earlier than all the suspended work.
    // Treat it as a pending update.
    markPendingPriorityLevel(root, earliestRemainingTime);
    findNextPendingPriorityLevel(root);
    return;
  }

  // The earliest remaining time falls within the range of known suspended
  // levels. We should treat this as suspended work.
  findNextPendingPriorityLevel(root);
}

export function hasLowerPriorityWork(
  root: FiberRoot,
  renderExpirationTime: ExpirationTime,
) {
  return (
    renderExpirationTime !== root.latestPendingTime &&
    renderExpirationTime !== root.latestSuspendedTime
  );
}

export function markSuspendedPriorityLevel(
  root: FiberRoot,
  suspendedTime: ExpirationTime,
  didError: boolean,
): void {
  if (didError && !hasLowerPriorityWork(root, suspendedTime)) {
    // TODO: When we add back resuming, we need to ensure the progressed work
    // is thrown out and not reused during the restarted render. One way to
    // invalidate the progressed work is to restart at expirationTime + 1.
    root.didError = true;
    findNextPendingPriorityLevel(root);
    return;
  }

  // First, check the known pending levels and update them if needed.
  const earliestPendingTime = root.earliestPendingTime;
  const latestPendingTime = root.latestPendingTime;
  if (earliestPendingTime === suspendedTime) {
    if (latestPendingTime === suspendedTime) {
      // Both known pending levels were suspended. Clear them.
      root.earliestPendingTime = root.latestPendingTime = NoWork;
    } else {
      // The earliest pending level was suspended. Clear by setting it to the
      // latest pending level.
      root.earliestPendingTime = latestPendingTime;
    }
  } else if (latestPendingTime === suspendedTime) {
    // The latest pending level was suspended. Clear by setting it to the
    // latest pending level.
    root.latestPendingTime = earliestPendingTime;
  }

  // Next, if we're working on the lowest known suspended level, clear the ping.
  // TODO: What if a promise suspends and pings before the root completes?
  const latestSuspendedTime = root.latestSuspendedTime;
  if (latestSuspendedTime === suspendedTime) {
    root.latestPingedTime = NoWork;
  }

  // Finally, update the known suspended levels.
  const earliestSuspendedTime = root.earliestSuspendedTime;
  if (earliestSuspendedTime === NoWork) {
    // No other suspended levels.
    root.earliestSuspendedTime = root.latestSuspendedTime = suspendedTime;
  } else {
    if (earliestSuspendedTime > suspendedTime) {
      // This is the earliest suspended level.
      root.earliestSuspendedTime = suspendedTime;
    } else if (latestSuspendedTime < suspendedTime) {
      // This is the latest suspended level
      root.latestSuspendedTime = suspendedTime;
    }
  }
  findNextPendingPriorityLevel(root);
}

export function markPingedPriorityLevel(
  root: FiberRoot,
  pingedTime: ExpirationTime,
): void {
  const latestSuspendedTime = root.latestSuspendedTime;
  if (latestSuspendedTime !== NoWork && latestSuspendedTime <= pingedTime) {
    const latestPingedTime = root.latestPingedTime;
    if (latestPingedTime === NoWork || latestPingedTime < pingedTime) {
      root.latestPingedTime = pingedTime;
    }
  }
  findNextPendingPriorityLevel(root);
}

function findNextPendingPriorityLevel(root) {
  const earliestSuspendedTime = root.earliestSuspendedTime;
  const earliestPendingTime = root.earliestPendingTime;
  let nextExpirationTimeToWorkOn;
  let expirationTime;
  if (earliestSuspendedTime === NoWork) {
    // Fast path. There's no suspended work.
    nextExpirationTimeToWorkOn = expirationTime = earliestPendingTime;
  } else if (earliestPendingTime !== NoWork) {
    // Check if there's known pending work.
    nextExpirationTimeToWorkOn = earliestPendingTime;
    expirationTime =
      earliestSuspendedTime < earliestPendingTime
        ? earliestSuspendedTime
        : earliestPendingTime;
  } else {
    // Finally, if a suspended level was pinged, work on that. Otherwise there's
    // nothing to work on.
    nextExpirationTimeToWorkOn = expirationTime = root.latestPingedTime;
  }

  if (root.didError) {
    // Revert to synchronous mode.
    expirationTime = Sync;
  }

  root.nextExpirationTimeToWorkOn = nextExpirationTimeToWorkOn;
  root.expirationTime = expirationTime;
}
