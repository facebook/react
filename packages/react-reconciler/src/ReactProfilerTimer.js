/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';

import {enableProfilerTimer} from 'shared/ReactFeatureFlags';

import warning from 'fbjs/lib/warning';

/**
 * The "actual" render time is total time required to render the descendants of a Profiler component.
 * This time is stored as a stack, since Profilers can be nested.
 * This time is started during the "begin" phase and stopped during the "complete" phase.
 * It is paused (and accumulated) in the event of an interruption or an aborted render.
 */

export type ProfilerTimer = {
  checkActualRenderTimeStackEmpty(): void,
  markActualRenderTimeStarted(fiber: Fiber): void,
  pauseActualRenderTimerIfRunning(): void,
  recordElapsedActualRenderTime(fiber: Fiber): void,
  resetActualRenderTimer(): void,
  resumeActualRenderTimerIfPaused(): void,
  recordElapsedBaseRenderTimeIfRunning(fiber: Fiber): void,
  startBaseRenderTimer(): void,
  stopBaseRenderTimerIfRunning(): void,
};

export function createProfilerTimer(now: () => number): ProfilerTimer {
  let fiberStack: Array<Fiber | null>;

  if (__DEV__) {
    fiberStack = [];
  }

  let timerPausedAt: number = 0;
  let totalElapsedPauseTime: number = 0;

  function checkActualRenderTimeStackEmpty(): void {
    if (__DEV__) {
      warning(
        fiberStack.length === 0,
        'Expected an empty stack. Something was not reset properly.',
      );
    }
  }

  function markActualRenderTimeStarted(fiber: Fiber): void {
    if (__DEV__) {
      fiberStack.push(fiber);
    }
    fiber.stateNode.startTime = now() - totalElapsedPauseTime;
  }

  function pauseActualRenderTimerIfRunning(): void {
    if (timerPausedAt === 0) {
      timerPausedAt = now();
    }
  }

  function recordElapsedActualRenderTime(fiber: Fiber): void {
    if (__DEV__) {
      warning(fiber === fiberStack.pop(), 'Unexpected Fiber popped.');
    }
    fiber.stateNode.duration +=
      now() - totalElapsedPauseTime - fiber.stateNode.startTime;
  }

  function resetActualRenderTimer(): void {
    totalElapsedPauseTime = 0;
  }

  function resumeActualRenderTimerIfPaused(): void {
    if (timerPausedAt > 0) {
      totalElapsedPauseTime += now() - timerPausedAt;
      timerPausedAt = 0;
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
    if (baseStartTime !== -1) {
      fiber.selfBaseTime = now() - baseStartTime;
    }
  }

  function startBaseRenderTimer(): void {
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
    baseStartTime = -1;
  }

  if (enableProfilerTimer) {
    return {
      checkActualRenderTimeStackEmpty,
      markActualRenderTimeStarted,
      pauseActualRenderTimerIfRunning,
      recordElapsedActualRenderTime,
      resetActualRenderTimer,
      resumeActualRenderTimerIfPaused,
      recordElapsedBaseRenderTimeIfRunning,
      startBaseRenderTimer,
      stopBaseRenderTimerIfRunning,
    };
  } else {
    return {
      checkActualRenderTimeStackEmpty(): void {},
      markActualRenderTimeStarted(fiber: Fiber): void {},
      pauseActualRenderTimerIfRunning(): void {},
      recordElapsedActualRenderTime(fiber: Fiber): void {},
      resetActualRenderTimer(): void {},
      resumeActualRenderTimerIfPaused(): void {},
      recordElapsedBaseRenderTimeIfRunning(fiber: Fiber): void {},
      startBaseRenderTimer(): void {},
      stopBaseRenderTimerIfRunning(): void {},
    };
  }
}
