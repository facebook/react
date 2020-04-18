/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactPriorityLevel} from './ReactInternalTypes';

import {MAX_SIGNED_31_BIT_INT} from './MaxInts';

import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  IdlePriority,
} from './SchedulerWithReactIntegration.new';

export opaque type ExpirationTimeOpaque = number;

export const NoWork: ExpirationTimeOpaque = 0;
// TODO: Think of a better name for Never. The key difference with Idle is that
// Never work can be committed in an inconsistent state without tearing the UI.
// The main example is offscreen content, like a hidden subtree. So one possible
// name is Offscreen. However, it also includes dehydrated Suspense boundaries,
// which are inconsistent in the sense that they haven't finished yet, but
// aren't visibly inconsistent because the server rendered HTML matches what the
// hydrated tree would look like.
export const Never: ExpirationTimeOpaque = 1;
// Idle is slightly higher priority than Never. It must completely finish in
// order to be consistent.
export const Idle: ExpirationTimeOpaque = 2;
// Continuous Hydration is slightly higher than Idle and is used to increase
// priority of hover targets.
export const ContinuousHydration: ExpirationTimeOpaque = 3;
export const LongTransition: ExpirationTimeOpaque = 49999;
export const ShortTransition: ExpirationTimeOpaque = 99999;
export const DefaultUpdateTime: ExpirationTimeOpaque = 1073741296;
export const UserBlockingUpdateTime: ExpirationTimeOpaque = 1073741761;
export const Sync: ExpirationTimeOpaque = MAX_SIGNED_31_BIT_INT;
export const Batched: ExpirationTimeOpaque = Sync - 1;

// Accounts for -1 trick to bump updates into a different batch
const ADJUSTMENT_OFFSET = 5;

export function inferPriorityFromExpirationTime(
  expirationTime: ExpirationTimeOpaque,
): ReactPriorityLevel {
  if (expirationTime >= Batched - ADJUSTMENT_OFFSET) {
    return ImmediatePriority;
  }
  if (expirationTime >= UserBlockingUpdateTime - ADJUSTMENT_OFFSET) {
    return UserBlockingPriority;
  }
  if (expirationTime >= LongTransition - ADJUSTMENT_OFFSET) {
    return NormalPriority;
  }

  // TODO: Handle LowPriority. Maybe should give it NormalPriority since Idle is
  // very agressively deprioritized.

  // Assume anything lower has idle priority
  return IdlePriority;
}

export function isSameOrHigherPriority(
  a: ExpirationTimeOpaque,
  b: ExpirationTimeOpaque,
) {
  return a >= b;
}

export function isSameExpirationTime(
  a: ExpirationTimeOpaque,
  b: ExpirationTimeOpaque,
) {
  return a === b;
}

export function bumpPriorityHigher(
  a: ExpirationTimeOpaque,
): ExpirationTimeOpaque {
  return a + 1;
}

export function bumpPriorityLower(
  a: ExpirationTimeOpaque,
): ExpirationTimeOpaque {
  return a - 1;
}
