/**
 * @jsx React.DOM
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

    expect(TestComponent.componentConstructor.displayName)
      .toBe('TestComponent');
  });

  it('should copy prop declarations onto the Constructor', function() {
    var propValidator = mocks.getMockFunction();
    var TestComponent = React.createClass({
      props: {
        value: propValidator
      },
      render: function() {
        return <div />;
      }
    });

    expect(TestComponent.componentConstructor.propDeclarations).toBeDefined();
    expect(TestComponent.componentConstructor.propDeclarations.value)
      .toBe(propValidator);
  });
});
