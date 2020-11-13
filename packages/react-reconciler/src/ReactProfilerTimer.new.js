/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
import {Profiler} from './ReactWorkTags';

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
  stopProfilerTimerIfRunningAndRecordDelta(fiber: Fiber): void,
  syncNestedUpdateFlag(): void,
  ...
};

let commitTime: number = 0;
let layoutEffectStartTime: number = -1;
let profilerStartTime: number = -1;
let passiveEffectStartTime: number = -1;

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
    fiber.actualStartTime = now();
  }
}

function stopProfilerTimerIfRunning(fiber: Fiber): void {
  if (!enableProfilerTimer) {
    return;
  }
  profilerStartTime = -1;
}

function stopProfilerTimerIfRunningAndRecordDelta(
  fiber: Fiber,
  overrideBaseTime: boolean,
): void {
  if (!enableProfilerTimer) {
    return;
  }

  if (profilerStartTime >= 0) {
    const elapsedTime = now() - profilerStartTime;
    fiber.actualDuration += elapsedTime;
    if (overrideBaseTime) {
      fiber.selfBaseDuration = elapsedTime;
    }
    profilerStartTime = -1;
  }
}

function recordLayoutEffectDuration(fiber: Fiber): void {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return;
  }

  if (layoutEffectStartTime >= 0) {
    const elapsedTime = now() - layoutEffectStartTime;

    layoutEffectStartTime = -1;

    // Store duration on the next nearest Profiler ancestor.
    let parentFiber = fiber.return;
    while (parentFiber !== null) {
      if (parentFiber.tag === Profiler) {
        const parentStateNode = parentFiber.stateNode;
        parentStateNode.effectDuration += elapsedTime;
        break;
      }
      parentFiber = parentFiber.return;
    }
  }
}

function recordPassiveEffectDuration(fiber: Fiber): void {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return;
  }

  if (passiveEffectStartTime >= 0) {
    const elapsedTime = now() - passiveEffectStartTime;

    passiveEffectStartTime = -1;

    // Store duration on the next nearest Profiler ancestor.
    let parentFiber = fiber.return;
    while (parentFiber !== null) {
      if (parentFiber.tag === Profiler) {
        const parentStateNode = parentFiber.stateNode;
        if (parentStateNode !== null) {
          // Detached fibers have their state node cleared out.
          // In this case, the return pointer is also cleared out,
          // so we won't be able to report the time spent in this Profiler's subtree.
          parentStateNode.passiveEffectDuration += elapsedTime;
        }
        break;
      }
      parentFiber = parentFiber.return;
    }
  }
}

function startLayoutEffectTimer(): void {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return;
  }
  layoutEffectStartTime = now();
}

function startPassiveEffectTimer(): void {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return;
  }
  passiveEffectStartTime = now();
}

function transferActualDuration(fiber: Fiber): void {
  // Transfer time spent rendering these children so we don't lose it
  // after we rerender. This is used as a helper in special cases
  // where we should count the work of multiple passes.
  let child = fiber.child;
  while (child) {
    fiber.actualDuration += child.actualDuration;
    child = child.sibling;
  }
}

export {
  getCommitTime,
  isCurrentUpdateNested,
  markNestedUpdateScheduled,
  recordCommitTime,
  recordLayoutEffectDuration,
  recordPassiveEffectDuration,
  resetNestedUpdateFlag,
  startLayoutEffectTimer,
  startPassiveEffectTimer,
  startProfilerTimer,
  stopProfilerTimerIfRunning,
  stopProfilerTimerIfRunningAndRecordDelta,
  syncNestedUpdateFlag,
  transferActualDuration,
};
