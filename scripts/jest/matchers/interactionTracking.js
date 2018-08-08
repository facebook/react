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

module.exports = {
  toContainNoInteractions,
  toMatchInteractions,
};
