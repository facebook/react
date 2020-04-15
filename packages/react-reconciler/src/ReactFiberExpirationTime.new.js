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
// Continuous Hydration is slightly higher than Idle and is used to increase
// priority of hover targets.
export const ContinuousHydration = 3;
export const LongTransition = 49999;
export const ShortTransition = 99999;
export const DefaultUpdateTime = 1073741296;
export const UserBlockingUpdateTime = 1073741761;
export const Sync = MAX_SIGNED_31_BIT_INT;
export const Batched = Sync - 1;

// Accounts for -1 trick to bump updates into a different batch
const ADJUSTMENT_OFFSET = 5;

export function inferPriorityFromExpirationTime(
  expirationTime: ExpirationTime,
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
