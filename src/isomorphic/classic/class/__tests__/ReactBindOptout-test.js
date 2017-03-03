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
/*global global:true*/
'use strict';

var React = require('react');
var ReactTestUtils = require('ReactTestUtils');

// TODO: Test render and all stock methods.
describe('autobind optout', () => {

  it('should work with manual binding', () => {

    var mouseDidEnter = jest.fn();
    var mouseDidLeave = jest.fn();
    var mouseDidClick = jest.fn();

    var TestBindComponent = React.createClass({
      autobind: false,
      getInitialState: function() {
        return {something: 'hi'};
      },
      onMouseEnter: mouseDidEnter,
      onMouseLeave: mouseDidLeave,
      onClick: mouseDidClick,

      render: function() {
        return (
          <div
            ref="child"
            onMouseOver={this.onMouseEnter.bind(this)}
            onMouseOut={this.onMouseLeave.bind(this)}
            onClick={this.onClick.bind(this)}
            />
        );
      },
    });

    var instance1 = ReactTestUtils.renderIntoDocument(<TestBindComponent />);
    var rendered1 = instance1.refs.child;

    var instance2 = ReactTestUtils.renderIntoDocument(<TestBindComponent />);
    var rendered2 = instance2.refs.child;

    ReactTestUtils.Simulate.click(rendered1);
    expect(mouseDidClick.mock.instances.length).toBe(1);
    expect(mouseDidClick.mock.instances[0]).toBe(instance1);

    ReactTestUtils.Simulate.click(rendered2);
    expect(mouseDidClick.mock.instances.length).toBe(2);
    expect(mouseDidClick.mock.instances[1]).toBe(instance2);

    ReactTestUtils.Simulate.mouseOver(rendered1);
    expect(mouseDidEnter.mock.instances.length).toBe(1);
    expect(mouseDidEnter.mock.instances[0]).toBe(instance1);

    ReactTestUtils.Simulate.mouseOver(rendered2);
    expect(mouseDidEnter.mock.instances.length).toBe(2);
    expect(mouseDidEnter.mock.instances[1]).toBe(instance2);

    ReactTestUtils.Simulate.mouseOut(rendered1);
    expect(mouseDidLeave.mock.instances.length).toBe(1);
    expect(mouseDidLeave.mock.instances[0]).toBe(instance1);

    ReactTestUtils.Simulate.mouseOut(rendered2);
    expect(mouseDidLeave.mock.instances.length).toBe(2);
    expect(mouseDidLeave.mock.instances[1]).toBe(instance2);
  });

  it('should not hold reference to instance', () => {
    var mouseDidClick = function() {
      void this.state.something;
    };

    var TestBindComponent = React.createClass({
      autobind: false,
      getInitialState: function() {
        return {something: 'hi'};
      },
      onClick: mouseDidClick,

      // auto binding only occurs on top level functions in class defs.
      badIdeas: {
        badBind: function() {
          void this.state.something;
        },
      },

      render: function() {
        return (
          <div
            ref="child"
            onClick={this.onClick}
          />
        );
      },
    });

    var instance1 = ReactTestUtils.renderIntoDocument(<TestBindComponent />);
    var rendered1 = instance1.refs.child;

    var instance2 = ReactTestUtils.renderIntoDocument(<TestBindComponent />);
    var rendered2 = instance2.refs.child;

    expect(function() {
      var badIdea = instance1.badIdeas.badBind;
      badIdea();
    }).toThrow();

    expect(instance1.onClick).toBe(instance2.onClick);

    expect(function() {
      ReactTestUtils.Simulate.click(rendered1);
    }).toThrow();

    expect(function() {
      ReactTestUtils.Simulate.click(rendered2);
    }).toThrow();
  });

  it('works with mixins that have not opted out of autobinding', () => {
    var mouseDidClick = jest.fn();

    var TestMixin = {
      onClick: mouseDidClick,
    };

    var TestBindComponent = React.createClass({
      mixins: [TestMixin],

      render: function() {
        return <div ref="child" onClick={this.onClick} />;
      },
    });

    var instance1 = ReactTestUtils.renderIntoDocument(<TestBindComponent />);
    var rendered1 = instance1.refs.child;

    ReactTestUtils.Simulate.click(rendered1);
    expect(mouseDidClick.mock.instances.length).toBe(1);
    expect(mouseDidClick.mock.instances[0]).toBe(instance1);
  });

  it('works with mixins that have opted out of autobinding', () => {
    var mouseDidClick = jest.fn();

    var TestMixin = {
      autobind: false,
      onClick: mouseDidClick,
    };

    var TestBindComponent = React.createClass({
      mixins: [TestMixin],

      render: function() {
        return <div ref="child" onClick={this.onClick.bind(this)} />;
      },
    });

    var instance1 = ReactTestUtils.renderIntoDocument(<TestBindComponent />);
    var rendered1 = instance1.refs.child;

    ReactTestUtils.Simulate.click(rendered1);
    expect(mouseDidClick.mock.instances.length).toBe(1);
    expect(mouseDidClick.mock.instances[0]).toBe(instance1);
  });

  it('does not warn if you try to bind to this', () => {
    spyOn(console, 'error');

    var TestBindComponent = React.createClass({
      autobind: false,
      handleClick: function() { },
      render: function() {
        return <div onClick={this.handleClick.bind(this)} />;
      },
    });

    ReactTestUtils.renderIntoDocument(<TestBindComponent />);

    expectDev(console.error.calls.count()).toBe(0);
  });

  it('does not warn if you pass an manually bound method to setState', () => {
    spyOn(console, 'error');

    var TestBindComponent = React.createClass({
      autobind: false,
      getInitialState: function() {
        return {foo: 1};
      },
      componentDidMount: function() {
        this.setState({foo: 2}, this.handleUpdate.bind(this));
      },
      handleUpdate: function() {

      },
      render: function() {
        return <div />;
      },
    });

    ReactTestUtils.renderIntoDocument(<TestBindComponent />);

    expectDev(console.error.calls.count()).toBe(0);
  });

});
