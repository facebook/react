'use strict';

const jestDiff = require('jest-diff');

function toContainNoInteractions(actualSet) {
  return {
    message: () =>
      this.isNot
        ? `Expected interactions but there were none.`
        : `Expected no interactions but there were ${actualSet.size}.`,
    pass: actualSet.size === 0,
  };
}

function toMatchInteractions(actualSet, expectedArray) {
  if (actualSet.size !== expectedArray.length) {
    return {
      message: () =>
        `Expected ${expectedArray.length} interactions but there were ${
          actualSet.size
        }`,
      pass: false,
    };
  }

  const actualArray = Array.from(actualSet);

  let actual, expected, attribute;
  for (let i = 0; i < actualArray.length; i++) {
    actual = actualArray[i];
    expected = expectedArray[i];

    for (attribute in expected) {
      if (actual[attribute] !== expected[attribute]) {
        return {
          message: () => jestDiff(expected, actual),
          pass: false,
        };
      }
    }
  }

  return {pass: true};
}

function toHaveBeenCalledWithInteractions(
  fn,
  index,
  expectedArray,
  expectedExecutionID
) {
  if (fn.mock.calls.length <= index) {
    return {
      message: () =>
        `Expected mock function to have been called at least ${index +
          1} times but it was only called ${fn.mock.calls.length} times.`,
      pass: false,
    };
  }

  const [actualSet, actualExecutionID] = fn.mock.calls[index];

  if (actualExecutionID !== expectedExecutionID) {
    return {
      message: () =>
        `Expected execution ID ${expectedExecutionID} but was ${actualExecutionID}`,
      pass: false,
    };
  }

  return toMatchInteractions(actualSet, expectedArray);
}

function toHaveBeenLastCalledWithInteractions(
  fn,
  expectedArray,
  expectedExecutionID
) {
  return toHaveBeenCalledWithInteractions(
    fn,
    fn.mock.calls.length - 1,
    expectedArray,
    expectedExecutionID
  );
}

module.exports = {
  toContainNoInteractions,
  toHaveBeenCalledWithInteractions,
  toHaveBeenLastCalledWithInteractions,
  toMatchInteractions,
};
