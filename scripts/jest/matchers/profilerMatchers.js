'use strict';

const jestDiff = require('jest-diff').default;

function toHaveLastRenderedWithNoInteractions(onRenderMockFn) {
  const calls = onRenderMockFn.mock.calls;
  if (calls.length === 0) {
    return {
      message: () => 'Mock onRender function was not called',
      pass: false,
    };
  }
}

function toHaveLastRenderedWithInteractions(
  onRenderMockFn,
  expectedInteractions
) {
  const calls = onRenderMockFn.mock.calls;
  if (calls.length === 0) {
    return {
      message: () => 'Mock onRender function was not called',
      pass: false,
    };
  }

  const lastCall = calls[calls.length - 1];
  const actualInteractions = lastCall[6];

  return toMatchInteractions(actualInteractions, expectedInteractions);
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

function toMatchInteractions(actualSetOrArray, expectedSetOrArray) {
  const actualArray = Array.from(actualSetOrArray);
  const expectedArray = Array.from(expectedSetOrArray);

  if (actualArray.length !== expectedArray.length) {
    return {
      message: () =>
        `Expected ${expectedArray.length} interactions but there were ${actualArray.length}`,
      pass: false,
    };
  }

  for (let i = 0; i < actualArray.length; i++) {
    const result = toMatchInteraction(actualArray[i], expectedArray[i]);
    if (result.pass === false) {
      return result;
    }
  }

  return {pass: true};
}

module.exports = {
  toHaveLastRenderedWithInteractions,
  toHaveLastRenderedWithNoInteractions,
};
