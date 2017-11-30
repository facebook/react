/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var EventPluginHub;
var React;
var ReactDOM;
var ReactTestUtils;
var TapEventPlugin;

var tapMoveThreshold;
var idCallOrder;
var recordID = function(id) {
  idCallOrder.push(id);
};
var LISTENER = jest.fn();
var ON_TOUCH_TAP_KEY = 'onTouchTap';

var GRANDPARENT;
var PARENT;
var CHILD;

var putListener;

describe('TapEventPlugin', () => {
  beforeEach(() => {
    jest.resetModules();
    LISTENER.mockClear();

    EventPluginHub = require('events/EventPluginHub');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
    TapEventPlugin = require('react-dom/src/events/TapEventPlugin').default;

    var container = document.createElement('div');

    var GRANDPARENT_PROPS = {};
    var PARENT_PROPS = {};
    var CHILD_PROPS = {};

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
          </div>
        </div>,
        container,
      );
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

    idCallOrder = [];
    tapMoveThreshold = TapEventPlugin.tapMoveThreshold;
    spyOnDev(console, 'warn');
    EventPluginHub.injection.injectEventPluginsByName({
      TapEventPlugin: TapEventPlugin,
    });
  });

  afterEach(() => {
    if (__DEV__) {
      expect(console.warn.calls.count()).toBe(1);
      expect(console.warn.calls.argsFor(0)[0]).toContain(
        'Injecting custom event plugins (TapEventPlugin) is deprecated',
      );
    }
  });

  /**
   * The onTouchTap inject is ignore future,
   * we should always test the deprecated message correct.
   * See https://github.com/facebook/react/issues/11689
   */

  it('should infer onTouchTap from a touchStart/End', () => {
    putListener(CHILD, ON_TOUCH_TAP_KEY, recordID.bind(null, CHILD));
    ReactTestUtils.SimulateNative.touchStart(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0),
    );
    ReactTestUtils.SimulateNative.touchEnd(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0),
    );
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(CHILD);
  });

  it('should infer onTouchTap from when dragging below threshold', () => {
    putListener(CHILD, ON_TOUCH_TAP_KEY, recordID.bind(null, CHILD));
    ReactTestUtils.SimulateNative.touchStart(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0),
    );
    ReactTestUtils.SimulateNative.touchEnd(
      CHILD,
      ReactTestUtils.nativeTouchData(0, tapMoveThreshold - 1),
    );
    expect(idCallOrder.length).toBe(1);
    expect(idCallOrder[0]).toBe(CHILD);
  });

  it('should not onTouchTap from when dragging beyond threshold', () => {
    putListener(CHILD, ON_TOUCH_TAP_KEY, recordID.bind(null, CHILD));
    ReactTestUtils.SimulateNative.touchStart(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0),
    );
    ReactTestUtils.SimulateNative.touchEnd(
      CHILD,
      ReactTestUtils.nativeTouchData(0, tapMoveThreshold + 1),
    );
    expect(idCallOrder.length).toBe(0);
  });

  it('should bubble onTouchTap', () => {
    putListener(CHILD, ON_TOUCH_TAP_KEY, recordID.bind(null, CHILD));
    putListener(PARENT, ON_TOUCH_TAP_KEY, recordID.bind(null, PARENT));
    putListener(
      GRANDPARENT,
      ON_TOUCH_TAP_KEY,
      recordID.bind(null, GRANDPARENT),
    );
    ReactTestUtils.SimulateNative.touchStart(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0),
    );
    ReactTestUtils.SimulateNative.touchEnd(
      CHILD,
      ReactTestUtils.nativeTouchData(0, 0),
    );
    expect(idCallOrder.length).toBe(3);
    expect(idCallOrder[0] === CHILD).toBe(true);
    expect(idCallOrder[1] === PARENT).toBe(true);
    expect(idCallOrder[2] === GRANDPARENT).toBe(true);
  });
});
