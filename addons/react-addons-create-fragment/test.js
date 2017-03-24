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
var ReactDOM;
var createReactFragment;

// For testing DOM Fiber.
global.requestAnimationFrame = function(callback) {
  setTimeout(callback);
};

global.requestIdleCallback = function(callback) {
  setTimeout(() => {
    callback({ timeRemaining() { return Infinity; } });
  });
};

const expectDev = function expectDev(actual) {
  const expectation = expect(actual);
  if (global.__suppressDevFailures) {
    Object.keys(expectation).forEach((name) => {
      wrapDevMatcher(expectation, name);
      wrapDevMatcher(expectation.not, name);
    });
  }
  return expectation;
};

describe('createReactFragment', () => {
  beforeEach(() => {
    jest.resetModules()

    React = require('react');
    ReactDOM = require('react-dom');
    createReactFragment = require('./index');
  });

  it('should throw if a plain object is used as a child', () => {
    spyOn(console, 'error')

    var children = {
      x: React.createElement('span'),
      y: React.createElement('span'),
      z: React.createElement('span'),
    };
    var element = React.createElement('div', {}, [children]);
    var container = document.createElement('div');
    expect(() => ReactDOM.render(element, container)).toThrowError(
      'Objects are not valid as a React child (found: object with keys {x, y, z}). ' +
      'If you meant to render a collection of children, use an array instead.',
    );
  });

  it('should throw if a plain object even if it is in an owner', () => {
    spyOn(console, 'error')

    class Foo extends React.Component {
      render() {
        var children = {
          a: React.createElement('span'),
          b: React.createElement('span'),
          c: React.createElement('span'),
        };
        return React.createElement('div', {}, [children]);
      }
    }
    var container = document.createElement('div');
    expect(() => ReactDOM.render(React.createElement(Foo), container)).toThrowError(
      'Objects are not valid as a React child (found: object with keys {a, b, c}). ' +
      'If you meant to render a collection of children, use an array instead.\n\n' +
       'Check the render method of `Foo`.',
    );
  });

  it('warns for numeric keys on objects as children', () => {
    spyOn(console, 'error');

    createReactFragment({1: React.createElement('span'), 2: React.createElement('span')});

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
