/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

var React;
var ReactDescriptor;
var ReactTestUtils;

describe('ReactDescriptor', function() {
  var ComponentFactory;
  var ComponentClass;

  beforeEach(function() {
    React = require('React');
    ReactDescriptor = require('ReactDescriptor');
    ReactTestUtils = require('ReactTestUtils');
    ComponentFactory = React.createClass({
      render: function() { return <div />; }
    });
    ComponentClass = ComponentFactory.type;
  });

  it('returns a complete descriptor according to spec', function() {
    var descriptor = React.createFactory(ComponentFactory)();
    expect(descriptor.type).toBe(ComponentClass);
    expect(descriptor.key).toBe(null);
    expect(descriptor.ref).toBe(null);
    expect(descriptor.props).toEqual({});
  });

  it('allows a string to be passed as the type', function() {
    var descriptor = React.createFactory('div')();
    expect(descriptor.type).toBe('div');
    expect(descriptor.key).toBe(null);
    expect(descriptor.ref).toBe(null);
    expect(descriptor.props).toEqual({});
  });

  it('returns an immutable descriptor', function() {
    var descriptor = React.createFactory(ComponentFactory)();
    expect(() => descriptor.type = 'div').toThrow();
  });

  it('does not reuse the original config object', function() {
    var config = { foo: 1 };
    var descriptor = React.createFactory(ComponentFactory)(config);
    expect(descriptor.props.foo).toBe(1);
    config.foo = 2;
    expect(descriptor.props.foo).toBe(1);
  });

  it('extracts key and ref from the config', function() {
    var descriptor = React.createFactory(ComponentFactory)({
      key: '12',
      ref: '34',
      foo: '56'
    });
    expect(descriptor.type).toBe(ComponentClass);
    expect(descriptor.key).toBe('12');
    expect(descriptor.ref).toBe('34');
    expect(descriptor.props).toEqual({foo:'56'});
  });

  it('coerces the key to a string', function() {
    var descriptor = React.createFactory(ComponentFactory)({
      key: 12,
      foo: '56'
    });
    expect(descriptor.type).toBe(ComponentClass);
    expect(descriptor.key).toBe('12');
    expect(descriptor.ref).toBe(null);
    expect(descriptor.props).toEqual({foo:'56'});
  });

  it('preserves the context on the descriptor', function() {
    var Component = React.createFactory(ComponentFactory);
    var descriptor;

    var Wrapper = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string
      },
      getChildContext: function() {
        return { foo: 'bar' };
      },
      render: function() {
        descriptor = Component();
        return descriptor;
      }
    });

    ReactTestUtils.renderIntoDocument(<Wrapper />);

    expect(descriptor._context).toEqual({ foo: 'bar' });
  });

  it('preserves the owner on the descriptor', function() {
    var Component = React.createFactory(ComponentFactory);
    var descriptor;

    var Wrapper = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string
      },
      getChildContext: function() {
        return { foo: 'bar' };
      },
      render: function() {
        descriptor = Component();
        return descriptor;
      }
    });

    var instance = ReactTestUtils.renderIntoDocument(<Wrapper />);

    expect(descriptor._owner).toBe(instance);
  });

  it('merges an additional argument onto the children prop', function() {
    spyOn(console, 'warn');
    var a = 1;
    var descriptor = React.createFactory(ComponentFactory)({
      children: 'text'
    }, a);
    expect(descriptor.props.children).toBe(a);
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('does not override children if no rest args are provided', function() {
    spyOn(console, 'warn');
    var descriptor = React.createFactory(ComponentFactory)({
      children: 'text'
    });
    expect(descriptor.props.children).toBe('text');
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('overrides children if null is provided as an argument', function() {
    spyOn(console, 'warn');
    var descriptor = React.createFactory(ComponentFactory)({
      children: 'text'
    }, null);
    expect(descriptor.props.children).toBe(null);
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('merges rest arguments onto the children prop in an array', function() {
    spyOn(console, 'warn');
    var a = 1, b = 2, c = 3;
    var descriptor = React.createFactory(ComponentFactory)(null, a, b, c);
    expect(descriptor.props.children).toEqual([1, 2, 3]);
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('warns for keys for arrays of descriptors in rest args', function() {
    spyOn(console, 'warn');
    var Component = React.createFactory(ComponentFactory);

    Component(null, [ Component(), Component() ]);

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Each child in an array should have a unique "key" prop'
    );
  });

  it('does not warn when the descriptor is directly in rest args', function() {
    spyOn(console, 'warn');
    var Component = React.createFactory(ComponentFactory);

    Component(null, Component(), Component());

    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('does not warn when the array contains a non-descriptor', function() {
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

    var descriptor = <ComponentClass />;
    expect(descriptor.type.someStaticMethod()).toBe('someReturnValue');
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('identifies valid descriptors', function() {
    var Component = React.createClass({
      render: function() {
        return <div />;
      }
    });

    expect(ReactDescriptor.isValidDescriptor(<div />)).toEqual(true);
    expect(ReactDescriptor.isValidDescriptor(<Component />)).toEqual(true);

    expect(ReactDescriptor.isValidDescriptor(null)).toEqual(false);
    expect(ReactDescriptor.isValidDescriptor(true)).toEqual(false);
    expect(ReactDescriptor.isValidDescriptor({})).toEqual(false);
    expect(ReactDescriptor.isValidDescriptor("string")).toEqual(false);
    expect(ReactDescriptor.isValidDescriptor(React.DOM.div)).toEqual(false);
    expect(ReactDescriptor.isValidDescriptor(Component)).toEqual(false);
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
    // TODO: This warning is temporarily disabled
    expect(console.warn.argsForCall.length).toBe(0);
    // expect(console.warn.argsForCall[0][0]).toContain(
    //   'This JSX uses a plain function.'
    // );
  });

  it('warns but allow a plain function to be immediately invoked', function() {
    spyOn(console, 'warn');
    var result = React.createDescriptor(function (x, y) {
      return 21 + x + y;
    }, 11, 10);
    expect(result).toBe(42);
    // TODO: This warning is temporarily disabled
    expect(console.warn.argsForCall.length).toBe(0);
    // expect(console.warn.argsForCall[0][0]).toContain(
    //   'This JSX uses a plain function.'
    // );
  });

  it('warns but does not fail on undefined results', function() {
    spyOn(console, 'warn');
    var fn = function () { };
    var result = React.createDescriptor(fn, 1, 2, null);
    expect(result).toBe(undefined);
    // TODO: This warning is temporarily disabled
    expect(console.warn.argsForCall.length).toBe(0);
    // expect(console.warn.argsForCall[0][0]).toContain(
    //   'This JSX uses a plain function.'
    // );
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

});
