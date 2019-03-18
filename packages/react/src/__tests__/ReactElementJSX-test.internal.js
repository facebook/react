/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactFeatureFlags;
let ReactTestUtils;

// NOTE: We're explicitly not using JSX here. This is intended to test
// a new React.jsx api which does not have a JSX transformer yet.
// A lot of these tests are pulled from ReactElement-test because
// this api is meant to be backwards compatible.
describe('ReactElement.jsx', () => {
  let originalSymbol;

  beforeEach(() => {
    jest.resetModules();

    // Delete the native Symbol if we have one to ensure we test the
    // unpolyfilled environment.
    originalSymbol = global.Symbol;
    global.Symbol = undefined;

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableJSXTransformAPI = true;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
  });

  afterEach(() => {
    global.Symbol = originalSymbol;
  });

  it('allows static methods to be called using the type property', () => {
    class StaticMethodComponentClass extends React.Component {
      render() {
        return React.jsx('div', {});
      }
    }
    StaticMethodComponentClass.someStaticMethod = () => 'someReturnValue';

    const element = React.jsx(StaticMethodComponentClass, {});
    expect(element.type.someStaticMethod()).toBe('someReturnValue');
  });

  it('identifies valid elements', () => {
    class Component extends React.Component {
      render() {
        return React.jsx('div', {});
      }
    }

    expect(React.isValidElement(React.jsx('div', {}))).toEqual(true);
    expect(React.isValidElement(React.jsx(Component, {}))).toEqual(true);

    expect(React.isValidElement(null)).toEqual(false);
    expect(React.isValidElement(true)).toEqual(false);
    expect(React.isValidElement({})).toEqual(false);
    expect(React.isValidElement('string')).toEqual(false);
    expect(React.isValidElement(React.createFactory('div'))).toEqual(false);
    expect(React.isValidElement(Component)).toEqual(false);
    expect(React.isValidElement({type: 'div', props: {}})).toEqual(false);

    const jsonElement = JSON.stringify(React.jsx('div', {}));
    expect(React.isValidElement(JSON.parse(jsonElement))).toBe(true);
  });

  it('is indistinguishable from a plain object', () => {
    const element = React.jsx('div', {className: 'foo'});
    const object = {};
    expect(element.constructor).toBe(object.constructor);
  });

  it('should use default prop value when removing a prop', () => {
    class Component extends React.Component {
      render() {
        return React.jsx('span', {});
      }
    }
    Component.defaultProps = {fruit: 'persimmon'};

    const container = document.createElement('div');
    const instance = ReactDOM.render(
      React.jsx(Component, {fruit: 'mango'}),
      container,
    );
    expect(instance.props.fruit).toBe('mango');

    ReactDOM.render(React.jsx(Component, {}), container);
    expect(instance.props.fruit).toBe('persimmon');
  });

  it('should normalize props with default values', () => {
    class Component extends React.Component {
      render() {
        return React.jsx('span', {children: this.props.prop});
      }
    }
    Component.defaultProps = {prop: 'testKey'};

    const instance = ReactTestUtils.renderIntoDocument(
      React.jsx(Component, {}),
    );
    expect(instance.props.prop).toBe('testKey');

    const inst2 = ReactTestUtils.renderIntoDocument(
      React.jsx(Component, {prop: null}),
    );
    expect(inst2.props.prop).toBe(null);
  });

  it('throws when changing a prop (in dev) after element creation', () => {
    class Outer extends React.Component {
      render() {
        const el = React.jsx('div', {className: 'moo'});

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
    const outer = ReactTestUtils.renderIntoDocument(
      React.jsx(Outer, {color: 'orange'}),
    );
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
        const el = React.jsx('div', {children: this.props.sound});

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
    const outer = ReactDOM.render(React.jsx(Outer, {}), container);
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
        return React.jsx('div', {});
      }
    }
    const test = ReactTestUtils.renderIntoDocument(
      React.jsx(Test, {value: +undefined}),
    );
    expect(test.props.value).toBeNaN();
  });

  it('should warn when `key` is being accessed on composite element', () => {
    const container = document.createElement('div');
    class Child extends React.Component {
      render() {
        return React.jsx('div', {children: this.props.key});
      }
    }
    class Parent extends React.Component {
      render() {
        return React.jsxs('div', {
          children: [
            React.jsx(Child, {}, '0'),
            React.jsx(Child, {}, '1'),
            React.jsx(Child, {}, '2'),
          ],
        });
      }
    }
    expect(() => ReactDOM.render(React.jsx(Parent, {}), container)).toWarnDev(
      'Child: `key` is not a prop. Trying to access it will result ' +
        'in `undefined` being returned. If you need to access the same ' +
        'value within the child component, you should pass it as a different ' +
        'prop. (https://fb.me/react-special-props)',
      {withoutStack: true},
    );
  });

  it('should warn when `key` is being accessed on a host element', () => {
    const element = React.jsxs('div', {}, '3');
    expect(() => void element.props.key).toWarnDev(
      'div: `key` is not a prop. Trying to access it will result ' +
        'in `undefined` being returned. If you need to access the same ' +
        'value within the child component, you should pass it as a different ' +
        'prop. (https://fb.me/react-special-props)',
      {withoutStack: true},
    );
  });

  it('should warn when `ref` is being accessed', () => {
    const container = document.createElement('div');
    class Child extends React.Component {
      render() {
        return React.jsx('div', {children: this.props.ref});
      }
    }
    class Parent extends React.Component {
      render() {
        return React.jsx('div', {
          children: React.jsx(Child, {ref: 'childElement'}),
        });
      }
    }
    expect(() => ReactDOM.render(React.jsx(Parent, {}), container)).toWarnDev(
      'Child: `ref` is not a prop. Trying to access it will result ' +
        'in `undefined` being returned. If you need to access the same ' +
        'value within the child component, you should pass it as a different ' +
        'prop. (https://fb.me/react-special-props)',
      {withoutStack: true},
    );
  });

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

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableJSXTransformAPI = true;

    React = require('react');

    class Component extends React.Component {
      render() {
        return React.jsx('div');
      }
    }

    expect(React.isValidElement(React.jsx('div', {}))).toEqual(true);
    expect(React.isValidElement(React.jsx(Component, {}))).toEqual(true);

    expect(React.isValidElement(null)).toEqual(false);
    expect(React.isValidElement(true)).toEqual(false);
    expect(React.isValidElement({})).toEqual(false);
    expect(React.isValidElement('string')).toEqual(false);
    expect(React.isValidElement(React.createFactory('div'))).toEqual(false);
    expect(React.isValidElement(Component)).toEqual(false);
    expect(React.isValidElement({type: 'div', props: {}})).toEqual(false);

    const jsonElement = JSON.stringify(React.jsx('div', {}));
    expect(React.isValidElement(JSON.parse(jsonElement))).toBe(false);
  });

  it('should warn when unkeyed children are passed to jsx', () => {
    const container = document.createElement('div');
    class Child extends React.Component {
      render() {
        return React.jsx('div', {});
      }
    }
    class Parent extends React.Component {
      render() {
        return React.jsx('div', {
          children: [
            React.jsx(Child, {}),
            React.jsx(Child, {}),
            React.jsx(Child, {}),
          ],
        });
      }
    }
    expect(() => ReactDOM.render(React.jsx(Parent, {}), container)).toWarnDev(
      'Warning: Each child in a list should have a unique "key" prop.\n\n' +
        'Check the render method of `Parent`. See https://fb.me/react-warning-keys for more information.\n' +
        '    in Child (created by Parent)\n' +
        '    in Parent',
    );
  });

  it('should warn when keys are passed as part of props', () => {
    const container = document.createElement('div');
    class Child extends React.Component {
      render() {
        return React.jsx('div', {});
      }
    }
    class Parent extends React.Component {
      render() {
        return React.jsx('div', {
          children: [React.jsx(Child, {key: '0'})],
        });
      }
    }
    expect(() => ReactDOM.render(React.jsx(Parent, {}), container)).toWarnDev(
      'Warning: React.jsx: Spreading a key to JSX is a deprecated pattern. ' +
        'Explicitly pass a key after spreading props in your JSX call. ' +
        'E.g. <ComponentName {...props} key={key} />',
    );
  });

  it('should not warn when unkeyed children are passed to jsxs', () => {
    const container = document.createElement('div');
    class Child extends React.Component {
      render() {
        return React.jsx('div', {});
      }
    }
    class Parent extends React.Component {
      render() {
        return React.jsxs('div', {
          children: [
            React.jsx(Child, {}),
            React.jsx(Child, {}),
            React.jsx(Child, {}),
          ],
        });
      }
    }
    // TODO: an explicit expect for no warning?
    ReactDOM.render(React.jsx(Parent, {}), container);
  });
});
