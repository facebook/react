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

// For testing DOM Fiber.
global.requestAnimationFrame = function(callback) {
  setTimeout(callback);
};

global.requestIdleCallback = function(callback) {
  setTimeout(() => {
    callback({
      timeRemaining() {
        return Infinity;
      },
    });
  });
};

const expectDev = function expectDev(actual) {
  const expectation = expect(actual);
  return expectation;
};

describe('createReactFragment', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    createReactFragment = require('./index');
  });

  it('warns for numeric keys on objects as children', () => {
    spyOn(console, 'error');

    createReactFragment({
      1: React.createElement('span'),
      2: React.createElement('span'),
    });

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Child objects should have non-numeric keys so ordering is preserved.',
    );
  });

  it('should warn if passing null to createFragment', () => {
    spyOn(console, 'error');
    createReactFragment(null);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'React.addons.createFragment only accepts a single object.',
    );
  });

  it('should warn if passing an array to createFragment', () => {
    spyOn(console, 'error');
    createReactFragment([]);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'React.addons.createFragment only accepts a single object.',
    );
  });

  it('should warn if passing a ReactElement to createFragment', () => {
    spyOn(console, 'error');
    createReactFragment(React.createElement('div'));
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'React.addons.createFragment does not accept a ReactElement without a ' +
        'wrapper object.',
    );
  });
});
