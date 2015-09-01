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
describe('autobind optout', function() {

  it('should work with manual binding', function() {

    var mouseDidEnter = mocks.getMockFunction();
    var mouseDidLeave = mocks.getMockFunction();
    var mouseDidClick = mocks.getMockFunction();

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
            onMouseOver={this.onMouseEnter.bind(this)}
            onMouseOut={this.onMouseLeave.bind(this)}
            onClick={this.onClick.bind(this)}
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

  it('should not hold reference to instance', function() {
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

    expect(mountedInstance1.onClick).toBe(mountedInstance2.onClick);

    expect(function() {
      ReactTestUtils.Simulate.click(rendered1);
    }).toThrow();

    expect(function() {
      ReactTestUtils.Simulate.click(rendered2);
    }).toThrow();
  });

  it('works with mixins that have not opted out of autobinding', function() {
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

  it('works with mixins that have opted out of autobinding', function() {
    var mouseDidClick = mocks.getMockFunction();

    var TestMixin = {
      autobind: false,
      onClick: mouseDidClick,
    };

    var TestBindComponent = React.createClass({
      mixins: [TestMixin],

      render: function() {
        return <div onClick={this.onClick.bind(this)} />;
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

  it('does not warn if you try to bind to this', function() {
    spyOn(console, 'error');

    var TestBindComponent = React.createClass({
      autobind: false,
      handleClick: function() { },
      render: function() {
        return <div onClick={this.handleClick.bind(this)} />;
      },
    });

    ReactTestUtils.renderIntoDocument(<TestBindComponent />);

    expect(console.error.argsForCall.length).toBe(0);
  });

  it('does not warn if you pass an manually bound method to setState', function() {
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

    expect(console.error.argsForCall.length).toBe(0);
  });

});
