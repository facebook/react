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

'use strict';

require('mock-modules')
    .dontMock('EventPluginHub')
    .dontMock('ReactMount')
    .dontMock('ReactBrowserEventEmitter')
    .dontMock('ReactInstanceHandles')
    .dontMock('EventPluginHub')
    .dontMock('TapEventPlugin')
    .dontMock('TouchEventUtils')
    .dontMock('keyOf');


var keyOf = require('keyOf');
var mocks = require('mocks');

var ReactMount = require('ReactMount');
var idToNode = {};
var getID = ReactMount.getID;
var setID = function(el, id) {
  ReactMount.setID(el, id);
  idToNode[id] = el;
};
var oldGetNode = ReactMount.getNode;

var EventPluginHub;
var ReactBrowserEventEmitter;
var ReactTestUtils;
var TapEventPlugin;
var EventListener;

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
var ON_CHANGE_KEY = keyOf({onChange: null});


/**
 * Since `ReactBrowserEventEmitter` is fairly well separated from the DOM, we
 * can test almost all of `ReactBrowserEventEmitter` without ever rendering
 * anything in the DOM. As long as we provide IDs that follow `React's`
 * conventional id namespace hierarchy. The only reason why we create these DOM
 * nodes is so that when we feed them into `ReactBrowserEventEmitter` (through
 * `ReactTestUtils`), the event handlers may receive a DOM node to inspect.
 */
var CHILD = document.createElement('div');
var PARENT = document.createElement('div');
var GRANDPARENT = document.createElement('div');
setID(CHILD, '.0.0.0.0');
setID(PARENT, '.0.0.0');
setID(GRANDPARENT, '.0.0');

function registerSimpleTestHandler() {
  ReactBrowserEventEmitter.putListener(getID(CHILD), ON_CLICK_KEY, LISTENER);
  var listener =
        ReactBrowserEventEmitter.getListener(getID(CHILD), ON_CLICK_KEY);
  expect(listener).toEqual(LISTENER);
  return ReactBrowserEventEmitter.getListener(getID(CHILD), ON_CLICK_KEY);
}


