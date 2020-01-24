/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {ExpirationTime} from './ReactFiberExpirationTime';
import type {RootTag} from 'shared/ReactRootTags';
import type {TimeoutHandle, NoTimeout} from './ReactFiberHostConfig';
import type {Thenable} from './ReactFiberWorkLoop';
import type {Interaction} from 'scheduler/src/Tracing';
import type {SuspenseHydrationCallbacks} from './ReactFiberSuspenseComponent';
import type {ReactPriorityLevel} from './SchedulerWithReactIntegration';

import {noTimeout} from './ReactFiberHostConfig';
import {createHostRootFiber} from './ReactFiber';
import {NoWork, Idle} from './ReactFiberExpirationTime';
import {
  enableSchedulerTracing,
  enableSuspenseCallback,
  enableTrainModelFix,
} from 'shared/ReactFeatureFlags';
import {unstable_getThreadID} from 'scheduler/tracing';
import {NoPriority} from './SchedulerWithReactIntegration';
import {initializeUpdateQueue} from './ReactUpdateQueue';

export type PendingInteractionMap = Map<ExpirationTime, Set<Interaction>>;

type BaseFiberRootProperties = {|
  // The type of root (legacy, batched, concurrent, etc.)
  tag: RootTag,

  // Any additional information from the host associated with this root.
  containerInfo: any,
  // Used only by persistent updates.
  pendingChildren: any,
  // The currently active root fiber. This is the mutable root of the tree.
  current: Fiber,

  pingCache:
    | WeakMap<Thenable, Set<ExpirationTime>>
    | Map<Thenable, Set<ExpirationTime>>
    | null,

  finishedExpirationTime: ExpirationTime,
  // A finished work-in-progress HostRoot that's ready to be committed.
  finishedWork: Fiber | null,
  // Timeout handle returned by setTimeout. Used to cancel a pending timeout, if
  // it's superseded by a new one.
  timeoutHandle: TimeoutHandle | NoTimeout,
  // Top context object, used by renderSubtreeIntoContainer
  context: Object | null,
  pendingContext: Object | null,
  // Determines if we should attempt to hydrate on the initial mount
  +hydrate: boolean,
  // Node returned by Scheduler.scheduleCallback
  callbackNode: *,
  // Expiration of the callback associated with this root
  callbackExpirationTime: ExpirationTime,
  // Priority of the callback associated with this root
  callbackPriority: ReactPriorityLevel,
  // The earliest pending expiration time that exists in the tree
  firstPendingTime: ExpirationTime,
  // The earliest suspended expiration time that exists in the tree
  firstSuspendedTime: ExpirationTime,
  // The latest suspended expiration time that exists in the tree
  lastSuspendedTime: ExpirationTime,
  // The next known expiration time after the suspended range
  nextKnownPendingLevel: ExpirationTime,
  // Ranges of expiration times each of which must be committed as a single
  // batch. Any update that is part of a range must commit at the same time as
  // all of the other updates in that range. Ranges do not overlap.
  //
  // For ranges 1..n, structure is [start1, end1, start2, end2...startN, endN]
  pendingRanges: Array<ExpirationTime> | null,
  // The latest time at which a suspended component pinged the root to
  // render again
  lastPingedTime: ExpirationTime,
  lastExpiredTime: ExpirationTime,
|};

// The following attributes are only used by interaction tracing builds.
// They enable interactions to be associated with their async work,
// And expose interaction metadata to the React DevTools Profiler plugin.
// Note that these attributes are only defined when the enableSchedulerTracing flag is enabled.
type ProfilingOnlyFiberRootProperties = {|
  interactionThreadID: number,
  memoizedInteractions: Set<Interaction>,
  pendingInteractionMap: PendingInteractionMap,
|};

// The follow fields are only used by enableSuspenseCallback for hydration.
type SuspenseCallbackOnlyFiberRootProperties = {|
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
|};

