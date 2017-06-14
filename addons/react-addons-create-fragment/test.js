/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React;
var createReactFragment;

// Catch stray warnings
var env = jasmine.getEnv();
var callCount = 0;
var oldError = console.error;
var newError = function() {
  callCount++;
  oldError.apply(this, arguments);
};
console.error = newError;
env.beforeEach(() => {
  callCount = 0;
  jasmine.addMatchers({
    toBeReset() {
      return {
        compare(actual) {
          if (actual !== newError && !jasmine.isSpy(actual)) {
            return {
              pass: false,
              message: 'Test did not tear down console.error mock properly.'
            };
          }
          return {pass: true};
        }
      };
    },
    toNotHaveBeenCalled() {
      return {
        compare(actual) {
          return {
            pass: callCount === 0,
            message: 'Expected test not to warn. If the warning is expected, mock ' +
              "it out using spyOn(console, 'error'); and test that the " +
              'warning occurs.'
          };
        }
      };
    }
  });
});
env.afterEach(() => {
  expect(console.error).toBeReset();
  expect(console.error).toNotHaveBeenCalled();
});

// Suppress warning expectations for prod builds
function suppressDevMatcher(obj, name) {
  const original = obj[name];
  obj[name] = function devMatcher() {
    try {
      original.apply(this, arguments);
    } catch (e) {
      // skip
    }
  };
}
function expectDev(actual) {
  const expectation = expect(actual);
  if (process.env.NODE_ENV === 'production') {
    Object.keys(expectation).forEach(name => {
      suppressDevMatcher(expectation, name);
      suppressDevMatcher(expectation.not, name);
    });
  }
  return expectation;
}

describe('createReactFragment', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    createReactFragment = require(process.env.TEST_ENTRY);
  });

  it('warns for numeric keys on objects as children', () => {
    spyOn(console, 'error');

    createReactFragment({
      1: React.createElement('span'),
      2: React.createElement('span')
    });

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Child objects should have non-numeric keys so ordering is preserved.'
    );
  });

  it('should warn if passing null to createFragment', () => {
    spyOn(console, 'error');
    createReactFragment(null);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'React.addons.createFragment only accepts a single object.'
    );
  });

  it('should warn if passing an array to createFragment', () => {
    spyOn(console, 'error');
    createReactFragment([]);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'React.addons.createFragment only accepts a single object.'
    );
  });

  it('should warn if passing a ReactElement to createFragment', () => {
    spyOn(console, 'error');
    createReactFragment(React.createElement('div'));
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'React.addons.createFragment does not accept a ReactElement without a ' +
        'wrapper object.'
    );
  });
});
