'use strict';

const JestReact = require('jest-react');
const SchedulerMatchers = require('./schedulerTestMatchers');

function captureAssertion(fn) {
  // Trick to use a Jest matcher inside another Jest matcher. `fn` contains an
  // assertion; if it throws, we capture the error and return it, so the stack
  // trace presented to the user points to the original assertion in the
  // test file.
  try {
    fn();
  } catch (error) {
    return {
      pass: false,
      message: () => error.message,
    };
  }
  return {pass: true};
}

function isScheduler(obj) {
  return typeof obj.unstable_scheduleCallback === 'function';
}

function isReactNoop(obj) {
  return typeof obj.hasScheduledCallback === 'function';
}

function assertYieldsWereCleared(ReactNoop) {
  const actualYields = ReactNoop.unstable_clearYields();
  if (actualYields.length !== 0) {
    throw new Error(
      'Log of yielded values is not empty. ' +
        'Call expect(ReactNoop).toHaveYielded(...) first.'
    );
  }
}

function toFlushAndYield(ReactNoop, expectedYields) {
  if (isScheduler(ReactNoop)) {
    return SchedulerMatchers.toFlushAndYield(ReactNoop, expectedYields);
  }
  if (!isReactNoop(ReactNoop)) {
    return JestReact.unstable_toFlushAndYield(ReactNoop, expectedYields);
  }
  assertYieldsWereCleared(ReactNoop);
  const actualYields = ReactNoop.unstable_flushWithoutYielding();
  return captureAssertion(() => {
    expect(actualYields).toEqual(expectedYields);
  });
}

function toFlushAndYieldThrough(ReactNoop, expectedYields) {
  if (isScheduler(ReactNoop)) {
    return SchedulerMatchers.toFlushAndYieldThrough(ReactNoop, expectedYields);
  }
  if (!isReactNoop(ReactNoop)) {
    return JestReact.unstable_toFlushAndYieldThrough(ReactNoop, expectedYields);
  }
  assertYieldsWereCleared(ReactNoop);
  const actualYields = ReactNoop.unstable_flushNumberOfYields(
    expectedYields.length
  );
  return captureAssertion(() => {
    expect(actualYields).toEqual(expectedYields);
  });
}

function toFlushWithoutYielding(ReactNoop) {
  if (isScheduler(ReactNoop)) {
    return SchedulerMatchers.toFlushWithoutYielding(ReactNoop);
  }
  if (!isReactNoop(ReactNoop)) {
    return JestReact.unstable_toFlushWithoutYielding(ReactNoop);
  }
  return toFlushAndYield(ReactNoop, []);
}

function toHaveYielded(ReactNoop, expectedYields) {
  if (isScheduler(ReactNoop)) {
    return SchedulerMatchers.toHaveYielded(ReactNoop, expectedYields);
  }
  if (!isReactNoop(ReactNoop)) {
    return JestReact.unstable_toHaveYielded(ReactNoop, expectedYields);
  }
  return captureAssertion(() => {
    const actualYields = ReactNoop.unstable_clearYields();
    expect(actualYields).toEqual(expectedYields);
  });
}

function toFlushAndThrow(ReactNoop, ...rest) {
  if (isScheduler(ReactNoop)) {
    return SchedulerMatchers.toFlushAndThrow(ReactNoop, ...rest);
  }
  if (!isReactNoop(ReactNoop)) {
    return JestReact.unstable_toFlushAndThrow(ReactNoop, ...rest);
  }
  assertYieldsWereCleared(ReactNoop);
  return captureAssertion(() => {
    expect(() => {
      ReactNoop.unstable_flushWithoutYielding();
    }).toThrow(...rest);
  });
}

function toMatchRenderedOutput(ReactNoop, expectedJSX) {
  if (!isReactNoop(ReactNoop)) {
    return JestReact.unstable_toMatchRenderedOutput(ReactNoop, expectedJSX);
  }
  assertYieldsWereCleared(ReactNoop);
  return captureAssertion(() => {
    expect(ReactNoop.getChildrenAsJSX()).toEqual(expectedJSX);
  });
}

module.exports = {
  toFlushAndYield,
  toFlushAndYieldThrough,
  toFlushWithoutYielding,
  toHaveYielded,
  toFlushAndThrow,
  toMatchRenderedOutput,
};
