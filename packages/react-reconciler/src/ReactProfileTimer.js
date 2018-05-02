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

const {createCursor, push, pop} = ReactFiberStack();

let renderTimeStackCursor: StackCursor<number> = createCursor(0);

export function startRenderTimer(fiber: Fiber): void {
  push(renderTimeStackCursor, now(), fiber);
}

export function stopRenderTimer(fiber: Fiber): number | null {
  const maybeStartTime = renderTimeStackCursor.current;

  pop(renderTimeStackCursor, fiber);

  if (maybeStartTime === null) {
    return null;
  } else {
    return now() - maybeStartTime;
  }
}

/**
 * The "base" render time is the duration of the “begin” phase of work for a particular fiber.
 * This time is measured and stored on each fiber.
 * The time for all sibling fibers are accumulated and stored on their parent during the "complete" phase.
 * If a fiber bails out (sCU false) then its "base" timer is cancelled and the fiber is not updated.
 */

let baseStartTime: number | null = null;

export function cancelBaseTimer(): void {
  baseStartTime = null;
}

export function isBaseTimerRunning(): boolean {
  return baseStartTime !== null;
}

export function startBaseTimer(): void {
  baseStartTime = now();
}

export function stopBaseTimer(): number | null {
  return baseStartTime === null ? null : now() - baseStartTime;
}
