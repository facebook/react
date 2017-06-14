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
var shallowCompare;

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

// Tests adapted from ReactComponentWithPureRendererMixin and ReactPureComponent tests
describe('shallowCompare', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    shallowCompare = require(process.env.TEST_ENTRY);
  });

  it('should render', () => {
    var renders = 0;
    class Component extends React.Component {
      constructor() {
        super();
        this.state = {type: 'mushrooms'};
      }
      render() {
        renders++;
        return React.createElement('div', null, this.props.text[0]);
      }
      shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState);
      }
    }

    var container = document.createElement('div');
    var text;
    var component;

    text = ['porcini'];
    component = ReactDOM.render(
      React.createElement(Component, {text}),
      container
    );
    expect(container.textContent).toBe('porcini');
    expect(renders).toBe(1);

    text = ['morel'];
    component = ReactDOM.render(
      React.createElement(Component, {text}),
      container
    );
    expect(container.textContent).toBe('morel');
    expect(renders).toBe(2);

    text[0] = 'portobello';
    component = ReactDOM.render(
      React.createElement(Component, {text}),
      container
    );
    expect(container.textContent).toBe('morel');
    expect(renders).toBe(2);

    // Setting state without changing it doesn't cause a rerender.
    component.setState({type: 'mushrooms'});
    expect(container.textContent).toBe('morel');
    expect(renders).toBe(2);

    // But changing state does.
    component.setState({type: 'portobello mushrooms'});
    expect(container.textContent).toBe('portobello');
    expect(renders).toBe(3);
  });

  it('can override shouldComponentUpdate', () => {
    var renders = 0;
    class Component extends React.PureComponent {
      render() {
        renders++;
        return React.createElement('div');
      }
      shouldComponentUpdate() {
        return true;
      }
    }
    var container = document.createElement('div');
    ReactDOM.render(React.createElement(Component), container);
    ReactDOM.render(React.createElement(Component), container);
    expect(renders).toBe(2);
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

      shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState);
      }

      render() {
        return React.createElement(Apple, {
          color: this.state.color,
          ref: 'apple'
        });
      }
    }

    var Apple = React.createClass({
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

      shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState);
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
      shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState);
      },

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
