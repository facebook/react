/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

import type {Lane} from './ReactFiberLane';
import {isTransitionLane, isBlockingLane, isSyncLane} from './ReactFiberLane';

import {resolveEventType, resolveEventTimeStamp} from './ReactFiberConfig';

import {
  enableProfilerCommitHooks,
  enableProfilerNestedUpdatePhase,
  enableProfilerTimer,
  enableComponentPerformanceTrack,
} from 'shared/ReactFeatureFlags';

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
import * as Scheduler from 'scheduler';

const {unstable_now: now} = Scheduler;

export let renderStartTime: number = -0;
export let commitStartTime: number = -0;
export let commitEndTime: number = -0;
export let profilerStartTime: number = -1.1;
export let profilerEffectDuration: number = -0;
export let componentEffectDuration: number = -0;
export let componentEffectStartTime: number = -1.1;
export let componentEffectEndTime: number = -1.1;

export let blockingUpdateTime: number = -1.1; // First sync setState scheduled.
export let blockingEventTime: number = -1.1; // Event timeStamp of the first setState.
export let blockingEventType: null | string = null; // Event type of the first setState.
// TODO: This should really be one per Transition lane.
export let transitionStartTime: number = -1.1; // First startTransition call before setState.
export let transitionUpdateTime: number = -1.1; // First transition setState scheduled.
export let transitionEventTime: number = -1.1; // Event timeStamp of the first transition.
export let transitionEventType: null | string = null; // Event type of the first transition.

export function startUpdateTimerByLane(lane: Lane): void {
  if (!enableProfilerTimer || !enableComponentPerformanceTrack) {
    return;
  }
  if (isSyncLane(lane) || isBlockingLane(lane)) {
    if (blockingUpdateTime < 0) {
      blockingUpdateTime = now();
      blockingEventTime = resolveEventTimeStamp();
      blockingEventType = resolveEventType();
    }
  } else if (isTransitionLane(lane)) {
    if (transitionUpdateTime < 0) {
      transitionUpdateTime = now();
      if (transitionStartTime < 0) {
        transitionEventTime = resolveEventTimeStamp();
        transitionEventType = resolveEventType();
      }
    }
  }
}

export function clearBlockingTimers(): void {
  blockingUpdateTime = -1.1;
}

export function startAsyncTransitionTimer(): void {
  if (!enableProfilerTimer || !enableComponentPerformanceTrack) {
    return;
  }
  if (transitionStartTime < 0 && transitionUpdateTime < 0) {
    transitionStartTime = now();
    transitionEventTime = resolveEventTimeStamp();
    transitionEventType = resolveEventType();
  }
}

export function hasScheduledTransitionWork(): boolean {
  // If we have setState on a transition or scheduled useActionState update.
  return transitionUpdateTime > -1;
}

// We use this marker to indicate that we have scheduled a render to be performed
// but it's not an explicit state update.
const ACTION_STATE_MARKER = -0.5;

export function startActionStateUpdate(): void {
  if (!enableProfilerTimer || !enableComponentPerformanceTrack) {
    return;
  }
  if (transitionUpdateTime < 0) {
    transitionUpdateTime = ACTION_STATE_MARKER;
  }
}

export function clearAsyncTransitionTimer(): void {
  transitionStartTime = -1.1;
}

export function clearTransitionTimers(): void {
  transitionStartTime = -1.1;
  transitionUpdateTime = -1.1;
}

export function clampBlockingTimers(finalTime: number): void {
  if (!enableProfilerTimer || !enableComponentPerformanceTrack) {
    return;
  }
  // If we had new updates come in while we were still rendering or committing, we don't want
  // those update times to create overlapping tracks in the performance timeline so we clamp
  // them to the end of the commit phase.
  if (blockingUpdateTime >= 0 && blockingUpdateTime < finalTime) {
    blockingUpdateTime = finalTime;
  }
  if (blockingEventTime >= 0 && blockingEventTime < finalTime) {
    blockingEventTime = finalTime;
  }
}

export function clampTransitionTimers(finalTime: number): void {
  if (!enableProfilerTimer || !enableComponentPerformanceTrack) {
    return;
  }
  // If we had new updates come in while we were still rendering or committing, we don't want
  // those update times to create overlapping tracks in the performance timeline so we clamp
  // them to the end of the commit phase.
  if (transitionStartTime >= 0 && transitionStartTime < finalTime) {
    transitionStartTime = finalTime;
  }
  if (transitionUpdateTime >= 0 && transitionUpdateTime < finalTime) {
    transitionUpdateTime = finalTime;
  }
  if (transitionEventTime >= 0 && transitionEventTime < finalTime) {
    transitionEventTime = finalTime;
  }
}

