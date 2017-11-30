/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactTestUtils;
let ReactBrowserEventEmitter;
let EventPluginHub;
let EventPluginRegistry;
let TapEventPlugin;

let CHILD, PARENT, GRANDPARENT;
let CHILD_C;
let CHILD_PROPS = {},
  PARENT_PROPS = {},
  GRANDPARENT_PROPS = {};

let tapMoveThreshold;

let treeInstance;
let container;
let idCallOrder;

const LISTENER = jest.fn();
const ON_CLICK_KEY = 'onClick';
const ON_CHANGE_KEY = 'onChange';
const ON_TOUCH_TAP_KEY = 'onTouchTap';
const ON_MOUSE_ENTER_KEY = 'onMouseEnter';

let putListener, getListener, deleteAllListeners;

function recordID(id) {
  idCallOrder.push(id);
}
function registerSimpleTestHandler() {
  putListener(CHILD, ON_CLICK_KEY, LISTENER);
  var listener = getListener(CHILD, ON_CLICK_KEY);
  expect(listener.props.onClick).toEqual(LISTENER);
  return getListener(CHILD, ON_CLICK_KEY);
}
function recordIDAndStopPropagation(id, event) {
  recordID(id);
  event.stopPropagation();
}
function recordIDAndReturnFalse(id, event) {
  recordID(id);
  return false;
}

