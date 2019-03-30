/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

let currentTime = 0;
let scheduledCallback = null;
let scheduledCallbackExpiration = -1;
let yieldedValues = null;
let expectedNumberOfYields = -1;
let didStop = false;
let isFlushing = false;

export function requestHostCallback(callback, expiration) {
  scheduledCallback = callback;
  scheduledCallbackExpiration = expiration;
}

export function cancelHostCallback() {
  scheduledCallback = null;
  scheduledCallbackExpiration = -1;
}

export function shouldYieldToHost() {
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

export function getCurrentTime() {
  return currentTime;
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
export function unstable_flushNumberOfYields(count) {
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

export function unstable_flushWithoutYielding() {
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

export function unstable_clearYields() {
  if (yieldedValues === null) {
    return [];
  }
  const values = yieldedValues;
  yieldedValues = null;
  return values;
}

export function flushAll() {
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

export function yieldValue(value) {
  if (yieldedValues === null) {
    yieldedValues = [value];
  } else {
    yieldedValues.push(value);
  }
}

export function advanceTime(ms) {
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
