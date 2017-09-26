/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
describe('ReactCompositeComponentDOMMinimalism', () => {
  beforeEach(() => {
    reactComponentExpect = require('reactComponentExpect');
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');

    LowerLevelComposite = class extends React.Component {
      render() {
        return (
          <div>
            {this.props.children}
          </div>
        );
      }
    };

    MyCompositeComponent = class extends React.Component {
      render() {
        return (
          <LowerLevelComposite>
            {this.props.children}
          </LowerLevelComposite>
        );
      }
    };

    expectSingleChildlessDiv = function(instance) {
      reactComponentExpect(instance)
        .expectRenderedChild()
        .toBeCompositeComponentWithType(LowerLevelComposite)
        .expectRenderedChild()
        .toBeDOMComponentWithTag('div')
        .toBeDOMComponentWithNoChildren();
    };
  });

  it('should not render extra nodes for non-interpolated text', () => {
    var instance = (
      <MyCompositeComponent>
        A string child
      </MyCompositeComponent>
    );
    instance = ReactTestUtils.renderIntoDocument(instance);
    expectSingleChildlessDiv(instance);
  });

  it('should not render extra nodes for non-interpolated text', () => {
    var instance = (
      <MyCompositeComponent>
        {'Interpolated String Child'}
      </MyCompositeComponent>
    );
    instance = ReactTestUtils.renderIntoDocument(instance);
    expectSingleChildlessDiv(instance);
  });

  it('should not render extra nodes for non-interpolated text', () => {
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
