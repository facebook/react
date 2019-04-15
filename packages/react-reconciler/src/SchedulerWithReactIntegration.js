/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
import * as Scheduler from 'scheduler';
import {__interactionsRef} from 'scheduler/tracing';
import {
  disableYielding,
  enableSchedulerTracing,
} from 'shared/ReactFeatureFlags';
import invariant from 'shared/invariant';

const {
  unstable_runWithPriority: Scheduler_runWithPriority,
  unstable_scheduleCallback: Scheduler_scheduleCallback,
  unstable_cancelCallback: Scheduler_cancelCallback,
  unstable_shouldYield: Scheduler_shouldYield,
  unstable_now: Scheduler_now,
  unstable_getCurrentPriorityLevel: Scheduler_getCurrentPriorityLevel,
  unstable_ImmediatePriority: Scheduler_ImmediatePriority,
  unstable_UserBlockingPriority: Scheduler_UserBlockingPriority,
  unstable_NormalPriority: Scheduler_NormalPriority,
  unstable_LowPriority: Scheduler_LowPriority,
  unstable_IdlePriority: Scheduler_IdlePriority,
} = Scheduler;

if (enableSchedulerTracing) {
  // Provide explicit error message when production+profiling bundle of e.g.
  // react-dom is used with production (non-profiling) bundle of
  // scheduler/tracing
  invariant(
    __interactionsRef != null && __interactionsRef.current != null,
    'It is not supported to run the profiling version of a renderer (for ' +
      'example, `react-dom/profiling`) without also replacing the ' +
      '`scheduler/tracing` module with `scheduler/tracing-profiling`. Your ' +
      'bundler might have a setting for aliasing both modules. Learn more at ' +
      'http://fb.me/react-profiling',
  );
}

export opaque type ReactPriorityLevel = 99 | 98 | 97 | 96 | 95 | 90;
export type SchedulerCallback = (isSync: boolean) => SchedulerCallback | null;

type SchedulerCallbackOptions = {
  timeout?: number,
};

const fakeCallbackNode = {};

// Except for NoPriority, these correspond to Scheduler priorities. We use
// ascending numbers so we can compare them like numbers. They start at 90 to
// avoid clashing with Scheduler's priorities.
export const ImmediatePriority: ReactPriorityLevel = 99;
export const UserBlockingPriority: ReactPriorityLevel = 98;
export const NormalPriority: ReactPriorityLevel = 97;
export const LowPriority: ReactPriorityLevel = 96;
export const IdlePriority: ReactPriorityLevel = 95;
// NoPriority is the absence of priority. Also React-only.
export const NoPriority: ReactPriorityLevel = 90;

export const now = Scheduler_now;
export const shouldYield = disableYielding
  ? () => false // Never yield when `disableYielding` is on
  : Scheduler_shouldYield;

let immediateQueue: Array<SchedulerCallback> | null = null;
let immediateQueueCallbackNode: mixed | null = null;
let isFlushingImmediate: boolean = false;

export function getCurrentPriorityLevel(): ReactPriorityLevel {
  switch (Scheduler_getCurrentPriorityLevel()) {
    case Scheduler_ImmediatePriority:
      return ImmediatePriority;
    case Scheduler_UserBlockingPriority:
      return UserBlockingPriority;
    case Scheduler_NormalPriority:
      return NormalPriority;
    case Scheduler_LowPriority:
      return LowPriority;
    case Scheduler_IdlePriority:
      return IdlePriority;
    default:
      invariant(false, 'Unknown priority level.');
  }
}

function reactPriorityToSchedulerPriority(reactPriorityLevel) {
  switch (reactPriorityLevel) {
    case ImmediatePriority:
      return Scheduler_ImmediatePriority;
    case UserBlockingPriority:
      return Scheduler_UserBlockingPriority;
    case NormalPriority:
      return Scheduler_NormalPriority;
    case LowPriority:
      return Scheduler_LowPriority;
    case IdlePriority:
      return Scheduler_IdlePriority;
    default:
      invariant(false, 'Unknown priority level.');
  }
}

export function runWithPriority<T>(
  reactPriorityLevel: ReactPriorityLevel,
  fn: () => T,
): T {
  const priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
  return Scheduler_runWithPriority(priorityLevel, fn);
}

export function scheduleCallback(
  reactPriorityLevel: ReactPriorityLevel,
  callback: SchedulerCallback,
  options: SchedulerCallbackOptions | void | null,
) {
  if (reactPriorityLevel === ImmediatePriority) {
    // Push this callback into an internal queue. We'll flush these either in
    // the next tick, or earlier if something calls `flushImmediateQueue`.
    if (immediateQueue === null) {
      immediateQueue = [callback];
      // Flush the queue in the next tick, at the earliest.
      immediateQueueCallbackNode = Scheduler_scheduleCallback(
        Scheduler_ImmediatePriority,
        flushImmediateQueueImpl,
      );
    } else {
      // Push onto existing queue. Don't need to schedule a callback because
      // we already scheduled one when we created the queue.
      immediateQueue.push(callback);
    }
    return fakeCallbackNode;
  }
  // Otherwise pass through to Scheduler.
  const priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
  return Scheduler_scheduleCallback(priorityLevel, callback, options);
}

export function cancelCallback(callbackNode: mixed) {
  if (callbackNode !== fakeCallbackNode) {
    Scheduler_cancelCallback(callbackNode);
  }
}

export function flushImmediateQueue() {
  if (immediateQueueCallbackNode !== null) {
    Scheduler_cancelCallback(immediateQueueCallbackNode);
  }
  flushImmediateQueueImpl();
}

function flushImmediateQueueImpl() {
  if (!isFlushingImmediate && immediateQueue !== null) {
    // Prevent re-entrancy.
    isFlushingImmediate = true;
    let i = 0;
    try {
      const isSync = true;
      for (; i < immediateQueue.length; i++) {
        let callback = immediateQueue[i];
        do {
          callback = callback(isSync);
        } while (callback !== null);
      }
      immediateQueue = null;
    } catch (error) {
      // If something throws, leave the remaining callbacks on the queue.
      if (immediateQueue !== null) {
        immediateQueue = immediateQueue.slice(i + 1);
      }
      // Resume flushing in the next tick
      Scheduler_scheduleCallback(
        Scheduler_ImmediatePriority,
        flushImmediateQueue,
      );
      throw error;
    } finally {
      isFlushingImmediate = false;
    }
  }
}
