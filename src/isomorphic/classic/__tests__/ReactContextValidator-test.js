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

// This test doesn't really have a good home yet. I'm leaving it here since this
// behavior belongs to the old propTypes system yet is currently implemented
// in the core ReactCompositeComponent. It should technically live in core's
// test suite but I'll leave it here to indicate that this is an issue that
// needs to be fixed.

'use strict';

var React;
var ReactDOM;
var ReactTestUtils;

describe('ReactContextValidator', () => {
  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  beforeEach(() => {
    jest.resetModules();

    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');
  });

  // TODO: This behavior creates a runtime dependency on propTypes. We should
  // ensure that this is not required for ES6 classes with Flow.

  it('should filter out context not in contextTypes', () => {
    var Component = React.createClass({
      contextTypes: {
        foo: React.PropTypes.string,
      },

      render: function() {
        return <div />;
      },
    });

    var ComponentInFooBarContext = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string,
        bar: React.PropTypes.number,
      },

      getChildContext: function() {
        return {
          foo: 'abc',
          bar: 123,
        };
      },

      render: function() {
        return <Component ref="child" />;
      },
    });

    var instance = ReactTestUtils.renderIntoDocument(<ComponentInFooBarContext />);
    expect(instance.refs.child.context).toEqual({foo: 'abc'});
  });

  it('should pass next context to lifecycles', () => {
    var actualComponentWillReceiveProps;
    var actualShouldComponentUpdate;
    var actualComponentWillUpdate;

    var Parent = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string.isRequired,
        bar: React.PropTypes.string.isRequired,
      },

      getChildContext: function() {
        return {
          foo: this.props.foo,
          bar: 'bar',
        };
      },

      render: function() {
        return <Component />;
      },
    });

    var Component = React.createClass({
      contextTypes: {
        foo: React.PropTypes.string,
      },

      componentWillReceiveProps: function(nextProps, nextContext) {
        actualComponentWillReceiveProps = nextContext;
        return true;
      },

      shouldComponentUpdate: function(nextProps, nextState, nextContext) {
        actualShouldComponentUpdate = nextContext;
        return true;
      },

      componentWillUpdate: function(nextProps, nextState, nextContext) {
        actualComponentWillUpdate = nextContext;
      },

      render: function() {
        return <div />;
      },
    });

    var container = document.createElement('div');
    ReactDOM.render(<Parent foo="abc" />, container);
    ReactDOM.render(<Parent foo="def" />, container);
    expect(actualComponentWillReceiveProps).toEqual({foo: 'def'});
    expect(actualShouldComponentUpdate).toEqual({foo: 'def'});
    expect(actualComponentWillUpdate).toEqual({foo: 'def'});
  });

  it('should pass previous context to lifecycles', () => {
    var actualComponentDidUpdate;

    var Parent = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string.isRequired,
        bar: React.PropTypes.string.isRequired,
      },

      getChildContext: function() {
        return {
          foo: this.props.foo,
          bar: 'bar',
        };
      },

      render: function() {
        return <Component />;
      },
    });

    var Component = React.createClass({
      contextTypes: {
        foo: React.PropTypes.string,
      },

      componentDidUpdate: function(prevProps, prevState, prevContext) {
        actualComponentDidUpdate = prevContext;
      },

      render: function() {
        return <div />;
      },
    });

    var container = document.createElement('div');
    ReactDOM.render(<Parent foo="abc" />, container);
    ReactDOM.render(<Parent foo="def" />, container);
    expect(actualComponentDidUpdate).toEqual({foo: 'abc'});
  });

  it('should check context types', () => {
    spyOn(console, 'error');

    var Component = React.createClass({
      contextTypes: {
        foo: React.PropTypes.string.isRequired,
      },

      render: function() {
        return <div />;
      },
    });

    ReactTestUtils.renderIntoDocument(<Component />);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
      'Warning: Failed context type: ' +
      'The context `foo` is marked as required in `Component`, but its value ' +
      'is `undefined`.\n' +
      '    in Component (at **)'
    );

    var ComponentInFooStringContext = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string,
      },

      getChildContext: function() {
        return {
          foo: this.props.fooValue,
        };
      },

      render: function() {
        return <Component />;
      },
    });

    ReactTestUtils.renderIntoDocument(
      <ComponentInFooStringContext fooValue={'bar'} />
    );

    // Previous call should not error
    expectDev(console.error.calls.count()).toBe(1);

    var ComponentInFooNumberContext = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.number,
      },

      getChildContext: function() {
        return {
          foo: this.props.fooValue,
        };
      },

      render: function() {
        return <Component />;
      },
    });

    ReactTestUtils.renderIntoDocument(<ComponentInFooNumberContext fooValue={123} />);

    expectDev(console.error.calls.count()).toBe(2);
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(1)[0])).toBe(
      'Warning: Failed context type: ' +
      'Invalid context `foo` of type `number` supplied ' +
      'to `Component`, expected `string`.\n' +
      '    in Component (at **)\n' +
      '    in ComponentInFooNumberContext (at **)'
    );
  });

  it('should check child context types', () => {
    spyOn(console, 'error');

    var Component = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string.isRequired,
        bar: React.PropTypes.number,
      },

      getChildContext: function() {
        return this.props.testContext;
      },

      render: function() {
        return <div />;
      },
    });

    ReactTestUtils.renderIntoDocument(<Component testContext={{bar: 123}} />);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
      'Warning: Failed childContext type: ' +
      'The child context `foo` is marked as required in `Component`, but its ' +
      'value is `undefined`.\n' +
      '    in Component (at **)'
    );

    ReactTestUtils.renderIntoDocument(<Component testContext={{foo: 123}} />);

    expectDev(console.error.calls.count()).toBe(2);
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(1)[0])).toBe(
      'Warning: Failed childContext type: ' +
      'Invalid child context `foo` of type `number` ' +
      'supplied to `Component`, expected `string`.\n' +
      '    in Component (at **)'
    );

    ReactTestUtils.renderIntoDocument(
      <Component testContext={{foo: 'foo', bar: 123}} />
    );

    ReactTestUtils.renderIntoDocument(
      <Component testContext={{foo: 'foo'}} />
    );

    // Previous calls should not log errors
    expectDev(console.error.calls.count()).toBe(2);
  });

  // TODO (bvaughn) Remove this test and the associated behavior in the future.
  // It has only been added in Fiber to match the (unintentional) behavior in Stack.
  it('should warn (but not error) if getChildContext method is missing', () => {
    spyOn(console, 'error');

    class ComponentA extends React.Component {
      static childContextTypes = {
        foo: React.PropTypes.string.isRequired,
      };
      render() {
        return <div />;
      }
    }
    class ComponentB extends React.Component {
      static childContextTypes = {
        foo: React.PropTypes.string.isRequired,
      };
      render() {
        return <div />;
      }
    }

    ReactTestUtils.renderIntoDocument(<ComponentA/>);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
      'Warning: ComponentA.childContextTypes is specified but there is no ' +
      'getChildContext() method on the instance. You can either define ' +
      'getChildContext() on ComponentA or remove childContextTypes from it.'
    );

    // Warnings should be deduped by component type
    ReactTestUtils.renderIntoDocument(<ComponentA/>);
    expectDev(console.error.calls.count()).toBe(1);
    ReactTestUtils.renderIntoDocument(<ComponentB/>);
    expectDev(console.error.calls.count()).toBe(2);
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(1)[0])).toBe(
      'Warning: ComponentB.childContextTypes is specified but there is no ' +
      'getChildContext() method on the instance. You can either define ' +
      'getChildContext() on ComponentB or remove childContextTypes from it.'
    );
  });

  // TODO (bvaughn) Remove this test and the associated behavior in the future.
  // It has only been added in Fiber to match the (unintentional) behavior in Stack.
  it('should pass parent context if getChildContext method is missing', () => {
    spyOn(console, 'error');

    class ParentContextProvider extends React.Component {
      static childContextTypes = {
        foo: React.PropTypes.number,
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
        bar: React.PropTypes.string.isRequired,
      };
      render() {
        return <ChildContextConsumer />;
      }
    }

    var childContext;
    var ChildContextConsumer = React.createClass({
      contextTypes: {
        bar: React.PropTypes.string.isRequired,
        foo: React.PropTypes.string.isRequired,
      },
      render: function() {
        childContext = this.context;
        return <div />;
      },
    });

    ReactTestUtils.renderIntoDocument(<ParentContextProvider/>);
    expect(childContext.bar).toBeUndefined();
    expect(childContext.foo).toBe('FOO');
  });

});
