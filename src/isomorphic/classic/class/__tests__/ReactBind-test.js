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
/*global global:true*/
'use strict';

var mocks = require('mocks');
var React = require('React');
var ReactTestUtils = require('ReactTestUtils');
var reactComponentExpect = require('reactComponentExpect');

// TODO: Test render and all stock methods.
describe('autobinding', function() {

  it('Holds reference to instance', function() {

    var mouseDidEnter = mocks.getMockFunction();
    var mouseDidLeave = mocks.getMockFunction();
    var mouseDidClick = mocks.getMockFunction();

    var TestBindComponent = React.createClass({
      getInitialState: function() {
        return {something: 'hi'};
      },
      onMouseEnter: mouseDidEnter,
      onMouseLeave: mouseDidLeave,
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
            onMouseOver={this.onMouseEnter}
            onMouseOut={this.onMouseLeave}
            onClick={this.onClick}
          />
        );
      },
    });

    var instance1 = <TestBindComponent />;
    var mountedInstance1 = ReactTestUtils.renderIntoDocument(instance1);
    var rendered1 = reactComponentExpect(mountedInstance1)
      .expectRenderedChild()
      .instance();

    var instance2 = <TestBindComponent />;
    var mountedInstance2 = ReactTestUtils.renderIntoDocument(instance2);
    var rendered2 = reactComponentExpect(mountedInstance2)
      .expectRenderedChild()
      .instance();

    expect(function() {
      var badIdea = instance1.badIdeas.badBind;
      badIdea();
    }).toThrow();

    expect(mountedInstance1.onClick).not.toBe(mountedInstance2.onClick);

    ReactTestUtils.Simulate.click(rendered1);
    expect(mouseDidClick.mock.instances.length).toBe(1);
    expect(mouseDidClick.mock.instances[0]).toBe(mountedInstance1);

    ReactTestUtils.Simulate.click(rendered2);
    expect(mouseDidClick.mock.instances.length).toBe(2);
    expect(mouseDidClick.mock.instances[1]).toBe(mountedInstance2);

    ReactTestUtils.Simulate.mouseOver(rendered1);
    expect(mouseDidEnter.mock.instances.length).toBe(1);
    expect(mouseDidEnter.mock.instances[0]).toBe(mountedInstance1);

    ReactTestUtils.Simulate.mouseOver(rendered2);
    expect(mouseDidEnter.mock.instances.length).toBe(2);
    expect(mouseDidEnter.mock.instances[1]).toBe(mountedInstance2);

    ReactTestUtils.Simulate.mouseOut(rendered1);
    expect(mouseDidLeave.mock.instances.length).toBe(1);
    expect(mouseDidLeave.mock.instances[0]).toBe(mountedInstance1);

    ReactTestUtils.Simulate.mouseOut(rendered2);
    expect(mouseDidLeave.mock.instances.length).toBe(2);
    expect(mouseDidLeave.mock.instances[1]).toBe(mountedInstance2);
  });

  it('works with mixins', function() {
    var mouseDidClick = mocks.getMockFunction();

    var TestMixin = {
      onClick: mouseDidClick,
    };

    var TestBindComponent = React.createClass({
      mixins: [TestMixin],

      render: function() {
        return <div onClick={this.onClick} />;
      },
    });

    var instance1 = <TestBindComponent />;
    var mountedInstance1 = ReactTestUtils.renderIntoDocument(instance1);
    var rendered1 = reactComponentExpect(mountedInstance1)
      .expectRenderedChild()
      .instance();

    ReactTestUtils.Simulate.click(rendered1);
    expect(mouseDidClick.mock.instances.length).toBe(1);
    expect(mouseDidClick.mock.instances[0]).toBe(mountedInstance1);
  });

  it('warns if you try to bind to this', function() {
    spyOn(console, 'error');

    var TestBindComponent = React.createClass({
      handleClick: function() { },
      render: function() {
        return <div onClick={this.handleClick.bind(this)} />;
      },
    });

    ReactTestUtils.renderIntoDocument(<TestBindComponent />);

    expect(console.error.argsForCall.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toBe(
      'Warning: bind(): You are binding a component method to the component. ' +
      'React does this for you automatically in a high-performance ' +
      'way, so you can safely remove this call. See TestBindComponent'
    );
  });

  it('does not warn if you pass an auto-bound method to setState', function() {
    spyOn(console, 'error');

    var TestBindComponent = React.createClass({
      getInitialState: function() {
        return {foo: 1};
      },
      componentDidMount: function() {
        this.setState({foo: 2}, this.handleUpdate);
      },
      handleUpdate: function() {

      },
      render: function() {
        return <div onClick={this.handleClick} />;
      },
    });

    ReactTestUtils.renderIntoDocument(<TestBindComponent />);

    expect(console.error.argsForCall.length).toBe(0);
  });

});
