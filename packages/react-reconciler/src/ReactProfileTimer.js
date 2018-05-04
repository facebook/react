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

  push(stackCursor, fiber, fiber);
}

export function isActualRenderTimerPaused(): boolean {
  return timerPausedAt > 0;
}

export function recordActualRenderTime(fiber: Fiber): void {
  pop(stackCursor, fiber);

  // Stop render timer and store the elapsed time as stateNode.
  // The "commit" phase reads this value and passes it along to the callback.
  fiber.stateNode.duration =
    now() - fiber.stateNode.startTime - totalElapsedPauseTime;
}

export function resumeActualRenderTimer(): void {
  if (timerPausedAt > 0) {
    totalElapsedPauseTime += now() - timerPausedAt;
    timerPausedAt = 0;
  }
}

export function pauseActualRenderTimer(): void {
  timerPausedAt = now();
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

/* TODO For testing use only
export function debugPrintStack(workInProgress: Fiber): void {
  let current = workInProgress;
  while (current.return !== null) {
    current = current.return;
  }
  let string = '';

  const recurse = (fiber: Fiber, depth: number) => {
    let prefix = '    ';
    for (let i = 0; i <= depth; i++) {
      prefix += '  ';
    }
    string += '\n' + prefix + require('shared/getComponentName').default(fiber) +
      ' {selfBaseTime: ' + fiber.selfBaseTime + ', treeBaseTime: ' + fiber.treeBaseTime + '}';
    let innerCurrent = fiber.child;
    while (innerCurrent !== null) {
      recurse(innerCurrent, depth + 1);
      innerCurrent = innerCurrent.sibling;
    }
  };

  recurse(current, 0);
  console.log('    debugPrintStack()' + string);
}
*/
