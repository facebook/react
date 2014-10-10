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

var mocks = require('mocks');

var React;
var ReactTestUtils;
var reactComponentExpect;

describe('ReactCompositeComponent-spec', function() {

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');
  });

  it('should throw when `render` is not specified', function() {
    expect(function() {
      React.createClass({});
    }).toThrow(
      'Invariant Violation: createClass(...): Class specification must ' +
      'implement a `render` method.'
    );
  });

  it('should copy `displayName` onto the Constructor', function() {
    var TestComponent = React.createClass({
      render: function() {
        return <div />;
      }
    });

    expect(TestComponent.type.displayName)
      .toBe('TestComponent');
  });

  it('should copy prop types onto the Constructor', function() {
    var propValidator = mocks.getMockFunction();
    var TestComponent = React.createClass({
      propTypes: {
        value: propValidator
      },
      render: function() {
        return <div />;
      }
    });

    expect(TestComponent.type.propTypes).toBeDefined();
    expect(TestComponent.type.propTypes.value)
      .toBe(propValidator);
  });
});
