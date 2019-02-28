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

function resolveScheduler(obj) {
  if (obj._Scheduler !== undefined) {
    return obj._Scheduler;
  }
  if (typeof obj.unstable_scheduleCallback === 'function') {
    return obj;
  }
  return null;
}

function assertYieldsWereCleared(Scheduler) {
  const actualYields = Scheduler.unstable_clearYields();
  if (actualYields.length !== 0) {
    throw new Error(
      'Log of yielded values is not empty. ' +
        'Call expect(ReactNoop).toHaveYielded(...) first.'
    );
  }
}

function toFlushAndYield(ReactNoop, expectedYields) {
  const Scheduler = resolveScheduler(ReactNoop);
  if (Scheduler === null) {
    return JestReact.unstable_toFlushAndYield(ReactNoop, expectedYields);
  }
  return SchedulerMatchers.toFlushAndYield(Scheduler, expectedYields);
}

function toFlushAndYieldThrough(ReactNoop, expectedYields) {
  const Scheduler = resolveScheduler(ReactNoop);
  if (Scheduler === null) {
    return JestReact.unstable_toFlushAndYieldThrough(ReactNoop, expectedYields);
  }
  return SchedulerMatchers.toFlushAndYieldThrough(Scheduler, expectedYields);
}

function toFlushWithoutYielding(ReactNoop) {
  const Scheduler = resolveScheduler(ReactNoop);
  if (Scheduler === null) {
    return JestReact.unstable_toFlushWithoutYielding(ReactNoop);
  }
  return SchedulerMatchers.toFlushWithoutYielding(Scheduler);
}

function toHaveYielded(ReactNoop, expectedYields) {
  const Scheduler = resolveScheduler(ReactNoop);
  if (Scheduler === null) {
    return JestReact.unstable_toHaveYielded(ReactNoop, expectedYields);
  }
  return SchedulerMatchers.toHaveYielded(Scheduler, expectedYields);
}

function toFlushAndThrow(ReactNoop, ...rest) {
  const Scheduler = resolveScheduler(ReactNoop);
  if (Scheduler === null) {
    return JestReact.unstable_toFlushAndThrow(ReactNoop, ...rest);
  }
  return SchedulerMatchers.toFlushAndThrow(Scheduler, ...rest);
}

function toMatchRenderedOutput(ReactNoop, expectedJSX) {
  if (typeof ReactNoop.getChildrenAsJSX === 'function') {
    const Scheduler = ReactNoop._Scheduler;
    assertYieldsWereCleared(Scheduler);
    return captureAssertion(() => {
      expect(ReactNoop.getChildrenAsJSX()).toEqual(expectedJSX);
    });
  }
  return JestReact.unstable_toMatchRenderedOutput(ReactNoop, expectedJSX);
}

module.exports = {
  toFlushAndYield,
  toFlushAndYieldThrough,
  toFlushWithoutYielding,
  toHaveYielded,
  toFlushAndThrow,
  toMatchRenderedOutput,
};
