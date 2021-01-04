/**
 * Copyright 2013-2014 Facebook, Inc.
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
/*global global:true*/
"use strict";

var mocks = require('mocks');
var React = require('React');
var ReactDoNotBindDeprecated = require('ReactDoNotBindDeprecated');
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
      onMouseEnter: ReactDoNotBindDeprecated.doNotBind(mouseDidEnter),
      onMouseLeave: ReactDoNotBindDeprecated.doNotBind(mouseDidLeave),
      onClick: mouseDidClick,

      // auto binding only occurs on top level functions in class defs.
      badIdeas: {
        badBind: function() {
          this.state.something;
        }
      },

      render: function() {
        return (
          <div
            onMouseOver={this.onMouseEnter.bind(this)}
            onMouseOut={this.onMouseLeave}
            onClick={this.onClick}
          />
        );
      }
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

    expect(mountedInstance1.onMouseEnter).toBe(mountedInstance2.onMouseEnter);
    expect(mountedInstance1.onMouseLeave).toBe(mountedInstance2.onMouseLeave);
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
    expect(mouseDidLeave.mock.instances[0]).toBe(global);

    ReactTestUtils.Simulate.mouseOut(rendered2);
    expect(mouseDidLeave.mock.instances.length).toBe(2);
    expect(mouseDidLeave.mock.instances[1]).toBe(global);
  });

  it('works with mixins', function() {
    var mouseDidClick = mocks.getMockFunction();

    var TestMixin = {
      onClick: mouseDidClick
    };

    var TestBindComponent = React.createClass({
      mixins: [TestMixin],

      render: function() {
        return <div onClick={this.onClick} />;
      }
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

});
