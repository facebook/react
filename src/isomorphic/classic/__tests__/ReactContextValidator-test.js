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

var reactComponentExpect;

describe('ReactContextValidator', () => {
  function normalizeCodeLocInfo(str) {
    return str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  beforeEach(() => {
    jest.resetModuleRegistry();

    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');
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
      foo: React.PropTypes.string,
    };

    class ComponentInFooBarContext extends React.Component {
      getChildContext() {
        return {
          foo: 'abc',
          bar: 123,
        };
      }

      render() {
        return <Component />;
      }
    }
    ComponentInFooBarContext.childContextTypes = {
      foo: React.PropTypes.string,
      bar: React.PropTypes.number,
    };

    var instance = ReactTestUtils.renderIntoDocument(<ComponentInFooBarContext />);
    reactComponentExpect(instance).expectRenderedChild().scalarContextEqual({foo: 'abc'});
  });

  it('should filter context properly in callbacks', () => {
    var actualComponentWillReceiveProps;
    var actualShouldComponentUpdate;
    var actualComponentWillUpdate;
    var actualComponentDidUpdate;

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
      foo: React.PropTypes.string.isRequired,
      bar: React.PropTypes.string.isRequired,
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

      componentDidUpdate(prevProps, prevState, prevContext) {
        actualComponentDidUpdate = prevContext;
      }

      render() {
        return <div />;
      }
    }
    Component.contextTypes = {
      foo: React.PropTypes.string,
    };


    var container = document.createElement('div');
    ReactDOM.render(<Parent foo="abc" />, container);
    ReactDOM.render(<Parent foo="def" />, container);
    expect(actualComponentWillReceiveProps).toEqual({foo: 'def'});
    expect(actualShouldComponentUpdate).toEqual({foo: 'def'});
    expect(actualComponentWillUpdate).toEqual({foo: 'def'});
    expect(actualComponentDidUpdate).toEqual({foo: 'abc'});
  });

  it('should check context types', () => {
    spyOn(console, 'error');

    class Component extends React.Component {
      render() {
        return <div />;
      }
    }
    Component.contextTypes = {
      foo: React.PropTypes.string.isRequired,
    };

    ReactTestUtils.renderIntoDocument(<Component />);

    expect(console.error.calls.count()).toBe(1);
    expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
      'Warning: Failed context type: ' +
      'The context `foo` is marked as required in `Component`, but its value ' +
      'is `undefined`.\n' +
      '    in Component (at **)'
    );

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
      foo: React.PropTypes.string,
    };

    ReactTestUtils.renderIntoDocument(
      <ComponentInFooStringContext fooValue={'bar'} />
    );

    // Previous call should not error
    expect(console.error.calls.count()).toBe(1);

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
      foo: React.PropTypes.number,
    };

    ReactTestUtils.renderIntoDocument(<ComponentInFooNumberContext fooValue={123} />);

    expect(console.error.calls.count()).toBe(2);
    expect(normalizeCodeLocInfo(console.error.calls.argsFor(1)[0])).toBe(
      'Warning: Failed context type: ' +
      'Invalid context `foo` of type `number` supplied ' +
      'to `Component`, expected `string`.\n' +
      '    in Component (at **)\n' +
      '    in ComponentInFooNumberContext (at **)'
    );
  });

  it('should check child context types', () => {
    spyOn(console, 'error');

    class Component extends React.Component {
      getChildContext() {
        return this.props.testContext;
      }

      render() {
        return <div />;
      }
    }
    Component.childContextTypes = {
      foo: React.PropTypes.string.isRequired,
      bar: React.PropTypes.number,
    };

    ReactTestUtils.renderIntoDocument(<Component testContext={{bar: 123}} />);
    expect(console.error.calls.count()).toBe(1);
    expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
      'Warning: Failed childContext type: ' +
      'The child context `foo` is marked as required in `Component`, but its ' +
      'value is `undefined`.\n' +
      '    in Component (at **)'
    );

    ReactTestUtils.renderIntoDocument(<Component testContext={{foo: 123}} />);

    expect(console.error.calls.count()).toBe(2);
    expect(normalizeCodeLocInfo(console.error.calls.argsFor(1)[0])).toBe(
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
    expect(console.error.calls.count()).toBe(2);
  });

});
