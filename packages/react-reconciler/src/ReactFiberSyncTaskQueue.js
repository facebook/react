/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {SchedulerCallback} from './Scheduler';

import {
  DiscreteEventPriority,
  getCurrentUpdatePriority,
  setCurrentUpdatePriority,
} from './ReactEventPriorities';
import {ImmediatePriority, scheduleCallback} from './Scheduler';

let syncQueue: Array<SchedulerCallback> | null = null;
let includesLegacySyncCallbacks: boolean = false;
let isFlushingSyncQueue: boolean = false;

export function scheduleSyncCallback(callback: SchedulerCallback) {
  // Push this callback into an internal queue. We'll flush these either in
  // the next tick, or earlier if something calls `flushSyncCallbackQueue`.
  if (syncQueue === null) {
    syncQueue = [callback];
  } else {
    // Push onto existing queue. Don't need to schedule a callback because
    // we already scheduled one when we created the queue.
    syncQueue.push(callback);
  }
}

export function scheduleLegacySyncCallback(callback: SchedulerCallback) {
  includesLegacySyncCallbacks = true;
  scheduleSyncCallback(callback);
}

export function flushSyncCallbacksOnlyInLegacyMode() {
  // Only flushes the queue if there's a legacy sync callback scheduled.
  // TODO: There's only a single type of callback: performSyncOnWorkOnRoot. So
  // it might make more sense for the queue to be a list of roots instead of a
  // list of generic callbacks. Then we can have two: one for legacy roots, one
  // for concurrent roots. And this method would only flush the legacy ones.
  if (includesLegacySyncCallbacks) {
    flushSyncCallbacks();
  }
}

export function flushSyncCallbacks(): null {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    // Prevent re-entrance.
    isFlushingSyncQueue = true;

    // Set the event priority to discrete
    // TODO: Is this necessary anymore? The only user code that runs in this
    // queue is in the render or commit phases, which already set the
    // event priority. Should be able to remove.
    const previousUpdatePriority = getCurrentUpdatePriority();
    setCurrentUpdatePriority(DiscreteEventPriority);

    let errors: Array<mixed> | null = null;

    const queue = syncQueue;
    // $FlowFixMe[incompatible-use] found when upgrading Flow
    for (let i = 0; i < queue.length; i++) {
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      let callback: SchedulerCallback = queue[i];
      try {
        do {
          const isSync = true;
          // $FlowFixMe[incompatible-type] we bail out when we get a null
          callback = callback(isSync);
        } while (callback !== null);
      } catch (error) {
        // Collect errors so we can rethrow them at the end
        if (errors === null) {
          errors = [error];
        } else {
          errors.push(error);
        }
      }
    }

    syncQueue = null;
    includesLegacySyncCallbacks = false;
    setCurrentUpdatePriority(previousUpdatePriority);
    isFlushingSyncQueue = false;

    if (errors !== null) {
      if (errors.length > 1) {
        if (typeof AggregateError === 'function') {
          // eslint-disable-next-line no-undef
          throw new AggregateError(errors);
        } else {
          for (let i = 1; i < errors.length; i++) {
            scheduleCallback(
              ImmediatePriority,
              throwError.bind(null, errors[i]),
            );
          }
          const firstError = errors[0];
          throw firstError;
        }
      } else {
        const error = errors[0];
        throw error;
      }
    }
  }

  return null;
}

function throwError(error: mixed) {
  throw error;
}
