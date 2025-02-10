/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

import type {SuspendedReason} from './ReactFiberWorkLoop';

import type {Lane, Lanes} from './ReactFiberLane';

import type {CapturedValue} from './ReactCapturedValue';

import {
  isTransitionLane,
  isBlockingLane,
  isSyncLane,
  includesTransitionLane,
  includesBlockingLane,
  includesSyncLane,
} from './ReactFiberLane';

import {resolveEventType, resolveEventTimeStamp} from './ReactFiberConfig';

import {
  enableProfilerCommitHooks,
  enableProfilerNestedUpdatePhase,
  enableProfilerTimer,
  enableComponentPerformanceTrack,
} from 'shared/ReactFeatureFlags';

import {isAlreadyRendering} from './ReactFiberWorkLoop';

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
import * as Scheduler from 'scheduler';

const {unstable_now: now} = Scheduler;

export let renderStartTime: number = -0;
export let commitStartTime: number = -0;
export let commitEndTime: number = -0;
export let commitErrors: null | Array<CapturedValue<mixed>> = null;
export let profilerStartTime: number = -1.1;
export let profilerEffectDuration: number = -0;
export let componentEffectDuration: number = -0;
export let componentEffectStartTime: number = -1.1;
export let componentEffectEndTime: number = -1.1;
export let componentEffectErrors: null | Array<CapturedValue<mixed>> = null;

export let blockingClampTime: number = -0;
export let blockingUpdateTime: number = -1.1; // First sync setState scheduled.
export let blockingEventTime: number = -1.1; // Event timeStamp of the first setState.
export let blockingEventType: null | string = null; // Event type of the first setState.
export let blockingEventIsRepeat: boolean = false;
export let blockingSpawnedUpdate: boolean = false;
export let blockingSuspendedTime: number = -1.1;
// TODO: This should really be one per Transition lane.
export let transitionClampTime: number = -0;
export let transitionStartTime: number = -1.1; // First startTransition call before setState.
export let transitionUpdateTime: number = -1.1; // First transition setState scheduled.
export let transitionEventTime: number = -1.1; // Event timeStamp of the first transition.
export let transitionEventType: null | string = null; // Event type of the first transition.
export let transitionEventIsRepeat: boolean = false;
export let transitionSuspendedTime: number = -1.1;

export let yieldReason: SuspendedReason = (0: any);
export let yieldStartTime: number = -1.1; // The time when we yielded to the event loop

export function startYieldTimer(reason: SuspendedReason) {
  if (!enableProfilerTimer || !enableComponentPerformanceTrack) {
    return;
  }
  yieldStartTime = now();
  yieldReason = reason;
}

export function startUpdateTimerByLane(lane: Lane): void {
  if (!enableProfilerTimer || !enableComponentPerformanceTrack) {
    return;
  }
  if (isSyncLane(lane) || isBlockingLane(lane)) {
    if (blockingUpdateTime < 0) {
      blockingUpdateTime = now();
      if (isAlreadyRendering()) {
        blockingSpawnedUpdate = true;
      }
      const newEventTime = resolveEventTimeStamp();
      const newEventType = resolveEventType();
      if (
        newEventTime !== blockingEventTime ||
        newEventType !== blockingEventType
      ) {
        blockingEventIsRepeat = false;
      } else if (newEventType !== null) {
        // If this is a second update in the same event, we treat it as a spawned update.
        // This might be a microtask spawned from useEffect, multiple flushSync or
        // a setState in a microtask spawned after the first setState. Regardless it's bad.
        blockingSpawnedUpdate = true;
      }
      blockingEventTime = newEventTime;
      blockingEventType = newEventType;
    }
  } else if (isTransitionLane(lane)) {
    if (transitionUpdateTime < 0) {
      transitionUpdateTime = now();
      if (transitionStartTime < 0) {
        const newEventTime = resolveEventTimeStamp();
        const newEventType = resolveEventType();
        if (
          newEventTime !== transitionEventTime ||
          newEventType !== transitionEventType
        ) {
          transitionEventIsRepeat = false;
        }
        transitionEventTime = newEventTime;
        transitionEventType = newEventType;
      }
    }
  }
}

export function startPingTimerByLanes(lanes: Lanes): void {
  if (!enableProfilerTimer || !enableComponentPerformanceTrack) {
    return;
  }
  // Mark the update time and clamp anything before it because we don't want
  // to show the event time for pings but we also don't want to clear it
  // because we still need to track if this was a repeat.
  if (includesSyncLane(lanes) || includesBlockingLane(lanes)) {
    if (blockingUpdateTime < 0) {
      blockingClampTime = blockingUpdateTime = now();
    }
  } else if (includesTransitionLane(lanes)) {
    if (transitionUpdateTime < 0) {
      transitionClampTime = transitionUpdateTime = now();
    }
  }
}

export function trackSuspendedTime(lanes: Lanes, renderEndTime: number) {
  if (!enableProfilerTimer || !enableComponentPerformanceTrack) {
    return;
  }
  if (includesSyncLane(lanes) || includesBlockingLane(lanes)) {
    blockingSuspendedTime = renderEndTime;
  } else if (includesTransitionLane(lanes)) {
    transitionSuspendedTime = renderEndTime;
  }
}

export function clearBlockingTimers(): void {
  blockingUpdateTime = -1.1;
  blockingSuspendedTime = -1.1;
  blockingEventIsRepeat = true;
  blockingSpawnedUpdate = false;
}

export function startAsyncTransitionTimer(): void {
  if (!enableProfilerTimer || !enableComponentPerformanceTrack) {
    return;
  }
  if (transitionStartTime < 0 && transitionUpdateTime < 0) {
    transitionStartTime = now();
    const newEventTime = resolveEventTimeStamp();
    const newEventType = resolveEventType();
    if (
      newEventTime !== transitionEventTime ||
      newEventType !== transitionEventType
    ) {
      transitionEventIsRepeat = false;
    }
    transitionEventTime = newEventTime;
    transitionEventType = newEventType;
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
  transitionSuspendedTime = -1.1;
  transitionEventIsRepeat = true;
}

export function clampBlockingTimers(finalTime: number): void {
  if (!enableProfilerTimer || !enableComponentPerformanceTrack) {
    return;
  }
  // If we had new updates come in while we were still rendering or committing, we don't want
  // those update times to create overlapping tracks in the performance timeline so we clamp
  // them to the end of the commit phase.
  blockingClampTime = finalTime;
}

export function clampTransitionTimers(finalTime: number): void {
  if (!enableProfilerTimer || !enableComponentPerformanceTrack) {
    return;
  }
  // If we had new updates come in while we were still rendering or committing, we don't want
  // those update times to create overlapping tracks in the performance timeline so we clamp
  // them to the end of the commit phase.
  transitionClampTime = finalTime;
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

export function pushComponentEffectErrors(): null | Array<
  CapturedValue<mixed>,
> {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return null;
  }
  const prevErrors = componentEffectErrors;
  componentEffectErrors = null;
  return prevErrors;
}

export function popComponentEffectErrors(
  prevErrors: null | Array<CapturedValue<mixed>>,
): void {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return;
  }
  componentEffectErrors = prevErrors;
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

export function recordEffectError(errorInfo: CapturedValue<mixed>): void {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return;
  }
  if (componentEffectErrors === null) {
    componentEffectErrors = [];
  }
  componentEffectErrors.push(errorInfo);
  if (commitErrors === null) {
    commitErrors = [];
  }
  commitErrors.push(errorInfo);
}

export function resetCommitErrors(): void {
  commitErrors = null;
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
