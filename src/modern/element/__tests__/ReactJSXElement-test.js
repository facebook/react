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

var mocks;

var React;
var ReactTestUtils;

describe('ReactJSXElement', function() {
  var Component;

  beforeEach(function() {
    require('mock-modules').dumpCache();

    mocks = require('mocks');

    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    Component = class {
      render() { return <div />; }
    };
  });

  it('returns a complete element according to spec', function() {
    var element = <Component />;
    expect(element.type).toBe(Component);
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    expect(element.props).toEqual({});
  });

  it('allows a lower-case to be passed as the string type', function() {
    var element = <div />;
    expect(element.type).toBe('div');
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    expect(element.props).toEqual({});
  });

  it('allows a string to be passed as the type', function() {
    var TagName = 'div';
    var element = <TagName />;
    expect(element.type).toBe('div');
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    expect(element.props).toEqual({});
  });

  it('returns an immutable element', function() {
    var element = <Component />;
    expect(() => element.type = 'div').toThrow();
  });

  it('does not reuse the object that is spread into props', function() {
    var config = {foo: 1};
    var element = <Component {...config} />;
    expect(element.props.foo).toBe(1);
    config.foo = 2;
    expect(element.props.foo).toBe(1);
  });

  it('extracts key and ref from the rest of the props', function() {
    var element = <Component key="12" ref="34" foo="56" />;
    expect(element.type).toBe(Component);
    expect(element.key).toBe('12');
    expect(element.ref).toBe('34');
    expect(element.props).toEqual({foo:'56'});
  });

  it('coerces the key to a string', function() {
    var element = <Component key={12} foo="56" />;
    expect(element.type).toBe(Component);
    expect(element.key).toBe('12');
    expect(element.ref).toBe(null);
    expect(element.props).toEqual({foo:'56'});
  });

  it('merges JSX children onto the children prop', function() {
    spyOn(console, 'warn');
    var a = 1;
    var element = <Component children="text">{a}</Component>;
    expect(element.props.children).toBe(a);
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('does not override children if no JSX children are provided', function() {
    spyOn(console, 'warn');
    var element = <Component children="text" />;
    expect(element.props.children).toBe('text');
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('overrides children if null is provided as a JSX child', function() {
    spyOn(console, 'warn');
    var element = <Component children="text">{null}</Component>;
    expect(element.props.children).toBe(null);
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('merges JSX children onto the children prop in an array', function() {
    spyOn(console, 'warn');
    var a = 1, b = 2, c = 3;
    var element = <Component>{a}{b}{c}</Component>;
    expect(element.props.children).toEqual([1, 2, 3]);
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('allows static methods to be called using the type property', function() {
    spyOn(console, 'warn');

    class Component {
      static someStaticMethod() {
        return 'someReturnValue';
      }
      render() {
        return <div></div>;
      }
    }

    var element = <Component />;
    expect(element.type.someStaticMethod()).toBe('someReturnValue');
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('identifies valid elements', function() {
    class Component {
      render() {
        return <div />;
      }
    }

    expect(React.isValidElement(<div />)).toEqual(true);
    expect(React.isValidElement(<Component />)).toEqual(true);

    expect(React.isValidElement(null)).toEqual(false);
    expect(React.isValidElement(true)).toEqual(false);
    expect(React.isValidElement({})).toEqual(false);
    expect(React.isValidElement("string")).toEqual(false);
    expect(React.isValidElement(Component)).toEqual(false);
  });

  it('is indistinguishable from a plain object', function() {
    var element = <div className="foo" />;
    var object = {};
    expect(element.constructor).toBe(object.constructor);
  });

  it('should use default prop value when removing a prop', function() {
    class Component {
      render() {
        return <span />;
      }
    }
    Component.defaultProps = {fruit: 'persimmon'};

    var container = document.createElement('div');
    var instance = React.render(
      <Component fruit="mango" />,
      container
    );
    expect(instance.props.fruit).toBe('mango');

    React.render(<Component />, container);
    expect(instance.props.fruit).toBe('persimmon');
  });

  it('should normalize props with default values', function() {
    class Component {
      render() {
        return <span>{this.props.prop}</span>;
      }
    }
    Component.defaultProps = {prop: 'testKey'};

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.props.prop).toBe('testKey');

    var inst2 = ReactTestUtils.renderIntoDocument(<Component prop={null} />);
    expect(inst2.props.prop).toBe(null);
  });

});
