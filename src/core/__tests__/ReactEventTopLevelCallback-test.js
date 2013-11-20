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
 * @emails react-core
 */

'use strict';

require('mock-modules')
  .dontMock('ReactEventTopLevelCallback')
  .dontMock('ReactMount')
  .dontMock('ReactInstanceHandles')
  .dontMock('ReactDOM');

var EVENT_TARGET_PARAM = 1;

describe('ReactEventTopLevelCallback', function() {
  var mocks;

  var React;
  var ReactEventTopLevelCallback;
  var ReactDOM;
  var ReactEventEmitter;

  beforeEach(function() {
    require('mock-modules').dumpCache();
    mocks = require('mocks');

    React = require('React');
    ReactEventTopLevelCallback = require('ReactEventTopLevelCallback');
    ReactDOM = require('ReactDOM');
    ReactEventEmitter = require('ReactEventEmitter');

    ReactEventEmitter.handleTopLevel = mocks.getMockFunction();
  });

  describe('Propagation', function() {
    it('should propagate events one level down', function() {
      var childContainer = document.createElement('div');
      var childControl = ReactDOM.div({}, 'Child');
      var parentContainer = document.createElement('div');
      var parentControl = ReactDOM.div({}, 'Parent');
      React.renderComponent(childControl, childContainer);
      React.renderComponent(parentControl, parentContainer);
      parentControl.getDOMNode().appendChild(childContainer);

      var callback = ReactEventTopLevelCallback.createTopLevelCallback('test');
      callback({
        target: childControl.getDOMNode()
      });

      var calls = ReactEventEmitter.handleTopLevel.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][EVENT_TARGET_PARAM]).toBe(childControl.getDOMNode());
      expect(calls[1][EVENT_TARGET_PARAM]).toBe(parentControl.getDOMNode());
    });

    it('should propagate events two levels down', function() {
      var childContainer = document.createElement('div');
      var childControl = ReactDOM.div({}, 'Child');
      var parentContainer = document.createElement('div');
      var parentControl = ReactDOM.div({}, 'Parent');
      var grandParentContainer = document.createElement('div');
      var grandParentControl = ReactDOM.div({}, 'Parent');
      React.renderComponent(childControl, childContainer);
      React.renderComponent(parentControl, parentContainer);
      React.renderComponent(grandParentControl, grandParentContainer);
      parentControl.getDOMNode().appendChild(childContainer);
      grandParentControl.getDOMNode().appendChild(parentContainer);

      var callback = ReactEventTopLevelCallback.createTopLevelCallback('test');
      callback({
        target: childControl.getDOMNode()
      });

      var calls = ReactEventEmitter.handleTopLevel.mock.calls;
      expect(calls.length).toBe(3);
      expect(calls[0][EVENT_TARGET_PARAM]).toBe(childControl.getDOMNode());
      expect(calls[1][EVENT_TARGET_PARAM]).toBe(parentControl.getDOMNode());
      expect(calls[2][EVENT_TARGET_PARAM])
        .toBe(grandParentControl.getDOMNode());
    });
  });

  it('should not fire duplicate events for a React DOM tree', function() {
    var container = document.createElement('div');
    var inner = ReactDOM.div({}, 'Inner');
    var control = ReactDOM.div({}, [
      ReactDOM.div({id: 'outer'}, inner)
    ]);
    React.renderComponent(control, container);

    var callback = ReactEventTopLevelCallback.createTopLevelCallback('test');
    callback({
      target: inner.getDOMNode()
    });

    var calls = ReactEventEmitter.handleTopLevel.mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][EVENT_TARGET_PARAM]).toBe(inner.getDOMNode());
  });
});
