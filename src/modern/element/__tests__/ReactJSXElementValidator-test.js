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

// TODO: All these warnings should become static errors using Flow instead
// of dynamic errors when using JSX with Flow.

var React;
var ReactFragment;
var ReactTestUtils;

describe('ReactJSXElementValidator', function() {
  var Component;

  beforeEach(function() {
    require('mock-modules').dumpCache();

    React = require('React');
    ReactFragment = require('ReactFragment');
    ReactTestUtils = require('ReactTestUtils');

    Component = class {
      render() { return <div />; }
    };
  });

  function frag(obj) {
    return ReactFragment.create(obj);
  }

  it('warns for keys for arrays of elements in children position', function() {
    spyOn(console, 'warn');

    <Component>{[<Component />, <Component />]}</Component>;

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Each child in an array or iterator should have a unique "key" prop.'
    );
  });

  it('warns for keys for arrays of elements with owner info', function() {
    spyOn(console, 'warn');

    class InnerComponent {
      render() {
        return <Component>{this.props.childSet}</Component>;
      }
    };

    class ComponentWrapper {
      render() {
        return (
          <InnerComponent
            childSet={[<Component />, <Component />]}
          />
        );
      }
    };

    ReactTestUtils.renderIntoDocument(<ComponentWrapper />);

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Each child in an array or iterator should have a unique "key" prop. ' +
      'Check the render method of InnerComponent. ' +
      'It was passed a child from ComponentWrapper. '
    );
  });

  it('warns for keys for iterables of elements in rest args', function() {
    spyOn(console, 'warn');

    var iterable = {
      '@@iterator': function() {
        var i = 0;
        return {
          next: function() {
            var done = ++i > 2;
            return {value: done ? undefined : <Component />, done: done};
          }
        };
      }
    };

    <Component>{iterable}</Component>;

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Each child in an array or iterator should have a unique "key" prop.'
    );
  });

  it('does not warns for arrays of elements with keys', function() {
    spyOn(console, 'warn');

    <Component>{[<Component key="#1" />, <Component key="#2" />]}</Component>;

    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('does not warns for iterable elements with keys', function() {
    spyOn(console, 'warn');

    var iterable = {
      '@@iterator': function() {
        var i = 0;
        return {
          next: function() {
            var done = ++i > 2;
            return {
              value: done ? undefined : <Component key={'#' + i} />,
              done: done
            };
          }
        };
      }
    };

    <Component>{iterable}</Component>

    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('warns for numeric keys on objects as children', function() {
    spyOn(console, 'warn');

    <Component>{frag({1: <Component />, 2: <Component />})}</Component>;

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Child objects should have non-numeric keys so ordering is preserved.'
    );
  });

  it('does not warn for numeric keys in entry iterable as a child', function() {
    spyOn(console, 'warn');

    var iterable = {
      '@@iterator': function() {
        var i = 0;
        return {
          next: function() {
            var done = ++i > 2;
            return {value: done ? undefined : [i, <Component />], done: done};
          }
        };
      }
    };
    iterable.entries = iterable['@@iterator'];

    <Component>{iterable}</Component>;

    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('does not warn when the element is directly as children', function() {
    spyOn(console, 'warn');

    <Component><Component /><Component /></Component>;

    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('does not warn when the child array contains non-elements', function() {
    spyOn(console, 'warn');

    <Component>{[ {}, {} ]}</Component>;

    expect(console.warn.argsForCall.length).toBe(0);
  });

  // TODO: These warnings currently come from the composite component, but
  // they should be moved into the ReactElementValidator.

  it('should give context for PropType errors in nested components.', () => {
    // In this test, we're making sure that if a proptype error is found in a
    // component, we give a small hint as to which parent instantiated that
    // component as per warnings about key usage in ReactElementValidator.
    spyOn(console, 'warn');
    class MyComp {
      render() {
        return <div>My color is {this.color}</div>;
      }
    }
    MyComp.propTypes = {
      color: React.PropTypes.string
    };
    class ParentComp {
      render() {
        return <MyComp color={123} />;
      }
    }
    ReactTestUtils.renderIntoDocument(<ParentComp />);
    expect(console.warn.calls[0].args[0]).toBe(
      'Warning: Failed propType: ' +
      'Invalid prop `color` of type `number` supplied to `MyComp`, ' +
      'expected `string`. Check the render method of `ParentComp`.'
    );
  });

  it('gives a helpful error when passing null or undefined', function() {
    var Undefined = undefined;
    var Null = null;
    var Div = 'div';
    spyOn(console, 'warn');
    <Undefined />;
    <Null />;
    expect(console.warn.calls.length).toBe(2);
    expect(console.warn.calls[0].args[0]).toContain(
      'type should not be null or undefined. It should be a string (for ' +
      'DOM elements) or a ReactClass (for composite components).'
    );
    expect(console.warn.calls[1].args[0]).toContain(
      'type should not be null or undefined. It should be a string (for ' +
      'DOM elements) or a ReactClass (for composite components).'
    );
    <Div />;
    expect(console.warn.calls.length).toBe(2);
  });

  it('should check default prop values', function() {
    spyOn(console, 'warn');

    class Component {
      render() {
        return <span>{this.props.prop}</span>;
      }
    }
    Component.defaultProps = {prop: null};
    Component.propTypes = {prop: React.PropTypes.string.isRequired};

    ReactTestUtils.renderIntoDocument(<Component />);

    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.calls[0].args[0]).toBe(
      'Warning: Failed propType: ' +
      'Required prop `prop` was not specified in `Component`.'
    );
  });

  it('should not check the default for explicit null', function() {
    spyOn(console, 'warn');

    class Component {
      render() {
        return <span>{this.props.prop}</span>;
      }
    }
    Component.defaultProps = {prop: 'text'};
    Component.propTypes = {prop: React.PropTypes.string.isRequired};

    ReactTestUtils.renderIntoDocument(<Component prop={null} />);

    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.calls[0].args[0]).toBe(
      'Warning: Failed propType: ' +
      'Required prop `prop` was not specified in `Component`.'
    );
  });

  it('should check declared prop types', function() {
    spyOn(console, 'warn');

    class Component {
      render() {
        return <span>{this.props.prop}</span>;
      }
    }
    Component.propTypes = {
      prop: React.PropTypes.string.isRequired
    };

    ReactTestUtils.renderIntoDocument(<Component />);
    ReactTestUtils.renderIntoDocument(<Component prop={42} />);

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

    ReactTestUtils.renderIntoDocument(<Component prop="string" />);

    // Should not error for strings
    expect(console.warn.calls.length).toBe(2);
  });

  it('should warn on invalid prop types', function() {
    // Since there is no prevalidation step for ES6 classes, there is no hook
    // for us to issue a warning earlier than element creation when the error
    // actually occurs. Since this step is skipped in production, we should just
    // warn instead of throwing for this case.
    spyOn(console, 'warn');
    class Component {
      render() {
        return <span>{this.props.prop}</span>;
      }
    }
    Component.propTypes = {
      prop: null
    };
    ReactTestUtils.renderIntoDocument(<Component />);
    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.calls[0].args[0]).toContain(
      'Invariant Violation: Component: prop type `prop` is invalid; ' +
      'it must be a function, usually from React.PropTypes.'
    );
  });

  it('should warn on invalid context types', function() {
    spyOn(console, 'warn');
    class Component {
      render() {
        return <span>{this.props.prop}</span>;
      }
    }
    Component.contextTypes = {
      prop: null
    };
    ReactTestUtils.renderIntoDocument(<Component />);
    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.calls[0].args[0]).toContain(
      'Invariant Violation: Component: context type `prop` is invalid; ' +
      'it must be a function, usually from React.PropTypes.'
    );
  });

  it('should warn if getDefaultProps is specificed on the class', function() {
    spyOn(console, 'warn');
    class Component {
      render() {
        return <span>{this.props.prop}</span>;
      }
    }
    Component.getDefaultProps = () => ({
      prop: 'foo'
    });
    ReactTestUtils.renderIntoDocument(<Component />);
    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.calls[0].args[0]).toContain(
      'getDefaultProps is only used on classic React.createClass definitions.' +
      ' Use a static property named `defaultProps` instead.'
    );
  });

});
