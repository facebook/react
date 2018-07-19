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

function toFlushAll(renderer, expectedYields) {
  const actualYields = renderer.unstable_flushAll();
  return captureAssertion(() => expect(actualYields).toEqual(expectedYields));
}

function toFlushThrough(renderer, expectedYields) {
  const actualYields = renderer.unstable_flushNumberOfYields(
    expectedYields.length
  );
  return captureAssertion(() => expect(actualYields).toEqual(expectedYields));
}

function toClearYields(ReactTestRenderer, expectedYields) {
  const actualYields = ReactTestRenderer.unstable_clearYields();
  return captureAssertion(() => expect(actualYields).toEqual(expectedYields));
}

function toFlushAndThrow(renderer, expectedYields, ...rest) {
  return captureAssertion(() => {
    try {
      expect(() => {
        renderer.unstable_flushAll();
      }).toThrow(...rest);
    } catch (error) {
      const actualYields = renderer.unstable_clearYields();
      expect(actualYields).toEqual(expectedYields);
      throw error;
    }
    const actualYields = renderer.unstable_clearYields();
    expect(actualYields).toEqual(expectedYields);
  });
}

module.exports = {
  toFlushAll,
  toFlushThrough,
  toFlushAndThrow,
  toClearYields,
};
