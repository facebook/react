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
    instance = ReactTestUtils.renderIntoDocument(instance);
    expectSingleChildlessDiv(instance);
  });

  it('should not render extra nodes for non-interpolated text', function() {
    var instance = (
      <MyCompositeComponent>
        {'Interpolated String Child'}
      </MyCompositeComponent>
    );
    instance = ReactTestUtils.renderIntoDocument(instance);
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
    instance = ReactTestUtils.renderIntoDocument(instance);
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
