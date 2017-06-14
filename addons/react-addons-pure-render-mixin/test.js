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
var ReactComponentWithPureRenderMixin;

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

function renderIntoDocument(element) {
  var node = document.createElement('div');
  return ReactDOM.render(element, node);
}

describe('PureRenderMixin', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactComponentWithPureRenderMixin = require(process.env.TEST_ENTRY);
  });

  it('provides a default shouldComponentUpdate implementation', () => {
    var renderCalls = 0;
    class PlasticWrap extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.state = {
          color: 'green'
        };
      }

      render() {
        return React.createElement(Apple, {
          color: this.state.color,
          ref: 'apple'
        });
      }
    }

    var Apple = React.createClass({
      mixins: [ReactComponentWithPureRenderMixin],

      getInitialState: function() {
        return {
          cut: false,
          slices: 1
        };
      },

      cut: function() {
        this.setState({
          cut: true,
          slices: 10
        });
      },

      eatSlice: function() {
        this.setState({
          slices: this.state.slices - 1
        });
      },

      render: function() {
        renderCalls++;
        return React.createElement('div');
      }
    });

    var instance = renderIntoDocument(React.createElement(PlasticWrap));
    expect(renderCalls).toBe(1);

    // Do not re-render based on props
    instance.setState({color: 'green'});
    expect(renderCalls).toBe(1);

    // Re-render based on props
    instance.setState({color: 'red'});
    expect(renderCalls).toBe(2);

    // Re-render base on state
    instance.refs.apple.cut();
    expect(renderCalls).toBe(3);

    // No re-render based on state
    instance.refs.apple.cut();
    expect(renderCalls).toBe(3);

    // Re-render based on state again
    instance.refs.apple.eatSlice();
    expect(renderCalls).toBe(4);
  });

  it('does not do a deep comparison', () => {
    function getInitialState() {
      return {
        foo: [1, 2, 3],
        bar: {a: 4, b: 5, c: 6}
      };
    }

    var renderCalls = 0;
    var initialSettings = getInitialState();

    var Component = React.createClass({
      mixins: [ReactComponentWithPureRenderMixin],

      getInitialState: function() {
        return initialSettings;
      },

      render: function() {
        renderCalls++;
        return React.createElement('div');
      }
    });

    var instance = renderIntoDocument(React.createElement(Component));
    expect(renderCalls).toBe(1);

    // Do not re-render if state is equal
    var settings = {
      foo: initialSettings.foo,
      bar: initialSettings.bar
    };
    instance.setState(settings);
    expect(renderCalls).toBe(1);

    // Re-render because one field changed
    initialSettings.foo = [1, 2, 3];
    instance.setState(initialSettings);
    expect(renderCalls).toBe(2);

    // Re-render because the object changed
    instance.setState(getInitialState());
    expect(renderCalls).toBe(3);
  });
});
