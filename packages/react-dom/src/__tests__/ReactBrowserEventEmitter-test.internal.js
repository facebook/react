/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let EventPluginGetListener;
let EventPluginRegistry;
let React;
let ReactDOM;
let ReactDOMComponentTree;
let listenToEvent;
let ReactDOMEventListener;
let ReactTestUtils;
let ReactFeatureFlags;

let idCallOrder;
const recordID = function(id) {
  idCallOrder.push(id);
};
const recordIDAndStopPropagation = function(id, event) {
  recordID(id);
  event.stopPropagation();
};
const recordIDAndReturnFalse = function(id, event) {
  recordID(id);
  return false;
};
const LISTENER = jest.fn();
const ON_CLICK_KEY = 'onClick';
const ON_CHANGE_KEY = 'onChange';
const ON_MOUSE_ENTER_KEY = 'onMouseEnter';

let GRANDPARENT;
let PARENT;
let CHILD;
let BUTTON;

let getListener;
let putListener;
let deleteAllListeners;

let container;

function registerSimpleTestHandler() {
  putListener(CHILD, ON_CLICK_KEY, LISTENER);
  const listener = getListener(CHILD, ON_CLICK_KEY);
  expect(listener).toEqual(LISTENER);
  return getListener(CHILD, ON_CLICK_KEY);
}

