/**
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

var mocks = require('mocks');

var React;
var ReactTestUtils;
var reactComponentExpect;

var TestComponent;

describe('ReactCompositeComponent-mixin', function() {

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');

    var MixinA = {
      componentDidMount: function() {
        this.props.listener('MixinA didMount');
      }
    };

    var MixinB = {
      mixins: [MixinA],
      componentDidMount: function() {
        this.props.listener('MixinB didMount');
      }
    };

    var MixinC = {
      componentDidMount: function() {
        this.props.listener('MixinC didMount');
      }
    };

    TestComponent = React.createClass({
      mixins: [MixinB, MixinC],

      componentDidMount: function() {
        this.props.listener('Component didMount');
      },

      render: function() {
        return <div />;
      }
    });

  });

  it('should support chaining delegate functions', function() {
    var listener = mocks.getMockFunction();
    var instance = <TestComponent listener={listener} />;
    ReactTestUtils.renderIntoDocument(instance);

    expect(listener.mock.calls).toEqual([
      ['MixinA didMount'],
      ['MixinB didMount'],
      ['MixinC didMount'],
      ['Component didMount']
    ]);
  });
});
