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

function toHaveBeenLastNotifiedOfInteraction(
  mockFunction,
  expectedInteraction
) {
  const calls = mockFunction.mock.calls;
  if (calls.length === 0) {
    return {
      message: () => 'Mock function was not called',
      pass: false,
    };
  }

  const [actualInteraction] = calls[calls.length - 1];

  return toMatchInteraction(actualInteraction, expectedInteraction);
}

function toHaveBeenLastNotifiedOfWork(
  mockFunction,
  expectedInteractions,
  expectedThreadID = undefined
) {
  const calls = mockFunction.mock.calls;
  if (calls.length === 0) {
    return {
      message: () => 'Mock function was not called',
      pass: false,
    };
  }

  const [actualInteractions, actualThreadID] = calls[calls.length - 1];

  if (expectedThreadID !== undefined) {
    if (expectedThreadID !== actualThreadID) {
      return {
        message: () => jestDiff(expectedThreadID + '', actualThreadID + ''),
        pass: false,
      };
    }
  }

  return toMatchInteractions(
    actualInteractions,
    Array.from(expectedInteractions)
  );
}

function toMatchInteraction(actual, expected) {
  let attribute;
  for (attribute in expected) {
    if (actual[attribute] !== expected[attribute]) {
      return {
        message: () => jestDiff(expected, actual),
        pass: false,
      };
    }
  }

  return {pass: true};
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

  for (let i = 0; i < actualArray.length; i++) {
    const match = toMatchInteraction(actualArray[i], expectedArray[i]);
    if (match.pass === false) {
      return match;
    }
  }

  return {pass: true};
}

module.exports = {
  toContainNoInteractions,
  toHaveBeenLastNotifiedOfInteraction,
  toHaveBeenLastNotifiedOfWork,
  toMatchInteraction,
  toMatchInteractions,
};
