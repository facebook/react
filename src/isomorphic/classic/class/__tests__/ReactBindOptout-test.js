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

const React = require('React');
const ReactTestUtils = require('ReactTestUtils');
const reactComponentExpect = require('reactComponentExpect');

// TODO: Test render and all stock methods.
describe('autobind optout', function() {

  it('should work with manual binding', function() {

    const mouseDidEnter = jest.genMockFn();
    const mouseDidLeave = jest.genMockFn();
    const mouseDidClick = jest.genMockFn();

    const TestBindComponent = React.createClass({
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

    const instance1 = <TestBindComponent />;
    const mountedInstance1 = ReactTestUtils.renderIntoDocument(instance1);
    const rendered1 = reactComponentExpect(mountedInstance1)
      .expectRenderedChild()
      .instance();

    const instance2 = <TestBindComponent />;
    const mountedInstance2 = ReactTestUtils.renderIntoDocument(instance2);
    const rendered2 = reactComponentExpect(mountedInstance2)
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
    const mouseDidClick = function() {
      void this.state.something;
    };

    const TestBindComponent = React.createClass({
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

    const instance1 = <TestBindComponent />;
    const mountedInstance1 = ReactTestUtils.renderIntoDocument(instance1);
    const rendered1 = reactComponentExpect(mountedInstance1)
      .expectRenderedChild()
      .instance();

    const instance2 = <TestBindComponent />;
    const mountedInstance2 = ReactTestUtils.renderIntoDocument(instance2);
    const rendered2 = reactComponentExpect(mountedInstance2)
      .expectRenderedChild()
      .instance();

    expect(function() {
      const badIdea = instance1.badIdeas.badBind;
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
    const mouseDidClick = jest.genMockFn();

    const TestMixin = {
      onClick: mouseDidClick,
    };

    const TestBindComponent = React.createClass({
      mixins: [TestMixin],

      render: function() {
        return <div onClick={this.onClick} />;
      },
    });

    const instance1 = <TestBindComponent />;
    const mountedInstance1 = ReactTestUtils.renderIntoDocument(instance1);
    const rendered1 = reactComponentExpect(mountedInstance1)
      .expectRenderedChild()
      .instance();

    ReactTestUtils.Simulate.click(rendered1);
    expect(mouseDidClick.mock.instances.length).toBe(1);
    expect(mouseDidClick.mock.instances[0]).toBe(mountedInstance1);
  });

  it('works with mixins that have opted out of autobinding', function() {
    const mouseDidClick = jest.genMockFn();

    const TestMixin = {
      autobind: false,
      onClick: mouseDidClick,
    };

    const TestBindComponent = React.createClass({
      mixins: [TestMixin],

      render: function() {
        return <div onClick={this.onClick.bind(this)} />;
      },
    });

    const instance1 = <TestBindComponent />;
    const mountedInstance1 = ReactTestUtils.renderIntoDocument(instance1);
    const rendered1 = reactComponentExpect(mountedInstance1)
      .expectRenderedChild()
      .instance();

    ReactTestUtils.Simulate.click(rendered1);
    expect(mouseDidClick.mock.instances.length).toBe(1);
    expect(mouseDidClick.mock.instances[0]).toBe(mountedInstance1);
  });

  it('does not warn if you try to bind to this', function() {
    spyOn(console, 'error');

    const TestBindComponent = React.createClass({
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

    const TestBindComponent = React.createClass({
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
