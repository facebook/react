/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

let currentTime: number = 0;
let scheduledCallback: (boolean => void) | null = null;
let scheduledCallbackExpiration: number = -1;
let yieldedValues: Array<mixed> | null = null;
let expectedNumberOfYields: number = -1;
let didStop: boolean = false;
let isFlushing: boolean = false;

export function requestHostCallback(
  callback: boolean => void,
  expiration: number,
) {
  scheduledCallback = callback;
  scheduledCallbackExpiration = expiration;
}

export function cancelHostCallback(): void {
  scheduledCallback = null;
  scheduledCallbackExpiration = -1;
}

export function shouldYieldToHost(): boolean {
  if (
    (expectedNumberOfYields !== -1 &&
      yieldedValues !== null &&
      yieldedValues.length >= expectedNumberOfYields) ||
    (scheduledCallbackExpiration !== -1 &&
      scheduledCallbackExpiration <= currentTime)
  ) {
    // We yielded at least as many values as expected. Stop flushing.
    didStop = true;
    return true;
  }
  return false;
}

export function getCurrentTime(): number {
  return currentTime;
}

export function forceFrameRate() {
  // No-op
}

export function reset() {
  if (isFlushing) {
    throw new Error('Cannot reset while already flushing work.');
  }
  currentTime = 0;
  scheduledCallback = null;
  scheduledCallbackExpiration = -1;
  yieldedValues = null;
  expectedNumberOfYields = -1;
  didStop = false;
  isFlushing = false;
}

// Should only be used via an assertion helper that inspects the yielded values.
export function unstable_flushNumberOfYields(count: number): void {
  if (isFlushing) {
    throw new Error('Already flushing work.');
  }
  expectedNumberOfYields = count;
  isFlushing = true;
  try {
    while (scheduledCallback !== null && !didStop) {
      const cb = scheduledCallback;
      scheduledCallback = null;
      const didTimeout =
        scheduledCallbackExpiration !== -1 &&
        scheduledCallbackExpiration <= currentTime;
      cb(didTimeout);
    }
  } finally {
    expectedNumberOfYields = -1;
    didStop = false;
    isFlushing = false;
  }
}

export function unstable_flushExpired() {
  if (isFlushing) {
    throw new Error('Already flushing work.');
  }
  if (scheduledCallback !== null) {
    const cb = scheduledCallback;
    scheduledCallback = null;
    isFlushing = true;
    try {
      cb(true);
    } finally {
      isFlushing = false;
    }
  }
}

export function unstable_flushWithoutYielding(): void {
  if (isFlushing) {
    throw new Error('Already flushing work.');
  }
  isFlushing = true;
  try {
    while (scheduledCallback !== null) {
      const cb = scheduledCallback;
      scheduledCallback = null;
      const didTimeout =
        scheduledCallbackExpiration !== -1 &&
        scheduledCallbackExpiration <= currentTime;
      cb(didTimeout);
    }
  } finally {
    expectedNumberOfYields = -1;
    didStop = false;
    isFlushing = false;
  }
}

export function unstable_clearYields(): Array<mixed> {
  if (yieldedValues === null) {
    return [];
  }
  const values = yieldedValues;
  yieldedValues = null;
  return values;
}

export function flushAll(): void {
  if (yieldedValues !== null) {
    throw new Error(
      'Log is not empty. Assert on the log of yielded values before ' +
        'flushing additional work.',
    );
  }
  unstable_flushWithoutYielding();
  if (yieldedValues !== null) {
    throw new Error(
      'While flushing work, something yielded a value. Use an ' +
        'assertion helper to assert on the log of yielded values, e.g. ' +
        'expect(Scheduler).toFlushAndYield([...])',
    );
  }
}

export function yieldValue(value: mixed): void {
  if (yieldedValues === null) {
    yieldedValues = [value];
  } else {
    yieldedValues.push(value);
  }
}

export function advanceTime(ms: number) {
  currentTime += ms;
  // If the host callback timed out, flush the expired work.
  if (
    !isFlushing &&
    scheduledCallbackExpiration !== -1 &&
    scheduledCallbackExpiration <= currentTime
  ) {
    unstable_flushExpired();
  }
}
