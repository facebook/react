/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

var React;
var ReactTestUtils;
var reactComponentExpect;

var TestComponent;

describe('ReactPropTransferer', function() {

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');

    TestComponent = React.createClass({
      render: function() {
        return this.transferPropsTo(
          <input
            className="textinput"
            style={{display: 'block'}}
            type="text"
            value=""
          />
        );
      }
    });
  });

  it('should leave explicitly specified properties intact', function() {
    var instance = <TestComponent type="radio" />;
    ReactTestUtils.renderIntoDocument(instance);

    reactComponentExpect(instance)
      .expectRenderedChild()
        .toBeComponentOfType(React.DOM.input)
        .scalarPropsEqual({
          className: 'textinput',
          style: {display: 'block'},
          type: 'text',
          value: ''
        });
  });

  it('should transfer unspecified properties', function() {
    var instance = <TestComponent placeholder="Type here..." />;
    ReactTestUtils.renderIntoDocument(instance);

    reactComponentExpect(instance)
      .expectRenderedChild()
        .toBeComponentOfType(React.DOM.input)
        .scalarPropsEqual({placeholder: 'Type here...'});
  });

  it('should transfer using merge strategies', function() {
    var instance =
      <TestComponent
        className="hidden_elem"
        style={{width: '100%'}}
      />;
    ReactTestUtils.renderIntoDocument(instance);

    reactComponentExpect(instance)
      .expectRenderedChild()
        .toBeComponentOfType(React.DOM.input)
        .scalarPropsEqual({
          className: 'textinput hidden_elem',
          style: {
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

    ReactTestUtils.renderIntoDocument(instance);
    reactComponentExpect(instance)
      .expectRenderedChild()
        .toBeDOMComponentWithTag('div')
        .toBeDOMComponentWithNoChildren();
  });

  it('should not transfer ref', function() {
    var RefTestComponent = React.createClass({
      render: function() {
        expect(this.props.ref).toBeUndefined();
        return <div />;
      }
    });
    var OuterRefTestComponent = React.createClass({
      render: function() {
        return this.transferPropsTo(<RefTestComponent />);
      }
    });
    var OuterOuterRefTestComponent = React.createClass({
      render: function() {
        return <OuterRefTestComponent ref="testref" />;
      }
    });

    ReactTestUtils.renderIntoDocument(<OuterOuterRefTestComponent />);
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
});
