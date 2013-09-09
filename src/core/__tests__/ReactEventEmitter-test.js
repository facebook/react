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

"use strict";

require('mock-modules')
    .dontMock('BrowserScroll')
    .dontMock('CallbackRegistry')
    .dontMock('EventPluginHub')
    .dontMock('ReactMount')
    .dontMock('ReactEventEmitter')
    .dontMock('ReactInstanceHandles')
    .dontMock('EventPluginHub')
    .dontMock('TapEventPlugin')
    .dontMock('TouchEventUtils')
    .dontMock('keyOf');


var keyOf = require('keyOf');
var mocks = require('mocks');

var EventPluginHub;
var ReactMount = require('ReactMount');
var getID = ReactMount.getID;
var setID = ReactMount.setID;
var ReactEventEmitter;
var ReactTestUtils;
var TapEventPlugin;

var tapMoveThreshold;
var idCallOrder = [];
var recordID = function(id) {
  idCallOrder.push(id);
};
var recordIDAndStopPropagation = function(id, event) {
  recordID(id);
  event.stopPropagation();
};
var recordIDAndReturnFalse = function(id, event) {
  recordID(id);
  return false;
};
var LISTENER = mocks.getMockFunction();
var ON_CLICK_KEY = keyOf({onClick: null});
var ON_TOUCH_TAP_KEY = keyOf({onTouchTap: null});


/**
 * Since `ReactEventEmitter` is fairly well separated from the DOM, we can test
 * almost all of `ReactEventEmitter` without ever rendering anything in the DOM.
 * As long as we provide IDs that follow `React's` conventional id namespace
 * hierarchy. The only reason why we create these DOM nodes, is so that when we
 * feed them into `ReactEventEmitter` (through `ReactTestUtils`), the event
 * handlers may receive a DOM node to inspect.
 */
var CHILD = document.createElement('div');
var PARENT = document.createElement('div');
var GRANDPARENT = document.createElement('div');
setID(CHILD, '.reactRoot.[0].[0].[0]');
setID(PARENT, '.reactRoot.[0].[0]');
setID(GRANDPARENT, '.reactRoot.[0]');

function registerSimpleTestHandler() {
  ReactEventEmitter.putListener(getID(CHILD), ON_CLICK_KEY, LISTENER);
  var listener = ReactEventEmitter.getListener(getID(CHILD), ON_CLICK_KEY);
  expect(listener).toEqual(LISTENER);
  return ReactEventEmitter.getListener(getID(CHILD), ON_CLICK_KEY);
}


