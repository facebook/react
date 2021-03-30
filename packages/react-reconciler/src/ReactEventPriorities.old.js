/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Lanes} from './ReactFiberLane.old';

import ReactSharedInternals from 'shared/ReactSharedInternals';

import {
  SyncLane,
  InputContinuousLane,
  DefaultLane,
  IdleLane,
  getHighestPriorityLane,
  includesNonIdleWork,
} from './ReactFiberLane.old';

const {ReactCurrentBatchConfig} = ReactSharedInternals;

export opaque type EventPriority = number;

export const DiscreteEventPriority: EventPriority = SyncLane;
export const ContinuousEventPriority: EventPriority = InputContinuousLane;
export const DefaultEventPriority: EventPriority = DefaultLane;
export const IdleEventPriority: EventPriority = IdleLane;

// This should stay in sync with the isomorphic package (ReactStartTransition).
// Intentionally not using a shared module, because this crosses a package
// boundary: importing from a shared module would give a false sense of
// DRYness, because it's theoretically possible for for the renderer and
// the isomorphic package to be out of sync. We don't fully support that, but we
// should try (within reason) to be resilient.
//
// The value is an arbitrary transition lane. I picked a lane in the middle of
// the bitmask because it's unlikely to change meaning.
export const TransitionEventPriority = 0b0000000000000001000000000000000;

export function getCurrentUpdatePriority(): EventPriority {
  return ReactCurrentBatchConfig.transition;
}

export function setCurrentUpdatePriority(newPriority: EventPriority) {
  ReactCurrentBatchConfig.transition = newPriority;
}

export function runWithPriority<T>(priority: EventPriority, fn: () => T): T {
  const previousPriority = ReactCurrentBatchConfig.transition;
  try {
    ReactCurrentBatchConfig.transition = priority;
    return fn();
  } finally {
    ReactCurrentBatchConfig.transition = previousPriority;
  }
}

export function higherEventPriority(
  a: EventPriority,
  b: EventPriority,
): EventPriority {
  return a !== 0 && a < b ? a : b;
}

export function isHigherEventPriority(
  a: EventPriority,
  b: EventPriority,
): boolean {
  return a !== 0 && a < b;
}

export function lanesToEventPriority(lanes: Lanes): EventPriority {
  const lane = getHighestPriorityLane(lanes);
  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority;
  }
  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority;
  }
  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority;
  }
  return IdleEventPriority;
}
