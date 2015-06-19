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

'use strict';

// NOTE: We're explicitly not using JSX in this file. This is intended to test
// classic JS without JSX.

var React;
var ReactTestUtils;

describe('ReactElement', function() {
  var ComponentClass;

  beforeEach(function() {
    require('mock-modules').dumpCache();

    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    ComponentClass = React.createClass({
      render: function() {
        return React.createElement('div');
      },
    });
  });

  it('returns a complete element according to spec', function() {
    var element = React.createFactory(ComponentClass)();
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    var expectation = {};
    Object.freeze(expectation);
    expect(element.props).toEqual(expectation);
  });

  it('allows a string to be passed as the type', function() {
    var element = React.createFactory('div')();
    expect(element.type).toBe('div');
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    var expectation = {};
    Object.freeze(expectation);
    expect(element.props).toEqual(expectation);
  });

  it('returns an immutable element', function() {
    var element = React.createFactory(ComponentClass)();
    expect(() => element.type = 'div').toThrow();
  });

  it('does not reuse the original config object', function() {
    var config = {foo: 1};
    var element = React.createFactory(ComponentClass)(config);
    expect(element.props.foo).toBe(1);
    config.foo = 2;
    expect(element.props.foo).toBe(1);
  });

  it('extracts key and ref from the config', function() {
    var element = React.createFactory(ComponentClass)({
      key: '12',
      ref: '34',
      foo: '56',
    });
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe('12');
    expect(element.ref).toBe('34');
    var expectation = {foo:'56'};
    Object.freeze(expectation);
    expect(element.props).toEqual(expectation);
  });

  it('coerces the key to a string', function() {
    var element = React.createFactory(ComponentClass)({
      key: 12,
      foo: '56',
    });
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe('12');
    expect(element.ref).toBe(null);
    var expectation = {foo:'56'};
    Object.freeze(expectation);
    expect(element.props).toEqual(expectation);
  });

  it('preserves the owner on the element', function() {
    var Component = React.createFactory(ComponentClass);
    var element;

    var Wrapper = React.createClass({
      render: function() {
        element = Component();
        return element;
      },
    });

    var instance = ReactTestUtils.renderIntoDocument(
      React.createElement(Wrapper)
    );

    expect(element._owner.getPublicInstance()).toBe(instance);
  });

  it('merges an additional argument onto the children prop', function() {
    spyOn(console, 'error');
    var a = 1;
    var element = React.createFactory(ComponentClass)({
      children: 'text',
    }, a);
    expect(element.props.children).toBe(a);
    expect(console.error.argsForCall.length).toBe(0);
  });

  it('does not override children if no rest args are provided', function() {
    spyOn(console, 'error');
    var element = React.createFactory(ComponentClass)({
      children: 'text',
    });
    expect(element.props.children).toBe('text');
    expect(console.error.argsForCall.length).toBe(0);
  });

  it('overrides children if null is provided as an argument', function() {
    spyOn(console, 'error');
    var element = React.createFactory(ComponentClass)({
      children: 'text',
    }, null);
    expect(element.props.children).toBe(null);
    expect(console.error.argsForCall.length).toBe(0);
  });

  it('merges rest arguments onto the children prop in an array', function() {
    spyOn(console, 'error');
    var a = 1, b = 2, c = 3;
    var element = React.createFactory(ComponentClass)(null, a, b, c);
    expect(element.props.children).toEqual([1, 2, 3]);
    expect(console.error.argsForCall.length).toBe(0);
  });

  it('allows static methods to be called using the type property', function() {
    spyOn(console, 'error');

    var StaticMethodComponentClass = React.createClass({
      statics: {
        someStaticMethod: function() {
          return 'someReturnValue';
        },
      },
      getInitialState: function() {
        return {valueToReturn: 'hi'};
      },
      render: function() {
        return React.createElement('div');
      },
    });

    var element = React.createElement(StaticMethodComponentClass);
    expect(element.type.someStaticMethod()).toBe('someReturnValue');
    expect(console.error.argsForCall.length).toBe(0);
  });

  it('identifies valid elements', function() {
    var Component = React.createClass({
      render: function() {
        return React.createElement('div');
      },
    });

    expect(React.isValidElement(React.createElement('div')))
      .toEqual(true);
    expect(React.isValidElement(React.createElement(Component)))
      .toEqual(true);

    expect(React.isValidElement(null)).toEqual(false);
    expect(React.isValidElement(true)).toEqual(false);
    expect(React.isValidElement({})).toEqual(false);
    expect(React.isValidElement('string')).toEqual(false);
    expect(React.isValidElement(React.DOM.div)).toEqual(false);
    expect(React.isValidElement(Component)).toEqual(false);
  });

  it('allows the use of PropTypes validators in statics', function() {
    // TODO: This test was added to cover a special case where we proxied
    // methods. However, we don't do that any more so this test can probably
    // be removed. Leaving it in classic as a safety precausion.
    var Component = React.createClass({
      render: () => null,
      statics: {
        specialType: React.PropTypes.shape({monkey: React.PropTypes.any}),
      },
    });

    expect(typeof Component.specialType).toBe('function');
    expect(typeof Component.specialType.isRequired).toBe('function');
  });

  it('is indistinguishable from a plain object', function() {
    var element = React.createElement('div', {className: 'foo'});
    var object = {};
    expect(element.constructor).toBe(object.constructor);
  });

  it('should use default prop value when removing a prop', function() {
    var Component = React.createClass({
      getDefaultProps: function() {
        return {fruit: 'persimmon'};
      },
      render: function() {
        return React.createElement('span');
      },
    });

    var container = document.createElement('div');
    var instance = React.render(
      React.createElement(Component, {fruit: 'mango'}),
      container
    );
    expect(instance.props.fruit).toBe('mango');

    React.render(React.createElement(Component), container);
    expect(instance.props.fruit).toBe('persimmon');
  });

  it('should normalize props with default values', function() {
    var Component = React.createClass({
      getDefaultProps: function() {
        return {prop: 'testKey'};
      },
      render: function() {
        return React.createElement('span', null, this.props.prop);
      },
    });

    var instance = ReactTestUtils.renderIntoDocument(
      React.createElement(Component)
    );
    expect(instance.props.prop).toBe('testKey');

    var inst2 = ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {prop: null})
    );
    expect(inst2.props.prop).toBe(null);
  });

  it('throws when changing a prop (in dev) after element creation', function() {
    var Outer = React.createClass({
      render: function() {
        var el = <div className="moo" />;

        expect(function() {
          el.props.className = 'quack';
        }).toThrow();
        expect(el.props.className).toBe('moo');

        return el;
      },
    });
    var outer = ReactTestUtils.renderIntoDocument(<Outer color="orange" />);
    expect(React.findDOMNode(outer).className).toBe('moo');
  });

  it('throws when adding a prop (in dev) after element creation', function() {
    var container = document.createElement('div');
    var Outer = React.createClass({
      getDefaultProps: () => ({sound: 'meow'}),
      render: function() {
        var el = <div>{this.props.sound}</div>;

        expect(function() {
          el.props.className = 'quack';
        }).toThrow();

        expect(el.props.className).toBe(undefined);

        return el;
      },
    });
    var outer = React.render(<Outer />, container);
    expect(React.findDOMNode(outer).textContent).toBe('meow');
    expect(React.findDOMNode(outer).className).toBe('');
  });

  it('does not warn for NaN props', function() {
    spyOn(console, 'error');
    var Test = React.createClass({
      render: function() {
        return <div />;
      },
    });
    var test = ReactTestUtils.renderIntoDocument(<Test value={+undefined} />);
    expect(test.props.value).toBeNaN();
    expect(console.error.argsForCall.length).toBe(0);
  });

});
