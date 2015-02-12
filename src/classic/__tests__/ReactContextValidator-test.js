/**
 * Copyright 2013-2015, Facebook, Inc.
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
var ReactTestUtils;

var reactComponentExpect;
var mocks;

describe('ReactContextValidator', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();

    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');
    mocks = require('mocks');

    spyOn(console, 'warn');
  });

  // TODO: This behavior creates a runtime dependency on propTypes. We should
  // ensure that this is not required for ES6 classes with Flow.

  it('should filter out context not in contextTypes', function() {
    var Component = React.createClass({
      contextTypes: {
        foo: React.PropTypes.string
      },

      render: function() {
        return <div />;
      }
    });

    var ComponentInFooBarContext = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string,
        bar: React.PropTypes.number
      },

      getChildContext: function() {
        return {
          foo: 'abc',
          bar: 123
        };
      },

      render: function() {
        return <Component />;
      }
    });

    var instance = ReactTestUtils.renderIntoDocument(<ComponentInFooBarContext />);
    reactComponentExpect(instance).expectRenderedChild().scalarContextEqual({foo: 'abc'});
  });

  it('should filter context properly in callbacks', function() {
    var actualComponentWillReceiveProps;
    var actualShouldComponentUpdate;
    var actualComponentWillUpdate;
    var actualComponentDidUpdate;

    var Parent = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string.isRequired,
        bar: React.PropTypes.string.isRequired
      },

      getChildContext: function() {
        return {
          foo: this.props.foo,
          bar: "bar"
        };
      },

      render: function() {
        return <Component />;
      }
    });

    var Component = React.createClass({
      contextTypes: {
        foo: React.PropTypes.string
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

      componentDidUpdate: function(prevProps, prevState, prevContext) {
        actualComponentDidUpdate = prevContext;
      },

      render: function() {
        return <div />;
      }
    });

    var instance = <Parent foo="abc" />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    instance.replaceProps({foo: "def"});
    expect(actualComponentWillReceiveProps).toEqual({foo: 'def'});
    expect(actualShouldComponentUpdate).toEqual({foo: 'def'});
    expect(actualComponentWillUpdate).toEqual({foo: 'def'});
    expect(actualComponentDidUpdate).toEqual({foo: 'abc'});
  });

  it('should check context types', function() {
    var Component = React.createClass({
      contextTypes: {
        foo: React.PropTypes.string.isRequired
      },

      render: function() {
        return <div />;
      }
    });

    ReactTestUtils.renderIntoDocument(<Component />);

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: Failed Context Types: ' +
      'Required context `foo` was not specified in `Component`.'
    );

    var ComponentInFooStringContext = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string
      },

      getChildContext: function() {
        return {
          foo: this.props.fooValue
        };
      },

      render: function() {
        return <Component />;
      }
    });

    ReactTestUtils.renderIntoDocument(
      <ComponentInFooStringContext fooValue={'bar'} />
    );

    // Previous call should not error
    expect(console.warn.argsForCall.length).toBe(1);

    var ComponentInFooNumberContext = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.number
      },

      getChildContext: function() {
        return {
          foo: this.props.fooValue
        };
      },

      render: function() {
        return <Component />;
      }
    });

    ReactTestUtils.renderIntoDocument(<ComponentInFooNumberContext fooValue={123} />);

    expect(console.warn.argsForCall.length).toBe(2);
    expect(console.warn.argsForCall[1][0]).toBe(
      'Warning: Failed Context Types: ' +
      'Invalid context `foo` of type `number` supplied ' +
      'to `Component`, expected `string`.' +
      ' Check the render method of `ComponentInFooNumberContext`.'
    );
  });

  it('should check child context types', function() {
    var Component = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string.isRequired,
        bar: React.PropTypes.number
      },

      getChildContext: function() {
        return this.props.testContext;
      },

      render: function() {
        return <div />;
      }
    });

    ReactTestUtils.renderIntoDocument(<Component testContext={{bar: 123}} />);
    expect(console.warn.argsForCall.length).toBe(2);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: Failed Context Types: ' +
      'Required child context `foo` was not specified in `Component`.'
    );
    expect(console.warn.argsForCall[1][0]).toBe(
      'Warning: Failed Context Types: ' +
      'Required child context `foo` was not specified in `Component`.'
    );

    ReactTestUtils.renderIntoDocument(<Component testContext={{foo: 123}} />);

    expect(console.warn.argsForCall.length).toBe(4);
    expect(console.warn.argsForCall[3][0]).toBe(
      'Warning: Failed Context Types: ' +
      'Invalid child context `foo` of type `number` ' +
      'supplied to `Component`, expected `string`.'
    );

    ReactTestUtils.renderIntoDocument(
      <Component testContext={{foo: 'foo', bar: 123}} />
    );

    ReactTestUtils.renderIntoDocument(
      <Component testContext={{foo: 'foo'}} />
    );

    // Previous calls should not log errors
    expect(console.warn.argsForCall.length).toBe(4);
  });

});
