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

'use strict';

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
var LISTENER = jest.fn();
var ON_CLICK_KEY = 'onClick';
var ON_TOUCH_TAP_KEY = 'onTouchTap';
var ON_CHANGE_KEY = 'onChange';
var ON_MOUSE_ENTER_KEY = 'onMouseEnter';

var GRANDPARENT;
var PARENT;
var CHILD;

function registerSimpleTestHandler() {
  EventPluginHub.putListener(getInternal(CHILD), ON_CLICK_KEY, LISTENER);
  var listener = EventPluginHub.getListener(getInternal(CHILD), ON_CLICK_KEY);
  expect(listener).toEqual(LISTENER);
  return EventPluginHub.getListener(getInternal(CHILD), ON_CLICK_KEY);
}

function getInternal(node) {
  return ReactDOMComponentTree.getInstanceFromNode(node);
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
    var listener = EventPluginHub.getListener(getInternal(CHILD), ON_CLICK_KEY);
    expect(listener).toBe(LISTENER);
  });

  it('should retrieve a listener correctly', function() {
    registerSimpleTestHandler();
    var listener = EventPluginHub.getListener(getInternal(CHILD), ON_CLICK_KEY);
    expect(listener).toEqual(LISTENER);
  });

  it('should clear all handlers when asked to', function() {
    registerSimpleTestHandler();
    EventPluginHub.deleteAllListeners(getInternal(CHILD));
    var listener = EventPluginHub.getListener(getInternal(CHILD), ON_CLICK_KEY);
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
      getInternal(CHILD),
      ON_CLICK_KEY,
      recordID.bind(null, getInternal(CHILD))
    );
    EventPluginHub.putListener(
      getInternal(PARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getInternal(PARENT))
    );
    EventPluginHub.putListener(
      getInternal(GRANDPARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getInternal(GRANDPARENT))
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toBe(getInternal(CHILD));
    expect(idCallOrder[1]).toBe(getInternal(PARENT));
    expect(idCallOrder[2]).toBe(getInternal(GRANDPARENT));
  });

  it('should continue bubbling if an error is thrown', function() {
    EventPluginHub.putListener(
      getInternal(CHILD),
      ON_CLICK_KEY,
      recordID.bind(null, getInternal(CHILD))
    );
    EventPluginHub.putListener(
      getInternal(PARENT),
      ON_CLICK_KEY,
      function() {
        recordID(getInternal(PARENT));
        throw new Error('Handler interrupted');
      }
    );
    EventPluginHub.putListener(
      getInternal(GRANDPARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getInternal(GRANDPARENT))
    );
    expect(function() {
      ReactTestUtils.Simulate.click(CHILD);
    }).toThrow();
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toBe(getInternal(CHILD));
    expect(idCallOrder[1]).toBe(getInternal(PARENT));
    expect(idCallOrder[2]).toBe(getInternal(GRANDPARENT));
  });

  it('should set currentTarget', function() {
    EventPluginHub.putListener(
      getInternal(CHILD),
      ON_CLICK_KEY,
      function(event) {
        recordID(getInternal(CHILD));
        expect(event.currentTarget).toBe(CHILD);
      }
    );
    EventPluginHub.putListener(
      getInternal(PARENT),
      ON_CLICK_KEY,
      function(event) {
        recordID(getInternal(PARENT));
        expect(event.currentTarget).toBe(PARENT);
      }
    );
    EventPluginHub.putListener(
      getInternal(GRANDPARENT),
      ON_CLICK_KEY,
      function(event) {
        recordID(getInternal(GRANDPARENT));
        expect(event.currentTarget).toBe(GRANDPARENT);
      }
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toBe(getInternal(CHILD));
    expect(idCallOrder[1]).toBe(getInternal(PARENT));
    expect(idCallOrder[2]).toBe(getInternal(GRANDPARENT));
  });

  it('should support stopPropagation()', function() {
    EventPluginHub.putListener(
      getInternal(CHILD),
      ON_CLICK_KEY,
      recordID.bind(null, getInternal(CHILD))
    );
    EventPluginHub.putListener(
      getInternal(PARENT),
      ON_CLICK_KEY,
      recordIDAndStopPropagation.bind(null, getInternal(PARENT))
    );
    EventPluginHub.putListener(
      getInternal(GRANDPARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getInternal(GRANDPARENT))
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(2);
    expect(idCallOrder[0]).toBe(getInternal(CHILD));
    expect(idCallOrder[1]).toBe(getInternal(PARENT));
  });

  it('should stop after first dispatch if stopPropagation', function() {
    EventPluginHub.putListener(
      getInternal(CHILD),
      ON_CLICK_KEY,
      recordIDAndStopPropagation.bind(null, getInternal(CHILD))
    );
    EventPluginHub.putListener(
      getInternal(PARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getInternal(PARENT))
    );
    EventPluginHub.putListener(
      getInternal(GRANDPARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getInternal(GRANDPARENT))
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(getInternal(CHILD));
  });

  it('should not stopPropagation if false is returned', function() {
    EventPluginHub.putListener(
      getInternal(CHILD),
      ON_CLICK_KEY,
      recordIDAndReturnFalse.bind(null, getInternal(CHILD))
    );
    EventPluginHub.putListener(
      getInternal(PARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getInternal(PARENT))
    );
    EventPluginHub.putListener(
      getInternal(GRANDPARENT),
      ON_CLICK_KEY,
      recordID.bind(null, getInternal(GRANDPARENT))
    );
    spyOn(console, 'error');
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toBe(getInternal(CHILD));
    expect(idCallOrder[1]).toBe(getInternal(PARENT));
    expect(idCallOrder[2]).toBe(getInternal(GRANDPARENT));
    expect(console.error.calls.count()).toEqual(0);
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
    var handleParentClick = jest.fn();
    var handleChildClick = function(event) {
      EventPluginHub.deleteAllListeners(getInternal(PARENT));
    };
    EventPluginHub.putListener(
      getInternal(CHILD),
      ON_CLICK_KEY,
      handleChildClick
    );
    EventPluginHub.putListener(
      getInternal(PARENT),
      ON_CLICK_KEY,
      handleParentClick
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(handleParentClick.mock.calls.length).toBe(1);
  });

  it('should not invoke newly inserted handlers while bubbling', function() {
    var handleParentClick = jest.fn();
    var handleChildClick = function(event) {
      EventPluginHub.putListener(
        getInternal(PARENT),
        ON_CLICK_KEY,
        handleParentClick
      );
    };
    EventPluginHub.putListener(
      getInternal(CHILD),
      ON_CLICK_KEY,
      handleChildClick
    );
    ReactTestUtils.Simulate.click(CHILD);
    expect(handleParentClick.mock.calls.length).toBe(0);
  });

  it('should have mouse enter simulated by test utils', function() {
    EventPluginHub.putListener(
      getInternal(CHILD),
      ON_MOUSE_ENTER_KEY,
      recordID.bind(null, getInternal(CHILD))
    );
    ReactTestUtils.Simulate.mouseEnter(CHILD);
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(getInternal(CHILD));
  });

  it('should infer onTouchTap from a touchStart/End', function() {
    EventPluginHub.putListener(
      getInternal(CHILD),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getInternal(CHILD))
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
    expect(idCallOrder[0]).toBe(getInternal(CHILD));
  });

  it('should infer onTouchTap from when dragging below threshold', function() {
    EventPluginHub.putListener(
      getInternal(CHILD),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getInternal(CHILD))
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
    expect(idCallOrder[0]).toBe(getInternal(CHILD));
  });

  it('should not onTouchTap from when dragging beyond threshold', function() {
    EventPluginHub.putListener(
      getInternal(CHILD),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getInternal(CHILD))
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
    expect(EventListener.listen.calls.count()).toBe(1);
  });

  it('should work with event plugins without dependencies', function() {
    spyOn(EventListener, 'listen');

    ReactBrowserEventEmitter.listenTo(ON_CLICK_KEY, document);

    expect(EventListener.listen.calls.argsFor(0)[1]).toBe('click');
  });

  it('should work with event plugins with dependencies', function() {
    spyOn(EventListener, 'listen');
    spyOn(EventListener, 'capture');

    ReactBrowserEventEmitter.listenTo(ON_CHANGE_KEY, document);

    var setEventListeners = [];
    var listenCalls = EventListener.listen.calls.allArgs();
    var captureCalls = EventListener.capture.calls.allArgs();
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
      getInternal(CHILD),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getInternal(CHILD))
    );
    EventPluginHub.putListener(
      getInternal(PARENT),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getInternal(PARENT))
    );
    EventPluginHub.putListener(
      getInternal(GRANDPARENT),
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, getInternal(GRANDPARENT))
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
    expect(idCallOrder[0]).toBe(getInternal(CHILD));
    expect(idCallOrder[1]).toBe(getInternal(PARENT));
    expect(idCallOrder[2]).toBe(getInternal(GRANDPARENT));
  });

});
