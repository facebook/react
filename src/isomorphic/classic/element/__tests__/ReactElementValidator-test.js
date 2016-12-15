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

// NOTE: We're explicitly not using JSX in this file. This is intended to test
// classic JS without JSX.

var React;
var ReactDOM;
var ReactTestUtils;

describe('ReactElementValidator', () => {
  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  var ComponentClass;

  beforeEach(() => {
    jest.resetModuleRegistry();

    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');
    ComponentClass = React.createClass({
      render: function() {
        return React.createElement('div');
      },
    });
  });

  it('warns for keys for arrays of elements in rest args', () => {
    spyOn(console, 'error');
    var Component = React.createFactory(ComponentClass);

    Component(null, [Component(), Component()]);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Each child in an array or iterator should have a unique "key" prop.'
    );
  });

  it('warns for keys for arrays of elements with owner info', () => {
    spyOn(console, 'error');
    var Component = React.createFactory(ComponentClass);

    var InnerClass = React.createClass({
      displayName: 'InnerClass',
      render: function() {
        return Component(null, this.props.childSet);
      },
    });

    var InnerComponent = React.createFactory(InnerClass);

    var ComponentWrapper = React.createClass({
      displayName: 'ComponentWrapper',
      render: function() {
        return InnerComponent({childSet: [Component(), Component()] });
      },
    });

    ReactTestUtils.renderIntoDocument(
      React.createElement(ComponentWrapper)
    );

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Each child in an array or iterator should have a unique "key" prop. ' +
      'Check the render method of `InnerClass`. ' +
      'It was passed a child from ComponentWrapper. '
    );
  });

  it('warns for keys for arrays with no owner or parent info', () => {
    spyOn(console, 'error');

    var Anonymous = React.createClass({
      displayName: undefined,
      render: function() {
        return <div />;
      },
    });

    var divs = [
      <div />,
      <div />,
    ];
    ReactTestUtils.renderIntoDocument(<Anonymous>{divs}</Anonymous>);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
      'Warning: Each child in an array or iterator should have a unique ' +
      '"key" prop. See https://fb.me/react-warning-keys for more information.\n' +
      '    in div (at **)'
    );
  });

  it('warns for keys for arrays of elements with no owner info', () => {
    spyOn(console, 'error');

    var divs = [
      <div />,
      <div />,
    ];
    ReactTestUtils.renderIntoDocument(<div>{divs}</div>);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
      'Warning: Each child in an array or iterator should have a unique ' +
      '"key" prop. Check the top-level render call using <div>. See ' +
      'https://fb.me/react-warning-keys for more information.\n' +
      '    in div (at **)'
    );
  });

  it('warns for keys with component stack info', () => {
    spyOn(console, 'error');

    var Component = React.createClass({
      render: function() {
        return <div>{[<div />, <div />]}</div>;
      },
    });

    var Parent = React.createClass({
      render: function() {
        return React.cloneElement(this.props.child);
      },
    });

    var GrandParent = React.createClass({
      render: function() {
        return <Parent child={<Component />} />;
      },
    });

    ReactTestUtils.renderIntoDocument(<GrandParent />);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
      'Warning: Each child in an array or iterator should have a unique ' +
      '"key" prop. Check the render method of `Component`. See ' +
      'https://fb.me/react-warning-keys for more information.\n' +
      '    in div (at **)\n' +
      '    in Component (at **)\n' +
      '    in Parent (at **)\n' +
      '    in GrandParent (at **)'
    );
  });

  it('does not warn for keys when passing children down', () => {
    spyOn(console, 'error');

    var Wrapper = React.createClass({
      render: function() {
        return (
          <div>
            {this.props.children}
            <footer />
          </div>
        );
      },
    });

    ReactTestUtils.renderIntoDocument(
      <Wrapper>
        <span />
        <span />
      </Wrapper>
    );

    expectDev(console.error.calls.count()).toBe(0);
  });

  it('warns for keys for iterables of elements in rest args', () => {
    spyOn(console, 'error');
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

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Each child in an array or iterator should have a unique "key" prop.'
    );
  });

  it('does not warns for arrays of elements with keys', () => {
    spyOn(console, 'error');
    var Component = React.createFactory(ComponentClass);

    Component(null, [Component({key: '#1'}), Component({key: '#2'})]);

    expectDev(console.error.calls.count()).toBe(0);
  });

  it('does not warns for iterable elements with keys', () => {
    spyOn(console, 'error');
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

    expectDev(console.error.calls.count()).toBe(0);
  });

  it('does not warn when the element is directly in rest args', () => {
    spyOn(console, 'error');
    var Component = React.createFactory(ComponentClass);

    Component(null, Component(), Component());

    expectDev(console.error.calls.count()).toBe(0);
  });

  it('does not warn when the array contains a non-element', () => {
    spyOn(console, 'error');
    var Component = React.createFactory(ComponentClass);

    Component(null, [{}, {}]);

    expectDev(console.error.calls.count()).toBe(0);
  });

  it('should give context for PropType errors in nested components.', () => {
    // In this test, we're making sure that if a proptype error is found in a
    // component, we give a small hint as to which parent instantiated that
    // component as per warnings about key usage in ReactElementValidator.
    spyOn(console, 'error');
    var MyComp = React.createClass({
      propTypes: {
        color: React.PropTypes.string,
      },
      render: function() {
        return React.createElement('div', null, 'My color is ' + this.color);
      },
    });
    var ParentComp = React.createClass({
      render: function() {
        return React.createElement(MyComp, {color: 123});
      },
    });
    ReactTestUtils.renderIntoDocument(React.createElement(ParentComp));
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Failed prop type: ' +
      'Invalid prop `color` of type `number` supplied to `MyComp`, ' +
      'expected `string`.\n' +
      '    in MyComp (created by ParentComp)\n' +
      '    in ParentComp'
    );
  });

  it('gives a helpful error when passing null, undefined, boolean, or number', () => {
    spyOn(console, 'error');
    React.createElement(undefined);
    React.createElement(null);
    React.createElement(true);
    React.createElement(123);
    expectDev(console.error.calls.count()).toBe(4);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: React.createElement: type should not be null, undefined, ' +
      'boolean, or number. It should be a string (for DOM elements) or a ' +
      'ReactClass (for composite components).'
    );
    expectDev(console.error.calls.argsFor(1)[0]).toBe(
      'Warning: React.createElement: type should not be null, undefined, ' +
      'boolean, or number. It should be a string (for DOM elements) or a ' +
      'ReactClass (for composite components).'
    );
    expectDev(console.error.calls.argsFor(2)[0]).toBe(
      'Warning: React.createElement: type should not be null, undefined, ' +
      'boolean, or number. It should be a string (for DOM elements) or a ' +
      'ReactClass (for composite components).'
    );
    expectDev(console.error.calls.argsFor(3)[0]).toBe(
      'Warning: React.createElement: type should not be null, undefined, ' +
      'boolean, or number. It should be a string (for DOM elements) or a ' +
      'ReactClass (for composite components).'
    );
    React.createElement('div');
    expectDev(console.error.calls.count()).toBe(4);
  });

  it('includes the owner name when passing null, undefined, boolean, or number', () => {
    spyOn(console, 'error');
    var ParentComp = React.createClass({
      render: function() {
        return React.createElement(null);
      },
    });
    expect(function() {
      ReactTestUtils.renderIntoDocument(React.createElement(ParentComp));
    }).toThrowError(
      'Element type is invalid: expected a string (for built-in components) ' +
      'or a class/function (for composite components) but got: null. Check ' +
      'the render method of `ParentComp`.'
    );
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: React.createElement: type should not be null, undefined, ' +
      'boolean, or number. It should be a string (for DOM elements) or a ' +
      'ReactClass (for composite components). Check the render method of ' +
      '`ParentComp`.'
    );
  });

  it('should check default prop values', () => {
    spyOn(console, 'error');

    var Component = React.createClass({
      propTypes: {prop: React.PropTypes.string.isRequired},
      getDefaultProps: function() {
        return {prop: null};
      },
      render: function() {
        return React.createElement('span', null, this.props.prop);
      },
    });

    ReactTestUtils.renderIntoDocument(React.createElement(Component));

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Failed prop type: The prop `prop` is marked as required in ' +
      '`Component`, but its value is `null`.\n' +
      '    in Component'
    );
  });

  it('should not check the default for explicit null', () => {
    spyOn(console, 'error');

    var Component = React.createClass({
      propTypes: {prop: React.PropTypes.string.isRequired},
      getDefaultProps: function() {
        return {prop: 'text'};
      },
      render: function() {
        return React.createElement('span', null, this.props.prop);
      },
    });

    ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {prop:null})
    );

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Failed prop type: The prop `prop` is marked as required in ' +
      '`Component`, but its value is `null`.\n' +
      '    in Component'
    );
  });

  it('should check declared prop types', () => {
    spyOn(console, 'error');

    var Component = React.createClass({
      propTypes: {
        prop: React.PropTypes.string.isRequired,
      },
      render: function() {
        return React.createElement('span', null, this.props.prop);
      },
    });

    ReactTestUtils.renderIntoDocument(
      React.createElement(Component)
    );
    ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {prop: 42})
    );

    expectDev(console.error.calls.count()).toBe(2);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Failed prop type: ' +
      'The prop `prop` is marked as required in `Component`, but its value ' +
      'is `undefined`.\n' +
      '    in Component'
    );

    expectDev(console.error.calls.argsFor(1)[0]).toBe(
      'Warning: Failed prop type: ' +
      'Invalid prop `prop` of type `number` supplied to ' +
      '`Component`, expected `string`.\n' +
      '    in Component'
    );

    ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {prop: 'string'})
    );

    // Should not error for strings
    expectDev(console.error.calls.count()).toBe(2);
  });

  it('should warn if a PropType creator is used as a PropType', () => {
    spyOn(console, 'error');

    var Component = React.createClass({
      propTypes: {
        myProp: React.PropTypes.shape,
      },
      render: function() {
        return React.createElement('span', null, this.props.myProp.value);
      },
    });

    ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {myProp: {value: 'hi'}})
    );

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Component: type specification of prop `myProp` is invalid; ' +
      'the type checker function must return `null` or an `Error` but ' +
      'returned a function. You may have forgotten to pass an argument to ' +
      'the type checker creator (arrayOf, instanceOf, objectOf, oneOf, ' +
      'oneOfType, and shape all require an argument).'
    );
  });

  it('should warn when accessing .type on an element factory', () => {
    spyOn(console, 'error');
    var TestComponent = React.createClass({
      render: function() {
        return <div />;
      },
    });
    var TestFactory = React.createFactory(TestComponent);
    expect(TestFactory.type).toBe(TestComponent);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Factory.type is deprecated. Access the class directly before ' +
      'passing it to createFactory.'
    );
    // Warn once, not again
    expect(TestFactory.type).toBe(TestComponent);
    expectDev(console.error.calls.count()).toBe(1);
  });

  it('does not warn when using DOM node as children', () => {
    spyOn(console, 'error');
    var DOMContainer = React.createClass({
      render: function() {
        return <div />;
      },
      componentDidMount: function() {
        ReactDOM.findDOMNode(this).appendChild(this.props.children);
      },
    });

    var node = document.createElement('div');
    // This shouldn't cause a stack overflow or any other problems (#3883)
    ReactTestUtils.renderIntoDocument(<DOMContainer>{node}</DOMContainer>);
    expectDev(console.error.calls.count()).toBe(0);
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
      $$typeof: (<div />).$$typeof,
      type: 'span',
      key: null,
      ref: null,
      props: {},
      _owner: null,
    };

    void <div>{[child]}</div>;
  });

  it('does not blow up on key warning with undefined type', () => {
    spyOn(console, 'error');
    var Foo = undefined;
    void <Foo>{[<div />]}</Foo>;
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: React.createElement: type should not be null, undefined, ' +
      'boolean, or number. It should be a string (for DOM elements) or a ' +
      'ReactClass (for composite components).'
    );
  });

});
