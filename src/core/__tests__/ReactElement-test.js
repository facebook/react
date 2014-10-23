/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

"use strict";

var React;
var ReactElement;
var ReactTestUtils;

describe('ReactElement', function() {
  var ComponentFactory;
  var ComponentClass;

  beforeEach(function() {
    React = require('React');
    ReactElement = require('ReactElement');
    ReactTestUtils = require('ReactTestUtils');
    ComponentFactory = React.createClass({
      render: function() { return <div />; }
    });
    ComponentClass = ComponentFactory.type;
  });

  it('returns a complete element according to spec', function() {
    var element = React.createFactory(ComponentFactory)();
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
    var element = React.createFactory(ComponentFactory)();
    expect(() => element.type = 'div').toThrow();
  });

  it('does not reuse the original config object', function() {
    var config = { foo: 1 };
    var element = React.createFactory(ComponentFactory)(config);
    expect(element.props.foo).toBe(1);
    config.foo = 2;
    expect(element.props.foo).toBe(1);
  });

  it('extracts key and ref from the config', function() {
    var element = React.createFactory(ComponentFactory)({
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
    var element = React.createFactory(ComponentFactory)({
      key: 12,
      foo: '56'
    });
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe('12');
    expect(element.ref).toBe(null);
    expect(element.props).toEqual({foo:'56'});
  });

  it('treats a null key as omitted but warns', function() {
    spyOn(console, 'warn');
    var element = React.createFactory(ComponentFactory)({
      key: null,
      foo: '56'
    });
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe(null);  // as opposed to string 'null'
    expect(element.ref).toBe(null);
    expect(element.props).toEqual({foo:'56'});
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'will be treated as equivalent to the string \'null\''
    );
  });

  it('preserves the context on the element', function() {
    var Component = React.createFactory(ComponentFactory);
    var element;

    var Wrapper = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string
      },
      getChildContext: function() {
        return { foo: 'bar' };
      },
      render: function() {
        element = Component();
        return element;
      }
    });

    ReactTestUtils.renderIntoDocument(<Wrapper />);

    expect(element._context).toEqual({ foo: 'bar' });
  });

  it('preserves the owner on the element', function() {
    var Component = React.createFactory(ComponentFactory);
    var element;

    var Wrapper = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string
      },
      getChildContext: function() {
        return { foo: 'bar' };
      },
      render: function() {
        element = Component();
        return element;
      }
    });

    var instance = ReactTestUtils.renderIntoDocument(<Wrapper />);

    expect(element._owner).toBe(instance);
  });

  it('merges an additional argument onto the children prop', function() {
    spyOn(console, 'warn');
    var a = 1;
    var element = React.createFactory(ComponentFactory)({
      children: 'text'
    }, a);
    expect(element.props.children).toBe(a);
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('does not override children if no rest args are provided', function() {
    spyOn(console, 'warn');
    var element = React.createFactory(ComponentFactory)({
      children: 'text'
    });
    expect(element.props.children).toBe('text');
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('overrides children if null is provided as an argument', function() {
    spyOn(console, 'warn');
    var element = React.createFactory(ComponentFactory)({
      children: 'text'
    }, null);
    expect(element.props.children).toBe(null);
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('merges rest arguments onto the children prop in an array', function() {
    spyOn(console, 'warn');
    var a = 1, b = 2, c = 3;
    var element = React.createFactory(ComponentFactory)(null, a, b, c);
    expect(element.props.children).toEqual([1, 2, 3]);
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('warns for keys for arrays of elements in rest args', function() {
    spyOn(console, 'warn');
    var Component = React.createFactory(ComponentFactory);

    Component(null, [ Component(), Component() ]);

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Each child in an array should have a unique "key" prop'
    );
  });

  it('does not warn when the element is directly in rest args', function() {
    spyOn(console, 'warn');
    var Component = React.createFactory(ComponentFactory);

    Component(null, Component(), Component());

    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('does not warn when the array contains a non-element', function() {
    spyOn(console, 'warn');
    var Component = React.createFactory(ComponentFactory);

    Component(null, [ {}, {} ]);

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
        return <div></div>;
      }
    });

    var element = <ComponentClass />;
    expect(element.type.someStaticMethod()).toBe('someReturnValue');
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('identifies valid elements', function() {
    var Component = React.createClass({
      render: function() {
        return <div />;
      }
    });

    expect(ReactElement.isValidElement(<div />)).toEqual(true);
    expect(ReactElement.isValidElement(<Component />)).toEqual(true);

    expect(ReactElement.isValidElement(null)).toEqual(false);
    expect(ReactElement.isValidElement(true)).toEqual(false);
    expect(ReactElement.isValidElement({})).toEqual(false);
    expect(ReactElement.isValidElement("string")).toEqual(false);
    expect(ReactElement.isValidElement(React.DOM.div)).toEqual(false);
    expect(ReactElement.isValidElement(Component)).toEqual(false);
  });

  it('warns but allow a plain function in a factory to be invoked', function() {
    spyOn(console, 'warn');
    // This is a temporary helper to allow JSX with plain functions.
    // This allow you to track down these callers and replace them with regular
    // function calls.
    var factory = React.createFactory(function (x) {
      return 21 + x;
    });
    expect(factory(21)).toBe(42);
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'This JSX uses a plain function.'
    );
  });

  it('warns but allow a plain function to be immediately invoked', function() {
    spyOn(console, 'warn');
    var result = React.createElement(function (x, y) {
      return 21 + x + y;
    }, 11, 10);
    expect(result).toBe(42);
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'This JSX uses a plain function.'
    );
  });

  it('warns but does not fail on undefined results', function() {
    spyOn(console, 'warn');
    var fn = function () { };
    var result = React.createElement(fn, 1, 2, null);
    expect(result).toBe(undefined);
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'This JSX uses a plain function.'
    );
  });


  it('should expose the underlying class from a legacy factory', function() {
    var Legacy = React.createClass({ render: function() { } });
    var factory = React.createFactory(Legacy);
    expect(factory.type).toBe(Legacy.type);
    expect(factory().type).toBe(Legacy.type);
  });

  it('allows the use of PropTypes validators in statics', function() {
    var Component = React.createClass({
      render: () => null,
      statics: {
        specialType: React.PropTypes.shape({monkey: React.PropTypes.any})
      }
    });

    expect(typeof Component.specialType).toBe("function");
    expect(typeof Component.specialType.isRequired).toBe("function");
  });

  it('allows a DOM element to be used with a string', function() {
    var element = React.createElement('div', { className: 'foo' });
    var instance = ReactTestUtils.renderIntoDocument(element);
    expect(instance.getDOMNode().tagName).toBe('DIV');
  });

  it('is indistinguishable from a plain object', function() {
    var element = React.createElement('div', { className: 'foo' });
    var object = {};
    expect(element.constructor).toBe(object.constructor);
  });

});
