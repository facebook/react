/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const isBrowserEnvironment =
  typeof window !== 'undefined' && typeof MessageChannel === 'function';

// Select the correct scheduler for this environment.
// TODO: this should be handled upstream by importing the correct scheduler.
let Scheduler;
if (isBrowserEnvironment) {
  Scheduler = require('./src/forks/SchedulerDOM');
} else {
  Scheduler = require('./src/forks/SchedulerNoDOM');
}

export const unstable_ImmediatePriority = Scheduler.unstable_ImmediatePriority;
export const unstable_UserBlockingPriority =
  Scheduler.unstable_UserBlockingPriority;
export const unstable_NormalPriority = Scheduler.unstable_NormalPriority;
export const unstable_IdlePriority = Scheduler.unstable_IdlePriority;
export const unstable_LowPriority = Scheduler.unstable_LowPriority;
export const unstable_runWithPriority = Scheduler.unstable_runWithPriority;
export const unstable_next = Scheduler.unstable_next;
export const unstable_scheduleCallback = Scheduler.unstable_scheduleCallback;
export const unstable_cancelCallback = Scheduler.unstable_cancelCallback;
export const unstable_wrapCallback = Scheduler.unstable_wrapCallback;
export const unstable_getCurrentPriorityLevel =
  Scheduler.unstable_getCurrentPriorityLevel;
export const unstable_shouldYield = Scheduler.unstable_shouldYield;
export const unstable_requestPaint = Scheduler.unstable_requestPaint;
export const unstable_continueExecution = Scheduler.unstable_continueExecution;
export const unstable_pauseExecution = Scheduler.unstable_pauseExecution;
export const unstable_getFirstCallbackNode =
  Scheduler.unstable_getFirstCallbackNode;
export const unstable_now = Scheduler.unstable_now;
export const unstable_forceFrameRate = Scheduler.unstable_forceFrameRate;
export const unstable_Profiling = Scheduler.unstable_Profiling;
