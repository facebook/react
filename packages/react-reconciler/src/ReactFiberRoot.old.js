/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FiberRoot, SuspenseHydrationCallbacks} from './ReactInternalTypes';
import type {ExpirationTime} from './ReactFiberExpirationTime.old';
import type {RootTag} from './ReactRootTags';

import {noTimeout} from './ReactFiberHostConfig';
import {createHostRootFiber} from './ReactFiber.old';
import {NoWork} from './ReactFiberExpirationTime.old';
import {
  enableSchedulerTracing,
  enableSuspenseCallback,
} from 'shared/ReactFeatureFlags';
import {unstable_getThreadID} from 'scheduler/tracing';
import {NoPriority} from './SchedulerWithReactIntegration.old';
import {initializeUpdateQueue} from './ReactUpdateQueue.old';
import {clearPendingUpdates as clearPendingMutableSourceUpdates} from './ReactMutableSource.old';

function FiberRootNode(containerInfo, tag, hydrate) {
  this.tag = tag;
  this.current = null;
  this.containerInfo = containerInfo;
  this.pendingChildren = null;
  this.pingCache = null;
  this.finishedExpirationTime = NoWork;
  this.finishedWork = null;
  this.timeoutHandle = noTimeout;
  this.context = null;
  this.pendingContext = null;
  this.hydrate = hydrate;
  this.callbackNode = null;
  this.callbackPriority_old = NoPriority;
  this.firstPendingTime = NoWork;
  this.lastPendingTime = NoWork;
  this.firstSuspendedTime = NoWork;
  this.lastSuspendedTime = NoWork;
  this.nextKnownPendingLevel = NoWork;
  this.lastPingedTime = NoWork;
  this.lastExpiredTime = NoWork;
  this.mutableSourceLastPendingUpdateTime = NoWork;

  if (enableSchedulerTracing) {
    this.interactionThreadID = unstable_getThreadID();
    this.memoizedInteractions = new Set();
    this.pendingInteractionMap_old = new Map();
  }
  if (enableSuspenseCallback) {
    this.hydrationCallbacks = null;
  }
}

export function createFiberRoot(
  containerInfo: any,
  tag: RootTag,
  hydrate: boolean,
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
): FiberRoot {
  const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any);
  if (enableSuspenseCallback) {
    root.hydrationCallbacks = hydrationCallbacks;
  }

  // Cyclic construction. This cheats the type system right now because
  // stateNode is any.
  const uninitializedFiber = createHostRootFiber(tag);
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  initializeUpdateQueue(uninitializedFiber);

  return root;
}

export function isRootSuspendedAtTime(
  root: FiberRoot,
  expirationTime: ExpirationTime,
): boolean {
  const firstSuspendedTime = root.firstSuspendedTime;
  const lastSuspendedTime = root.lastSuspendedTime;
  return (
    firstSuspendedTime !== NoWork &&
    firstSuspendedTime >= expirationTime &&
    lastSuspendedTime <= expirationTime
  );
}

export function markRootSuspendedAtTime(
  root: FiberRoot,
  expirationTime: ExpirationTime,
): void {
  const firstSuspendedTime = root.firstSuspendedTime;
  const lastSuspendedTime = root.lastSuspendedTime;
  if (firstSuspendedTime < expirationTime) {
    root.firstSuspendedTime = expirationTime;
  }
  if (lastSuspendedTime > expirationTime || firstSuspendedTime === NoWork) {
    root.lastSuspendedTime = expirationTime;
  }

  if (expirationTime <= root.lastPingedTime) {
    root.lastPingedTime = NoWork;
  }

  if (expirationTime <= root.lastExpiredTime) {
    root.lastExpiredTime = NoWork;
  }
}

export function markRootUpdatedAtTime(
  root: FiberRoot,
  expirationTime: ExpirationTime,
): void {
  // Update the range of pending times
  const firstPendingTime = root.firstPendingTime;
  if (expirationTime > firstPendingTime) {
    root.firstPendingTime = expirationTime;
  }
  const lastPendingTime = root.lastPendingTime;
  if (lastPendingTime === NoWork || expirationTime < lastPendingTime) {
    root.lastPendingTime = expirationTime;
  }

  // Update the range of suspended times. Treat everything lower priority or
  // equal to this update as unsuspended.
  const firstSuspendedTime = root.firstSuspendedTime;
  if (firstSuspendedTime !== NoWork) {
    if (expirationTime >= firstSuspendedTime) {
      // The entire suspended range is now unsuspended.
      root.firstSuspendedTime = root.lastSuspendedTime = root.nextKnownPendingLevel = NoWork;
    } else if (expirationTime >= root.lastSuspendedTime) {
      root.lastSuspendedTime = expirationTime + 1;
    }

    // This is a pending level. Check if it's higher priority than the next
    // known pending level.
    if (expirationTime > root.nextKnownPendingLevel) {
      root.nextKnownPendingLevel = expirationTime;
    }
  }
}

export function markRootFinishedAtTime(
  root: FiberRoot,
  finishedExpirationTime: ExpirationTime,
  remainingExpirationTime: ExpirationTime,
): void {
  // Update the range of pending times
  root.firstPendingTime = remainingExpirationTime;
  if (remainingExpirationTime < root.lastPendingTime) {
    // This usually means we've finished all the work, but it can also happen
    // when something gets downprioritized during render, like a hidden tree.
    root.lastPendingTime = remainingExpirationTime;
  }

  // Update the range of suspended times. Treat everything higher priority or
  // equal to this update as unsuspended.
  if (finishedExpirationTime <= root.lastSuspendedTime) {
    // The entire suspended range is now unsuspended.
    root.firstSuspendedTime = root.lastSuspendedTime = root.nextKnownPendingLevel = NoWork;
  } else if (finishedExpirationTime <= root.firstSuspendedTime) {
    // Part of the suspended range is now unsuspended. Narrow the range to
    // include everything between the unsuspended time (non-inclusive) and the
    // last suspended time.
    root.firstSuspendedTime = finishedExpirationTime - 1;
  }

  if (finishedExpirationTime <= root.lastPingedTime) {
    // Clear the pinged time
    root.lastPingedTime = NoWork;
  }

  if (finishedExpirationTime <= root.lastExpiredTime) {
    // Clear the expired time
    root.lastExpiredTime = NoWork;
  }

  // Clear any pending updates that were just processed.
  clearPendingMutableSourceUpdates(root, finishedExpirationTime);
}

export function markRootExpiredAtTime(
  root: FiberRoot,
  expirationTime: ExpirationTime,
): void {
  const lastExpiredTime = root.lastExpiredTime;
  if (lastExpiredTime === NoWork || lastExpiredTime > expirationTime) {
    root.lastExpiredTime = expirationTime;
  }
}
