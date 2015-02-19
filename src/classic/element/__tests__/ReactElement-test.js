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

var mocks;

var React;
var ReactTestUtils;

describe('ReactElement', function() {
  var ComponentClass;

  beforeEach(function() {
    require('mock-modules').dumpCache();

    mocks = require('mocks');

    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    ComponentClass = React.createClass({
      render: function() { return React.createElement('div'); }
    });
  });

  it('returns a complete element according to spec', function() {
    var element = React.createFactory(ComponentClass)();
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    expect(element.props).toEqual({});
  });

  it('allows a string to be passed as the type', function() {
    var element = React.createFactory('div')();
    expect(element.type).toBe('div');
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    expect(element.props).toEqual({});
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
      foo: '56'
    });
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe('12');
    expect(element.ref).toBe('34');
    expect(element.props).toEqual({foo:'56'});
  });

  it('coerces the key to a string', function() {
    var element = React.createFactory(ComponentClass)({
      key: 12,
      foo: '56'
    });
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe('12');
    expect(element.ref).toBe(null);
    expect(element.props).toEqual({foo:'56'});
  });

  it('preserves the legacy context on the element', function() {
    var Component = React.createFactory(ComponentClass);
    var element;

    var Wrapper = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string
      },
      getChildContext: function() {
        return {foo: 'bar'};
      },
      render: function() {
        element = Component();
        return element;
      }
    });

    ReactTestUtils.renderIntoDocument(
      React.createElement(Wrapper)
    );

    expect(element._context).toEqual({foo: 'bar'});
  });

  it('preserves the owner on the element', function() {
    var Component = React.createFactory(ComponentClass);
    var element;

    var Wrapper = React.createClass({
      render: function() {
        element = Component();
        return element;
      }
    });

    var instance = ReactTestUtils.renderIntoDocument(
      React.createElement(Wrapper)
    );

    expect(element._owner.getPublicInstance()).toBe(instance);
  });

  it('merges an additional argument onto the children prop', function() {
    spyOn(console, 'warn');
    var a = 1;
    var element = React.createFactory(ComponentClass)({
      children: 'text'
    }, a);
    expect(element.props.children).toBe(a);
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('does not override children if no rest args are provided', function() {
    spyOn(console, 'warn');
    var element = React.createFactory(ComponentClass)({
      children: 'text'
    });
    expect(element.props.children).toBe('text');
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('overrides children if null is provided as an argument', function() {
    spyOn(console, 'warn');
    var element = React.createFactory(ComponentClass)({
      children: 'text'
    }, null);
    expect(element.props.children).toBe(null);
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('merges rest arguments onto the children prop in an array', function() {
    spyOn(console, 'warn');
    var a = 1, b = 2, c = 3;
    var element = React.createFactory(ComponentClass)(null, a, b, c);
    expect(element.props.children).toEqual([1, 2, 3]);
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('allows static methods to be called using the type property', function() {
    spyOn(console, 'warn');

    var ComponentClass = React.createClass({
      statics: {
        someStaticMethod: function() {
          return 'someReturnValue';
        }
      },
      getInitialState: function() {
        return {valueToReturn: 'hi'};
      },
      render: function() {
        return React.createElement('div');
      }
    });

    var element = React.createElement(ComponentClass);
    expect(element.type.someStaticMethod()).toBe('someReturnValue');
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('identifies valid elements', function() {
    var Component = React.createClass({
      render: function() {
        return React.createElement('div');
      }
    });

    expect(React.isValidElement(React.createElement('div')))
      .toEqual(true);
    expect(React.isValidElement(React.createElement(Component)))
      .toEqual(true);

    expect(React.isValidElement(null)).toEqual(false);
    expect(React.isValidElement(true)).toEqual(false);
    expect(React.isValidElement({})).toEqual(false);
    expect(React.isValidElement("string")).toEqual(false);
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
        specialType: React.PropTypes.shape({monkey: React.PropTypes.any})
      }
    });

    expect(typeof Component.specialType).toBe("function");
    expect(typeof Component.specialType.isRequired).toBe("function");
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
      }
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
      }
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

  it('warns when changing a prop after element creation', function() {
    spyOn(console, 'warn');
    var Outer = React.createClass({
      render: function() {
        var el = <div className="moo" />;

        // This assignment warns but should still work for now.
        el.props.className = 'quack';
        expect(el.props.className).toBe('quack');

        return el;
      }
    });
    var outer = ReactTestUtils.renderIntoDocument(<Outer color="orange" />);
    expect(outer.getDOMNode().className).toBe('quack');

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Don\'t set .props.className of the React component <div />.'
    );
    expect(console.warn.argsForCall[0][0]).toContain(
      'The element was created by Outer.'
    );

    console.warn.reset();

    // This also warns (just once per key/type pair)
    outer.props.color = 'green';
    outer.forceUpdate();
    outer.props.color = 'purple';
    outer.forceUpdate();

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Don\'t set .props.color of the React component <Outer />.'
    );
  });

  it('warns when adding a prop after element creation', function() {
    spyOn(console, 'warn');
    var el = document.createElement('div');
    var Outer = React.createClass({
      getDefaultProps: () => ({sound: 'meow'}),
      render: function() {
        var el = <div>{this.props.sound}</div>;

        // This assignment doesn't warn immediately (because we can't) but it
        // warns upon mount.
        el.props.className = 'quack';
        expect(el.props.className).toBe('quack');

        return el;
      }
    });
    var outer = React.render(<Outer />, el);
    expect(outer.getDOMNode().textContent).toBe('meow');
    expect(outer.getDOMNode().className).toBe('quack');

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Don\'t set .props.className of the React component <div />.'
    );
    expect(console.warn.argsForCall[0][0]).toContain(
      'The element was created by Outer.'
    );

    console.warn.reset();

    var newOuterEl = <Outer />;
    newOuterEl.props.sound = 'oink';
    outer = React.render(newOuterEl, el);
    expect(outer.getDOMNode().textContent).toBe('oink');
    expect(outer.getDOMNode().className).toBe('quack');

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Don\'t set .props.sound of the React component <Outer />.'
    );
  });

  it('does not warn for NaN props', function() {
    spyOn(console, 'warn');
    var Test = React.createClass({
      render: function() {
        return <div />;
      }
    });
    var test = ReactTestUtils.renderIntoDocument(<Test value={+undefined} />);
    expect(test.props.value).toBeNaN();
    expect(console.warn.argsForCall.length).toBe(0);
  });

});
