/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Current virtual time
export let nowImplementation = () => 0;
export let scheduledCallback: (() => mixed) | null = null;
export let yieldedValues: Array<mixed> = [];

let didStop: boolean = false;
let expectedNumberOfYields: number = -1;

export function scheduleDeferredCallback(
  callback: () => mixed,
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

export function shouldYield() {
  if (
    expectedNumberOfYields !== -1 &&
    yieldedValues.length >= expectedNumberOfYields
  ) {
    // We yielded at least as many values as expected. Stop rendering.
    didStop = true;
    return true;
  }
  // Keep rendering.
  return false;
}

export function flushAll(): Array<mixed> {
  yieldedValues = [];
  while (scheduledCallback !== null) {
    const cb = scheduledCallback;
    scheduledCallback = null;
    cb();
  }
  const values = yieldedValues;
  yieldedValues = [];
  return values;
}

export function flushNumberOfYields(count: number): Array<mixed> {
  expectedNumberOfYields = count;
  didStop = false;
  yieldedValues = [];
  try {
    while (scheduledCallback !== null && !didStop) {
      const cb = scheduledCallback;
      scheduledCallback = null;
      cb();
    }
    return yieldedValues;
  } finally {
    expectedNumberOfYields = -1;
    didStop = false;
    yieldedValues = [];
  }
}

export function yieldValue(value: mixed): void {
  yieldedValues.push(value);
}

export function clearYields(): Array<mixed> {
  const values = yieldedValues;
  yieldedValues = [];
  return values;
}
