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

var React;
var ReactTestUtils;
var reactComponentExpect;

describe('reactComponentExpect', () => {

  beforeEach(() => {
    React = require('react');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');
  });

  it('should match composite components', () => {
    class SomeComponent extends React.Component {
      state = {y: 2};
      render() {
        return (
          <div className="Hello" />
        );
      }
    }

    var component = ReactTestUtils.renderIntoDocument(<SomeComponent x={1} />);
    reactComponentExpect(component)
      .toBePresent()
      .toBeCompositeComponent()
      .toBeComponentOfType(SomeComponent)
      .toBeCompositeComponentWithType(SomeComponent)
      .scalarPropsEqual({x: 1})
      .scalarStateEqual({y: 2});
  });

  it('should match empty DOM components', () => {
    class SomeComponent extends React.Component {
      render() {
        return (
          <div className="Hello" />
        );
      }
    }

    var component = ReactTestUtils.renderIntoDocument(<SomeComponent />);
    reactComponentExpect(component)
      .expectRenderedChild()
      .toBePresent()
      .toBeDOMComponent()
      .toBeDOMComponentWithNoChildren()
      .toBeComponentOfType('div');
  });

  it('should match non-empty DOM components', () => {
    class SomeComponent extends React.Component {
      render() {
        return (
          <div className="Hello">
            <p>1</p>
            <p>2</p>
          </div>
        );
      }
    }

    var component = ReactTestUtils.renderIntoDocument(<SomeComponent />);
    reactComponentExpect(component)
      .expectRenderedChild()
      .toBePresent()
      .toBeDOMComponent()
      .toBeDOMComponentWithChildCount(2)
      .toBeComponentOfType('div');
  });

  it('should match DOM component children', () => {
    class Inner extends React.Component {
      render() {
        return <section />;
      }
    }

    class Noop extends React.Component {
      render() {
        return null;
      }
    }

    class SomeComponent extends React.Component {
      render() {
        return (
          <div className="Hello">
            <p>1</p>
            <Inner foo="bar" />
            <span>{'Two'}{3}</span>
            <Noop />
          </div>
        );
      }
    }

    var component = ReactTestUtils.renderIntoDocument(<SomeComponent />);
    reactComponentExpect(component)
      .expectRenderedChild()
      .expectRenderedChildAt(0)
      .toBePresent()
      .toBeDOMComponent()
      .toBeDOMComponentWithNoChildren()
      .toBeComponentOfType('p');

    reactComponentExpect(component)
      .expectRenderedChild()
      .expectRenderedChildAt(1)
      .toBePresent()
      .toBeCompositeComponentWithType(Inner)
      .scalarPropsEqual({foo: 'bar'})
      .expectRenderedChild()
      .toBeComponentOfType('section')
      .toBeDOMComponentWithNoChildren();

    reactComponentExpect(component)
      .expectRenderedChild()
      .expectRenderedChildAt(2)
      .toBePresent()
      .toBeDOMComponent()
      .toBeComponentOfType('span')
      .toBeDOMComponentWithChildCount(2)
      .expectRenderedChildAt(0)
      .toBeTextComponentWithValue('Two');

    reactComponentExpect(component)
      .expectRenderedChild()
      .expectRenderedChildAt(2)
      .expectRenderedChildAt(1)
      .toBeTextComponentWithValue('3');

    reactComponentExpect(component)
      .expectRenderedChild()
      .expectRenderedChildAt(3)
      .toBePresent()
      .toBeCompositeComponentWithType(Noop)
      .expectRenderedChild()
      .toBeEmptyComponent();
  });

  it('should detect text components', () => {
    class SomeComponent extends React.Component {
      render() {
        return (
          <div>
            <div>This is a div</div>
            {'This is text'}
          </div>
        );
      }
    }

    var component = ReactTestUtils.renderIntoDocument(<SomeComponent />);
    reactComponentExpect(component)
      .expectRenderedChild()
      .expectRenderedChildAt(1)
      .toBeTextComponentWithValue('This is text');
  });
});
