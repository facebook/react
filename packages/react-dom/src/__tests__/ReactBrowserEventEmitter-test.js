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
let ReactTestUtils;
let ReactBrowserEventEmitter;

let CHILD, PARENT, GRANDPARENT;
let CHILD_PROPS = {};
let PARENT_PROPS = {};
let GRANDPARENT_PROPS = {};

let container;
let idCallOrder;

const LISTENER = jest.fn();
const ON_CLICK_KEY = 'onClick';
// const ON_CHANGE_KEY = 'onChange';
const ON_MOUSE_ENTER_KEY = 'onMouseEnter';

let putListener;
let getListener;
let deleteAllListeners;

function recordID(id) {
  idCallOrder.push(id);
}
function registerSimpleTestHandler() {
  putListener(CHILD, ON_CLICK_KEY, LISTENER);
  var listener = getListener(CHILD, ON_CLICK_KEY);
  expect(listener).toEqual(LISTENER);
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
    jest.resetModules();
    LISTENER.mockClear();

    React = require('react');
    ReactBrowserEventEmitter = require('react-dom/src/events/ReactBrowserEventEmitter');
    ReactTestUtils = require('react-dom/test-utils');

    container = document.createElement('div');

    let instance;

    function Child(props) {
      return <div ref={node => (CHILD = node)} {...props} />;
    }

    class ChildWrapper extends React.PureComponent {
      render() {
        return <Child {...this.props} />;
      }
    }

    class CommonComponent extends React.Component {
      render() {
        return (
          <div ref={c => (GRANDPARENT = c)} {...GRANDPARENT_PROPS}>
            <div ref={c => (PARENT = c)} {...PARENT_PROPS}>
              <ChildWrapper {...CHILD_PROPS} />
            </div>
          </div>
        );
      }
    }

    function renderTree() {
      instance = ReactTestUtils.renderIntoDocument(<CommonComponent />);
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
      const trees = ReactTestUtils.findAllInRenderedTree(instance, () => true);
      return trees[3].props[eventName];
    };

    idCallOrder = [];
  });

  afterEach(() => {
    idCallOrder = [];
  });

  it('should store a listener correctly', () => {
    registerSimpleTestHandler();
    var listener = getListener(CHILD, ON_CLICK_KEY);
    expect(listener).toBe(LISTENER);
  });

  it('should retrieve a listener correctly', () => {
    registerSimpleTestHandler();
    var listener = getListener(CHILD, ON_CLICK_KEY);
    expect(listener).toBe(LISTENER);
  });

  it('should clear all handlers when asked to', () => {
    registerSimpleTestHandler();
    deleteAllListeners(CHILD);
    var listener = getListener(CHILD, ON_CLICK_KEY);
    expect(listener).toBe(undefined);
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
      recordID.bind(null, 'UPDATED_GRANDPARENT'),
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
      recordIDAndStopPropagation.bind(null, PARENT),
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
      recordIDAndStopPropagation.bind(null, CHILD),
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

  it('should listen to events only once', () => {
    spyOnDevAndProd(EventTarget.prototype, 'addEventListener');
    ReactBrowserEventEmitter.listenTo(ON_CLICK_KEY, container);
    ReactBrowserEventEmitter.listenTo(ON_CLICK_KEY, container);
    expect(EventTarget.prototype.addEventListener.calls.count()).toBe(1);
  });

  it('should work with event plugins without dependencies', () => {
    spyOnDevAndProd(EventTarget.prototype, 'addEventListener');

    ReactBrowserEventEmitter.listenTo(ON_CLICK_KEY, container);

    expect(EventTarget.prototype.addEventListener.calls.argsFor(0)[0]).toBe(
      'click',
    );
  });

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
});
