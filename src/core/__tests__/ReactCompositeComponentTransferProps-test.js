/**
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

var React;
var ReactTestUtils;
var reactComponentExpect;

var TestComponent;

describe('ReactCompositeComponent-transferProps', function() {

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
      .expectRenderedChild(instance)
        .toBeDOMComponentWithTag('input')
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
      .expectRenderedChild(instance)
        .toBeDOMComponentWithTag('input')
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
      .expectRenderedChild(instance)
        .toBeDOMComponentWithTag('input')
        .scalarPropsEqual({
          className: 'textinput hidden_elem',
          style: {
            display: 'block',
            width: '100%'
          }
        });
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
});
