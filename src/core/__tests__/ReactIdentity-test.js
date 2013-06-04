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

  it('should let restructured components retain their uniqueness', function() {
    var instance0 = <span />;
    var instance1 = <span />;
    var instance2 = <span />;
    var wrapped = <div>{instance0} {instance1}</div>;
    var unwrappedAndAdded =
      <div>
        {instance2}
        {wrapped.props.children[0]}
        {wrapped.props.children[1]}
      </div>;

    expect(function() {

      React.renderComponent(unwrappedAndAdded, document.createElement('div'));

    }).not.toThrow();
  });

  it('should retain keys during updates in composite components', function() {

    var TestComponent = React.createClass({
      render: function() {
        return <div>{this.props.children}</div>;
      }
    });

    var TestContainer = React.createClass({

      getInitialState: function() {
        return { swapped: false };
      },

      swap: function() {
        this.setState({ swapped: true });
      },

      render: function() {
        return (
          <TestComponent>
            {this.state.swapped ? this.props.second : this.props.first}
            {this.state.swapped ? this.props.first : this.props.second}
          </TestComponent>
        );
      }

    });

    var instance0 = <span key="A" />;
    var instance1 = <span key="B" />;

    var wrapped = <TestContainer first={instance0} second={instance1} />;

    React.renderComponent(wrapped, document.createElement('div'));

    var beforeKey = wrapped
      ._renderedComponent
      ._renderedComponent
      .props.children[0]._key;

    wrapped.swap();

    var afterKey = wrapped
      ._renderedComponent
      ._renderedComponent
      .props.children[0]._key;

    expect(beforeKey).not.toEqual(afterKey);

  });

});
