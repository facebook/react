/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule MetaMatchers
 */

'use strict';

/**
 * This modules adds a jasmine matcher toEqualSpecsIn that can be used to
 * compare the specs in two different "describe" functions and their result.
 * It can be used to test a test.
 */

function getRunnerWithResults(describeFunction) {
  if (describeFunction._cachedRunner) {
    // Cached result of execution. This is a convenience way to test against
    // the same authoritative function multiple times.
    return describeFunction._cachedRunner;
  }
  // Patch the current global environment.
  const env = new jasmine.Env();
  // Execute the tests synchronously.
  env.updateInterval = 0;
  const outerGetEnv = jasmine.getEnv;
  jasmine.getEnv = function() {
    return env;
  };
  // TODO: Bring over matchers from the existing environment.
  const runner = env.currentRunner();
  try {
    env.describe('', describeFunction);
    env.execute();
  } finally {
    // Restore the environment.
    jasmine.getEnv = outerGetEnv;
  }
  describeFunction._cachedRunner = runner;
  return runner;
}

function compareSpec(actual, expected) {
  if (actual.results().totalCount !== expected.results().totalCount) {
    return (
      'Expected ' + expected.results().totalCount + ' expects, ' +
      'but got ' + actual.results().totalCount + ':' +
      actual.getFullName()
    );
  }
  return null;
}

function includesDescription(specs, description, startIndex) {
  for (let i = startIndex; i < specs.length; i++) {
    if (specs[i].description === description) {
      return true;
    }
  }
  return false;
}

function compareSpecs(actualSpecs, expectedSpecs) {
  for (var i = 0; i < actualSpecs.length && i < expectedSpecs.length; i++) {
    const actual = actualSpecs[i];
    const expected = expectedSpecs[i];
    if (actual.description === expected.description) {
      const errorMessage = compareSpec(actual, expected);
      if (errorMessage) {
        return errorMessage;
      }
      continue;
    } else if (includesDescription(actualSpecs, expected.description, i)) {
      return 'Did not expect the spec:' + actualSpecs[i].getFullName();
    } else {
      return 'Expected an equivalent to:' + expectedSpecs[i].getFullName();
    }
  }
  if (i < actualSpecs.length) {
    return 'Did not expect the spec:' + actualSpecs[i].getFullName();
  }
  if (i < expectedSpecs.length) {
    return 'Expected an equivalent to:' + expectedSpecs[i].getFullName();
  }
  return null;
}

function compareDescription(a, b) {
  if (a.description === b.description) {
    return 0;
  }
  return a.description < b.description ? -1 : 1;
}

function compareRunners(actual, expected) {
  return compareSpecs(
    actual.specs().sort(compareDescription),
    expected.specs().sort(compareDescription)
  );
}

const MetaMatchers = {
  toEqualSpecsIn: function(expectedDescribeFunction) {
    const actualDescribeFunction = this.actual;
    if (typeof actualDescribeFunction !== 'function') {
      throw Error('toEqualSpecsIn() should be used on a describe function');
    }
    if (typeof expectedDescribeFunction !== 'function') {
      throw Error('toEqualSpecsIn() should be passed a describe function');
    }
    var actual = getRunnerWithResults(actualDescribeFunction);
    const expected = getRunnerWithResults(expectedDescribeFunction);
    const errorMessage = compareRunners(actual, expected);
    this.message = function() {
      return [
        errorMessage,
        'The specs are equal. Expected them to be different.',
      ];
    };
    return !errorMessage;
  },
};

module.exports = MetaMatchers;
