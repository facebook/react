/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactPriorityLevel} from './SchedulerWithReactIntegration';

import MAX_SIGNED_31_BIT_INT from './maxSigned31BitInt';

import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  IdlePriority,
} from './SchedulerWithReactIntegration';

export type ExpirationTime = number;

export const NoWork = 0;
// TODO: Think of a better name for Never. The key difference with Idle is that
// Never work can be committed in an inconsistent state without tearing the UI.
// The main example is offscreen content, like a hidden subtree. So one possible
// name is Offscreen. However, it also includes dehydrated Suspense boundaries,
// which are inconsistent in the sense that they haven't finished yet, but
// aren't visibly inconsistent because the server rendered HTML matches what the
// hydrated tree would look like.
export const Never = 1;
// Idle is slightly higher priority than Never. It must completely finish in
// order to be consistent.
export const Idle = 2;
export const Sync = MAX_SIGNED_31_BIT_INT;
export const Batched = Sync - 1;

const UNIT_SIZE = 10;
const MAGIC_NUMBER_OFFSET = Batched - 1;

// 1 unit of expiration time represents 10ms.
export function msToExpirationTime(ms: number): ExpirationTime {
  // Always add an offset so that we don't clash with the magic number for NoWork.
  return MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0);
}

export function expirationTimeToMs(expirationTime: ExpirationTime): number {
  return (MAGIC_NUMBER_OFFSET - expirationTime) * UNIT_SIZE;
}

function ceiling(num: number, precision: number): number {
  return (((num / precision) | 0) + 1) * precision;
}

function computeExpirationBucket(
  currentTime,
  expirationInMs,
  bucketSizeMs,
): ExpirationTime {
  return (
    MAGIC_NUMBER_OFFSET -
    ceiling(
      MAGIC_NUMBER_OFFSET - currentTime + expirationInMs / UNIT_SIZE,
      bucketSizeMs / UNIT_SIZE,
    )
  );
}

// TODO: This corresponds to Scheduler's NormalPriority, not LowPriority. Update
// the names to reflect.
export const LOW_PRIORITY_EXPIRATION = 5000;
export const LOW_PRIORITY_BATCH_SIZE = 250;

export function computeAsyncExpiration(
  currentTime: ExpirationTime,
): ExpirationTime {
  return computeExpirationBucket(
    currentTime,
    LOW_PRIORITY_EXPIRATION,
    LOW_PRIORITY_BATCH_SIZE,
  );
}

export function computeSuspenseExpiration(
  currentTime: ExpirationTime,
  timeoutMs: number,
): ExpirationTime {
  // TODO: Should we warn if timeoutMs is lower than the normal pri expiration time?
  return computeExpirationBucket(
    currentTime,
    timeoutMs,
    LOW_PRIORITY_BATCH_SIZE,
  );
}

// We intentionally set a higher expiration time for interactive updates in
// dev than in production.
//
// If the main thread is being blocked so long that you hit the expiration,
// it's a problem that could be solved with better scheduling.
//
// People will be more likely to notice this and fix it with the long
// expiration time in development.
//
// In production we opt for better UX at the risk of masking scheduling
// problems, by expiring fast.
export const HIGH_PRIORITY_EXPIRATION = __DEV__ ? 500 : 150;
export const HIGH_PRIORITY_BATCH_SIZE = 100;

export function computeInteractiveExpiration(currentTime: ExpirationTime) {
  return computeExpirationBucket(
    currentTime,
    HIGH_PRIORITY_EXPIRATION,
    HIGH_PRIORITY_BATCH_SIZE,
  );
}

export function inferPriorityFromExpirationTime(
  currentTime: ExpirationTime,
  expirationTime: ExpirationTime,
): ReactPriorityLevel {
  if (expirationTime === Sync) {
    return ImmediatePriority;
  }
  if (expirationTime === Never || expirationTime === Idle) {
    return IdlePriority;
  }
  const msUntil =
    expirationTimeToMs(expirationTime) - expirationTimeToMs(currentTime);
  if (msUntil <= 0) {
    return ImmediatePriority;
  }
  if (msUntil <= HIGH_PRIORITY_EXPIRATION + HIGH_PRIORITY_BATCH_SIZE) {
    return UserBlockingPriority;
  }
  if (msUntil <= LOW_PRIORITY_EXPIRATION + LOW_PRIORITY_BATCH_SIZE) {
    return NormalPriority;
  }

  // TODO: Handle LowPriority

  // Assume anything lower has idle priority
  return IdlePriority;
}
