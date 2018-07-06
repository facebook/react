/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';

import getComponentName from 'shared/getComponentName';
import {enableProfilerTimer} from 'shared/ReactFeatureFlags';

import warning from 'shared/warning';
import {now} from './ReactFiberHostConfig';

export type ProfilerTimer = {
  checkActualRenderTimeStackEmpty(): void,
  getCommitTime(): number,
  markActualRenderTimeStarted(fiber: Fiber): void,
  pauseActualRenderTimerIfRunning(): void,
  recordElapsedActualRenderTime(fiber: Fiber): void,
  resumeActualRenderTimerIfPaused(isProcessingBatchCommit: boolean): void,
  recordCommitTime(): void,
  recordElapsedBaseRenderTimeIfRunning(fiber: Fiber): void,
  resetActualRenderTimerStackAfterFatalErrorInDev(): void,
  startBaseRenderTimer(): void,
  stopBaseRenderTimerIfRunning(): void,
};

let commitTime: number = 0;

function getCommitTime(): number {
  return commitTime;
}

function recordCommitTime(): void {
  if (!enableProfilerTimer) {
    return;
  }
  commitTime = now();
}

/**
 * The "actual" render time is total time required to render the descendants of a Profiler component.
 * This time is stored as a stack, since Profilers can be nested.
 * This time is started during the "begin" phase and stopped during the "complete" phase.
 * It is paused (and accumulated) in the event of an interruption or an aborted render.
 */

let fiberStack: Array<Fiber | null>;

if (__DEV__) {
  fiberStack = [];
}

let syncCommitStartTime: number = 0;
let timerPausedAt: number = 0;
let totalElapsedPauseTime: number = 0;

function checkActualRenderTimeStackEmpty(): void {
  if (!enableProfilerTimer) {
    return;
  }
  if (__DEV__) {
    warning(
      fiberStack.length === 0,
      'Expected an empty stack. Something was not reset properly.',
    );
  }
}

function markActualRenderTimeStarted(fiber: Fiber): void {
  if (!enableProfilerTimer) {
    return;
  }
  if (__DEV__) {
    fiberStack.push(fiber);
  }

  fiber.actualDuration =
    now() - ((fiber.actualDuration: any): number) - totalElapsedPauseTime;
  fiber.actualStartTime = now();
}

function pauseActualRenderTimerIfRunning(): void {
  if (!enableProfilerTimer) {
    return;
  }
  if (timerPausedAt === 0) {
    timerPausedAt = now();
  }
  if (syncCommitStartTime > 0) {
    // Don't count the time spent processing sycn work,
    // Against yielded async work that will be resumed later.
    totalElapsedPauseTime += now() - syncCommitStartTime;
    syncCommitStartTime = 0;
  } else {
    totalElapsedPauseTime = 0;
  }
}

function recordElapsedActualRenderTime(fiber: Fiber): void {
  if (!enableProfilerTimer) {
    return;
  }
  if (__DEV__) {
    warning(
      fiber === fiberStack.pop(),
      'Unexpected Fiber (%s) popped.',
      getComponentName(fiber),
    );
  }

  fiber.actualDuration =
    now() - totalElapsedPauseTime - ((fiber.actualDuration: any): number);
}

function resumeActualRenderTimerIfPaused(isProcessingSyncWork: boolean): void {
  if (!enableProfilerTimer) {
    return;
  }
  if (isProcessingSyncWork && syncCommitStartTime === 0) {
    syncCommitStartTime = now();
  }
  if (timerPausedAt > 0) {
    totalElapsedPauseTime += now() - timerPausedAt;
    timerPausedAt = 0;
  }
}

function resetActualRenderTimerStackAfterFatalErrorInDev(): void {
  if (!enableProfilerTimer) {
    return;
  }
  if (__DEV__) {
    fiberStack.length = 0;
  }
}

/**
 * The "base" render time is the duration of the “begin” phase of work for a particular fiber.
 * This time is measured and stored on each fiber.
 * The time for all sibling fibers are accumulated and stored on their parent during the "complete" phase.
 * If a fiber bails out (sCU false) then its "base" timer is cancelled and the fiber is not updated.
 */

let baseStartTime: number = -1;

function recordElapsedBaseRenderTimeIfRunning(fiber: Fiber): void {
  if (!enableProfilerTimer) {
    return;
  }
  if (baseStartTime !== -1) {
    fiber.selfBaseDuration = now() - baseStartTime;
  }
}

function startBaseRenderTimer(): void {
  if (!enableProfilerTimer) {
    return;
  }
  if (__DEV__) {
    if (baseStartTime !== -1) {
      warning(
        false,
        'Cannot start base timer that is already running. ' +
          'This error is likely caused by a bug in React. ' +
          'Please file an issue.',
      );
    }
  }
  baseStartTime = now();
}

function stopBaseRenderTimerIfRunning(): void {
  if (!enableProfilerTimer) {
    return;
  }
  baseStartTime = -1;
}

export {
  checkActualRenderTimeStackEmpty,
  getCommitTime,
  markActualRenderTimeStarted,
  pauseActualRenderTimerIfRunning,
  recordCommitTime,
  recordElapsedActualRenderTime,
  resetActualRenderTimerStackAfterFatalErrorInDev,
  resumeActualRenderTimerIfPaused,
  recordElapsedBaseRenderTimeIfRunning,
  startBaseRenderTimer,
  stopBaseRenderTimerIfRunning,
};
