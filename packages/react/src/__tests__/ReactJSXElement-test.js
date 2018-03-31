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

describe('ReactJSXElement', () => {
  let Component;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
    Component = class extends React.Component {
      render() {
        return <div />;
      }
    };
  });

  it('returns a complete element according to spec', () => {
    const element = <Component />;
    expect(element.type).toBe(Component);
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    const expectation = {};
    Object.freeze(expectation);
    expect(element.props).toEqual(expectation);
  });

  it('allows a lower-case to be passed as the string type', () => {
    const element = <div />;
    expect(element.type).toBe('div');
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    const expectation = {};
    Object.freeze(expectation);
    expect(element.props).toEqual(expectation);
  });

  it('allows a string to be passed as the type', () => {
    const TagName = 'div';
    const element = <TagName />;
    expect(element.type).toBe('div');
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    const expectation = {};
    Object.freeze(expectation);
    expect(element.props).toEqual(expectation);
  });

  it('returns an immutable element', () => {
    const element = <Component />;
    if (__DEV__) {
      expect(() => (element.type = 'div')).toThrow();
    } else {
      expect(() => (element.type = 'div')).not.toThrow();
    }
  });

  it('does not reuse the object that is spread into props', () => {
    const config = {foo: 1};
    const element = <Component {...config} />;
    expect(element.props.foo).toBe(1);
    config.foo = 2;
    expect(element.props.foo).toBe(1);
  });

  it('extracts key and ref from the rest of the props', () => {
    const element = <Component key="12" ref="34" foo="56" />;
    expect(element.type).toBe(Component);
    expect(element.key).toBe('12');
    expect(element.ref).toBe('34');
    const expectation = {foo: '56'};
    Object.freeze(expectation);
    expect(element.props).toEqual(expectation);
  });

  it('coerces the key to a string', () => {
    const element = <Component key={12} foo="56" />;
    expect(element.type).toBe(Component);
    expect(element.key).toBe('12');
    expect(element.ref).toBe(null);
    const expectation = {foo: '56'};
    Object.freeze(expectation);
    expect(element.props).toEqual(expectation);
  });

  it('merges JSX children onto the children prop', () => {
    const a = 1;
    const element = <Component children="text">{a}</Component>;
    expect(element.props.children).toBe(a);
  });

  it('does not override children if no JSX children are provided', () => {
    const element = <Component children="text" />;
    expect(element.props.children).toBe('text');
  });

  it('overrides children if null is provided as a JSX child', () => {
    const element = <Component children="text">{null}</Component>;
    expect(element.props.children).toBe(null);
  });

  it('overrides children if undefined is provided as an argument', () => {
    const element = <Component children="text">{undefined}</Component>;
    expect(element.props.children).toBe(undefined);

    const element2 = React.cloneElement(
      <Component children="text" />,
      {},
      undefined,
    );
    expect(element2.props.children).toBe(undefined);
  });

  it('merges JSX children onto the children prop in an array', () => {
    const a = 1;
    const b = 2;
    const c = 3;
    const element = (
      <Component>
        {a}
        {b}
        {c}
      </Component>
    );
    expect(element.props.children).toEqual([1, 2, 3]);
  });

  it('allows static methods to be called using the type property', () => {
    class StaticMethodComponent {
      static someStaticMethod() {
        return 'someReturnValue';
      }
      render() {
        return <div />;
      }
    }

    const element = <StaticMethodComponent />;
    expect(element.type.someStaticMethod()).toBe('someReturnValue');
  });

  it('identifies valid elements', () => {
    expect(React.isValidElement(<div />)).toEqual(true);
    expect(React.isValidElement(<Component />)).toEqual(true);

    expect(React.isValidElement(null)).toEqual(false);
    expect(React.isValidElement(true)).toEqual(false);
    expect(React.isValidElement({})).toEqual(false);
    expect(React.isValidElement('string')).toEqual(false);
    expect(React.isValidElement(Component)).toEqual(false);
    expect(React.isValidElement({type: 'div', props: {}})).toEqual(false);
  });

  it('is indistinguishable from a plain object', () => {
    const element = <div className="foo" />;
    const object = {};
    expect(element.constructor).toBe(object.constructor);
  });

  it('should use default prop value when removing a prop', () => {
    Component.defaultProps = {fruit: 'persimmon'};

    const container = document.createElement('div');
    const instance = ReactDOM.render(<Component fruit="mango" />, container);
    expect(instance.props.fruit).toBe('mango');

    ReactDOM.render(<Component />, container);
    expect(instance.props.fruit).toBe('persimmon');
  });

  it('should normalize props with default values', () => {
    class NormalizingComponent extends React.Component {
      render() {
        return <span>{this.props.prop}</span>;
      }
    }
    NormalizingComponent.defaultProps = {prop: 'testKey'};

    const instance = ReactTestUtils.renderIntoDocument(
      <NormalizingComponent />,
    );
    expect(instance.props.prop).toBe('testKey');

    const inst2 = ReactTestUtils.renderIntoDocument(
      <NormalizingComponent prop={null} />,
    );
    expect(inst2.props.prop).toBe(null);
  });
});
