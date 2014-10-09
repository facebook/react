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
var reactComponentExpect;

var TestComponent;

describe('ReactPropTransferer', function() {

  beforeEach(function() {
    require('mock-modules').dumpCache();

    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');

    // We expect to get a warning from transferPropsTo since it's deprecated
    spyOn(console, 'warn');

    TestComponent = React.createClass({
      render: function() {
        var result = this.transferPropsTo(
          <input
            className="textinput"
            style={{display: 'block', color: 'green'}}
            type="text"
            value=""
          />
        );
        expect(console.warn).toHaveBeenCalled();
        return result;
      }
    });
  });

  it('should leave explicitly specified properties intact', function() {
    var instance = <TestComponent type="radio" />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    reactComponentExpect(instance)
      .expectRenderedChild()
        .toBeComponentOfType('input')
        .scalarPropsEqual({
          className: 'textinput',
          style: {display: 'block', color: 'green'},
          type: 'text',
          value: ''
        });
  });

  it('should transfer unspecified properties', function() {
    var instance = <TestComponent placeholder="Type here..." />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    reactComponentExpect(instance)
      .expectRenderedChild()
        .toBeComponentOfType('input')
        .scalarPropsEqual({placeholder: 'Type here...'});
  });

  it('should transfer using merge strategies', function() {
    var instance =
      <TestComponent
        className="hidden_elem"
        style={{width: '100%', display: 'none'}}
      />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    reactComponentExpect(instance)
      .expectRenderedChild()
        .toBeComponentOfType('input')
        .scalarPropsEqual({
          className: 'textinput hidden_elem',
          style: {
            color: 'green',
            display: 'block',
            width: '100%'
          }
        });
  });

  it('should not transfer children', function() {
    var ChildrenTestComponent = React.createClass({
      render: function() {
        return this.transferPropsTo(<div />);
      }
    });

    var instance =
      <ChildrenTestComponent>
        <span>Hello!</span>
      </ChildrenTestComponent>;

    instance = ReactTestUtils.renderIntoDocument(instance);
    reactComponentExpect(instance)
      .expectRenderedChild()
        .toBeDOMComponentWithTag('div')
        .toBeDOMComponentWithNoChildren();
  });

  it('should not transfer ref or key', function() {
    var TestComponent = React.createClass({
      render: function() {
        expect(this.props.ref).toBeUndefined();
        expect(this.props.key).toBeUndefined();
        return <div />;
      }
    });
    var OuterTestComponent = React.createClass({
      render: function() {
        return this.transferPropsTo(<TestComponent />);
      }
    });
    var OuterOuterTestComponent = React.createClass({
      render: function() {
        return <OuterTestComponent ref="testref" key="testkey" />;
      }
    });

    ReactTestUtils.renderIntoDocument(<OuterOuterTestComponent />);
  });

  it('should not transferPropsTo() a component you don\'t own', function() {
    var Parent = React.createClass({
      render: function() {
        return <Child><span /></Child>;
      }
    });

    var Child = React.createClass({
      render: function() {
        return this.transferPropsTo(this.props.children);
      }
    });

    expect(function() {
      ReactTestUtils.renderIntoDocument(<Parent />);
    }).toThrow(
      'Invariant Violation: ' +
      'Child: You can\'t call transferPropsTo() on a component that you ' +
      'don\'t own, span. ' +
      'This usually means you are calling transferPropsTo() on a component ' +
      'passed in as props or children.'
    );
  });

  it('uses the default instead of the transferred prop (regress)', function() {

    var Child = React.createClass({

      getDefaultProps: function() {
        return {
          x: 2
        };
      },

      render: function() {
        expect(this.props.x).toBe(2);
        return <div />;
      }

    });

    var Parent = React.createClass({

      render: function() {
        return this.transferPropsTo(<Child />);
      }

    });

    ReactTestUtils.renderIntoDocument(<Parent x={5} />);

  });

});
