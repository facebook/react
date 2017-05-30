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
var ReactDOMFeatureFlags;

describe('ReactElement', () => {
  var ComponentClass;
  var originalSymbol;

  beforeEach(() => {
    jest.resetModules();

    // Delete the native Symbol if we have one to ensure we test the
    // unpolyfilled environment.
    originalSymbol = global.Symbol;
    global.Symbol = undefined;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('ReactTestUtils');
    ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
    // NOTE: We're explicitly not using JSX here. This is intended to test
    // classic JS without JSX.
    ComponentClass = class extends React.Component {
      render() {
        return React.createElement('div');
      }
    };
  });

  afterEach(() => {
    global.Symbol = originalSymbol;
  });

  it('uses the fallback value when in an environment without Symbol', () => {
    expect(<div />.$$typeof).toBe(0xeac7);
  });

  it('returns a complete element according to spec', () => {
    var element = React.createFactory(ComponentClass)();
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    expect(Object.isFrozen(element)).toBe(true);
    expect(Object.isFrozen(element.props)).toBe(true);
    expect(element.props).toEqual({});
  });

  it('should warn when `key` is being accessed on composite element', () => {
    spyOn(console, 'error');
    var container = document.createElement('div');
    class Child extends React.Component {
      render() {
        return <div> {this.props.key} </div>;
      }
    }
    class Parent extends React.Component {
      render() {
        return (
          <div>
            <Child key="0" />
            <Child key="1" />
            <Child key="2" />
          </div>
        );
      }
    }
    expect(console.error.calls.count()).toBe(0);
    ReactDOM.render(<Parent />, container);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Child: `key` is not a prop. Trying to access it will result ' +
        'in `undefined` being returned. If you need to access the same ' +
        'value within the child component, you should pass it as a different ' +
        'prop. (https://fb.me/react-special-props)',
    );
  });

  it('should warn when `key` is being accessed on a host element', () => {
    spyOn(console, 'error');
    var element = <div key="3" />;
    expectDev(console.error.calls.count()).toBe(0);
    void element.props.key;
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'div: `key` is not a prop. Trying to access it will result ' +
        'in `undefined` being returned. If you need to access the same ' +
        'value within the child component, you should pass it as a different ' +
        'prop. (https://fb.me/react-special-props)',
    );
  });

  it('should warn when `ref` is being accessed', () => {
    spyOn(console, 'error');
    var container = document.createElement('div');
    class Child extends React.Component {
      render() {
        return <div> {this.props.ref} </div>;
      }
    }
    class Parent extends React.Component {
      render() {
        return (
          <div>
            <Child ref="childElement" />
          </div>
        );
      }
    }
    expect(console.error.calls.count()).toBe(0);
    ReactDOM.render(<Parent />, container);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Child: `ref` is not a prop. Trying to access it will result ' +
        'in `undefined` being returned. If you need to access the same ' +
        'value within the child component, you should pass it as a different ' +
        'prop. (https://fb.me/react-special-props)',
    );
  });

  it('allows a string to be passed as the type', () => {
    var element = React.createFactory('div')();
    expect(element.type).toBe('div');
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    expect(Object.isFrozen(element)).toBe(true);
    expect(Object.isFrozen(element.props)).toBe(true);
    expect(element.props).toEqual({});
  });

  it('returns an immutable element', () => {
    var element = React.createFactory(ComponentClass)();
    expect(() => (element.type = 'div')).toThrow();
  });

  it('does not reuse the original config object', () => {
    var config = {foo: 1};
    var element = React.createFactory(ComponentClass)(config);
    expect(element.props.foo).toBe(1);
    config.foo = 2;
    expect(element.props.foo).toBe(1);
  });

  it('does not fail if config has no prototype', () => {
    var config = Object.create(null, {foo: {value: 1, enumerable: true}});
    var element = React.createFactory(ComponentClass)(config);
    expect(element.props.foo).toBe(1);
  });

  it('extracts key and ref from the config', () => {
    var element = React.createFactory(ComponentClass)({
      key: '12',
      ref: '34',
      foo: '56',
    });
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe('12');
    expect(element.ref).toBe('34');
    expect(Object.isFrozen(element)).toBe(true);
    expect(Object.isFrozen(element.props)).toBe(true);
    expect(element.props).toEqual({foo: '56'});
  });

  it('extracts null key and ref', () => {
    var element = React.createFactory(ComponentClass)({
      key: null,
      ref: null,
      foo: '12',
    });
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe('null');
    expect(element.ref).toBe(null);
    expect(Object.isFrozen(element)).toBe(true);
    expect(Object.isFrozen(element.props)).toBe(true);
    expect(element.props).toEqual({foo: '12'});
  });

  it('ignores undefined key and ref', () => {
    var props = {
      foo: '56',
      key: undefined,
      ref: undefined,
    };
    var element = React.createFactory(ComponentClass)(props);
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    expect(Object.isFrozen(element)).toBe(true);
    expect(Object.isFrozen(element.props)).toBe(true);
    expect(element.props).toEqual({foo: '56'});
  });

  it('ignores key and ref warning getters', () => {
    var elementA = React.createElement('div');
    var elementB = React.createElement('div', elementA.props);
    expect(elementB.key).toBe(null);
    expect(elementB.ref).toBe(null);
  });

  it('coerces the key to a string', () => {
    var element = React.createFactory(ComponentClass)({
      key: 12,
      foo: '56',
    });
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe('12');
    expect(element.ref).toBe(null);
    expect(Object.isFrozen(element)).toBe(true);
    expect(Object.isFrozen(element.props)).toBe(true);
    expect(element.props).toEqual({foo: '56'});
  });

  it('preserves the owner on the element', () => {
    var Component = React.createFactory(ComponentClass);
    var element;

    class Wrapper extends React.Component {
      render() {
        element = Component();
        return element;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(
      React.createElement(Wrapper),
    );

    if (ReactDOMFeatureFlags.useFiber) {
      expect(element._owner.stateNode).toBe(instance);
    } else {
      expect(element._owner.getPublicInstance()).toBe(instance);
    }
  });

  it('merges an additional argument onto the children prop', () => {
    spyOn(console, 'error');
    var a = 1;
    var element = React.createFactory(ComponentClass)(
      {
        children: 'text',
      },
      a,
    );
    expect(element.props.children).toBe(a);
    expectDev(console.error.calls.count()).toBe(0);
  });

  it('does not override children if no rest args are provided', () => {
    spyOn(console, 'error');
    var element = React.createFactory(ComponentClass)({
      children: 'text',
    });
    expect(element.props.children).toBe('text');
    expectDev(console.error.calls.count()).toBe(0);
  });

  it('overrides children if null is provided as an argument', () => {
    spyOn(console, 'error');
    var element = React.createFactory(ComponentClass)(
      {
        children: 'text',
      },
      null,
    );
    expect(element.props.children).toBe(null);
    expectDev(console.error.calls.count()).toBe(0);
  });

  it('merges rest arguments onto the children prop in an array', () => {
    spyOn(console, 'error');
    var a = 1;
    var b = 2;
    var c = 3;
    var element = React.createFactory(ComponentClass)(null, a, b, c);
    expect(element.props.children).toEqual([1, 2, 3]);
    expectDev(console.error.calls.count()).toBe(0);
  });

  // NOTE: We're explicitly not using JSX here. This is intended to test
  // classic JS without JSX.
  it('allows static methods to be called using the type property', () => {
    spyOn(console, 'error');

    class StaticMethodComponentClass extends React.Component {
      render() {
        return React.createElement('div');
      }
    }
    StaticMethodComponentClass.someStaticMethod = () => 'someReturnValue';

    var element = React.createElement(StaticMethodComponentClass);
    expect(element.type.someStaticMethod()).toBe('someReturnValue');
    expectDev(console.error.calls.count()).toBe(0);
  });

  // NOTE: We're explicitly not using JSX here. This is intended to test
  // classic JS without JSX.
  it('identifies valid elements', () => {
    class Component extends React.Component {
      render() {
        return React.createElement('div');
      }
    }

    expect(React.isValidElement(React.createElement('div'))).toEqual(true);
    expect(React.isValidElement(React.createElement(Component))).toEqual(true);

    expect(React.isValidElement(null)).toEqual(false);
    expect(React.isValidElement(true)).toEqual(false);
    expect(React.isValidElement({})).toEqual(false);
    expect(React.isValidElement('string')).toEqual(false);
    expect(React.isValidElement(React.createFactory('div'))).toEqual(false);
    expect(React.isValidElement(Component)).toEqual(false);
    expect(React.isValidElement({type: 'div', props: {}})).toEqual(false);

    var jsonElement = JSON.stringify(React.createElement('div'));
    expect(React.isValidElement(JSON.parse(jsonElement))).toBe(true);
  });

  // NOTE: We're explicitly not using JSX here. This is intended to test
  // classic JS without JSX.
  it('is indistinguishable from a plain object', () => {
    var element = React.createElement('div', {className: 'foo'});
    var object = {};
    expect(element.constructor).toBe(object.constructor);
  });

  // NOTE: We're explicitly not using JSX here. This is intended to test
  // classic JS without JSX.
  it('should use default prop value when removing a prop', () => {
    class Component extends React.Component {
      render() {
        return React.createElement('span');
      }
    }
    Component.defaultProps = {fruit: 'persimmon'};

    var container = document.createElement('div');
    var instance = ReactDOM.render(
      React.createElement(Component, {fruit: 'mango'}),
      container,
    );
    expect(instance.props.fruit).toBe('mango');

    ReactDOM.render(React.createElement(Component), container);
    expect(instance.props.fruit).toBe('persimmon');
  });

  // NOTE: We're explicitly not using JSX here. This is intended to test
  // classic JS without JSX.
  it('should normalize props with default values', () => {
    class Component extends React.Component {
      render() {
        return React.createElement('span', null, this.props.prop);
      }
    }
    Component.defaultProps = {prop: 'testKey'};

    var instance = ReactTestUtils.renderIntoDocument(
      React.createElement(Component),
    );
    expect(instance.props.prop).toBe('testKey');

    var inst2 = ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {prop: null}),
    );
    expect(inst2.props.prop).toBe(null);
  });

  it('throws when changing a prop (in dev) after element creation', () => {
    class Outer extends React.Component {
      render() {
        var el = <div className="moo" />;

        expect(function() {
          el.props.className = 'quack';
        }).toThrow();
        expect(el.props.className).toBe('moo');

        return el;
      }
    }
    var outer = ReactTestUtils.renderIntoDocument(<Outer color="orange" />);
    expect(ReactDOM.findDOMNode(outer).className).toBe('moo');
  });

  it('throws when adding a prop (in dev) after element creation', () => {
    var container = document.createElement('div');
    class Outer extends React.Component {
      render() {
        var el = <div>{this.props.sound}</div>;

        expect(function() {
          el.props.className = 'quack';
        }).toThrow();

        expect(el.props.className).toBe(undefined);

        return el;
      }
    }
    Outer.defaultProps = {sound: 'meow'};
    var outer = ReactDOM.render(<Outer />, container);
    expect(ReactDOM.findDOMNode(outer).textContent).toBe('meow');
    expect(ReactDOM.findDOMNode(outer).className).toBe('');
  });

  it('does not warn for NaN props', () => {
    spyOn(console, 'error');
    class Test extends React.Component {
      render() {
        return <div />;
      }
    }
    var test = ReactTestUtils.renderIntoDocument(<Test value={+undefined} />);
    expect(test.props.value).toBeNaN();
    expectDev(console.error.calls.count()).toBe(0);
  });

  // NOTE: We're explicitly not using JSX here. This is intended to test
  // classic JS without JSX.
  it('identifies elements, but not JSON, if Symbols are supported', () => {
    // Rudimentary polyfill
    // Once all jest engines support Symbols natively we can swap this to test
    // WITH native Symbols by default.
    var REACT_ELEMENT_TYPE = function() {}; // fake Symbol
    var OTHER_SYMBOL = function() {}; // another fake Symbol
    global.Symbol = function(name) {
      return OTHER_SYMBOL;
    };
    global.Symbol.for = function(key) {
      if (key === 'react.element') {
        return REACT_ELEMENT_TYPE;
      }
      return OTHER_SYMBOL;
    };

    jest.resetModules();

    React = require('react');

    class Component extends React.Component {
      render() {
        return React.createElement('div');
      }
    }

    expect(React.isValidElement(React.createElement('div'))).toEqual(true);
    expect(React.isValidElement(React.createElement(Component))).toEqual(true);

    expect(React.isValidElement(null)).toEqual(false);
    expect(React.isValidElement(true)).toEqual(false);
    expect(React.isValidElement({})).toEqual(false);
    expect(React.isValidElement('string')).toEqual(false);
    expect(React.isValidElement(React.createFactory('div'))).toEqual(false);
    expect(React.isValidElement(Component)).toEqual(false);
    expect(React.isValidElement({type: 'div', props: {}})).toEqual(false);

    var jsonElement = JSON.stringify(React.createElement('div'));
    expect(React.isValidElement(JSON.parse(jsonElement))).toBe(false);
  });
});

