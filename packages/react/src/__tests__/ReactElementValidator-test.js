/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// NOTE: We're explicitly not using JSX in this file. This is intended to test
// classic JS without JSX.

var PropTypes;
var React;
var ReactDOM;
var ReactTestUtils;

describe('ReactElementValidator', () => {
  function normalizeCodeLocInfo(str) {
    return str && str.replace(/at .+?:\d+/g, 'at **');
  }

  var ComponentClass;

  beforeEach(() => {
    jest.resetModules();

    PropTypes = require('prop-types');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
    ComponentClass = class extends React.Component {
      render() {
        return React.createElement('div');
      }
    };
  });

  it('warns for keys for arrays of elements in rest args', () => {
    spyOnDev(console, 'error');
    var Component = React.createFactory(ComponentClass);

    Component(null, [Component(), Component()]);

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Each child in an array or iterator should have a unique "key" prop.',
      );
    }
  });

  it('warns for keys for arrays of elements with owner info', () => {
    spyOnDev(console, 'error');
    var Component = React.createFactory(ComponentClass);

    class InnerClass extends React.Component {
      render() {
        return Component(null, this.props.childSet);
      }
    }

    var InnerComponent = React.createFactory(InnerClass);

    class ComponentWrapper extends React.Component {
      render() {
        return InnerComponent({childSet: [Component(), Component()]});
      }
    }

    ReactTestUtils.renderIntoDocument(React.createElement(ComponentWrapper));

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Each child in an array or iterator should have a unique "key" prop.' +
          '\n\nCheck the render method of `InnerClass`. ' +
          'It was passed a child from ComponentWrapper. ',
      );
    }
  });

  it('warns for keys for arrays with no owner or parent info', () => {
    spyOnDev(console, 'error');

    function Anonymous() {
      return <div />;
    }
    Object.defineProperty(Anonymous, 'name', {value: undefined});

    var divs = [<div />, <div />];
    ReactTestUtils.renderIntoDocument(<Anonymous>{divs}</Anonymous>);

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Each child in an array or iterator should have a unique ' +
          '"key" prop. See https://fb.me/react-warning-keys for more information.\n' +
          '    in div (at **)',
      );
    }
  });

  it('warns for keys for arrays of elements with no owner info', () => {
    spyOnDev(console, 'error');

    var divs = [<div />, <div />];
    ReactTestUtils.renderIntoDocument(<div>{divs}</div>);

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Each child in an array or iterator should have a unique ' +
          '"key" prop.\n\nCheck the top-level render call using <div>. See ' +
          'https://fb.me/react-warning-keys for more information.\n' +
          '    in div (at **)',
      );
    }
  });

  it('warns for keys with component stack info', () => {
    spyOnDev(console, 'error');

    function Component() {
      return <div>{[<div />, <div />]}</div>;
    }

    function Parent(props) {
      return React.cloneElement(props.child);
    }

    function GrandParent() {
      return <Parent child={<Component />} />;
    }

    ReactTestUtils.renderIntoDocument(<GrandParent />);

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Each child in an array or iterator should have a unique ' +
          '"key" prop.\n\nCheck the render method of `Component`. See ' +
          'https://fb.me/react-warning-keys for more information.\n' +
          '    in div (at **)\n' +
          '    in Component (at **)\n' +
          '    in Parent (at **)\n' +
          '    in GrandParent (at **)',
      );
    }
  });

  it('does not warn for keys when passing children down', () => {
    function Wrapper(props) {
      return (
        <div>
          {props.children}
          <footer />
        </div>
      );
    }

    ReactTestUtils.renderIntoDocument(
      <Wrapper>
        <span />
        <span />
      </Wrapper>,
    );
  });

  it('warns for keys for iterables of elements in rest args', () => {
    spyOnDev(console, 'error');
    var Component = React.createFactory(ComponentClass);

    var iterable = {
      '@@iterator': function() {
        var i = 0;
        return {
          next: function() {
            var done = ++i > 2;
            return {value: done ? undefined : Component(), done: done};
          },
        };
      },
    };

    Component(null, iterable);

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Each child in an array or iterator should have a unique "key" prop.',
      );
    }
  });

  it('does not warns for arrays of elements with keys', () => {
    var Component = React.createFactory(ComponentClass);

    Component(null, [Component({key: '#1'}), Component({key: '#2'})]);
  });

  it('does not warns for iterable elements with keys', () => {
    var Component = React.createFactory(ComponentClass);

    var iterable = {
      '@@iterator': function() {
        var i = 0;
        return {
          next: function() {
            var done = ++i > 2;
            return {
              value: done ? undefined : Component({key: '#' + i}),
              done: done,
            };
          },
        };
      },
    };

    Component(null, iterable);
  });

  it('does not warn when the element is directly in rest args', () => {
    var Component = React.createFactory(ComponentClass);

    Component(null, Component(), Component());
  });

  it('does not warn when the array contains a non-element', () => {
    var Component = React.createFactory(ComponentClass);

    Component(null, [{}, {}]);
  });

  it('should give context for PropType errors in nested components.', () => {
    // In this test, we're making sure that if a proptype error is found in a
    // component, we give a small hint as to which parent instantiated that
    // component as per warnings about key usage in ReactElementValidator.
    spyOnDev(console, 'error');
    function MyComp(props) {
      return React.createElement('div', null, 'My color is ' + props.color);
    }
    MyComp.propTypes = {
      color: PropTypes.string,
    };
    function ParentComp() {
      return React.createElement(MyComp, {color: 123});
    }
    ReactTestUtils.renderIntoDocument(React.createElement(ParentComp));
    if (__DEV__) {
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: Failed prop type: ' +
          'Invalid prop `color` of type `number` supplied to `MyComp`, ' +
          'expected `string`.\n' +
          '    in MyComp (created by ParentComp)\n' +
          '    in ParentComp',
      );
    }
  });

  it('gives a helpful error when passing invalid types', () => {
    spyOnDev(console, 'error');
    React.createElement(undefined);
    React.createElement(null);
    React.createElement(true);
    React.createElement({x: 17});
    React.createElement({});
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(5);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: undefined. You likely forgot to export your ' +
          "component from the file it's defined in, or you might have mixed up " +
          'default and named imports.',
      );
      expect(console.error.calls.argsFor(1)[0]).toBe(
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: null.',
      );
      expect(console.error.calls.argsFor(2)[0]).toBe(
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: boolean.',
      );
      expect(console.error.calls.argsFor(3)[0]).toBe(
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: object.',
      );
      expect(console.error.calls.argsFor(4)[0]).toBe(
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: object. You likely forgot to export your ' +
          "component from the file it's defined in, or you might have mixed up " +
          'default and named imports.',
      );
    }
    React.createElement('div');
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(5);
    }
  });

  it('includes the owner name when passing null, undefined, boolean, or number', () => {
    spyOnDev(console, 'error');
    function ParentComp() {
      return React.createElement(null);
    }
    expect(function() {
      ReactTestUtils.renderIntoDocument(React.createElement(ParentComp));
    }).toThrowError(
      'Element type is invalid: expected a string (for built-in components) ' +
        'or a class/function (for composite components) but got: null.' +
        (__DEV__ ? '\n\nCheck the render method of `ParentComp`.' : ''),
    );
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: null.' +
          '\n\nCheck the render method of `ParentComp`.\n    in ParentComp',
      );
    }
  });

  it('should check default prop values', () => {
    spyOnDev(console, 'error');

    class Component extends React.Component {
      static propTypes = {prop: PropTypes.string.isRequired};
      static defaultProps = {prop: null};
      render() {
        return React.createElement('span', null, this.props.prop);
      }
    }

    ReactTestUtils.renderIntoDocument(React.createElement(Component));

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: Failed prop type: The prop `prop` is marked as required in ' +
          '`Component`, but its value is `null`.\n' +
          '    in Component',
      );
    }
  });

  it('should not check the default for explicit null', () => {
    spyOnDev(console, 'error');

    class Component extends React.Component {
      static propTypes = {prop: PropTypes.string.isRequired};
      static defaultProps = {prop: 'text'};
      render() {
        return React.createElement('span', null, this.props.prop);
      }
    }

    ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {prop: null}),
    );

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: Failed prop type: The prop `prop` is marked as required in ' +
          '`Component`, but its value is `null`.\n' +
          '    in Component',
      );
    }
  });

  it('should check declared prop types', () => {
    spyOnDev(console, 'error');

    class Component extends React.Component {
      static propTypes = {
        prop: PropTypes.string.isRequired,
      };
      render() {
        return React.createElement('span', null, this.props.prop);
      }
    }

    ReactTestUtils.renderIntoDocument(React.createElement(Component));
    ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {prop: 42}),
    );

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(2);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: Failed prop type: ' +
          'The prop `prop` is marked as required in `Component`, but its value ' +
          'is `undefined`.\n' +
          '    in Component',
      );

      expect(console.error.calls.argsFor(1)[0]).toBe(
        'Warning: Failed prop type: ' +
          'Invalid prop `prop` of type `number` supplied to ' +
          '`Component`, expected `string`.\n' +
          '    in Component',
      );
    }

    ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {prop: 'string'}),
    );

    if (__DEV__) {
      // Should not error for strings
      expect(console.error.calls.count()).toBe(2);
    }
  });

  it('should warn if a PropType creator is used as a PropType', () => {
    spyOnDev(console, 'error');

    class Component extends React.Component {
      static propTypes = {
        myProp: PropTypes.shape,
      };
      render() {
        return React.createElement('span', null, this.props.myProp.value);
      }
    }

    ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {myProp: {value: 'hi'}}),
    );

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: Component: type specification of prop `myProp` is invalid; ' +
          'the type checker function must return `null` or an `Error` but ' +
          'returned a function. You may have forgotten to pass an argument to ' +
          'the type checker creator (arrayOf, instanceOf, objectOf, oneOf, ' +
          'oneOfType, and shape all require an argument).',
      );
    }
  });

  it('should warn if component declares PropTypes instead of propTypes', () => {
    spyOnDevAndProd(console, 'error');
    class MisspelledPropTypesComponent extends React.Component {
      static PropTypes = {
        prop: PropTypes.string,
      };
      render() {
        return React.createElement('span', null, this.props.prop);
      }
    }

    ReactTestUtils.renderIntoDocument(
      React.createElement(MisspelledPropTypesComponent, {prop: 'Hi'}),
    );
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: Component MisspelledPropTypesComponent declared `PropTypes` ' +
          'instead of `propTypes`. Did you misspell the property assignment?',
      );
    }
  });

  it('should warn when accessing .type on an element factory', () => {
    spyOnDev(console, 'warn');
    function TestComponent() {
      return <div />;
    }
    var TestFactory = React.createFactory(TestComponent);
    expect(TestFactory.type).toBe(TestComponent);
    if (__DEV__) {
      expect(console.warn.calls.count()).toBe(1);
      expect(console.warn.calls.argsFor(0)[0]).toBe(
        'Warning: Factory.type is deprecated. Access the class directly before ' +
          'passing it to createFactory.',
      );
    }
    // Warn once, not again
    expect(TestFactory.type).toBe(TestComponent);
    if (__DEV__) {
      expect(console.warn.calls.count()).toBe(1);
    }
  });

  it('does not warn when using DOM node as children', () => {
    class DOMContainer extends React.Component {
      render() {
        return <div />;
      }
      componentDidMount() {
        ReactDOM.findDOMNode(this).appendChild(this.props.children);
      }
    }

    var node = document.createElement('div');
    // This shouldn't cause a stack overflow or any other problems (#3883)
    ReactTestUtils.renderIntoDocument(<DOMContainer>{node}</DOMContainer>);
  });

  it('should not enumerate enumerable numbers (#4776)', () => {
    /*eslint-disable no-extend-native */
    Number.prototype['@@iterator'] = function() {
      throw new Error('number iterator called');
    };
    /*eslint-enable no-extend-native */

    try {
      void (
        <div>
          {5}
          {12}
          {13}
        </div>
      );
    } finally {
      delete Number.prototype['@@iterator'];
    }
  });

  it('does not blow up with inlined children', () => {
    // We don't suggest this since it silences all sorts of warnings, but we
    // shouldn't blow up either.

    var child = {
      $$typeof: <div />.$$typeof,
      type: 'span',
      key: null,
      ref: null,
      props: {},
      _owner: null,
    };

    void <div>{[child]}</div>;
  });

  it('does not blow up on key warning with undefined type', () => {
    spyOnDev(console, 'error');
    var Foo = undefined;
    void <Foo>{[<div />]}</Foo>;
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: undefined. You likely forgot to export your ' +
          "component from the file it's defined in, or you might have mixed up " +
          'default and named imports.\n\nCheck your code at **.',
      );
    }
  });
});
