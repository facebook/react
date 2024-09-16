/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

import {
  enableProfilerCommitHooks,
  enableProfilerNestedUpdatePhase,
  enableProfilerTimer,
} from 'shared/ReactFeatureFlags';

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
import * as Scheduler from 'scheduler';

const {unstable_now: now} = Scheduler;

export type ProfilerTimer = {
  getCommitTime(): number,
  isCurrentUpdateNested(): boolean,
  markNestedUpdateScheduled(): void,
  recordCommitTime(): void,
  startProfilerTimer(fiber: Fiber): void,
  stopProfilerTimerIfRunning(fiber: Fiber): void,
  stopProfilerTimerIfRunningAndRecordDuration(fiber: Fiber): void,
  stopProfilerTimerIfRunningAndRecordIncompleteDuration(fiber: Fiber): void,
  syncNestedUpdateFlag(): void,
  ...
};

let completeTime: number = -0;
let commitTime: number = -0;
let profilerStartTime: number = -1.1;
let profilerEffectDuration: number = -0;

function pushNestedEffectDurations(): number {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return 0;
  }
  const prevEffectDuration = profilerEffectDuration;
  profilerEffectDuration = 0; // Reset counter.
  return prevEffectDuration;
}

function popNestedEffectDurations(prevEffectDuration: number): number {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return 0;
  }
  const elapsedTime = profilerEffectDuration;
  profilerEffectDuration = prevEffectDuration;
  return elapsedTime;
}

// Like pop but it also adds the current elapsed time to the parent scope.
function bubbleNestedEffectDurations(prevEffectDuration: number): number {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return 0;
  }
  const elapsedTime = profilerEffectDuration;
  profilerEffectDuration += prevEffectDuration;
  return elapsedTime;
}

/**
 * Tracks whether the current update was a nested/cascading update (scheduled from a layout effect).
 *
 * The overall sequence is:
 *   1. render
 *   2. commit (and call `onRender`, `onCommit`)
 *   3. check for nested updates
 *   4. flush passive effects (and call `onPostCommit`)
 *
 * Nested updates are identified in step 3 above,
 * but step 4 still applies to the work that was just committed.
 * We use two flags to track nested updates then:
 * one tracks whether the upcoming update is a nested update,
 * and the other tracks whether the current update was a nested update.
 * The first value gets synced to the second at the start of the render phase.
 */
let currentUpdateIsNested: boolean = false;
let nestedUpdateScheduled: boolean = false;

function isCurrentUpdateNested(): boolean {
  return currentUpdateIsNested;
}

function markNestedUpdateScheduled(): void {
  if (enableProfilerNestedUpdatePhase) {
    nestedUpdateScheduled = true;
  }
}

function resetNestedUpdateFlag(): void {
  if (enableProfilerNestedUpdatePhase) {
    currentUpdateIsNested = false;
    nestedUpdateScheduled = false;
  }
}

function syncNestedUpdateFlag(): void {
  if (enableProfilerNestedUpdatePhase) {
    currentUpdateIsNested = nestedUpdateScheduled;
    nestedUpdateScheduled = false;
  }
}

function getCompleteTime(): number {
  return completeTime;
}

function recordCompleteTime(): void {
  if (!enableProfilerTimer) {
    return;
  }
  completeTime = now();
}

function getCommitTime(): number {
  return commitTime;
}

function recordCommitTime(): void {
  if (!enableProfilerTimer) {
    return;
  }
  commitTime = now();
}

function startProfilerTimer(fiber: Fiber): void {
  if (!enableProfilerTimer) {
    return;
  }

  profilerStartTime = now();

  if (((fiber.actualStartTime: any): number) < 0) {
    fiber.actualStartTime = profilerStartTime;
  }
}

function stopProfilerTimerIfRunning(fiber: Fiber): void {
  if (!enableProfilerTimer) {
    return;
  }
  profilerStartTime = -1;
}

function stopProfilerTimerIfRunningAndRecordDuration(fiber: Fiber): void {
  if (!enableProfilerTimer) {
    return;
  }

  if (profilerStartTime >= 0) {
    const elapsedTime = now() - profilerStartTime;
    fiber.actualDuration += elapsedTime;
    fiber.selfBaseDuration = elapsedTime;
    profilerStartTime = -1;
  }
}

function stopProfilerTimerIfRunningAndRecordIncompleteDuration(
  fiber: Fiber,
): void {
  if (!enableProfilerTimer) {
    return;
  }

  if (profilerStartTime >= 0) {
    const elapsedTime = now() - profilerStartTime;
    fiber.actualDuration += elapsedTime;
    // We don't update the selfBaseDuration here because we errored.
    profilerStartTime = -1;
  }
}

function recordEffectDuration(fiber: Fiber): void {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return;
  }

  if (profilerStartTime >= 0) {
    const elapsedTime = now() - profilerStartTime;

    profilerStartTime = -1;

    // Store duration on the next nearest Profiler ancestor
    // Or the root (for the DevTools Profiler to read)
    profilerEffectDuration += elapsedTime;
  }
}

function startEffectTimer(): void {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return;
  }
  profilerStartTime = now();
}

function transferActualDuration(fiber: Fiber): void {
  // Transfer time spent rendering these children so we don't lose it
  // after we rerender. This is used as a helper in special cases
  // where we should count the work of multiple passes.
  let child = fiber.child;
  while (child) {
    // $FlowFixMe[unsafe-addition] addition with possible null/undefined value
    fiber.actualDuration += child.actualDuration;
    child = child.sibling;
  }
}

export {
  getCompleteTime,
  recordCompleteTime,
  getCommitTime,
  recordCommitTime,
  isCurrentUpdateNested,
  markNestedUpdateScheduled,
  recordEffectDuration,
  resetNestedUpdateFlag,
  startEffectTimer,
  startProfilerTimer,
  stopProfilerTimerIfRunning,
  stopProfilerTimerIfRunningAndRecordDuration,
  stopProfilerTimerIfRunningAndRecordIncompleteDuration,
  syncNestedUpdateFlag,
  transferActualDuration,
  pushNestedEffectDurations,
  popNestedEffectDurations,
  bubbleNestedEffectDurations,
};