export function pushNestedEffectDurations(): number {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return 0;
  }
  const prevEffectDuration = profilerEffectDuration;
  profilerEffectDuration = 0; // Reset counter.
  return prevEffectDuration;
}

export function popNestedEffectDurations(prevEffectDuration: number): number {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return 0;
  }
  const elapsedTime = profilerEffectDuration;
  profilerEffectDuration = prevEffectDuration;
  return elapsedTime;
}

// Like pop but it also adds the current elapsed time to the parent scope.
export function bubbleNestedEffectDurations(
  prevEffectDuration: number,
): number {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return 0;
  }
  const elapsedTime = profilerEffectDuration;
  profilerEffectDuration += prevEffectDuration;
  return elapsedTime;
}

export function resetComponentEffectTimers(): void {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return;
  }
  componentEffectStartTime = -1.1;
  componentEffectEndTime = -1.1;
}

export function pushComponentEffectStart(): number {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return 0;
  }
  const prevEffectStart = componentEffectStartTime;
  componentEffectStartTime = -1.1; // Track the next start.
  componentEffectDuration = -0; // Reset component level duration.
  return prevEffectStart;
}

export function popComponentEffectStart(prevEffectStart: number): void {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return;
  }
  // If the parent component didn't have a start time, we let this current time persist.
  if (prevEffectStart >= 0) {
    // Otherwise, we restore the previous parent's start time.
    componentEffectStartTime = prevEffectStart;
  }
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

export function isCurrentUpdateNested(): boolean {
  return currentUpdateIsNested;
}

export function markNestedUpdateScheduled(): void {
  if (enableProfilerNestedUpdatePhase) {
    nestedUpdateScheduled = true;
  }
}

export function resetNestedUpdateFlag(): void {
  if (enableProfilerNestedUpdatePhase) {
    currentUpdateIsNested = false;
    nestedUpdateScheduled = false;
  }
}

export function syncNestedUpdateFlag(): void {
  if (enableProfilerNestedUpdatePhase) {
    currentUpdateIsNested = nestedUpdateScheduled;
    nestedUpdateScheduled = false;
  }
}

export function recordRenderTime(): void {
  if (!enableProfilerTimer || !enableComponentPerformanceTrack) {
    return;
  }
  renderStartTime = now();
}

export function recordCommitTime(): void {
  if (!enableProfilerTimer) {
    return;
  }
  commitStartTime = now();
}

export function recordCommitEndTime(): void {
  if (!enableProfilerTimer) {
    return;
  }
  commitEndTime = now();
}

export function startProfilerTimer(fiber: Fiber): void {
  if (!enableProfilerTimer) {
    return;
  }

  profilerStartTime = now();

  if (((fiber.actualStartTime: any): number) < 0) {
    fiber.actualStartTime = profilerStartTime;
  }
}

export function stopProfilerTimerIfRunning(fiber: Fiber): void {
  if (!enableProfilerTimer) {
    return;
  }
  profilerStartTime = -1;
}

export function stopProfilerTimerIfRunningAndRecordDuration(
  fiber: Fiber,
): void {
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

export function stopProfilerTimerIfRunningAndRecordIncompleteDuration(
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

export function recordEffectDuration(fiber: Fiber): void {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return;
  }

  if (profilerStartTime >= 0) {
    const endTime = now();
    const elapsedTime = endTime - profilerStartTime;

    profilerStartTime = -1;

    // Store duration on the next nearest Profiler ancestor
    // Or the root (for the DevTools Profiler to read)
    profilerEffectDuration += elapsedTime;
    componentEffectDuration += elapsedTime;

    // Keep track of the last end time of the effects.
    componentEffectEndTime = endTime;
  }
}

export function startEffectTimer(): void {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return;
  }
  profilerStartTime = now();
  if (componentEffectStartTime < 0) {
    // Keep track of the first time we start an effect as the component's effect start time.
    componentEffectStartTime = profilerStartTime;
  }
}

export function transferActualDuration(fiber: Fiber): void {
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
