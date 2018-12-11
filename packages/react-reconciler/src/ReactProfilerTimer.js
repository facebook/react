/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';

import {enableProfiling} from 'shared/ReactFeatureFlags';

import {now} from './ReactFiberHostConfig';

export type ProfilerTimer = {
  getCommitTime(): number,
  recordCommitTime(): void,
  startProfilerTimer(fiber: Fiber): void,
  stopProfilerTimerIfRunning(fiber: Fiber): void,
  stopProfilerTimerIfRunningAndRecordDelta(fiber: Fiber): void,
};

let commitTime: number = 0;
let profilerStartTime: number = -1;

function getCommitTime(): number {
  return commitTime;
}

function recordCommitTime(): void {
  if (!enableProfiling) {
    return;
  }
  commitTime = now();
}

function startProfilerTimer(fiber: Fiber): void {
  if (!enableProfiling) {
    return;
  }

  profilerStartTime = now();

  if (((fiber.actualStartTime: any): number) < 0) {
    fiber.actualStartTime = now();
  }
}

function stopProfilerTimerIfRunning(fiber: Fiber): void {
  if (!enableProfiling) {
    return;
  }
  profilerStartTime = -1;
}

function stopProfilerTimerIfRunningAndRecordDelta(
  fiber: Fiber,
  overrideBaseTime: boolean,
): void {
  if (!enableProfiling) {
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

export {
  getCommitTime,
  recordCommitTime,
  startProfilerTimer,
  stopProfilerTimerIfRunning,
  stopProfilerTimerIfRunningAndRecordDelta,
};
