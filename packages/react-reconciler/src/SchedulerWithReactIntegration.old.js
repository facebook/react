/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactPriorityLevel} from './ReactInternalTypes';

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
import * as Scheduler from 'scheduler';
import {__interactionsRef} from 'scheduler/tracing';
import {
  enableSchedulerTracing,
  decoupleUpdatePriorityFromScheduler,
} from 'shared/ReactFeatureFlags';
import invariant from 'shared/invariant';
import {
  SyncLanePriority,
  getCurrentUpdateLanePriority,
  setCurrentUpdateLanePriority,
} from './ReactFiberLane.old';

const {
  unstable_runWithPriority: Scheduler_runWithPriority,
  unstable_scheduleCallback: Scheduler_scheduleCallback,
  unstable_cancelCallback: Scheduler_cancelCallback,
  unstable_shouldYield: Scheduler_shouldYield,
  unstable_requestPaint: Scheduler_requestPaint,
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
      'https://reactjs.org/link/profiling',
  );
}

export type SchedulerCallback = (isSync: boolean) => SchedulerCallback | null;

type SchedulerCallbackOptions = {timeout?: number, ...};

export const ImmediatePriority: ReactPriorityLevel = Scheduler_ImmediatePriority;
export const UserBlockingPriority: ReactPriorityLevel = Scheduler_UserBlockingPriority;
export const NormalPriority: ReactPriorityLevel = Scheduler_NormalPriority;
export const LowPriority: ReactPriorityLevel = Scheduler_LowPriority;
export const IdlePriority: ReactPriorityLevel = Scheduler_IdlePriority;
// NoPriority is the absence of priority. React-only.
export const NoPriority: ReactPriorityLevel = 90;

export const shouldYield = Scheduler_shouldYield;
export const requestPaint =
  // Fall back gracefully if we're running an older version of Scheduler.
  Scheduler_requestPaint !== undefined ? Scheduler_requestPaint : () => {};

let syncQueue: Array<SchedulerCallback> | null = null;
let immediateQueueCallbackNode: mixed | null = null;
let isFlushingSyncQueue: boolean = false;

export const now = Scheduler_now;

export function getCurrentPriorityLevel(): ReactPriorityLevel {
  return Scheduler_getCurrentPriorityLevel();
}

export function runWithPriority<T>(
  priorityLevel: ReactPriorityLevel,
  fn: () => T,
): T {
  return Scheduler_runWithPriority(priorityLevel, fn);
}

export function scheduleCallback(
  priorityLevel: ReactPriorityLevel,
  callback: SchedulerCallback,
  options: SchedulerCallbackOptions | void | null,
) {
  return Scheduler_scheduleCallback(priorityLevel, callback, options);
}

export function scheduleSyncCallback(callback: SchedulerCallback) {
  // Push this callback into an internal queue. We'll flush these either in
  // the next tick, or earlier if something calls `flushSyncCallbackQueue`.
  if (syncQueue === null) {
    syncQueue = [callback];
    // Flush the queue in the next tick, at the earliest.
    // TODO: Figure out how to remove this It's only here as a last resort if we
    // forget to explicitly flush.
    immediateQueueCallbackNode = Scheduler_scheduleCallback(
      Scheduler_ImmediatePriority,
      flushSyncCallbackQueueImpl,
    );
  } else {
    // Push onto existing queue. Don't need to schedule a callback because
    // we already scheduled one when we created the queue.
    syncQueue.push(callback);
  }
}

export function cancelCallback(callbackNode: mixed) {
  Scheduler_cancelCallback(callbackNode);
}

export function flushSyncCallbackQueue() {
  if (immediateQueueCallbackNode !== null) {
    const node = immediateQueueCallbackNode;
    immediateQueueCallbackNode = null;
    Scheduler_cancelCallback(node);
  }
  flushSyncCallbackQueueImpl();
}

function flushSyncCallbackQueueImpl() {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    // Prevent re-entrancy.
    isFlushingSyncQueue = true;
    let i = 0;
    if (decoupleUpdatePriorityFromScheduler) {
      const previousLanePriority = getCurrentUpdateLanePriority();
      try {
        const isSync = true;
        const queue = syncQueue;
        setCurrentUpdateLanePriority(SyncLanePriority);
        runWithPriority(ImmediatePriority, () => {
          for (; i < queue.length; i++) {
            let callback = queue[i];
            do {
              callback = callback(isSync);
            } while (callback !== null);
          }
        });
        syncQueue = null;
      } catch (error) {
        // If something throws, leave the remaining callbacks on the queue.
        if (syncQueue !== null) {
          syncQueue = syncQueue.slice(i + 1);
        }
        // Resume flushing in the next tick
        Scheduler_scheduleCallback(
          Scheduler_ImmediatePriority,
          flushSyncCallbackQueue,
        );
        throw error;
      } finally {
        setCurrentUpdateLanePriority(previousLanePriority);
        isFlushingSyncQueue = false;
      }
    } else {
      try {
        const isSync = true;
        const queue = syncQueue;
        runWithPriority(ImmediatePriority, () => {
          for (; i < queue.length; i++) {
            let callback = queue[i];
            do {
              callback = callback(isSync);
            } while (callback !== null);
          }
        });
        syncQueue = null;
      } catch (error) {
        // If something throws, leave the remaining callbacks on the queue.
        if (syncQueue !== null) {
          syncQueue = syncQueue.slice(i + 1);
        }
        // Resume flushing in the next tick
        Scheduler_scheduleCallback(
          Scheduler_ImmediatePriority,
          flushSyncCallbackQueue,
        );
        throw error;
      } finally {
        isFlushingSyncQueue = false;
      }
    }
  }
}