describe('comparing jsx vs .createFactory() vs .createElement()', () => {
  var Child;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('ReactTestUtils');
    Child = jest.genMockFromModule('ReactElementTestChild');
  });

  describe('when using jsx only', () => {
    var Parent, instance;
    beforeEach(() => {
      Parent = class extends React.Component {
        render() {
          return (
            <div>
              <Child ref="child" foo="foo value">children value</Child>
            </div>
          );
        }
      };
      instance = ReactTestUtils.renderIntoDocument(<Parent />);
    });

    it('should scry children but cannot', () => {
      var children = ReactTestUtils.scryRenderedComponentsWithType(
        instance,
        Child,
      );
      expect(children.length).toBe(1);
    });

    it('does not maintain refs', () => {
      expect(instance.refs.child).not.toBeUndefined();
    });

    it('can capture Child instantiation calls', () => {
      expect(Child.mock.calls[0][0]).toEqual({
        foo: 'foo value',
        children: 'children value',
      });
    });
  });

  describe('when using parent that uses .createFactory()', () => {
    var factory, instance;
    beforeEach(() => {
      var childFactory = React.createFactory(Child);
      class Parent extends React.Component {
        render() {
          return React.createElement(
            'div',
            {},
            childFactory({ref: 'child', foo: 'foo value'}, 'children value'),
          );
        }
      }
      factory = React.createFactory(Parent);
      instance = ReactTestUtils.renderIntoDocument(factory());
    });

    it('can properly scry children', () => {
      var children = ReactTestUtils.scryRenderedComponentsWithType(
        instance,
        Child,
      );
      expect(children.length).toBe(1);
    });

    it('does not maintain refs', () => {
      expect(instance.refs.child).not.toBeUndefined();
    });

    it('can capture Child instantiation calls', () => {
      expect(Child.mock.calls[0][0]).toEqual({
        foo: 'foo value',
        children: 'children value',
      });
    });
  });

  describe('when using parent that uses .createElement()', () => {
    var factory, instance;
    beforeEach(() => {
      class Parent extends React.Component {
        render() {
          return React.createElement(
            'div',
            {},
            React.createElement(
              Child,
              {ref: 'child', foo: 'foo value'},
              'children value',
            ),
          );
        }
      }
      factory = React.createFactory(Parent);
      instance = ReactTestUtils.renderIntoDocument(factory());
    });

    it('should scry children but cannot', () => {
      var children = ReactTestUtils.scryRenderedComponentsWithType(
        instance,
        Child,
      );
      expect(children.length).toBe(1);
    });

    it('does not maintain refs', () => {
      expect(instance.refs.child).not.toBeUndefined();
    });

    it('can capture Child instantiation calls', () => {
      expect(Child.mock.calls[0][0]).toEqual({
        foo: 'foo value',
        children: 'children value',
      });
    });
  });
});
