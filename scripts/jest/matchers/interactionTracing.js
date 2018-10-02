/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const jestDiff = require('jest-diff');
const {toMatchInteraction, toMatchInteractions} = require('jest-scheduler');

// TODO (bvaughn) Remove this matcher once tests no longer reference it
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

// TODO (bvaughn) Remove this matcher once tests no longer reference it
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

  return toMatchInteractions(actualInteractions, expectedInteractions);
}

// TODO (bvaughn) Remove these matchers once tests no longer reference them
module.exports = {
  toHaveBeenLastNotifiedOfInteraction,
  toHaveBeenLastNotifiedOfWork,
};
