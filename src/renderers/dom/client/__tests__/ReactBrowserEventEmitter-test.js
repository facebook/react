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

var keyOf = require('keyOf');

var EventListener;
var EventPluginHub;
var EventPluginRegistry;
var React;
var ReactBrowserEventEmitter;
var ReactDOMComponentTree;
var ReactTestUtils;
var TapEventPlugin;

var tapMoveThreshold;
var idCallOrder;
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
var LISTENER = jest.genMockFn();
var ON_CLICK_KEY = keyOf({onClick: null});
var ON_TOUCH_TAP_KEY = keyOf({onTouchTap: null});
var ON_CHANGE_KEY = keyOf({onChange: null});
var ON_MOUSE_ENTER_KEY = keyOf({onMouseEnter: null});

var GRANDPARENT;
var PARENT;
var CHILD;

function registerSimpleTestHandler() {
  EventPluginHub.putListener(getID(CHILD), ON_CLICK_KEY, LISTENER);
  var listener = EventPluginHub.getListener(getID(CHILD), ON_CLICK_KEY);
  expect(listener).toEqual(LISTENER);
  return EventPluginHub.getListener(getID(CHILD), ON_CLICK_KEY);
}

function getID(node) {
  return ReactDOMComponentTree.getInstanceFromNode(node)._rootNodeID;
}


describe('ReactBrowserEventEmitter', function() {
  beforeEach(function() {
    jest.resetModuleRegistry();
    LISTENER.mockClear();
    EventListener = require('EventListener');
    EventPluginHub = require('EventPluginHub');
    EventPluginRegistry = require('EventPluginRegistry');
    React = require('React');
    ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
    ReactDOMComponentTree = require('ReactDOMComponentTree');
    ReactTestUtils = require('ReactTestUtils');
    TapEventPlugin = require('TapEventPlugin');

    ReactTestUtils.renderIntoDocument(
      <div ref={(c) => GRANDPARENT = c}>
        <div ref={(c) => PARENT = c}>
          <div ref={(c) => CHILD = c} />
        </div>
      </div>
    );

    idCallOrder = [];
    tapMoveThreshold = TapEventPlugin.tapMoveThreshold;
    EventPluginHub.injection.injectEventPluginsByName({
      TapEventPlugin: TapEventPlugin,
    });
  });

  it('should store a listener correctly', function() {
    registerSimpleTestHandler();
    var listener = EventPluginHub.getListener(getID(CHILD), ON_CLICK_KEY);
    expect(listener).toBe(LISTENER);
  });

  it('should retrieve a listener correctly', function() {
    registerSimpleTestHandler();
    var listener = EventPluginHub.getListener(getID(CHILD), ON_CLICK_KEY);
    expect(listener).toEqual(LISTENER);
  });

  it('should clear all handlers when asked to', function() {
    registerSimpleTestHandler();
    EventPluginHub.deleteAllListeners(getID(CHILD));
    var listener = EventPluginHub.getListener(getID(CHILD), ON_CLICK_KEY);
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
    EventPluginHub.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      recordID.bind(null, getID(CHILD))
    );
    EventPluginHub.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(PARENT))
    );
    EventPluginHub.putListener(
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

  it('should continue bubbling if an error is thrown', function() {
    EventPluginHub.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      recordID.bind(null, getID(CHILD))
    );
    EventPluginHub.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      function() {
        recordID(getID(PARENT));
        throw new Error('Handler interrupted');
      }
    );
    EventPluginHub.putListener(
      getID(GRANDPARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(GRANDPARENT))
    );
    expect(function() {
      ReactTestUtils.Simulate.click(CHILD);
    }).toThrow();
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toBe(getID(CHILD));
    expect(idCallOrder[1]).toBe(getID(PARENT));
    expect(idCallOrder[2]).toBe(getID(GRANDPARENT));
  });

  it('should set currentTarget', function() {
    EventPluginHub.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      function(event) {
        recordID(getID(CHILD));
        expect(event.currentTarget).toBe(CHILD);
      }
    );
    EventPluginHub.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      function(event) {
        recordID(getID(PARENT));
        expect(event.currentTarget).toBe(PARENT);
      }
    );
    EventPluginHub.putListener(
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
    EventPluginHub.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      recordID.bind(null, getID(CHILD))
    );
    EventPluginHub.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      recordIDAndStopPropagation.bind(null, getID(PARENT))
    );
    EventPluginHub.putListener(
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
    EventPluginHub.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      recordIDAndStopPropagation.bind(null, getID(CHILD))
    );
    EventPluginHub.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(PARENT))
    );
    EventPluginHub.putListener(
      getID(GRANDPARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(GRANDPARENT))
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(getID(CHILD));
  });

  it('should not stopPropagation if false is returned', function() {
    EventPluginHub.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      recordIDAndReturnFalse.bind(null, getID(CHILD))
    );
    EventPluginHub.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(PARENT))
    );
    EventPluginHub.putListener(
      getID(GRANDPARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getID(GRANDPARENT))
    );
    spyOn(console, 'error');
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toBe(getID(CHILD));
    expect(idCallOrder[1]).toBe(getID(PARENT));
    expect(idCallOrder[2]).toBe(getID(GRANDPARENT));
    expect(console.error.calls.length).toEqual(0);
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
    var handleParentClick = jest.genMockFn();
    var handleChildClick = function(event) {
      EventPluginHub.deleteAllListeners(getID(PARENT));
    };
    EventPluginHub.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      handleChildClick
    );
    EventPluginHub.putListener(
      getID(PARENT),
      ON_CLICK_KEY,
      handleParentClick
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(handleParentClick.mock.calls.length).toBe(1);
  });

  it('should not invoke newly inserted handlers while bubbling', function() {
    var handleParentClick = jest.genMockFn();
    var handleChildClick = function(event) {
      EventPluginHub.putListener(
        getID(PARENT),
        ON_CLICK_KEY,
        handleParentClick
      );
    };
    EventPluginHub.putListener(
      getID(CHILD),
      ON_CLICK_KEY,
      handleChildClick
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(handleParentClick.mock.calls.length).toBe(0);
  });

  it('should have mouse enter simulated by test utils', function() {
    EventPluginHub.putListener(
      getID(CHILD),
      ON_MOUSE_ENTER_KEY,
      recordID.bind(null, getID(CHILD))
    );
    ReactTestUtils.Simulate.mouseEnter(CHILD);
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(getID(CHILD));
  });

  it('should infer onTouchTap from a touchStart/End', function() {
    EventPluginHub.putListener(
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
    EventPluginHub.putListener(
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
    EventPluginHub.putListener(
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

    var module = EventPluginRegistry.registrationNameModules[ON_CHANGE_KEY];
    var dependencies = module.eventTypes.change.dependencies;
    expect(setEventListeners.length).toEqual(dependencies.length);

    for (i = 0; i < setEventListeners.length; i++) {
      expect(dependencies.indexOf(setEventListeners[i])).toBeTruthy();
    }
  });

  it('should bubble onTouchTap', function() {
    EventPluginHub.putListener(
      getID(CHILD),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getID(CHILD))
    );
    EventPluginHub.putListener(
      getID(PARENT),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getID(PARENT))
    );
    EventPluginHub.putListener(
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
