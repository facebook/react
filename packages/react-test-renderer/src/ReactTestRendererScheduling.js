/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Deadline} from 'react-reconciler/src/ReactFiberReconciler';

// Current virtual time
export let nowImplementation = () => 0;
export let scheduledCallback: ((deadline: Deadline) => mixed) | null = null;
export let yieldedValues: Array<mixed> | null = null;

export function scheduleDeferredCallback(
  callback: (deadline: Deadline) => mixed,
  options?: {timeout: number},
): number {
  scheduledCallback = callback;
  return 0;
}

export function cancelDeferredCallback(timeoutID: number): void {
  scheduledCallback = null;
}

export function setNowImplementation(implementation: () => number): void {
  nowImplementation = implementation;
}

export function flushAll(): Array<mixed> {
  yieldedValues = null;
  while (scheduledCallback !== null) {
    const cb = scheduledCallback;
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
  }
  if (yieldedValues === null) {
    // Always return an array.
    return [];
  }
  return yieldedValues;
}

export function flushThrough(expectedValues: Array<mixed>): Array<mixed> {
  let didStop = false;
  yieldedValues = null;
  while (scheduledCallback !== null && !didStop) {
    const cb = scheduledCallback;
    scheduledCallback = null;
    cb({
      timeRemaining() {
        if (
          yieldedValues !== null &&
          yieldedValues.length >= expectedValues.length
        ) {
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
  }
  if (yieldedValues === null) {
    // Always return an array.
    return [];
  }
  return yieldedValues;
}

export function yieldValue(value: mixed): void {
  if (yieldedValues === null) {
    yieldedValues = [value];
  } else {
    yieldedValues.push(value);
  }
}

export function withCleanYields(fn: Function) {
  yieldedValues = [];
  fn();
  return yieldedValues;
}
