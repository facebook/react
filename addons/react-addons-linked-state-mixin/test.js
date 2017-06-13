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

let LinkedStateMixin;
let React;
let ReactDOM;
let ReactTestUtils;

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

describe('LinkedStateMixin', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-addons-test-utils');
    LinkedStateMixin = require('./index');
  });

  // https://facebook.github.io/react/docs/two-way-binding-helpers.html#linkedstatemixin-before-and-after
  it('should work with valueLink', () => {
    spyOn(console, 'error'); // Ignore deprecated valueLink message for now

    const WithLink = React.createClass({
      mixins: [LinkedStateMixin],
      getInitialState: function() {
        return {message: 'Hello!'};
      },
      render: function() {
        return <input type="text" valueLink={this.linkState('message')} />;
      },
    });

    const instance = ReactTestUtils.renderIntoDocument(
      React.createElement(WithLink)
    );

    expect(instance.state.message).toBe('Hello!');

    const node = ReactDOM.findDOMNode(instance);
    node.value = 'Goodbye!';
    ReactTestUtils.Simulate.change(node);

    expect(instance.state.message).toBe('Goodbye!');
  });

  // https://facebook.github.io/react/docs/two-way-binding-helpers.html#linkedstatemixin-without-valuelink
  it('should work without valueLink', () => {
    const WithoutLink = React.createClass({
      mixins: [LinkedStateMixin],
      getInitialState: function() {
        return {message: 'Hello!'};
      },
      render: function() {
        var valueLink = this.linkState('message');
        var handleChange = function(e) {
          valueLink.requestChange(e.target.value);
        };
        return (
          <input type="text" value={valueLink.value} onChange={handleChange} />
        );
      },
    });

    const instance = ReactTestUtils.renderIntoDocument(
      React.createElement(WithoutLink)
    );

    expect(instance.state.message).toBe('Hello!');

    const node = ReactDOM.findDOMNode(instance);
    node.value = 'Goodbye!';
    ReactTestUtils.Simulate.change(node);

    expect(instance.state.message).toBe('Goodbye!');
  });
});
