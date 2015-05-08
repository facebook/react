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

var React;
var ReactFragment;
var ReactTestUtils;

describe('ReactElementValidator', function() {
  var ComponentClass;

  beforeEach(function() {
    require('mock-modules').dumpCache();

    React = require('React');
    ReactFragment = require('ReactFragment');
    ReactTestUtils = require('ReactTestUtils');
    ComponentClass = React.createClass({
      render: function() { return React.createElement('div'); }
    });
  });

  function frag(obj) {
    return ReactFragment.create(obj);
  }

  it('warns for keys for arrays of elements in rest args', function() {
    spyOn(console, 'warn');
    var Component = React.createFactory(ComponentClass);

    Component(null, [Component(), Component()]);

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Each child in an array or iterator should have a unique "key" prop.'
    );
  });

  it('warns for keys for arrays of elements with owner info', function() {
    spyOn(console, 'warn');
    var Component = React.createFactory(ComponentClass);

    var InnerClass = React.createClass({
      displayName: 'InnerClass',
      render: function() {
        return Component(null, this.props.childSet);
      }
    });

    var InnerComponent = React.createFactory(InnerClass);

    var ComponentWrapper = React.createClass({
      displayName: 'ComponentWrapper',
      render: function() {
        return InnerComponent({childSet: [Component(), Component()] });
      }
    });

    ReactTestUtils.renderIntoDocument(
      React.createElement(ComponentWrapper)
    );

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Each child in an array or iterator should have a unique "key" prop. ' +
      'Check the render method of InnerClass. ' +
      'It was passed a child from ComponentWrapper. '
    );
  });

  it('warns for keys for arrays with no owner or parent info', function() {
    spyOn(console, 'warn');

    var Anonymous = React.createClass({
      displayName: undefined,
      render: function() {
        return <div />;
      }
    });

    var divs = [
      <div />,
      <div />
    ];
    ReactTestUtils.renderIntoDocument(<Anonymous>{divs}</Anonymous>);

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: Each child in an array or iterator should have a unique ' +
      '"key" prop. See https://fb.me/react-warning-keys for more information.'
    );
  });

  it('warns for keys for arrays of elements with no owner info', function() {
    spyOn(console, 'warn');

    var divs = [
      <div />,
      <div />
    ];
    ReactTestUtils.renderIntoDocument(<div>{divs}</div>);

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: Each child in an array or iterator should have a unique ' +
      '"key" prop. Check the React.render call using <div>. See ' +
      'https://fb.me/react-warning-keys for more information.'
    );
  });

  it('warns for keys for iterables of elements in rest args', function() {
    spyOn(console, 'warn');
    var Component = React.createFactory(ComponentClass);

    var iterable = {
      '@@iterator': function() {
        var i = 0;
        return {
          next: function() {
            var done = ++i > 2;
            return {value: done ? undefined : Component(), done: done};
          }
        };
      }
    };

    Component(null, iterable);

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Each child in an array or iterator should have a unique "key" prop.'
    );
  });

  it('does not warns for arrays of elements with keys', function() {
    spyOn(console, 'warn');
    var Component = React.createFactory(ComponentClass);

    Component(null, [Component({key: '#1'}), Component({key: '#2'})]);

    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('does not warns for iterable elements with keys', function() {
    spyOn(console, 'warn');
    var Component = React.createFactory(ComponentClass);

    var iterable = {
      '@@iterator': function() {
        var i = 0;
        return {
          next: function() {
            var done = ++i > 2;
            return {
              value: done ? undefined : Component({key: '#' + i}),
              done: done
            };
          }
        };
      }
    };

    Component(null, iterable);

    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('warns for numeric keys on objects in rest args', function() {
    spyOn(console, 'warn');
    var Component = React.createFactory(ComponentClass);

    Component(null, frag({1: Component(), 2: Component()}));

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Child objects should have non-numeric keys so ordering is preserved.'
    );
  });

  it('does not warn for numeric keys in entry iterables in rest args', function() {
    spyOn(console, 'warn');
    var Component = React.createFactory(ComponentClass);

    var iterable = {
      '@@iterator': function() {
        var i = 0;
        return {
          next: function() {
            var done = ++i > 2;
            return {value: done ? undefined : [i, Component()], done: done};
          }
        };
      }
    };
    iterable.entries = iterable['@@iterator'];

    Component(null, iterable);

    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('does not warn when the element is directly in rest args', function() {
    spyOn(console, 'warn');
    var Component = React.createFactory(ComponentClass);

    Component(null, Component(), Component());

    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('does not warn when the array contains a non-element', function() {
    spyOn(console, 'warn');
    var Component = React.createFactory(ComponentClass);

    Component(null, [ {}, {} ]);

    expect(console.warn.argsForCall.length).toBe(0);
  });

  // TODO: These warnings currently come from the composite component, but
  // they should be moved into the ReactElementValidator.

  it('should give context for PropType errors in nested components.', () => {
    // In this test, we're making sure that if a proptype error is found in a
    // component, we give a small hint as to which parent instantiated that
    // component as per warnings about key usage in ReactElementValidator.
    spyOn(console, 'warn');
    var MyComp = React.createClass({
      propTypes: {
        color: React.PropTypes.string
      },
      render: function() {
        return React.createElement('div', null, 'My color is ' + this.color);
      }
    });
    var ParentComp = React.createClass({
      render: function() {
        return React.createElement(MyComp, {color: 123});
      }
    });
    ReactTestUtils.renderIntoDocument(React.createElement(ParentComp));
    expect(console.warn.calls[0].args[0]).toBe(
      'Warning: Failed propType: ' +
      'Invalid prop `color` of type `number` supplied to `MyComp`, ' +
      'expected `string`. Check the render method of `ParentComp`.'
    );
  });

  it('gives a helpful error when passing null or undefined', function() {
    spyOn(console, 'warn');
    React.createElement(undefined);
    React.createElement(null);
    expect(console.warn.calls.length).toBe(2);
    expect(console.warn.calls[0].args[0]).toBe(
      'Warning: React.createElement: type should not be null or undefined. ' +
      'It should be a string (for DOM elements) or a ReactClass (for ' +
      'composite components).'
    );
    expect(console.warn.calls[1].args[0]).toBe(
      'Warning: React.createElement: type should not be null or undefined. ' +
      'It should be a string (for DOM elements) or a ReactClass (for ' +
      'composite components).'
    );
    React.createElement('div');
    expect(console.warn.calls.length).toBe(2);
  });

  it('should check default prop values', function() {
    spyOn(console, 'warn');

    var Component = React.createClass({
      propTypes: {prop: React.PropTypes.string.isRequired},
      getDefaultProps: function() {
        return {prop: null};
      },
      render: function() {
        return React.createElement('span', null, this.props.prop);
      }
    });

    ReactTestUtils.renderIntoDocument(React.createElement(Component));

    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.calls[0].args[0]).toBe(
      'Warning: Failed propType: ' +
      'Required prop `prop` was not specified in `Component`.'
    );
  });

  it('should not check the default for explicit null', function() {
    spyOn(console, 'warn');

    var Component = React.createClass({
      propTypes: {prop: React.PropTypes.string.isRequired},
      getDefaultProps: function() {
        return {prop: 'text'};
      },
      render: function() {
        return React.createElement('span', null, this.props.prop);
      }
    });

    ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {prop:null})
    );

    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.calls[0].args[0]).toBe(
      'Warning: Failed propType: ' +
      'Required prop `prop` was not specified in `Component`.'
    );
  });

  it('should check declared prop types', function() {
    spyOn(console, 'warn');

    var Component = React.createClass({
      propTypes: {
        prop: React.PropTypes.string.isRequired
      },
      render: function() {
        return React.createElement('span', null, this.props.prop);
      }
    });

    ReactTestUtils.renderIntoDocument(
      React.createElement(Component)
    );
    ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {prop: 42})
    );

    expect(console.warn.calls.length).toBe(2);
    expect(console.warn.calls[0].args[0]).toBe(
      'Warning: Failed propType: ' +
      'Required prop `prop` was not specified in `Component`.'
    );

    expect(console.warn.calls[1].args[0]).toBe(
      'Warning: Failed propType: ' +
      'Invalid prop `prop` of type `number` supplied to ' +
      '`Component`, expected `string`.'
    );

    ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {prop: 'string'})
    );

    // Should not error for strings
    expect(console.warn.calls.length).toBe(2);
  });

  it('should warn if a fragment is used without the wrapper', function() {
    spyOn(console, 'warn');
    var child = React.createElement('span');
    React.createElement('div', null, {a: child, b: child});
    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.calls[0].args[0]).toContain('use of a keyed object');
  });

  it('should warn when accessing .type on an element factory', function() {
    spyOn(console, 'warn');
    var TestComponent = React.createClass({
      render: function() {
        return <div />;
      }
    });
    var TestFactory = React.createFactory(TestComponent);
    expect(TestFactory.type).toBe(TestComponent);
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: Factory.type is deprecated. Access the class directly before ' +
      'passing it to createFactory.'
    );
    // Warn once, not again
    expect(TestFactory.type).toBe(TestComponent);
    expect(console.warn.argsForCall.length).toBe(1);
  });

});
