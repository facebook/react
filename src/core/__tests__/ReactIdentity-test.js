/**
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

var React;
var ReactTestUtils;
var reactComponentExpect;

describe('ReactIdentity', function() {

  beforeEach(function() {
    require('mock-modules').autoMockOff().dumpCache();
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');
  });

  it('should allow keyed objects to express identity', function() {
    var instance =
      <div>
        {{
          first: <div />,
          second: <div />
        }}
      </div>;

    React.renderComponent(instance, document.createElement('div'));
    var node = instance.getDOMNode();
    reactComponentExpect(instance).toBeDOMComponentWithChildCount(2);
    expect(node.childNodes[0].id).toEqual('.reactRoot[0].:0:first');
    expect(node.childNodes[1].id).toEqual('.reactRoot[0].:0:second');
  });

  it('should allow key property to express identity', function() {
    var instance =
      <div>
        <div key="apple" />
        <div key="banana" />
      </div>;

    React.renderComponent(instance, document.createElement('div'));
    var node = instance.getDOMNode();
    reactComponentExpect(instance).toBeDOMComponentWithChildCount(2);
    expect(node.childNodes[0].id).toEqual('.reactRoot[0].:apple');
    expect(node.childNodes[1].id).toEqual('.reactRoot[0].:banana');
  });

  it('should use instance identity', function() {

    var Wrapper = React.createClass({
      render: function() {
        return <a key="i_get_overwritten">{this.props.children}</a>;
      }
    });

    var instance =
      <div>
        <Wrapper key="wrap1"><span key="squirrel" /></Wrapper>
        <Wrapper key="wrap2"><span key="bunny" /></Wrapper>
        <Wrapper><span key="chipmunk" /></Wrapper>
      </div>;

    React.renderComponent(instance, document.createElement('div'));
    var node = instance.getDOMNode();
    reactComponentExpect(instance).toBeDOMComponentWithChildCount(3);
    expect(node.childNodes[0].id)
      .toEqual('.reactRoot[0].:wrap1');
    expect(node.childNodes[0].firstChild.id)
      .toEqual('.reactRoot[0].:wrap1.:squirrel');
    expect(node.childNodes[1].id)
      .toEqual('.reactRoot[0].:wrap2');
    expect(node.childNodes[1].firstChild.id)
      .toEqual('.reactRoot[0].:wrap2.:bunny');
    expect(node.childNodes[2].id)
      .toEqual('.reactRoot[0].:2');
    expect(node.childNodes[2].firstChild.id)
      .toEqual('.reactRoot[0].:2.:chipmunk');
  });

});
