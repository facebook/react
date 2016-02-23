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
describe('autobinding', function() {

  it('Holds reference to instance', function() {

    const mouseDidEnter = jest.genMockFn();
    const mouseDidLeave = jest.genMockFn();
    const mouseDidClick = jest.genMockFn();

    const TestBindComponent = React.createClass({
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

  it('warns if you try to bind to this', function() {
    spyOn(console, 'error');

    const TestBindComponent = React.createClass({
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

    const TestBindComponent = React.createClass({
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