// Exported FiberRoot type includes all properties,
// To avoid requiring potentially error-prone :any casts throughout the project.
// Profiling properties are only safe to access in profiling builds (when enableSchedulerTracing is true).
// The types are defined separately within this file to ensure they stay in sync.
// (We don't have to use an inline :any cast when enableSchedulerTracing is disabled.)
export type FiberRoot = {
  ...BaseFiberRootProperties,
  ...ProfilingOnlyFiberRootProperties,
  ...SuspenseCallbackOnlyFiberRootProperties,
  ...
};

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
  this.callbackPriority = NoPriority;
  this.firstPendingTime = NoWork;
  this.firstSuspendedTime = NoWork;
  this.lastSuspendedTime = NoWork;
  this.nextKnownPendingLevel = NoWork;
  this.pendingRanges = null;
  this.lastPingedTime = NoWork;
  this.lastExpiredTime = NoWork;

  if (enableSchedulerTracing) {
    this.interactionThreadID = unstable_getThreadID();
    this.memoizedInteractions = new Set();
    this.pendingInteractionMap = new Map();
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

export function getNextRootExpirationTimeToWorkOn(
  root: FiberRoot,
): ExpirationTime {
  // Determines the next expiration time that the root should render, taking
  // into account levels that may be suspended, or levels that may have
  // received a ping.
  const lastExpiredTime = resolveTransitionTime(root, root.lastExpiredTime);
  if (lastExpiredTime !== NoWork) {
    return lastExpiredTime;
  }

  // Check if the root is suspended. "Pending" refers to any update that hasn't
  // committed yet, including if it suspended. The "suspended" range is
  // therefore a subset.
  const firstPendingTime = resolveTransitionTime(root, root.firstPendingTime);
  const firstSuspendedTime = root.firstSuspendedTime;
  const lastSuspendedTime = root.lastSuspendedTime;
  if (
    !(
      firstSuspendedTime !== NoWork &&
      firstSuspendedTime >= firstPendingTime &&
      lastSuspendedTime <= firstPendingTime
    )
  ) {
    // The highest priority pending time is not suspended. Let's work on that.
    return firstPendingTime;
  }

  // If the first pending time is suspended, check if there's a lower priority
  // pending level that we know about. Or check if we received a ping. Work
  // on whichever is higher priority.
  const lastPingedTime = root.lastPingedTime;
  const nextKnownPendingLevel = root.nextKnownPendingLevel;
  const nextLevel = resolveTransitionTime(
    root,
    lastPingedTime > nextKnownPendingLevel
      ? lastPingedTime
      : nextKnownPendingLevel,
  );
  if (
    enableTrainModelFix &&
    nextLevel <= Idle &&
    firstPendingTime !== nextLevel
  ) {
    // Don't work on Idle/Never priority unless everything else is committed.
    return NoWork;
  }
  return nextLevel;
}

function resolveTransitionTime(root, expirationTime) {
  if (expirationTime === NoWork) {
    return NoWork;
  }
  const pendingRanges = root.pendingRanges;
  if (pendingRanges !== null) {
    // Check if the expiration time is part of a transition range. If so, resolve
    // it to the end of that range, since that will encompass all the times in the
    // entire range. A single pass is sufficient because the ranges do
    // not overlap.
    let resolvedTime = expirationTime;
    for (let i = 0; i < pendingRanges.length; i += 2) {
      const start = pendingRanges[i];
      const end = pendingRanges[i + 1];
      if (start >= resolvedTime) {
        if (resolvedTime > end) {
          resolvedTime = end;
        }
      }
    }
    return resolvedTime;
  }
  return expirationTime;
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

export function markRootPingedAtTime(
  root: FiberRoot,
  expirationTime: ExpirationTime,
): void {
  const lastPingedTime = root.lastPingedTime;
  if (enableTrainModelFix) {
    // Track the lowest priority ping that isn't at Idle priority. Unless
    // there are *only* Idle pings. Any non-Idle ping beats an Idle ping.
    if (expirationTime <= Idle) {
      // This is an Idle ping.
      if (
        lastPingedTime === NoWork ||
        (lastPingedTime <= Idle && lastPingedTime > expirationTime)
      ) {
        // There are only Idle pings.
        root.lastPingedTime = expirationTime;
      }
    } else {
      // This is a non-Idle ping.
      if (
        lastPingedTime === NoWork ||
        lastPingedTime > expirationTime ||
        lastPingedTime <= Idle
      ) {
        // This is the lowest priority non-Idle ping.
        root.lastPingedTime = expirationTime;
      }
    }
  } else {
    // Don't special case Idle pings.
    if (lastPingedTime === NoWork || lastPingedTime > expirationTime) {
      root.lastPingedTime = expirationTime;
    }
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

  // Clear pending transition ranges
  const pendingRanges = root.pendingRanges;
  if (pendingRanges !== null) {
    for (let i = 0; i < pendingRanges.length; ) {
      const end = pendingRanges[i + 1];
      if (finishedExpirationTime <= end) {
        // Remove this range from the set
        pendingRanges.splice(i, 2);
      } else {
        // Only increment if we didn't remove the range in the block above.
        i += 2;
      }
    }
  }
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
