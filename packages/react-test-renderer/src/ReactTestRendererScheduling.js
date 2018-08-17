/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Deadline} from 'react-reconciler/src/ReactFiberScheduler';

// Current virtual time
export let nowImplementation = () => 0;
export let scheduledCallback: ((deadline: Deadline) => mixed) | null = null;
export let yieldedValues: Array<mixed> = [];

export function scheduleDeferredCallback(
  callback: (deadline: Deadline) => mixed,
  options?: {timeout: number},
): number {
  scheduledCallback = callback;
  const fakeCallbackId = 0;
  return fakeCallbackId;
}

export function cancelDeferredCallback(timeoutID: number): void {
  scheduledCallback = null;
}

export function setNowImplementation(implementation: () => number): void {
  nowImplementation = implementation;
}

export function flushAll(): Array<mixed> {
  yieldedValues = [];
  while (scheduledCallback !== null) {
    const cb = scheduledCallback;
    try {
      scheduledCallback = null;
      cb({
        timeRemaining() {
          // Keep rendering until there's no more work
          return 999;
        },
        // React's scheduler has its own way of keeping track of expired
        // work and doesn't read this, so don't bother setting it to the
        // correct value.
        didTimeout: false,
      });
    } catch (error) {
      // If an error occurred before we finished work,
      // Reset the callback so it can be flushed again.
      // Otherwise we leave the test renderer in a funky state,
      // Where nothing appears to be scheuduled unless new work is added,
      // And then the old failed work will also re-appear.
      scheduledCallback = cb;
      throw error;
    }
  }
  return yieldedValues;
}

export function flushNumberOfYields(count: number): Array<mixed> {
  let didStop = false;
  yieldedValues = [];
  while (scheduledCallback !== null && !didStop) {
    const cb = scheduledCallback;
    try {
      scheduledCallback = null;
      cb({
        timeRemaining() {
          if (yieldedValues.length >= count) {
            // We at least as many values as expected. Stop rendering.
            didStop = true;
            return 0;
          }
          // Keep rendering.
          return 999;
        },
        // React's scheduler has its own way of keeping track of expired
        // work and doesn't read this, so don't bother setting it to the
        // correct value.
        didTimeout: false,
      });
    } catch (error) {
      // If an error occurred before we finished work,
      // Reset the callback so it can be flushed again.
      // Otherwise we leave the test renderer in a funky state,
      // Where nothing appears to be scheuduled unless new work is added,
      // And then the old failed work will also re-appear.
      scheduledCallback = cb;
      throw error;
    }
  }
  return yieldedValues;
}

export function yieldValue(value: mixed): void {
  yieldedValues.push(value);
}

export function clearYields(): Array<mixed> {
  const values = yieldedValues;
  yieldedValues = [];
  return values;
}
