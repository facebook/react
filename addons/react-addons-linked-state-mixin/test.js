/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let LinkedStateMixin;
let createReactClass;
let React;
let ReactDOM;
let ReactTestUtils;

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
            message:
              'Expected test not to warn. If the warning is expected, mock ' +
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

describe('LinkedStateMixin', () => {
  beforeEach(() => {
    jest.resetModules();

    createReactClass = require('create-react-class');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
    LinkedStateMixin = require(process.env.TEST_ENTRY);
  });

  // https://facebook.github.io/react/docs/two-way-binding-helpers.html#linkedstatemixin-before-and-after
  it('should work with valueLink', () => {
    spyOn(console, 'error'); // Ignore deprecated valueLink message for now

    const WithLink = createReactClass({
      mixins: [LinkedStateMixin],
      getInitialState: function() {
        return {message: 'Hello!'};
      },
      render: function() {
        return <input type="text" valueLink={this.linkState('message')} />;
      }
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
    const WithoutLink = createReactClass({
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
      }
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
