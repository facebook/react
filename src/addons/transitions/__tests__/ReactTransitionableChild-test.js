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
var ReactTransitionableChild;

var mocks = require('mocks');

describe('ReactTransitionableChild', function() {
  beforeEach(function() {
    React = require('React');
    ReactTransitionableChild = require('ReactTransitionableChild');
  });

  it('should keep the DOM node around', function() {
    var container = document.createElement('div');
    var ac = React.renderComponent(
      <ReactTransitionableChild><span id="test" /></ReactTransitionableChild>,
      container
    );
    expect(ac.getDOMNode().id).toBe('test');
    ac = React.renderComponent(<ReactTransitionableChild />, container);
    expect(ac.getDOMNode().id).toBe('test');
  });

  it('should manage enter css classes correctly', function() {
    var runNextTick = mocks.getMockFunction();
    var container = document.createElement('div');
    var ac = React.renderComponent(
      <ReactTransitionableChild
        runNextTick={runNextTick}
        name="myanim"
        enter={true}>
        <span id="test" />
      </ReactTransitionableChild>,
      container
    );
    expect(ac.getDOMNode().id).toBe('test');
    expect(ac.getDOMNode().className.trim()).toBe('myanim-enter');
    expect(runNextTick.mock.calls.length).toBe(1);
    runNextTick.mock.calls[0][0]();
    expect(ac.getDOMNode().className.trim()).toBe(
      'myanim-enter myanim-enter-active'
    );
    expect(runNextTick.mock.calls.length).toBe(1);
  });

  it('should manage leave css classes correctly', function() {
    var runNextTick = mocks.getMockFunction();
    var container = document.createElement('div');
    var ac = React.renderComponent(
      <ReactTransitionableChild
        runNextTick={runNextTick}
        name="myanim"
        enter={true}
        leave={true}>
        <span id="test" />
      </ReactTransitionableChild>,
      container
    );
    runNextTick.mock.calls[0][0]();
    expect(ac.getDOMNode().className.trim()).toBe(
      'myanim-enter myanim-enter-active'
    );

    // TODO: we should just trigger the CSS animation end event to
    // clean these up
    ac.getDOMNode().className = '';
    React.renderComponent(
      <ReactTransitionableChild
        runNextTick={runNextTick}
        name="myanim"
        enter={true}
        leave={true}
      />,
      container
    );
    expect(ac.getDOMNode().className.trim()).toBe('myanim-leave');
    expect(runNextTick.mock.calls.length).toBe(2);
    runNextTick.mock.calls[1][0]();
    expect(ac.getDOMNode().className.trim()).toBe(
      'myanim-leave myanim-leave-active'
    );
    expect(runNextTick.mock.calls.length).toBe(2);
  });
});
