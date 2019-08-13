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
  enableSharedProfilingBuffer,
} from './SchedulerFeatureFlags';

import {NoPriority} from './SchedulerPriorities';

const enableUserTimingAPI =
  enableUserTimingAPIFeatureFlag &&
  typeof performance !== 'undefined' &&
  typeof performance.mark === 'function' &&
  typeof performance.clearMarks === 'function';

let runIdCounter: number = 0;
let mainThreadIdCounter: number = 0;

const length = 3;
const size = Int32Array.BYTES_PER_ELEMENT * length;
export const sharedProfilingBuffer =
  // $FlowFixMe Flow doesn't know about SharedArrayBuffer
  typeof SharedArrayBuffer === 'function'
    ? new SharedArrayBuffer(size)
    : // $FlowFixMe Flow doesn't know about ArrayBuffer
      new ArrayBuffer(size);
const profilingInfo = enableSharedProfilingBuffer
  ? new Int32Array(sharedProfilingBuffer)
  : null;

const PRIORITY = 0;
const CURRENT_TASK_ID = 1;
const QUEUE_SIZE = 2;

if (enableSharedProfilingBuffer && profilingInfo !== null) {
  profilingInfo[PRIORITY] = NoPriority;
  // This is maintained with a counter, because the size of the priority queue
  // array might include canceled tasks.
  profilingInfo[QUEUE_SIZE] = 0;
  profilingInfo[CURRENT_TASK_ID] = 0;
}

export function markTaskStart(task: {id: number}) {
  if (enableProfiling) {
    if (enableSharedProfilingBuffer && profilingInfo !== null) {
      profilingInfo[QUEUE_SIZE]++;
    }
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
    if (enableSharedProfilingBuffer && profilingInfo !== null) {
      profilingInfo[PRIORITY] = NoPriority;
      profilingInfo[CURRENT_TASK_ID] = 0;
      profilingInfo[QUEUE_SIZE]--;
    }
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
    if (enableSharedProfilingBuffer && profilingInfo !== null) {
      profilingInfo[QUEUE_SIZE]--;
    }
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
    if (enableSharedProfilingBuffer && profilingInfo !== null) {
      profilingInfo[PRIORITY] = NoPriority;
      profilingInfo[CURRENT_TASK_ID] = 0;
      profilingInfo[QUEUE_SIZE]--;
    }
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

export function markTaskRun(task: {id: number, priorityLevel: PriorityLevel}) {
  if (enableProfiling) {
    if (enableSharedProfilingBuffer && profilingInfo !== null) {
      profilingInfo[PRIORITY] = task.priorityLevel;
      profilingInfo[CURRENT_TASK_ID] = task.id;
    }
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
    if (enableSharedProfilingBuffer && profilingInfo !== null) {
      profilingInfo[PRIORITY] = NoPriority;
      profilingInfo[CURRENT_TASK_ID] = 0;
    }
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
