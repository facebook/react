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

export function stopRenderTimer(fiber: Fiber): number {
  const startTime = renderTimeStackCursor.current;
  pop(renderTimeStackCursor, fiber);
  const stopTime = now();
  return stopTime - startTime;
}

// TODO (bvaughn) Support pausing and resuming the timer
