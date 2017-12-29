/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

// This test doesn't really have a good home yet. I'm leaving it here since this
// behavior belongs to the old propTypes system yet is currently implemented
// in the core ReactCompositeComponent. It should technically live in core's
// test suite but I'll leave it here to indicate that this is an issue that
// needs to be fixed.

'use strict';

let PropTypes;
let React;
let ReactDOM;
let ReactTestUtils;

describe('ReactContextValidator', () => {
  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  beforeEach(() => {
    jest.resetModules();

    PropTypes = require('prop-types');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
  });

  // TODO: This behavior creates a runtime dependency on propTypes. We should
  // ensure that this is not required for ES6 classes with Flow.

  it('should filter out context not in contextTypes', () => {
    class Component extends React.Component {
      render() {
        return <div />;
      }
    }
    Component.contextTypes = {
      foo: PropTypes.string,
    };

    class ComponentInFooBarContext extends React.Component {
      getChildContext() {
        return {
          foo: 'abc',
          bar: 123,
        };
      }

      render() {
        return <Component ref="child" />;
      }
    }
    ComponentInFooBarContext.childContextTypes = {
      foo: PropTypes.string,
      bar: PropTypes.number,
    };

    const instance = ReactTestUtils.renderIntoDocument(
      <ComponentInFooBarContext />,
    );
    expect(instance.refs.child.context).toEqual({foo: 'abc'});
  });

  it('should pass next context to lifecycles', () => {
    let actualComponentWillReceiveProps;
    let actualShouldComponentUpdate;
    let actualComponentWillUpdate;

    class Parent extends React.Component {
      getChildContext() {
        return {
          foo: this.props.foo,
          bar: 'bar',
        };
      }

      render() {
        return <Component />;
      }
    }
    Parent.childContextTypes = {
      foo: PropTypes.string.isRequired,
      bar: PropTypes.string.isRequired,
    };

    class Component extends React.Component {
      componentWillReceiveProps(nextProps, nextContext) {
        actualComponentWillReceiveProps = nextContext;
        return true;
      }

      shouldComponentUpdate(nextProps, nextState, nextContext) {
        actualShouldComponentUpdate = nextContext;
        return true;
      }

      componentWillUpdate(nextProps, nextState, nextContext) {
        actualComponentWillUpdate = nextContext;
      }

      render() {
        return <div />;
      }
    }
    Component.contextTypes = {
      foo: PropTypes.string,
    };

    const container = document.createElement('div');
    ReactDOM.render(<Parent foo="abc" />, container);
    ReactDOM.render(<Parent foo="def" />, container);
    expect(actualComponentWillReceiveProps).toEqual({foo: 'def'});
    expect(actualShouldComponentUpdate).toEqual({foo: 'def'});
    expect(actualComponentWillUpdate).toEqual({foo: 'def'});
  });

  it('should not pass previous context to lifecycles', () => {
    let actualComponentDidUpdate;

    class Parent extends React.Component {
      getChildContext() {
        return {
          foo: this.props.foo,
        };
      }

      render() {
        return <Component />;
      }
    }
    Parent.childContextTypes = {
      foo: PropTypes.string.isRequired,
    };

    class Component extends React.Component {
      componentDidUpdate(...args) {
        actualComponentDidUpdate = args;
      }

      render() {
        return <div />;
      }
    }
    Component.contextTypes = {
      foo: PropTypes.string,
    };

    const container = document.createElement('div');
    ReactDOM.render(<Parent foo="abc" />, container);
    ReactDOM.render(<Parent foo="def" />, container);
    expect(actualComponentDidUpdate).toHaveLength(2);
  });

  it('should check context types', () => {
    spyOnDev(console, 'error');

    class Component extends React.Component {
      render() {
        return <div />;
      }
    }
    Component.contextTypes = {
      foo: PropTypes.string.isRequired,
    };

    ReactTestUtils.renderIntoDocument(<Component />);

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Failed context type: ' +
          'The context `foo` is marked as required in `Component`, but its value ' +
          'is `undefined`.\n' +
          '    in Component (at **)',
      );
    }

    class ComponentInFooStringContext extends React.Component {
      getChildContext() {
        return {
          foo: this.props.fooValue,
        };
      }

      render() {
        return <Component />;
      }
    }
    ComponentInFooStringContext.childContextTypes = {
      foo: PropTypes.string,
    };

    ReactTestUtils.renderIntoDocument(
      <ComponentInFooStringContext fooValue={'bar'} />,
    );

    // Previous call should not error
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
    }

    class ComponentInFooNumberContext extends React.Component {
      getChildContext() {
        return {
          foo: this.props.fooValue,
        };
      }

      render() {
        return <Component />;
      }
    }
    ComponentInFooNumberContext.childContextTypes = {
      foo: PropTypes.number,
    };

    ReactTestUtils.renderIntoDocument(
      <ComponentInFooNumberContext fooValue={123} />,
    );

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(2);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(1)[0])).toBe(
        'Warning: Failed context type: ' +
          'Invalid context `foo` of type `number` supplied ' +
          'to `Component`, expected `string`.\n' +
          '    in Component (at **)\n' +
          '    in ComponentInFooNumberContext (at **)',
      );
    }
  });

  it('should check child context types', () => {
    spyOnDev(console, 'error');

    class Component extends React.Component {
      getChildContext() {
        return this.props.testContext;
      }

      render() {
        return <div />;
      }
    }
    Component.childContextTypes = {
      foo: PropTypes.string.isRequired,
      bar: PropTypes.number,
    };

    ReactTestUtils.renderIntoDocument(<Component testContext={{bar: 123}} />);
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Failed child context type: ' +
          'The child context `foo` is marked as required in `Component`, but its ' +
          'value is `undefined`.\n' +
          '    in Component (at **)',
      );
    }

    ReactTestUtils.renderIntoDocument(<Component testContext={{foo: 123}} />);

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(2);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(1)[0])).toBe(
        'Warning: Failed child context type: ' +
          'Invalid child context `foo` of type `number` ' +
          'supplied to `Component`, expected `string`.\n' +
          '    in Component (at **)',
      );
    }

    ReactTestUtils.renderIntoDocument(
      <Component testContext={{foo: 'foo', bar: 123}} />,
    );

    ReactTestUtils.renderIntoDocument(<Component testContext={{foo: 'foo'}} />);

    if (__DEV__) {
      // Previous calls should not log errors
      expect(console.error.calls.count()).toBe(2);
    }
  });

  // TODO (bvaughn) Remove this test and the associated behavior in the future.
  // It has only been added in Fiber to match the (unintentional) behavior in Stack.
  it('should warn (but not error) if getChildContext method is missing', () => {
    spyOnDev(console, 'error');

    class ComponentA extends React.Component {
      static childContextTypes = {
        foo: PropTypes.string.isRequired,
      };
      render() {
        return <div />;
      }
    }
    class ComponentB extends React.Component {
      static childContextTypes = {
        foo: PropTypes.string.isRequired,
      };
      render() {
        return <div />;
      }
    }

    ReactTestUtils.renderIntoDocument(<ComponentA />);
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: ComponentA.childContextTypes is specified but there is no ' +
          'getChildContext() method on the instance. You can either define ' +
          'getChildContext() on ComponentA or remove childContextTypes from it.',
      );
    }

    // Warnings should be deduped by component type
    ReactTestUtils.renderIntoDocument(<ComponentA />);
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
    }
    ReactTestUtils.renderIntoDocument(<ComponentB />);
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(2);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(1)[0])).toBe(
        'Warning: ComponentB.childContextTypes is specified but there is no ' +
          'getChildContext() method on the instance. You can either define ' +
          'getChildContext() on ComponentB or remove childContextTypes from it.',
      );
    }
  });

  // TODO (bvaughn) Remove this test and the associated behavior in the future.
  // It has only been added in Fiber to match the (unintentional) behavior in Stack.
  it('should pass parent context if getChildContext method is missing', () => {
    spyOnDev(console, 'error');

    class ParentContextProvider extends React.Component {
      static childContextTypes = {
        foo: PropTypes.number,
      };
      getChildContext() {
        return {
          foo: 'FOO',
        };
      }
      render() {
        return <MiddleMissingContext />;
      }
    }

    class MiddleMissingContext extends React.Component {
      static childContextTypes = {
        bar: PropTypes.string.isRequired,
      };
      render() {
        return <ChildContextConsumer />;
      }
    }

    let childContext;
    class ChildContextConsumer extends React.Component {
      render() {
        childContext = this.context;
        return <div />;
      }
    }
    ChildContextConsumer.contextTypes = {
      bar: PropTypes.string.isRequired,
      foo: PropTypes.string.isRequired,
    };

    ReactTestUtils.renderIntoDocument(<ParentContextProvider />);
    expect(childContext.bar).toBeUndefined();
    expect(childContext.foo).toBe('FOO');
  });
});
