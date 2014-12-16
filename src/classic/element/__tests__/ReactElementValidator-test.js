/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

"use strict";

var React;
var ReactTestUtils;

describe('ReactElementValidator', function() {
  var ComponentClass;

  beforeEach(function() {
    require('mock-modules').dumpCache();

    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    ComponentClass = React.createClass({
      render: function() { return <div />; }
    });
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
        return <div>My color is {this.color}</div>;
      }
    });
    var ParentComp = React.createClass({
      render: function() {
        return <MyComp color={123} />;
      }
    });
    ReactTestUtils.renderIntoDocument(<ParentComp />);
    expect(console.warn.calls[0].args[0]).toBe(
      'Warning: Invalid prop `color` of type `number` supplied to `MyComp`, ' +
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

    expect(() => React.createElement(undefined)).not.toThrow()
  });


  it('should check default prop values', function() {
    spyOn(console, 'warn');

    var Component = React.createClass({
      propTypes: {prop: React.PropTypes.string.isRequired},
      getDefaultProps: function() {
        return {prop: null};
      },
      render: function() {
        return <span>{this.props.prop}</span>;
      }
    });

    ReactTestUtils.renderIntoDocument(<Component />);

    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.calls[0].args[0]).toBe(
      'Warning: Required prop `prop` was not specified in `Component`.'
    );
  });

  it('should check declared prop types', function() {
    spyOn(console, 'warn');

    var Component = React.createClass({
      propTypes: {
        prop: React.PropTypes.string.isRequired
      },
      render: function() {
        return <span>{this.props.prop}</span>;
      }
    });

    ReactTestUtils.renderIntoDocument(<Component />);
    ReactTestUtils.renderIntoDocument(<Component prop={42} />);

    expect(console.warn.calls.length).toBe(2);
    expect(console.warn.calls[0].args[0]).toBe(
      'Warning: Required prop `prop` was not specified in `Component`.'
    );

    expect(console.warn.calls[1].args[0]).toBe(
      'Warning: Invalid prop `prop` of type `number` supplied to ' +
      '`Component`, expected `string`.'
    );

    ReactTestUtils.renderIntoDocument(<Component prop="string" />);

    // Should not error for strings
    expect(console.warn.calls.length).toBe(2);
  });

});
