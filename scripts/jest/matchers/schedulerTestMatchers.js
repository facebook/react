'use strict';

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

function assertYieldsWereCleared(Scheduler) {
  const actualYields = Scheduler.unstable_clearYields();
  if (actualYields.length !== 0) {
    throw new Error(
      'Log of yielded values is not empty. ' +
        'Call expect(Scheduler).toHaveYielded(...) first.'
    );
  }
}

function toFlushAndYield(Scheduler, expectedYields) {
  assertYieldsWereCleared(Scheduler);
  Scheduler.unstable_flushWithoutYielding();
  const actualYields = Scheduler.unstable_clearYields();
  return captureAssertion(() => {
    expect(actualYields).toEqual(expectedYields);
  });
}

function toFlushAndYieldThrough(Scheduler, expectedYields) {
  assertYieldsWereCleared(Scheduler);
  Scheduler.unstable_flushNumberOfYields(expectedYields.length);
  const actualYields = Scheduler.unstable_clearYields();
  return captureAssertion(() => {
    expect(actualYields).toEqual(expectedYields);
  });
}

function toFlushWithoutYielding(Scheduler) {
  return toFlushAndYield(Scheduler, []);
}

function toHaveYielded(Scheduler, expectedYields) {
  return captureAssertion(() => {
    const actualYields = Scheduler.unstable_clearYields();
    expect(actualYields).toEqual(expectedYields);
  });
}

function toFlushAndThrow(Scheduler, ...rest) {
  assertYieldsWereCleared(Scheduler);
  return captureAssertion(() => {
    expect(() => {
      Scheduler.unstable_flushWithoutYielding();
    }).toThrow(...rest);
  });
}

module.exports = {
  toFlushAndYield,
  toFlushAndYieldThrough,
  toFlushWithoutYielding,
  toHaveYielded,
  toFlushAndThrow,
};
