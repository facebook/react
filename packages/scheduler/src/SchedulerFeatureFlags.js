/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import type {PriorityLevel} from './SchedulerPriorities';

export const enableProfiling = false;
export const frameYieldMs = 5;

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
const maxSigned31BitInt = 1073741823;
export const immediatePriorityTimeout = -1;
export const idlePriorityTimeout = maxSigned31BitInt;
export const userBlockingPriorityTimeout = 250;
export const normalPriorityTimeout = 5000;
export const lowPriorityTimeout = 10000;

const timeoutMap = [
  null, // NoPriority
  immediatePriorityTimeout, // ImmediatePriority
  userBlockingPriorityTimeout, // UserBlockingPriority
  normalPriorityTimeout, // NormalPriority
  lowPriorityTimeout, // LowPriority
  idlePriorityTimeout, // IdlePriority
];

export function getPriorityTimeout(priorityLevel: PriorityLevel): number {
  const timeout = timeoutMap[priorityLevel];
  return typeof timeout === 'number' ? timeout : normalPriorityTimeout;
}

export const enableRequestPaint = true;

export const enableAlwaysYieldScheduler = __EXPERIMENTAL__;
