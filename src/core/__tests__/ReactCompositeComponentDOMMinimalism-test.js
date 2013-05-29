/**
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

// Requires
var React;
var ReactTestUtils;
var reactComponentExpect;

// Test components
var LowerLevelComposite;
var MyCompositeComponent;

var expectSingleChildlessDiv;

/**
 * Integration test, testing the combination of JSX with our unit of
 * abstraction, `ReactCompositeComponent` does not ever add superfluous DOM
 * nodes.
 */
describe('ReactCompositeComponentDOMMinimalism', function() {

  beforeEach(function() {
    reactComponentExpect = require('reactComponentExpect');
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');

    LowerLevelComposite = React.createClass({
      render: function() {
        return (
          <div>
            {this.props.children}
          </div>
        );
      }
    });

    MyCompositeComponent = React.createClass({
      render: function() {
        return (
          <LowerLevelComposite>
            {this.props.children}
          </LowerLevelComposite>
        );
      }
    });

    expectSingleChildlessDiv = function(instance) {
      reactComponentExpect(instance)
        .expectRenderedChild()
        .toBeCompositeComponentWithType(LowerLevelComposite)
          .expectRenderedChild()
          .toBeDOMComponentWithTag('div')
          .toBeDOMComponentWithNoChildren();
    };
  });

  it('should not render extra nodes for non-interpolated text', function() {
    var instance = (
      <MyCompositeComponent>
        A string child
      </MyCompositeComponent>
    );
    ReactTestUtils.renderIntoDocument(instance);
    expectSingleChildlessDiv(instance);
  });

  it('should not render extra nodes for non-interpolated text', function() {
    var instance = (
      <MyCompositeComponent>
        {'Interpolated String Child'}
      </MyCompositeComponent>
    );
    ReactTestUtils.renderIntoDocument(instance);
    expectSingleChildlessDiv(instance);
  });

  it('should not render extra nodes for non-interpolated text', function() {
    var instance = (
      <MyCompositeComponent>
        <ul>
          This text causes no children in ul, just innerHTML
        </ul>
      </MyCompositeComponent>
    );
    ReactTestUtils.renderIntoDocument(instance);
    reactComponentExpect(instance)
      .expectRenderedChild()
      .toBeCompositeComponentWithType(LowerLevelComposite)
        .expectRenderedChild()
        .toBeDOMComponentWithTag('div')
        .toBeDOMComponentWithChildCount(1)
        .expectRenderedChildAt(0)
          .toBeDOMComponentWithTag('ul')
          .toBeDOMComponentWithNoChildren();
  });

});