// We should probably remove this file at some point, it's just full of
// internal API usage.
describe('ReactBrowserEventEmitter', () => {
  beforeEach(() => {
    jest.resetModules();
    LISTENER.mockClear();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    EventPluginGetListener = require('react-dom/src/events/getListener')
      .default;
    EventPluginRegistry = require('legacy-events/EventPluginRegistry');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMComponentTree = require('../client/ReactDOMComponentTree');
    if (ReactFeatureFlags.enableModernEventSystem) {
      listenToEvent = require('../events/DOMModernPluginEventSystem')
        .listenToEvent;
    } else {
      listenToEvent = require('../events/DOMLegacyEventPluginSystem')
        .legacyListenToEvent;
    }

    ReactDOMEventListener = require('../events/ReactDOMEventListener');
    ReactTestUtils = require('react-dom/test-utils');

    container = document.createElement('div');
    document.body.appendChild(container);

    let GRANDPARENT_PROPS = {};
    let PARENT_PROPS = {};
    let CHILD_PROPS = {};
    let BUTTON_PROPS = {};

    function Child(props) {
      return <div ref={c => (CHILD = c)} {...props} />;
    }

    class ChildWrapper extends React.PureComponent {
      render() {
        return <Child {...this.props} />;
      }
    }

    function renderTree() {
      ReactDOM.render(
        <div ref={c => (GRANDPARENT = c)} {...GRANDPARENT_PROPS}>
          <div ref={c => (PARENT = c)} {...PARENT_PROPS}>
            <ChildWrapper {...CHILD_PROPS} />
            <button disabled={true} ref={c => (BUTTON = c)} {...BUTTON_PROPS} />
          </div>
        </div>,
        container,
      );
    }

    renderTree();

    getListener = function(node, eventName) {
      const inst = ReactDOMComponentTree.getInstanceFromNode(node);
      return EventPluginGetListener(inst, eventName);
    };
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
        case BUTTON:
          BUTTON_PROPS[eventName] = listener;
          break;
      }
      // Rerender with new event listeners
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
        case BUTTON:
          BUTTON_PROPS = {};
          break;
      }
      renderTree();
    };

    idCallOrder = [];
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('should store a listener correctly', () => {
    registerSimpleTestHandler();
    const listener = getListener(CHILD, ON_CLICK_KEY);
    expect(listener).toBe(LISTENER);
  });

  it('should retrieve a listener correctly', () => {
    registerSimpleTestHandler();
    const listener = getListener(CHILD, ON_CLICK_KEY);
    expect(listener).toEqual(LISTENER);
  });

  it('should not retrieve listeners on a disabled interactive element', () => {
    putListener(BUTTON, ON_MOUSE_ENTER_KEY, recordID.bind(null, BUTTON));
    const listener = getListener(BUTTON, ON_MOUSE_ENTER_KEY);
    expect(listener).toBe(null);
  });

  it('should clear all handlers when asked to', () => {
    registerSimpleTestHandler();
    deleteAllListeners(CHILD);
    const listener = getListener(CHILD, ON_CLICK_KEY);
    expect(listener).toBe(undefined);
  });

  it('should invoke a simple handler registered on a node', () => {
    registerSimpleTestHandler();
    CHILD.click();
    expect(LISTENER).toHaveBeenCalledTimes(1);
  });

  it('should not invoke handlers if ReactDOMEventListener is disabled', () => {
    registerSimpleTestHandler();
    ReactDOMEventListener.setEnabled(false);
    CHILD.click();
    expect(LISTENER).toHaveBeenCalledTimes(0);
    ReactDOMEventListener.setEnabled(true);
    CHILD.click();
    expect(LISTENER).toHaveBeenCalledTimes(1);
  });

  it('should bubble simply', () => {
    putListener(CHILD, ON_CLICK_KEY, recordID.bind(null, CHILD));
    putListener(PARENT, ON_CLICK_KEY, recordID.bind(null, PARENT));
    putListener(GRANDPARENT, ON_CLICK_KEY, recordID.bind(null, GRANDPARENT));
    CHILD.click();
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toBe(CHILD);
    expect(idCallOrder[1]).toBe(PARENT);
    expect(idCallOrder[2]).toBe(GRANDPARENT);
  });

  it('should bubble to the right handler after an update', () => {
    putListener(GRANDPARENT, ON_CLICK_KEY, recordID.bind(null, 'GRANDPARENT'));
    putListener(PARENT, ON_CLICK_KEY, recordID.bind(null, 'PARENT'));
    putListener(CHILD, ON_CLICK_KEY, recordID.bind(null, 'CHILD'));
    CHILD.click();
    expect(idCallOrder).toEqual(['CHILD', 'PARENT', 'GRANDPARENT']);

    idCallOrder = [];

    // Update just the grand parent without updating the child.
    putListener(
      GRANDPARENT,
      ON_CLICK_KEY,
      recordID.bind(null, 'UPDATED_GRANDPARENT'),
    );

    CHILD.click();
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
    expect(idCallOrder[0]).toBe(CHILD);
    expect(idCallOrder[1]).toBe(PARENT);
    expect(idCallOrder[2]).toBe(GRANDPARENT);
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
    CHILD.click();
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toBe(CHILD);
    expect(idCallOrder[1]).toBe(PARENT);
    expect(idCallOrder[2]).toBe(GRANDPARENT);
  });

  it('should support stopPropagation()', () => {
    putListener(CHILD, ON_CLICK_KEY, recordID.bind(null, CHILD));
    putListener(
      PARENT,
      ON_CLICK_KEY,
      recordIDAndStopPropagation.bind(null, PARENT),
    );
    putListener(GRANDPARENT, ON_CLICK_KEY, recordID.bind(null, GRANDPARENT));
    CHILD.click();
    expect(idCallOrder.length).toBe(2);
    expect(idCallOrder[0]).toBe(CHILD);
    expect(idCallOrder[1]).toBe(PARENT);
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
    CHILD.click();
    expect(idCallOrder.length).toBe(2);
    expect(idCallOrder[0]).toBe(CHILD);
    expect(idCallOrder[1]).toBe(PARENT);
  });

  it('should stop after first dispatch if stopPropagation', () => {
    putListener(
      CHILD,
      ON_CLICK_KEY,
      recordIDAndStopPropagation.bind(null, CHILD),
    );
    putListener(PARENT, ON_CLICK_KEY, recordID.bind(null, PARENT));
    putListener(GRANDPARENT, ON_CLICK_KEY, recordID.bind(null, GRANDPARENT));
    CHILD.click();
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(CHILD);
  });

  it('should not stopPropagation if false is returned', () => {
    putListener(CHILD, ON_CLICK_KEY, recordIDAndReturnFalse.bind(null, CHILD));
    putListener(PARENT, ON_CLICK_KEY, recordID.bind(null, PARENT));
    putListener(GRANDPARENT, ON_CLICK_KEY, recordID.bind(null, GRANDPARENT));
    CHILD.click();
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0]).toBe(CHILD);
    expect(idCallOrder[1]).toBe(PARENT);
    expect(idCallOrder[2]).toBe(GRANDPARENT);
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
    const handleParentClick = jest.fn();
    const handleChildClick = function(event) {
      deleteAllListeners(PARENT);
    };
    putListener(CHILD, ON_CLICK_KEY, handleChildClick);
    putListener(PARENT, ON_CLICK_KEY, handleParentClick);
    CHILD.click();
    expect(handleParentClick).toHaveBeenCalledTimes(1);
  });

  it('should not invoke newly inserted handlers while bubbling', () => {
    const handleParentClick = jest.fn();
    const handleChildClick = function(event) {
      putListener(PARENT, ON_CLICK_KEY, handleParentClick);
    };
    putListener(CHILD, ON_CLICK_KEY, handleChildClick);
    CHILD.click();
    expect(handleParentClick).toHaveBeenCalledTimes(0);
  });

  it('should have mouse enter simulated by test utils', () => {
    putListener(CHILD, ON_MOUSE_ENTER_KEY, recordID.bind(null, CHILD));
    ReactTestUtils.Simulate.mouseEnter(CHILD);
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(CHILD);
  });

  it('should listen to events only once', () => {
    spyOnDevAndProd(EventTarget.prototype, 'addEventListener');
    listenToEvent(ON_CLICK_KEY, document);
    listenToEvent(ON_CLICK_KEY, document);
    expect(EventTarget.prototype.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('should work with event plugins without dependencies', () => {
    spyOnDevAndProd(EventTarget.prototype, 'addEventListener');

    listenToEvent(ON_CLICK_KEY, document);

    expect(EventTarget.prototype.addEventListener.calls.argsFor(0)[0]).toBe(
      'click',
    );
  });

  it('should work with event plugins with dependencies', () => {
    spyOnDevAndProd(EventTarget.prototype, 'addEventListener');

    listenToEvent(ON_CHANGE_KEY, document);

    const setEventListeners = [];
    const listenCalls = EventTarget.prototype.addEventListener.calls.allArgs();
    for (let i = 0; i < listenCalls.length; i++) {
      setEventListeners.push(listenCalls[i][1]);
    }

    const module = EventPluginRegistry.registrationNameModules[ON_CHANGE_KEY];
    const dependencies = module.eventTypes.change.dependencies;
    expect(setEventListeners.length).toEqual(dependencies.length);

    for (let i = 0; i < setEventListeners.length; i++) {
      expect(dependencies.indexOf(setEventListeners[i])).toBeTruthy();
    }
  });
});
