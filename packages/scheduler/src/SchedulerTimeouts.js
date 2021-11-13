/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {maxSigned31BitInt} from './constants';
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
} from './SchedulerPriorities';

// Times out immediately
export const IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
export const USER_BLOCKING_PRIORITY_TIMEOUT = 250;
export const NORMAL_PRIORITY_TIMEOUT = 5000;
export const LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
export const IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

export const PRIORITY_TIMEOUT_MAP = {
  [ImmediatePriority]: IMMEDIATE_PRIORITY_TIMEOUT,
  [UserBlockingPriority]: USER_BLOCKING_PRIORITY_TIMEOUT,
  [NormalPriority]: NORMAL_PRIORITY_TIMEOUT,
  [LowPriority]: LOW_PRIORITY_TIMEOUT,
  [IdlePriority]: IDLE_PRIORITY_TIMEOUT,
};