describe('ReactBrowserEventEmitter', () => {
  beforeEach(() => {
    LISTENER.mockClear();

    EventPluginHub = require('events/EventPluginHub');
    EventPluginRegistry = require('events/EventPluginRegistry');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactBrowserEventEmitter = require('react-dom/src/events/ReactBrowserEventEmitter');
    ReactTestUtils = require('react-dom/test-utils');
    TapEventPlugin = require('../events/TapEventPlugin').default;

    container = document.createElement('div');

    CHILD_C = class Child extends React.PureComponent {
      render() {
        return <div ref={node => (CHILD = node)} {...this.props} />;
      }
    };
    class ChildWrapper extends React.PureComponent {
      render() {
        return <CHILD_C {...this.props} />;
      }
    }

    function renderTree() {
      class TestInstance extends React.PureComponent {
        render() {
          return (
            <div ref={node => (GRANDPARENT = node)} {...GRANDPARENT_PROPS}>
              <div ref={node => (PARENT = node)} {...PARENT_PROPS}>
                <ChildWrapper {...CHILD_PROPS} />
              </div>
            </div>
          );
        }
      }
      treeInstance = ReactDOM.render(<TestInstance />, container);
    }
    renderTree();

    putListener = function(node, eventName, listener) {
      switch (node) {
        case CHILD:
          CHILD_PROPS[eventName] = listener;
          break;
        case PARENT:
          PARENT_PROPS[eventName] = listener;
          break;
        case GRANDPARENT:
          GRANDPARENT_PROPS[eventName] = listener;
          break;
      }
      renderTree();
    };

    deleteAllListeners = function(node) {
      switch (node) {
        case CHILD:
          CHILD_PROPS = {};
          break;
        case PARENT:
          PARENT_PROPS = {};
          break;
        case GRANDPARENT:
          GRANDPARENT_PROPS = {};
          break;
      }
      renderTree();
    };

    getListener = function(node, eventName) {
      const inst = ReactTestUtils.findRenderedComponentWithType(
        treeInstance,
        CHILD_C
      );
      return inst;
    };

    idCallOrder = [];
    tapMoveThreshold = TapEventPlugin.tapMoveThreshold;
    spyOnDev(console, 'warn');
    EventPluginHub.injection.injectEventPluginsByName({
      TapEventPlugin: TapEventPlugin
    });
  });

  afterEach(() => {
    container = null;
    idCallOrder = [];

    if (__DEV__) {
      expect(console.warn.calls.count()).toBe(1);
      expect(console.warn.calls.argsFor(0)[0]).toContain(
        'Injecting custom event plugins (TapEventPlugin) is deprecated'
      );
    }
  });

  it('should store a listener correctly', () => {
    registerSimpleTestHandler();
    var listener = getListener(CHILD, ON_CLICK_KEY);
    expect(listener.props.onClick).toBe(LISTENER);
  });

  it('should retrieve a listener correctly', () => {
    registerSimpleTestHandler();
    var listener = getListener(CHILD, ON_CLICK_KEY);
    expect(listener.props.onClick).toBe(LISTENER);
  });

  it('should clear all handlers when asked to', () => {
    registerSimpleTestHandler();
    deleteAllListeners(CHILD);
    var listener = getListener(CHILD, ON_CLICK_KEY);
    expect(listener.props.onClick).toBe(undefined);
  });

  it('should invoke a simple handler registered on a node', () => {
    registerSimpleTestHandler();
    ReactTestUtils.Simulate.click(CHILD);
    expect(LISTENER.mock.calls.length).toBe(1);
  });

  /**
   * used ../events/ReactBrowserEventEmitter by origin test,
   * change it to use the public modules react-dom/src/events/ReactBrowserEventEmitter
   * to instead.
   */
  it('should not invoke handlers if ReactBrowserEventEmitter is disabled', () => {
    registerSimpleTestHandler();
    ReactBrowserEventEmitter.setEnabled(false);
    ReactTestUtils.SimulateNative.click(CHILD);
    expect(LISTENER.mock.calls.length).toBe(0);
    ReactBrowserEventEmitter.setEnabled(true);
    ReactTestUtils.SimulateNative.click(CHILD);
    expect(LISTENER.mock.calls.length).toBe(1);
  });

  it('should bubble simply', () => {
    putListener(CHILD, ON_CLICK_KEY, recordID.bind(null, CHILD));
    putListener(PARENT, ON_CLICK_KEY, recordID.bind(null, PARENT));
    putListener(GRANDPARENT, ON_CLICK_KEY, recordID.bind(null, GRANDPARENT));
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toEqual(CHILD);
    expect(idCallOrder[1]).toEqual(PARENT);
    expect(idCallOrder[2]).toEqual(GRANDPARENT);
  });

  it('should bubble to the right handler after an update', () => {
    putListener(GRANDPARENT, ON_CLICK_KEY, recordID.bind(null, 'GRANDPARENT'));
    putListener(PARENT, ON_CLICK_KEY, recordID.bind(null, 'PARENT'));
    putListener(CHILD, ON_CLICK_KEY, recordID.bind(null, 'CHILD'));
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder).toEqual(['CHILD', 'PARENT', 'GRANDPARENT']);

    idCallOrder = [];

    // Update just the grand parent without updating the child.
    putListener(
      GRANDPARENT,
      ON_CLICK_KEY,
      recordID.bind(null, 'UPDATED_GRANDPARENT')
    );

    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder).toEqual(['CHILD', 'PARENT', 'UPDATED_GRANDPARENT']);
  });

  it('should continue bubbling if an error is thrown', () => {
    putListener(CHILD, ON_CLICK_KEY, recordID.bind(null, CHILD));
    putListener(PARENT, ON_CLICK_KEY, function() {
      recordID(PARENT);
      throw new Error('Handler interrupted');
    });
    putListener(GRANDPARENT, ON_CLICK_KEY, recordID.bind(null, GRANDPARENT));
    expect(function() {
      ReactTestUtils.Simulate.click(CHILD);
    }).toThrow();
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toEqual(CHILD);
    expect(idCallOrder[1]).toEqual(PARENT);
    expect(idCallOrder[2]).toEqual(GRANDPARENT);
  });

  it('should set currentTarget', () => {
    putListener(CHILD, ON_CLICK_KEY, function(event) {
      recordID(CHILD);
      expect(event.currentTarget).toBe(CHILD);
    });
    putListener(PARENT, ON_CLICK_KEY, function(event) {
      recordID(PARENT);
      expect(event.currentTarget).toBe(PARENT);
    });
    putListener(GRANDPARENT, ON_CLICK_KEY, function(event) {
      recordID(GRANDPARENT);
      expect(event.currentTarget).toBe(GRANDPARENT);
    });
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toEqual(CHILD);
    expect(idCallOrder[1]).toEqual(PARENT);
    expect(idCallOrder[2]).toEqual(GRANDPARENT);
  });
  it('should support stopPropagation()', () => {
    putListener(CHILD, ON_CLICK_KEY, recordID.bind(null, CHILD));
    putListener(
      PARENT,
      ON_CLICK_KEY,
      recordIDAndStopPropagation.bind(null, PARENT)
    );
    putListener(GRANDPARENT, ON_CLICK_KEY, recordID.bind(null, GRANDPARENT));
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(2);
    expect(idCallOrder[0]).toEqual(CHILD);
    expect(idCallOrder[1]).toEqual(PARENT);
  });

  it('should support overriding .isPropagationStopped()', () => {
    // Ew. See D4504876.
    putListener(CHILD, ON_CLICK_KEY, recordID.bind(null, CHILD));
    putListener(PARENT, ON_CLICK_KEY, function(e) {
      recordID(PARENT, e);
      // This stops React bubbling but avoids touching the native event
      e.isPropagationStopped = () => true;
    });
    putListener(GRANDPARENT, ON_CLICK_KEY, recordID.bind(null, GRANDPARENT));
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(2);
    expect(idCallOrder[0]).toEqual(CHILD);
    expect(idCallOrder[1]).toEqual(PARENT);
  });

  it('should stop after first dispatch if stopPropagation', () => {
    putListener(
      CHILD,
      ON_CLICK_KEY,
      recordIDAndStopPropagation.bind(null, CHILD)
    );
    putListener(PARENT, ON_CLICK_KEY, recordID.bind(null, PARENT));
    putListener(GRANDPARENT, ON_CLICK_KEY, recordID.bind(null, GRANDPARENT));
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toEqual(CHILD);
  });

  it('should not stopPropagation if false is returned', () => {
    putListener(CHILD, ON_CLICK_KEY, recordIDAndReturnFalse.bind(null, CHILD));
    putListener(PARENT, ON_CLICK_KEY, recordID.bind(null, PARENT));
    putListener(GRANDPARENT, ON_CLICK_KEY, recordID.bind(null, GRANDPARENT));
    spyOnDev(console, 'error');
    ReactTestUtils.Simulate.click(CHILD);
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toEqual(CHILD);
    expect(idCallOrder[1]).toEqual(PARENT);
    expect(idCallOrder[2]).toEqual(GRANDPARENT);
    if (__DEV__) {
      expect(console.error.calls.count()).toEqual(0);
    }
  });

  /**
   * The entire event registration state of the world should be "locked-in" at
   * the time the event occurs. This is to resolve many edge cases that come
   * about from a listener on a lower-in-DOM node causing structural changes at
   * places higher in the DOM. If this lower-in-DOM node causes new content to
   * be rendered at a place higher-in-DOM, we need to be careful not to invoke
   * these new listeners.
   */

  it('should invoke handlers that were removed while bubbling', () => {
    var handleParentClick = jest.fn();
    var handleChildClick = function(event) {
      deleteAllListeners(PARENT);
    };
    putListener(CHILD, ON_CLICK_KEY, handleChildClick);
    putListener(PARENT, ON_CLICK_KEY, handleParentClick);
    ReactTestUtils.Simulate.click(CHILD);
    expect(handleParentClick.mock.calls.length).toBe(1);
  });

  it('should not invoke newly inserted handlers while bubbling', () => {
    var handleParentClick = jest.fn();
    var handleChildClick = function(event) {
      putListener(PARENT, ON_CLICK_KEY, handleParentClick);
    };
    putListener(CHILD, ON_CLICK_KEY, handleChildClick);
    ReactTestUtils.Simulate.click(CHILD);
    expect(handleParentClick.mock.calls.length).toBe(0);
  });

  it('should have mouse enter simulated by test utils', () => {
    putListener(CHILD, ON_MOUSE_ENTER_KEY, recordID.bind(null, CHILD));
    ReactTestUtils.Simulate.mouseEnter(CHILD);
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toEqual(CHILD);
  });

  // The onTouchTap is ignore ?

  it('should infer onTouchTap from a touchStart/End', () => {
    putListener(CHILD, ON_TOUCH_TAP_KEY, recordID.bind(null, CHILD));
    ReactTestUtils.SimulateNative.touchStart(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0)
    );
    ReactTestUtils.SimulateNative.touchEnd(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0)
    );
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toEqual(CHILD);
  });

  it('should infer onTouchTap from when dragging below threshold', () => {
    putListener(CHILD, ON_TOUCH_TAP_KEY, recordID.bind(null, CHILD));
    ReactTestUtils.SimulateNative.touchStart(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0)
    );
    ReactTestUtils.SimulateNative.touchEnd(
      CHILD,
      ReactTestUtils.nativeTouchData(0, tapMoveThreshold - 1)
    );
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toEqual(CHILD);
  });

  it('should not onTouchTap from when dragging beyond threshold', () => {
    putListener(CHILD, ON_TOUCH_TAP_KEY, recordID.bind(null, CHILD));
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

  // it('should listen to events only once', () => {
  //   spyOnDevAndProd(EventTarget.prototype, 'addEventListener');
  //   ReactBrowserEventEmitter.listenTo(ON_CLICK_KEY, document);
  //   ReactBrowserEventEmitter.listenTo(ON_CLICK_KEY, document);
  //   expect(EventTarget.prototype.addEventListener.calls.count()).toBe(1);
  // });

  // it('should work with event plugins without dependencies', () => {
  //   spyOnDevAndProd(EventTarget.prototype, 'addEventListener');

  //   ReactBrowserEventEmitter.listenTo(ON_CLICK_KEY, document);

  //   expect(EventTarget.prototype.addEventListener.calls.argsFor(0)[0]).toBe(
  //     'click'
  //   );
  // });

  // it('should work with event plugins with dependencies', () => {
  //   spyOnDevAndProd(EventTarget.prototype, 'addEventListener');

  //   ReactBrowserEventEmitter.listenTo(ON_CHANGE_KEY, document);

  //   var setEventListeners = [];
  //   var listenCalls = EventTarget.prototype.addEventListener.calls.allArgs();
  //   for (var i = 0; i < listenCalls.length; i++) {
  //     setEventListeners.push(listenCalls[i][1]);
  //   }

  //   var module = EventPluginRegistry.registrationNameModules[ON_CHANGE_KEY];
  //   var dependencies = module.eventTypes.change.dependencies;
  //   expect(setEventListeners.length).toEqual(dependencies.length);

  //   for (i = 0; i < setEventListeners.length; i++) {
  //     expect(dependencies.indexOf(setEventListeners[i])).toBeTruthy();
  //   }
  // });

  // it('should bubble onTouchTap', () => {
  //   putListener(CHILD, ON_TOUCH_TAP_KEY, recordID.bind(null, CHILD));
  //   putListener(PARENT, ON_TOUCH_TAP_KEY, recordID.bind(null, PARENT));
  //   putListener(
  //     GRANDPARENT,
  //     ON_TOUCH_TAP_KEY,
  //     recordID.bind(null, GRANDPARENT)
  //   );
  //   ReactTestUtils.SimulateNative.touchStart(
  //     CHILD,
  //     ReactTestUtils.nativeTouchData(0, 0)
  //   );
  //   ReactTestUtils.SimulateNative.touchEnd(
  //     CHILD,
  //     ReactTestUtils.nativeTouchData(0, 0)
  //   );
  //   expect(idCallOrder.length).toBe(3);
  //   expect(idCallOrder[0] === CHILD).toBe(true);
  //   expect(idCallOrder[1] === PARENT).toBe(true);
  //   expect(idCallOrder[2] === GRANDPARENT).toBe(true);
  // });
});