describe('ReactEventEmitter', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
    EventPluginHub = require('EventPluginHub');
    TapEventPlugin = require('TapEventPlugin');
    ReactMount = require('ReactMount');
    getID = ReactMount.getID;
    setID = ReactMount.setID;
    ReactEventEmitter = require('ReactEventEmitter');
    ReactTestUtils = require('ReactTestUtils');
    idCallOrder = [];
    tapMoveThreshold = TapEventPlugin.tapMoveThreshold;
    ReactEventEmitter.ensureListening(false, document);
    EventPluginHub.injection.injectEventPluginsByName({
      TapEventPlugin: TapEventPlugin
    });
  });

  it('should store a listener correctly', function() {
    registerSimpleTestHandler();
    var listener = ReactEventEmitter.getListener(getID(CHILD), ON_CLICK_KEY);
    expect(listener).toBe(LISTENER);
  });

  it('should retrieve a listener correctly', function() {
    registerSimpleTestHandler();
    var listener = ReactEventEmitter.getListener(getID(CHILD), ON_CLICK_KEY);
    expect(listener).toEqual(LISTENER);
  });

  it('should clear all handlers when asked to', function() {
    registerSimpleTestHandler();
    ReactEventEmitter.deleteAllListeners(getID(CHILD));
    var listener = ReactEventEmitter.getListener(getID(CHILD), ON_CLICK_KEY);
    expect(listener).toBe(undefined);
  });

  it('should invoke a simple handler registered on a node', function() {
    registerSimpleTestHandler();
    ReactTestUtils.Simulate.click(CHILD);
    expect(LISTENER.mock.calls.length).toBe(1);
  });

  it('should not invoke handlers if ReactEventEmitter is disabled', function() {
    registerSimpleTestHandler();
    ReactEventEmitter.setEnabled(false);
    ReactTestUtils.Simulate.click(CHILD);
    expect(LISTENER.mock.calls.length).toBe(0);
    ReactEventEmitter.setEnabled(true);
    ReactTestUtils.Simulate.click(CHILD);
    expect(LISTENER.mock.calls.length).toBe(1);
  });

  it('should bubble simply', function() {
    ReactEventEmitter.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      recordID.bind(null, getID(CHILD))
    );
    ReactEventEmitter.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(PARENT))
    );
    ReactEventEmitter.putListener(
      getID(GRANDPARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(GRANDPARENT))
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toBe(getID(CHILD));
    expect(idCallOrder[1]).toBe(getID(PARENT));
    expect(idCallOrder[2]).toBe(getID(GRANDPARENT));
  });

  it('should support stopPropagation()', function() {
    ReactEventEmitter.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      recordID.bind(null, getID(CHILD))
    );
    ReactEventEmitter.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      recordIDAndStopPropagation.bind(null, getID(PARENT))
    );
    ReactEventEmitter.putListener(
      getID(GRANDPARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(GRANDPARENT))
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(2);
    expect(idCallOrder[0]).toBe(getID(CHILD));
    expect(idCallOrder[1]).toBe(getID(PARENT));
  });

  it('should stop after first dispatch if stopPropagation', function() {
    ReactEventEmitter.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      recordIDAndStopPropagation.bind(null, getID(CHILD))
    );
    ReactEventEmitter.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(PARENT))
    );
    ReactEventEmitter.putListener(
      getID(GRANDPARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(GRANDPARENT))
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(getID(CHILD));
  });

  it('should stopPropagation if false is returned', function() {
    ReactEventEmitter.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      recordIDAndReturnFalse.bind(null, getID(CHILD))
    );
    ReactEventEmitter.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(PARENT))
    );
    ReactEventEmitter.putListener(
      getID(GRANDPARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(GRANDPARENT))
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(getID(CHILD));
  });

  /**
   * The entire event registration state of the world should be "locked-in" at
   * the time the event occurs. This is to resolve many edge cases that come
   * about from a listener on a lower-in-DOM node causing structural changes at
   * places higher in the DOM. If this lower-in-DOM node causes new content to
   * be rendered at a place higher-in-DOM, we need to be careful not to invoke
   * these new listeners.
   */

  it('should invoke handlers that were removed while bubbling', function() {
    var handleParentClick = mocks.getMockFunction();
    var handleChildClick = function(event) {
      ReactEventEmitter.deleteAllListeners(getID(PARENT));
    };
    ReactEventEmitter.putListener(getID(CHILD), ON_CLICK_KEY, handleChildClick);
    ReactEventEmitter.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      handleParentClick
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(handleParentClick.mock.calls.length).toBe(1);
  });

  it('should not invoke newly inserted handlers while bubbling', function() {
    var handleParentClick = mocks.getMockFunction();
    var handleChildClick = function(event) {
      ReactEventEmitter.putListener(
        getID(PARENT),
        ON_CLICK_KEY,
        handleParentClick
      );
    };
    ReactEventEmitter.putListener(getID(CHILD), ON_CLICK_KEY, handleChildClick);
    ReactTestUtils.Simulate.click(CHILD);
    expect(handleParentClick.mock.calls.length).toBe(0);
  });

  it('should infer onTouchTap from a touchStart/End', function() {
    ReactEventEmitter.putListener(
      getID(CHILD),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getID(CHILD))
    );
    ReactTestUtils.Simulate.touchStart(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0)
    );
    ReactTestUtils.Simulate.touchEnd(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0)
    );
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(getID(CHILD));
  });

  it('should infer onTouchTap from when dragging below threshold', function() {
    ReactEventEmitter.putListener(
      getID(CHILD),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getID(CHILD))
    );
    ReactTestUtils.Simulate.touchStart(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0)
    );
    ReactTestUtils.Simulate.touchEnd(
      CHILD,
      ReactTestUtils.nativeTouchData(0, tapMoveThreshold - 1)
    );
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(getID(CHILD));
  });

  it('should not onTouchTap from when dragging beyond threshold', function() {
    ReactEventEmitter.putListener(
      getID(CHILD),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getID(CHILD))
    );
    ReactTestUtils.Simulate.touchStart(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0)
    );
    ReactTestUtils.Simulate.touchEnd(
      CHILD,
      ReactTestUtils.nativeTouchData(0, tapMoveThreshold + 1)
    );
    expect(idCallOrder.length).toBe(0);
  });


  it('should bubble onTouchTap', function() {
    ReactEventEmitter.putListener(
      getID(CHILD),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getID(CHILD))
    );
    ReactEventEmitter.putListener(
      getID(PARENT),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getID(PARENT))
    );
    ReactEventEmitter.putListener(
      getID(GRANDPARENT),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getID(GRANDPARENT))
    );
    ReactTestUtils.Simulate.touchStart(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0)
    );
    ReactTestUtils.Simulate.touchEnd(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0)
    );
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toBe(getID(CHILD));
    expect(idCallOrder[1]).toBe(getID(PARENT));
    expect(idCallOrder[2]).toBe(getID(GRANDPARENT));
  });

});
