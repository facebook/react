/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

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

function noop() {}

// Tests adapted from ReactComponentWithPureRendererMixin and ReactPureComponent tests
describe('LinkedInput', function() {
  let LinkedInput;
  let React;
  let ReactDOM;

  beforeEach(function() {
    React = require('react');
    ReactDOM = require('react-dom');
    LinkedInput = require(process.env.TEST_ENTRY);
  });

  it('should basically work', function() {
    spyOn(console, 'error'); // Unknown prop `requestChange` on <input> tag

    const container = document.createElement('div');
    const component = ReactDOM.render(
      React.createElement(LinkedInput, {
        value: 'foo',
        onChange: noop
      }),
      container
    );
    const input = ReactDOM.findDOMNode(component);
    expect(input.value).toBe('foo');
    ReactDOM.render(
      React.createElement(LinkedInput, {
        valueLink: {value: 'boo'},
        requestChange: noop
      }),
      container
    );
    expect(input.value).toBe('boo');
  });

  it('should throw', function() {
    const container = document.createElement('div');
    const element = React.createElement(LinkedInput, {
      value: 'foo',
      valueLink: {
        value: 'boo',
        requestChange: noop
      }
    });
    expect(function() {
      ReactDOM.render(element, container);
    }).toThrow();
  });
});
