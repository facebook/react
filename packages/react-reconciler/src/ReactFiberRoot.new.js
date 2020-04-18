/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FiberRoot, SuspenseHydrationCallbacks} from './ReactInternalTypes';
import type {ExpirationTimeOpaque} from './ReactFiberExpirationTime.new';
import type {RootTag} from './ReactRootTags';

import {noTimeout} from './ReactFiberHostConfig';
import {createHostRootFiber} from './ReactFiber.new';
import {
  NoWork,
  isSameOrHigherPriority,
  isSameExpirationTime,
  bumpPriorityHigher,
  bumpPriorityLower,
} from './ReactFiberExpirationTime.new';
import {
  enableSchedulerTracing,
  enableSuspenseCallback,
} from 'shared/ReactFeatureFlags';
import {unstable_getThreadID} from 'scheduler/tracing';
import {initializeUpdateQueue} from './ReactUpdateQueue.new';
import {clearPendingUpdates as clearPendingMutableSourceUpdates} from './ReactMutableSource.new';

function FiberRootNode(containerInfo, tag, hydrate) {
  this.tag = tag;
  this.containerInfo = containerInfo;
  this.pendingChildren = null;
  this.current = null;
  this.pingCache = null;
  this.finishedWork = null;
  this.finishedExpirationTime_opaque = NoWork;
  this.timeoutHandle = noTimeout;
  this.context = null;
  this.pendingContext = null;
  this.hydrate = hydrate;
  this.callbackNode = null;
  this.callbackId = NoWork;
  this.callbackIsSync = false;
  this.expiresAt = -1;
  this.firstPendingTime_opaque = NoWork;
  this.lastPendingTime_opaque = NoWork;
  this.firstSuspendedTime_opaque = NoWork;
  this.lastSuspendedTime_opaque = NoWork;
  this.nextKnownPendingLevel_opaque = NoWork;
  this.lastPingedTime_opaque = NoWork;
  this.lastExpiredTime_opaque = NoWork;
  this.mutableSourceLastPendingUpdateTime_opaque = NoWork;

  if (enableSchedulerTracing) {
    this.interactionThreadID = unstable_getThreadID();
    this.memoizedInteractions = new Set();
    this.pendingInteractionMap_new = new Map();
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
  expirationTime: ExpirationTimeOpaque,
): boolean {
  const firstSuspendedTime = root.firstSuspendedTime_opaque;
  const lastSuspendedTime = root.lastSuspendedTime_opaque;
  return (
    !isSameExpirationTime(firstSuspendedTime, (NoWork: ExpirationTimeOpaque)) &&
    isSameOrHigherPriority(firstSuspendedTime, expirationTime) &&
    isSameOrHigherPriority(expirationTime, lastSuspendedTime)
  );
}

export function markRootSuspendedAtTime(
  root: FiberRoot,
  expirationTime: ExpirationTimeOpaque,
): void {
  const firstSuspendedTime = root.firstSuspendedTime_opaque;
  const lastSuspendedTime = root.lastSuspendedTime_opaque;
  if (!isSameOrHigherPriority(firstSuspendedTime, expirationTime)) {
    root.firstSuspendedTime_opaque = expirationTime;
  }
  if (
    !isSameOrHigherPriority(expirationTime, lastSuspendedTime) ||
    isSameExpirationTime(firstSuspendedTime, (NoWork: ExpirationTimeOpaque))
  ) {
    root.lastSuspendedTime_opaque = expirationTime;
  }

  if (isSameOrHigherPriority(root.lastPingedTime_opaque, expirationTime)) {
    root.lastPingedTime_opaque = NoWork;
  }

  if (isSameOrHigherPriority(root.lastExpiredTime_opaque, expirationTime)) {
    root.lastExpiredTime_opaque = NoWork;
  }
}

export function markRootUpdatedAtTime(
  root: FiberRoot,
  expirationTime: ExpirationTimeOpaque,
): void {
  // Update the range of pending times
  const firstPendingTime = root.firstPendingTime_opaque;
  if (!isSameOrHigherPriority(firstPendingTime, expirationTime)) {
    root.firstPendingTime_opaque = expirationTime;
  }
  const lastPendingTime = root.lastPendingTime_opaque;
  if (
    isSameExpirationTime(lastPendingTime, (NoWork: ExpirationTimeOpaque)) ||
    !isSameOrHigherPriority(expirationTime, lastPendingTime)
  ) {
    root.lastPendingTime_opaque = expirationTime;
  }

  // Update the range of suspended times. Treat everything lower priority or
  // equal to this update as unsuspended.
  const firstSuspendedTime = root.firstSuspendedTime_opaque;
  if (
    !isSameExpirationTime(firstSuspendedTime, (NoWork: ExpirationTimeOpaque))
  ) {
    if (isSameOrHigherPriority(expirationTime, firstSuspendedTime)) {
      // The entire suspended range is now unsuspended.
      root.firstSuspendedTime_opaque = root.lastSuspendedTime_opaque = root.nextKnownPendingLevel_opaque = NoWork;
    } else if (
      isSameOrHigherPriority(expirationTime, root.lastSuspendedTime_opaque)
    ) {
      root.lastSuspendedTime_opaque = bumpPriorityHigher(expirationTime);
    }

    // This is a pending level. Check if it's higher priority than the next
    // known pending level.
    if (
      !isSameOrHigherPriority(root.nextKnownPendingLevel_opaque, expirationTime)
    ) {
      root.nextKnownPendingLevel_opaque = expirationTime;
    }
  }
}

export function markRootFinishedAtTime(
  root: FiberRoot,
  finishedExpirationTime: ExpirationTimeOpaque,
  remainingExpirationTime: ExpirationTimeOpaque,
): void {
  // Update the range of pending times
  root.firstPendingTime_opaque = remainingExpirationTime;
  if (
    !isSameOrHigherPriority(
      remainingExpirationTime,
      root.lastPendingTime_opaque,
    )
  ) {
    // This usually means we've finished all the work, but it can also happen
    // when something gets downprioritized during render, like a hidden tree.
    root.lastPendingTime_opaque = remainingExpirationTime;
  }

  // Update the range of suspended times. Treat everything higher priority or
  // equal to this update as unsuspended.
  if (
    isSameOrHigherPriority(
      root.lastSuspendedTime_opaque,
      finishedExpirationTime,
    )
  ) {
    // The entire suspended range is now unsuspended.
    root.firstSuspendedTime_opaque = root.lastSuspendedTime_opaque = root.nextKnownPendingLevel_opaque = NoWork;
  } else if (
    isSameOrHigherPriority(
      root.firstSuspendedTime_opaque,
      finishedExpirationTime,
    )
  ) {
    // Part of the suspended range is now unsuspended. Narrow the range to
    // include everything between the unsuspended time (non-inclusive) and the
    // last suspended time.
    root.firstSuspendedTime_opaque = bumpPriorityLower(finishedExpirationTime);
  }

  if (
    isSameOrHigherPriority(root.lastPingedTime_opaque, finishedExpirationTime)
  ) {
    // Clear the pinged time
    root.lastPingedTime_opaque = NoWork;
  }

  if (
    isSameOrHigherPriority(root.lastExpiredTime_opaque, finishedExpirationTime)
  ) {
    // Clear the expired time
    root.lastExpiredTime_opaque = NoWork;
  }

  // Clear any pending updates that were just processed.
  clearPendingMutableSourceUpdates(root, finishedExpirationTime);
}

export function markRootExpiredAtTime(
  root: FiberRoot,
  expirationTime: ExpirationTimeOpaque,
): void {
  const lastExpiredTime = root.lastExpiredTime_opaque;
  if (
    isSameExpirationTime(lastExpiredTime, (NoWork: ExpirationTimeOpaque)) ||
    !isSameOrHigherPriority(expirationTime, lastExpiredTime)
  ) {
    root.lastExpiredTime_opaque = expirationTime;
  }
}
