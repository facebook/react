/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {StackCursor} from './ReactFiberStack';

import warning from 'fbjs/lib/warning';
import ReactFiberStack from './ReactFiberStack';

const hasNativePerformanceNow =
  typeof performance === 'object' && typeof performance.now === 'function';

let now;
if (hasNativePerformanceNow) {
  now = function() {
    return performance.now();
  };
} else {
  now = function() {
    return Date.now();
  };
}

/**
 * The "actual" render time is total time required to render the descendants of a ProfileRoot component.
 * This time is stored as a stack, since ProfileRoots can be nested.
 * This time is started during the "begin" phase and stopped during the "complete" phase.
 * It is paused (and accumulated) in the event of an interruption or an aborted render.
 */

const {checkThatStackIsEmpty, createCursor, push, pop} = ReactFiberStack();

let stackCursor: StackCursor<Fiber> = createCursor(null);
let timerPausedAt: number = 0;
let totalElapsedPauseTime: number = 0;

export function checkActualRenderTimeStackEmpty(): void {
  if (__DEV__) {
    checkThatStackIsEmpty();
  }
}

export function markActualRenderTimeStarted(fiber: Fiber): void {
  fiber.stateNode.startTime = now() - totalElapsedPauseTime;

  push(stackCursor, fiber.stateNode, fiber);
}

export function recordElapsedActualRenderTime(fiber: Fiber): void {
  pop(stackCursor, fiber);

  fiber.stateNode.duration +=
    now() - fiber.stateNode.startTime - totalElapsedPauseTime;
}

export function resumeActualRenderTimerIfPaused(): void {
  if (timerPausedAt > 0) {
    totalElapsedPauseTime += now() - timerPausedAt;
    timerPausedAt = 0;
  }
}

export function pauseActualRenderTimerIfRunning(): void {
  if (timerPausedAt === 0) {
    timerPausedAt = now();
  }
}

/**
 * The "base" render time is the duration of the “begin” phase of work for a particular fiber.
 * This time is measured and stored on each fiber.
 * The time for all sibling fibers are accumulated and stored on their parent during the "complete" phase.
 * If a fiber bails out (sCU false) then its "base" timer is cancelled and the fiber is not updated.
 */

let baseStartTime: number | null = null;

export function getElapsedBaseRenderTime(): number {
  if (__DEV__) {
    if (baseStartTime === null) {
      warning(
        false,
        'Cannot read elapsed time when base timer is not running. ' +
          'This error is likely caused by a bug in React. ' +
          'Please file an issue.',
      );
    }
  }

  return baseStartTime === null ? 0 : now() - baseStartTime;
}

export function isBaseRenderTimerRunning(): boolean {
  return baseStartTime !== null;
}

export function startBaseRenderTimer(): void {
  if (__DEV__) {
    if (baseStartTime !== null) {
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

export function stopBaseRenderTimer(): void {
  if (__DEV__) {
    if (baseStartTime === null) {
      warning(
        false,
        'Cannot stop a base timer is not running. ' +
          'This error is likely caused by a bug in React. ' +
          'Please file an issue.',
      );
    }
  }

  baseStartTime = null;
}
