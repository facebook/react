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

var React;
var ReactDOM;
var ReactTestUtils;

describe('ReactClass-spec', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should throw when `render` is not specified', () => {
    expect(function() {
      React.createClass({});
    }).toThrowError(
      'createClass(...): Class specification must implement a `render` method.',
    );
  });

  it('should copy `displayName` onto the Constructor', () => {
    var TestComponent = React.createClass({
      render: function() {
        return <div />;
      },
    });

    expect(TestComponent.displayName).toBe('TestComponent');
  });

  it('should copy prop types onto the Constructor', () => {
    var propValidator = jest.fn();
    var TestComponent = React.createClass({
      propTypes: {
        value: propValidator,
      },
      render: function() {
        return <div />;
      },
    });

    expect(TestComponent.propTypes).toBeDefined();
    expect(TestComponent.propTypes.value).toBe(propValidator);
  });

  it('should warn on invalid prop types', () => {
    spyOn(console, 'error');
    React.createClass({
      displayName: 'Component',
      propTypes: {
        prop: null,
      },
      render: function() {
        return <span>{this.props.prop}</span>;
      },
    });
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Component: prop type `prop` is invalid; ' +
        'it must be a function, usually from React.PropTypes.',
    );
  });

  it('should warn on invalid context types', () => {
    spyOn(console, 'error');
    React.createClass({
      displayName: 'Component',
      contextTypes: {
        prop: null,
      },
      render: function() {
        return <span>{this.props.prop}</span>;
      },
    });
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Component: context type `prop` is invalid; ' +
        'it must be a function, usually from React.PropTypes.',
    );
  });

  it('should throw on invalid child context types', () => {
    spyOn(console, 'error');
    React.createClass({
      displayName: 'Component',
      childContextTypes: {
        prop: null,
      },
      render: function() {
        return <span>{this.props.prop}</span>;
      },
    });
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Component: child context type `prop` is invalid; ' +
        'it must be a function, usually from React.PropTypes.',
    );
  });

  it('should warn when mispelling shouldComponentUpdate', () => {
    spyOn(console, 'error');

    React.createClass({
      componentShouldUpdate: function() {
        return false;
      },
      render: function() {
        return <div />;
      },
    });
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: A component has a method called componentShouldUpdate(). Did you ' +
        'mean shouldComponentUpdate()? The name is phrased as a question ' +
        'because the function is expected to return a value.',
    );

    React.createClass({
      displayName: 'NamedComponent',
      componentShouldUpdate: function() {
        return false;
      },
      render: function() {
        return <div />;
      },
    });
    expectDev(console.error.calls.count()).toBe(2);
    expectDev(console.error.calls.argsFor(1)[0]).toBe(
      'Warning: NamedComponent has a method called componentShouldUpdate(). Did you ' +
        'mean shouldComponentUpdate()? The name is phrased as a question ' +
        'because the function is expected to return a value.',
    );
  });

  it('should warn when mispelling componentWillReceiveProps', () => {
    spyOn(console, 'error');
    React.createClass({
      componentWillRecieveProps: function() {
        return false;
      },
      render: function() {
        return <div />;
      },
    });
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: A component has a method called componentWillRecieveProps(). Did you ' +
        'mean componentWillReceiveProps()?',
    );
  });

  it('should throw if a reserved property is in statics', () => {
    expect(function() {
      React.createClass({
        statics: {
          getDefaultProps: function() {
            return {
              foo: 0,
            };
          },
        },

        render: function() {
          return <span />;
        },
      });
    }).toThrowError(
      'ReactClass: You are attempting to define a reserved property, ' +
        '`getDefaultProps`, that shouldn\'t be on the "statics" key. Define ' +
        'it as an instance property instead; it will still be accessible on ' +
        'the constructor.',
    );
  });

  // TODO: Consider actually moving these to statics or drop this unit test.

  xit('should warn when using deprecated non-static spec keys', () => {
    spyOn(console, 'error');
    React.createClass({
      mixins: [{}],
      propTypes: {
        foo: React.PropTypes.string,
      },
      contextTypes: {
        foo: React.PropTypes.string,
      },
      childContextTypes: {
        foo: React.PropTypes.string,
      },
      render: function() {
        return <div />;
      },
    });
    expectDev(console.error.calls.count()).toBe(4);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'createClass(...): `mixins` is now a static property and should ' +
        'be defined inside "statics".',
    );
    expectDev(console.error.calls.argsFor(1)[0]).toBe(
      'createClass(...): `propTypes` is now a static property and should ' +
        'be defined inside "statics".',
    );
    expectDev(console.error.calls.argsFor(2)[0]).toBe(
      'createClass(...): `contextTypes` is now a static property and ' +
        'should be defined inside "statics".',
    );
    expectDev(console.error.calls.argsFor(3)[0]).toBe(
      'createClass(...): `childContextTypes` is now a static property and ' +
        'should be defined inside "statics".',
    );
  });

  it('should support statics', () => {
    var Component = React.createClass({
      statics: {
        abc: 'def',
        def: 0,
        ghi: null,
        jkl: 'mno',
        pqr: function() {
          return this;
        },
      },

      render: function() {
        return <span />;
      },
    });
    var instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.constructor.abc).toBe('def');
    expect(Component.abc).toBe('def');
    expect(instance.constructor.def).toBe(0);
    expect(Component.def).toBe(0);
    expect(instance.constructor.ghi).toBe(null);
    expect(Component.ghi).toBe(null);
    expect(instance.constructor.jkl).toBe('mno');
    expect(Component.jkl).toBe('mno');
    expect(instance.constructor.pqr()).toBe(Component);
    expect(Component.pqr()).toBe(Component);
  });

  it('should work with object getInitialState() return values', () => {
    var Component = React.createClass({
      getInitialState: function() {
        return {
          occupation: 'clown',
        };
      },
      render: function() {
        return <span />;
      },
    });
    var instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state.occupation).toEqual('clown');
  });

  it('renders based on context getInitialState', () => {
    var Foo = React.createClass({
      contextTypes: {
        className: React.PropTypes.string,
      },
      getInitialState() {
        return {className: this.context.className};
      },
      render() {
        return <span className={this.state.className} />;
      },
    });

    var Outer = React.createClass({
      childContextTypes: {
        className: React.PropTypes.string,
      },
      getChildContext() {
        return {className: 'foo'};
      },
      render() {
        return <Foo />;
      },
    });

    var container = document.createElement('div');
    ReactDOM.render(<Outer />, container);
    expect(container.firstChild.className).toBe('foo');
  });

  it('should throw with non-object getInitialState() return values', () => {
    [['an array'], 'a string', 1234].forEach(function(state) {
      var Component = React.createClass({
        getInitialState: function() {
          return state;
        },
        render: function() {
          return <span />;
        },
      });
      var instance = <Component />;
      expect(function() {
        instance = ReactTestUtils.renderIntoDocument(instance);
      }).toThrowError(
        'Component.getInitialState(): must return an object or null',
      );
    });
  });

  it('should work with a null getInitialState() return value', () => {
    var Component = React.createClass({
      getInitialState: function() {
        return null;
      },
      render: function() {
        return <span />;
      },
    });
    expect(() =>
      ReactTestUtils.renderIntoDocument(<Component />)).not.toThrow();
  });

  it('should throw when using legacy factories', () => {
    spyOn(console, 'error');
    var Component = React.createClass({
      render() {
        return <div />;
      },
    });

    expect(() => Component()).toThrow();
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Something is calling a React component directly. Use a ' +
        'factory or JSX instead. See: https://fb.me/react-legacyfactory',
    );
  });
});