describe('ReactBrowserEventEmitter', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
    LISTENER.mockClear();
    EventPluginHub = require('EventPluginHub');
    TapEventPlugin = require('TapEventPlugin');
    ReactMount = require('ReactMount');
    EventListener = require('EventListener');
    ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
    ReactTestUtils = require('ReactTestUtils');
    ReactMount.getNode = function(id) {
      return idToNode[id];
    };
    idCallOrder = [];
    tapMoveThreshold = TapEventPlugin.tapMoveThreshold;
    EventPluginHub.injection.injectEventPluginsByName({
      TapEventPlugin: TapEventPlugin
    });
  });

  afterEach(function() {
    ReactMount.getNode = oldGetNode;
  });

  it('should store a listener correctly', function() {
    registerSimpleTestHandler();
    var listener =
          ReactBrowserEventEmitter.getListener(getID(CHILD), ON_CLICK_KEY);
    expect(listener).toBe(LISTENER);
  });

  it('should retrieve a listener correctly', function() {
    registerSimpleTestHandler();
    var listener =
          ReactBrowserEventEmitter.getListener(getID(CHILD), ON_CLICK_KEY);
    expect(listener).toEqual(LISTENER);
  });

  it('should clear all handlers when asked to', function() {
    registerSimpleTestHandler();
    ReactBrowserEventEmitter.deleteAllListeners(getID(CHILD));
    var listener =
          ReactBrowserEventEmitter.getListener(getID(CHILD), ON_CLICK_KEY);
    expect(listener).toBe(undefined);
  });

  it('should invoke a simple handler registered on a node', function() {
    registerSimpleTestHandler();
    ReactTestUtils.Simulate.click(CHILD);
    expect(LISTENER.mock.calls.length).toBe(1);
  });

  it(
    'should not invoke handlers if ReactBrowserEventEmitter is disabled',
    function() {
      registerSimpleTestHandler();
      ReactBrowserEventEmitter.setEnabled(false);
      ReactTestUtils.SimulateNative.click(CHILD);
      expect(LISTENER.mock.calls.length).toBe(0);
      ReactBrowserEventEmitter.setEnabled(true);
      ReactTestUtils.SimulateNative.click(CHILD);
      expect(LISTENER.mock.calls.length).toBe(1);
    }
  );

  it('should bubble simply', function() {
    ReactBrowserEventEmitter.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      recordID.bind(null, getID(CHILD))
    );
    ReactBrowserEventEmitter.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(PARENT))
    );
    ReactBrowserEventEmitter.putListener(
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

  it('should set currentTarget', function() {
    ReactBrowserEventEmitter.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      function(event) {
        recordID(getID(CHILD));
        expect(event.currentTarget).toBe(CHILD);
      }
    );
    ReactBrowserEventEmitter.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      function(event) {
        recordID(getID(PARENT));
        expect(event.currentTarget).toBe(PARENT);
      }
    );
    ReactBrowserEventEmitter.putListener(
      getID(GRANDPARENT),
      ON_CLICK_KEY,
      function(event) {
        recordID(getID(GRANDPARENT));
        expect(event.currentTarget).toBe(GRANDPARENT);
      }
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toBe(getID(CHILD));
    expect(idCallOrder[1]).toBe(getID(PARENT));
    expect(idCallOrder[2]).toBe(getID(GRANDPARENT));
  });

  it('should support stopPropagation()', function() {
    ReactBrowserEventEmitter.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      recordID.bind(null, getID(CHILD))
    );
    ReactBrowserEventEmitter.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      recordIDAndStopPropagation.bind(null, getID(PARENT))
    );
    ReactBrowserEventEmitter.putListener(
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
    ReactBrowserEventEmitter.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      recordIDAndStopPropagation.bind(null, getID(CHILD))
    );
    ReactBrowserEventEmitter.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(PARENT))
    );
    ReactBrowserEventEmitter.putListener(
      getID(GRANDPARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(GRANDPARENT))
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(getID(CHILD));
  });

  it('should stopPropagation if false is returned, but warn', function() {
    ReactBrowserEventEmitter.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      recordIDAndReturnFalse.bind(null, getID(CHILD))
    );
    ReactBrowserEventEmitter.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(PARENT))
    );
    ReactBrowserEventEmitter.putListener(
      getID(GRANDPARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(GRANDPARENT))
    );
    spyOn(console, 'error');
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(getID(CHILD));
    expect(console.error.calls.length).toEqual(1);
    expect(console.error.calls[0].args[0]).toBe(
      'Warning: Returning `false` from an event handler is deprecated and ' +
      'will be ignored in a future release. Instead, manually call ' +
      'e.stopPropagation() or e.preventDefault(), as appropriate.'
    );
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
      ReactBrowserEventEmitter.deleteAllListeners(getID(PARENT));
    };
    ReactBrowserEventEmitter.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      handleChildClick
    );
    ReactBrowserEventEmitter.putListener(
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
      ReactBrowserEventEmitter.putListener(
        getID(PARENT),
        ON_CLICK_KEY,
        handleParentClick
      );
    };
    ReactBrowserEventEmitter.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      handleChildClick
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(handleParentClick.mock.calls.length).toBe(0);
  });

  it('should infer onTouchTap from a touchStart/End', function() {
    ReactBrowserEventEmitter.putListener(
      getID(CHILD),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getID(CHILD))
    );
    ReactTestUtils.SimulateNative.touchStart(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0)
    );
    ReactTestUtils.SimulateNative.touchEnd(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0)
    );
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(getID(CHILD));
  });

  it('should infer onTouchTap from when dragging below threshold', function() {
    ReactBrowserEventEmitter.putListener(
      getID(CHILD),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getID(CHILD))
    );
    ReactTestUtils.SimulateNative.touchStart(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0)
    );
    ReactTestUtils.SimulateNative.touchEnd(
      CHILD,
      ReactTestUtils.nativeTouchData(0, tapMoveThreshold - 1)
    );
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(getID(CHILD));
  });

  it('should not onTouchTap from when dragging beyond threshold', function() {
    ReactBrowserEventEmitter.putListener(
      getID(CHILD),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getID(CHILD))
    );
    ReactTestUtils.SimulateNative.touchStart(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0)
    );
    ReactTestUtils.SimulateNative.touchEnd(
      CHILD,
      ReactTestUtils.nativeTouchData(0, tapMoveThreshold + 1)
    );
    expect(idCallOrder.length).toBe(0);
  });

  it('should listen to events only once', function() {
    spyOn(EventListener, 'listen');
    ReactBrowserEventEmitter.listenTo(ON_CLICK_KEY, document);
    ReactBrowserEventEmitter.listenTo(ON_CLICK_KEY, document);
    expect(EventListener.listen.calls.length).toBe(1);
  });

  it('should work with event plugins without dependencies', function() {
    spyOn(EventListener, 'listen');

    ReactBrowserEventEmitter.listenTo(ON_CLICK_KEY, document);

    expect(EventListener.listen.argsForCall[0][1]).toBe('click');
  });

  it('should work with event plugins with dependencies', function() {
    spyOn(EventListener, 'listen');
    spyOn(EventListener, 'capture');

    ReactBrowserEventEmitter.listenTo(ON_CHANGE_KEY, document);

    var setEventListeners = [];
    var listenCalls = EventListener.listen.argsForCall;
    var captureCalls = EventListener.capture.argsForCall;
    for (var i = 0; i < listenCalls.length; i++) {
      setEventListeners.push(listenCalls[i][1]);
    }
    for (i = 0; i < captureCalls.length; i++) {
      setEventListeners.push(captureCalls[i][1]);
    }

    var module =
          ReactBrowserEventEmitter.registrationNameModules[ON_CHANGE_KEY];
    var dependencies = module.eventTypes.change.dependencies;
    expect(setEventListeners.length).toEqual(dependencies.length);

    for (i = 0; i < setEventListeners.length; i++) {
      expect(dependencies.indexOf(setEventListeners[i])).toBeTruthy();
    }
  });

  it('should bubble onTouchTap', function() {
    ReactBrowserEventEmitter.putListener(
      getID(CHILD),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getID(CHILD))
    );
    ReactBrowserEventEmitter.putListener(
      getID(PARENT),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getID(PARENT))
    );
    ReactBrowserEventEmitter.putListener(
      getID(GRANDPARENT),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getID(GRANDPARENT))
    );
    ReactTestUtils.SimulateNative.touchStart(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0)
    );
    ReactTestUtils.SimulateNative.touchEnd(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0)
    );
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toBe(getID(CHILD));
    expect(idCallOrder[1]).toBe(getID(PARENT));
    expect(idCallOrder[2]).toBe(getID(GRANDPARENT));
  });

});
