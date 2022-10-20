/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Lane, Lanes} from './ReactFiberLane.old';

import {
  NoLane,
  SyncLane,
  InputContinuousLane,
  IdleLane,
  getHighestPriorityLane,
  includesNonIdleWork,
  DefaultLane,
} from './ReactFiberLane.old';
import {enableUnifiedSyncLane} from '../../shared/ReactFeatureFlags';

// TODO: Ideally this would be opaque but that doesn't work well with
// our reconciler fork infra, since these leak into non-reconciler packages.
export type EventPriority = number;

export const NoEventPriority: EventPriority = NoLane;
export const DiscreteEventPriority: EventPriority = SyncLane;
export const ContinuousEventPriority: EventPriority = SyncLane | (2 << 1);
export const DefaultEventPriority: EventPriority = SyncLane | (1 << 1);
export const IdleEventPriority: EventPriority = IdleLane;

let currentUpdatePriority: EventPriority = NoEventPriority;

export function getCurrentUpdatePriority(): EventPriority {
  return currentUpdatePriority;
}

export function setCurrentUpdatePriority(newPriority: EventPriority) {
  currentUpdatePriority = newPriority;
}

export function runWithPriority<T>(priority: EventPriority, fn: () => T): T {
  const previousPriority = currentUpdatePriority;
  try {
    currentUpdatePriority = priority;
    return fn();
  } finally {
    currentUpdatePriority = previousPriority;
  }
}

export function higherEventPriority(
  a: EventPriority,
  b: EventPriority,
): EventPriority {
  return a !== 0 && a < b ? a : b;
}

export function lowerEventPriority(
  a: EventPriority,
  b: EventPriority,
): EventPriority {
  return a === 0 || a > b ? a : b;
}

export function isHigherEventPriority(
  a: EventPriority,
  b: EventPriority,
): boolean {
  return a !== 0 && a < b;
}

export function lanesToEventPriority(
  lanes: Lanes,
  syncUpdatePriority: EventPriority,
): EventPriority {
  const lane = getHighestPriorityLane(lanes);
  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return enableUnifiedSyncLane ? syncUpdatePriority : DiscreteEventPriority;
  }
  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority;
  }
  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority;
  }
  return IdleEventPriority;
}

export function laneToEventPriority(
  lane: Lane,
  syncUpdatePriority: EventPriority,
): EventPriority {
  if (enableUnifiedSyncLane && lane === SyncLane) {
    return syncUpdatePriority;
  }
  if (!enableUnifiedSyncLane && lane === DefaultLane) {
    return DefaultEventPriority;
  }
  if (lane === InputContinuousLane) {
    return ContinuousEventPriority;
  }
  return (lane: any);
}
