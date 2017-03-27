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

// Polyfill for testing DOM Fiber.
global.requestAnimationFrame = function(callback) {
  setTimeout(callback);
};

global.requestIdleCallback = function(callback) {
  setTimeout(() => {
    callback({ timeRemaining() { return Infinity; } });
  });
};

function noop() {}

// Tests adapted from ReactComponentWithPureRendererMixin and ReactPureComponent tests
describe('LinkedStateMixin', function() {
  let LinkedInput;
  let React;
  let ReactDOM;

  beforeEach(function() {
    React = require('react');
    ReactDOM = require('react-dom');
    LinkedInput = require('./index');
  });

  it('should basically work', function() {
    spyOn(console, 'error'); // Unknown prop `requestChange` on <input> tag

    const container = document.createElement('div');
    const component = ReactDOM.render(
      React.createElement(LinkedInput, {
        value: "foo",
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
