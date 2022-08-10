/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Wakeable} from 'shared/ReactTypes';

let suspendedWakeable: Wakeable | null = null;
let wasPinged = false;
let adHocSuspendCount: number = 0;

const MAX_AD_HOC_SUSPEND_COUNT = 50;

export function suspendedWakeableWasPinged() {
  return wasPinged;
}

export function trackSuspendedWakeable(wakeable: Wakeable) {
  adHocSuspendCount++;
  suspendedWakeable = wakeable;
}

export function attemptToPingSuspendedWakeable(wakeable: Wakeable) {
  if (wakeable === suspendedWakeable) {
    // This ping is from the wakeable that just suspended. Mark it as pinged.
    // When the work loop resumes, we'll immediately try rendering the fiber
    // again instead of unwinding the stack.
    wasPinged = true;
    return true;
  }
  return false;
}

export function resetWakeableState() {
  suspendedWakeable = null;
  wasPinged = false;
  adHocSuspendCount = 0;
}

export function throwIfInfinitePingLoopDetected() {
  if (adHocSuspendCount > MAX_AD_HOC_SUSPEND_COUNT) {
    // TODO: Guard against an infinite loop by throwing an error if the same
    // component suspends too many times in a row. This should be thrown from
    // the render phase so that it gets the component stack.
  }
}
