/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactTestUtils;

describe('ReactElement', () => {
  let ComponentClass;
  let originalSymbol;

  beforeEach(() => {
    jest.resetModules();

    // Delete the native Symbol if we have one to ensure we test the
    // unpolyfilled environment.
    originalSymbol = global.Symbol;
    global.Symbol = undefined;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
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
    const element = React.createFactory(ComponentClass)();
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    if (__DEV__) {
      expect(Object.isFrozen(element)).toBe(true);
      expect(Object.isFrozen(element.props)).toBe(true);
    }
    expect(element.props).toEqual({});
  });

  it('should warn when `key` is being accessed on composite element', () => {
    spyOnDev(console, 'error');
    const container = document.createElement('div');
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
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(0);
    }
    ReactDOM.render(<Parent />, container);
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Child: `key` is not a prop. Trying to access it will result ' +
          'in `undefined` being returned. If you need to access the same ' +
          'value within the child component, you should pass it as a different ' +
          'prop. (https://fb.me/react-special-props)',
      );
    }
  });

  it('should warn when `key` is being accessed on a host element', () => {
    spyOnDev(console, 'error');
    const element = <div key="3" />;
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(0);
    }
    void element.props.key;
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'div: `key` is not a prop. Trying to access it will result ' +
          'in `undefined` being returned. If you need to access the same ' +
          'value within the child component, you should pass it as a different ' +
          'prop. (https://fb.me/react-special-props)',
      );
    }
  });

  it('should warn when `ref` is being accessed', () => {
    spyOnDev(console, 'error');
    const container = document.createElement('div');
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
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(0);
    }
    ReactDOM.render(<Parent />, container);
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Child: `ref` is not a prop. Trying to access it will result ' +
          'in `undefined` being returned. If you need to access the same ' +
          'value within the child component, you should pass it as a different ' +
          'prop. (https://fb.me/react-special-props)',
      );
    }
  });

  it('allows a string to be passed as the type', () => {
    const element = React.createFactory('div')();
    expect(element.type).toBe('div');
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    if (__DEV__) {
      expect(Object.isFrozen(element)).toBe(true);
      expect(Object.isFrozen(element.props)).toBe(true);
    }
    expect(element.props).toEqual({});
  });

  it('returns an immutable element', () => {
    const element = React.createFactory(ComponentClass)();
    if (__DEV__) {
      expect(() => (element.type = 'div')).toThrow();
    } else {
      expect(() => (element.type = 'div')).not.toThrow();
    }
  });

  it('does not reuse the original config object', () => {
    const config = {foo: 1};
    const element = React.createFactory(ComponentClass)(config);
    expect(element.props.foo).toBe(1);
    config.foo = 2;
    expect(element.props.foo).toBe(1);
  });

  it('does not fail if config has no prototype', () => {
    const config = Object.create(null, {foo: {value: 1, enumerable: true}});
    const element = React.createFactory(ComponentClass)(config);
    expect(element.props.foo).toBe(1);
  });

  it('extracts key and ref from the config', () => {
    const element = React.createFactory(ComponentClass)({
      key: '12',
      ref: '34',
      foo: '56',
    });
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe('12');
    expect(element.ref).toBe('34');
    if (__DEV__) {
      expect(Object.isFrozen(element)).toBe(true);
      expect(Object.isFrozen(element.props)).toBe(true);
    }
    expect(element.props).toEqual({foo: '56'});
  });

  it('extracts null key and ref', () => {
    const element = React.createFactory(ComponentClass)({
      key: null,
      ref: null,
      foo: '12',
    });
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe('null');
    expect(element.ref).toBe(null);
    if (__DEV__) {
      expect(Object.isFrozen(element)).toBe(true);
      expect(Object.isFrozen(element.props)).toBe(true);
    }
    expect(element.props).toEqual({foo: '12'});
  });

  it('ignores undefined key and ref', () => {
    const props = {
      foo: '56',
      key: undefined,
      ref: undefined,
    };
    const element = React.createFactory(ComponentClass)(props);
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    if (__DEV__) {
      expect(Object.isFrozen(element)).toBe(true);
      expect(Object.isFrozen(element.props)).toBe(true);
    }
    expect(element.props).toEqual({foo: '56'});
  });

  it('ignores key and ref warning getters', () => {
    const elementA = React.createElement('div');
    const elementB = React.createElement('div', elementA.props);
    expect(elementB.key).toBe(null);
    expect(elementB.ref).toBe(null);
  });

  it('coerces the key to a string', () => {
    const element = React.createFactory(ComponentClass)({
      key: 12,
      foo: '56',
    });
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe('12');
    expect(element.ref).toBe(null);
    if (__DEV__) {
      expect(Object.isFrozen(element)).toBe(true);
      expect(Object.isFrozen(element.props)).toBe(true);
    }
    expect(element.props).toEqual({foo: '56'});
  });

  it('preserves the owner on the element', () => {
    const Component = React.createFactory(ComponentClass);
    let element;

    class Wrapper extends React.Component {
      render() {
        element = Component();
        return element;
      }
    }

    const instance = ReactTestUtils.renderIntoDocument(
      React.createElement(Wrapper),
    );
    expect(element._owner.stateNode).toBe(instance);
  });

  it('merges an additional argument onto the children prop', () => {
    const a = 1;
    const element = React.createFactory(ComponentClass)(
      {
        children: 'text',
      },
      a,
    );
    expect(element.props.children).toBe(a);
  });

  it('does not override children if no rest args are provided', () => {
    const element = React.createFactory(ComponentClass)({
      children: 'text',
    });
    expect(element.props.children).toBe('text');
  });

  it('overrides children if null is provided as an argument', () => {
    const element = React.createFactory(ComponentClass)(
      {
        children: 'text',
      },
      null,
    );
    expect(element.props.children).toBe(null);
  });

  it('merges rest arguments onto the children prop in an array', () => {
    const a = 1;
    const b = 2;
    const c = 3;
    const element = React.createFactory(ComponentClass)(null, a, b, c);
    expect(element.props.children).toEqual([1, 2, 3]);
  });

  // NOTE: We're explicitly not using JSX here. This is intended to test
  // classic JS without JSX.
  it('allows static methods to be called using the type property', () => {
    class StaticMethodComponentClass extends React.Component {
      render() {
        return React.createElement('div');
      }
    }
    StaticMethodComponentClass.someStaticMethod = () => 'someReturnValue';

    const element = React.createElement(StaticMethodComponentClass);
    expect(element.type.someStaticMethod()).toBe('someReturnValue');
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

    const jsonElement = JSON.stringify(React.createElement('div'));
    expect(React.isValidElement(JSON.parse(jsonElement))).toBe(true);
  });

  // NOTE: We're explicitly not using JSX here. This is intended to test
  // classic JS without JSX.
  it('is indistinguishable from a plain object', () => {
    const element = React.createElement('div', {className: 'foo'});
    const object = {};
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

    const container = document.createElement('div');
    const instance = ReactDOM.render(
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

    const instance = ReactTestUtils.renderIntoDocument(
      React.createElement(Component),
    );
    expect(instance.props.prop).toBe('testKey');

    const inst2 = ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {prop: null}),
    );
    expect(inst2.props.prop).toBe(null);
  });

  it('throws when changing a prop (in dev) after element creation', () => {
    class Outer extends React.Component {
      render() {
        const el = <div className="moo" />;

        if (__DEV__) {
          expect(function() {
            el.props.className = 'quack';
          }).toThrow();
          expect(el.props.className).toBe('moo');
        } else {
          el.props.className = 'quack';
          expect(el.props.className).toBe('quack');
        }

        return el;
      }
    }
    const outer = ReactTestUtils.renderIntoDocument(<Outer color="orange" />);
    if (__DEV__) {
      expect(ReactDOM.findDOMNode(outer).className).toBe('moo');
    } else {
      expect(ReactDOM.findDOMNode(outer).className).toBe('quack');
    }
  });

  it('throws when adding a prop (in dev) after element creation', () => {
    const container = document.createElement('div');
    class Outer extends React.Component {
      render() {
        const el = <div>{this.props.sound}</div>;

        if (__DEV__) {
          expect(function() {
            el.props.className = 'quack';
          }).toThrow();
          expect(el.props.className).toBe(undefined);
        } else {
          el.props.className = 'quack';
          expect(el.props.className).toBe('quack');
        }

        return el;
      }
    }
    Outer.defaultProps = {sound: 'meow'};
    const outer = ReactDOM.render(<Outer />, container);
    expect(ReactDOM.findDOMNode(outer).textContent).toBe('meow');
    if (__DEV__) {
      expect(ReactDOM.findDOMNode(outer).className).toBe('');
    } else {
      expect(ReactDOM.findDOMNode(outer).className).toBe('quack');
    }
  });

  it('does not warn for NaN props', () => {
    class Test extends React.Component {
      render() {
        return <div />;
      }
    }
    const test = ReactTestUtils.renderIntoDocument(<Test value={+undefined} />);
    expect(test.props.value).toBeNaN();
  });

  // NOTE: We're explicitly not using JSX here. This is intended to test
  // classic JS without JSX.
  it('identifies elements, but not JSON, if Symbols are supported', () => {
    // Rudimentary polyfill
    // Once all jest engines support Symbols natively we can swap this to test
    // WITH native Symbols by default.
    const REACT_ELEMENT_TYPE = function() {}; // fake Symbol
    const OTHER_SYMBOL = function() {}; // another fake Symbol
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

    const jsonElement = JSON.stringify(React.createElement('div'));
    expect(React.isValidElement(JSON.parse(jsonElement))).toBe(false);
  });
});
