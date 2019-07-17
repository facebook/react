/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {PriorityLevel} from './SchedulerPriorities';
import {
  enableProfiling,
  enableUserTimingAPI as enableUserTimingAPIFeatureFlag,
} from './SchedulerFeatureFlags';

const enableUserTimingAPI =
  enableUserTimingAPIFeatureFlag &&
  typeof performance !== 'undefined' &&
  typeof performance.mark === 'function' &&
  typeof performance.clearMarks === 'function';

let runIdCounter: number = 0;
let mainThreadIdCounter: number = 0;

export function markTaskStart(task: {id: number}) {
  if (enableProfiling) {
    if (enableUserTimingAPI) {
      // Use extra field to track if delayed task starts.
      const taskStartMark = `SchedulerTask-${task.id}-Start`;
      performance.mark(taskStartMark);
      performance.clearMarks(taskStartMark);
    }
  }
}

export function markTaskCompleted(task: {
  id: number,
  priorityLevel: PriorityLevel,
  label?: string,
}) {
  if (enableProfiling) {
    if (enableUserTimingAPI) {
      const info = JSON.stringify({
        priorityLevel: task.priorityLevel,
        label: task.label,
        exitStatus: 'completed',
      });
      const taskEndMark = `SchedulerTask-${task.id}-End-${info}`;
      performance.mark(taskEndMark);
      performance.clearMarks(taskEndMark);
    }
  }
}

export function markTaskCanceled(task: {
  id: number,
  priorityLevel: PriorityLevel,
  label?: string,
}) {
  if (enableProfiling) {
    if (enableUserTimingAPI) {
      const info = JSON.stringify({
        priorityLevel: task.priorityLevel,
        label: task.label,
        exitStatus: 'canceled',
      });
      const taskEndMark = `SchedulerTask-${task.id}-End-${info}`;
      performance.mark(taskEndMark);
      performance.clearMarks(taskEndMark);
    }
  }
}

export function markTaskErrored(task: {
  id: number,
  priorityLevel: PriorityLevel,
  label?: string,
}) {
  if (enableProfiling) {
    if (enableUserTimingAPI) {
      const info = JSON.stringify({
        priorityLevel: task.priorityLevel,
        label: task.label,
        exitStatus: 'errored',
      });
      const taskEndMark = `SchedulerTask-${task.id}-End-${info}`;
      performance.mark(taskEndMark);
      performance.clearMarks(taskEndMark);
    }
  }
}

export function markTaskRun(task: {id: number}) {
  if (enableProfiling) {
    if (enableUserTimingAPI) {
      runIdCounter++;
      const runMark = `SchedulerTask-${task.id}-Run-${runIdCounter}`;
      performance.mark(runMark);
      performance.clearMarks(runMark);
    }
  }
}

export function markTaskYield(task: {id: number}) {
  if (enableProfiling) {
    if (enableUserTimingAPI) {
      const yieldMark = `SchedulerTask-${task.id}-Yield-${runIdCounter}`;
      performance.mark(yieldMark);
      performance.clearMarks(yieldMark);
    }
  }
}

export function markSchedulerSuspended() {
  if (enableProfiling) {
    if (enableUserTimingAPI) {
      mainThreadIdCounter++;
      const suspendStartMark =
        'SchedulerSuspended-Start-' + mainThreadIdCounter;
      performance.mark(suspendStartMark);
      performance.clearMarks(suspendStartMark);
    }
  }
}

export function markSchedulerUnsuspended() {
  if (enableProfiling) {
    if (enableUserTimingAPI) {
      const suspendedEndMark = 'SchedulerSuspended-End-' + mainThreadIdCounter;
      performance.mark(suspendedEndMark);
      performance.clearMarks(suspendedEndMark);
    }
  }
}
