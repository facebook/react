/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let EventPluginHub;
let React;
let ReactDOM;
let ReactTestUtils;
let TapEventPlugin;

let tapMoveThreshold;
let idCallOrder;
const recordID = function(id) {
  idCallOrder.push(id);
};
const LISTENER = jest.fn();
const ON_TOUCH_TAP_KEY = 'onTouchTap';

let GRANDPARENT;
let PARENT;
let CHILD;

let putListener;

describe('TapEventPlugin', () => {
  beforeEach(() => {
    jest.resetModules();
    LISTENER.mockClear();

    EventPluginHub = require('events/EventPluginHub');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
    TapEventPlugin = require('react-dom/src/events/TapEventPlugin').default;

    const container = document.createElement('div');

    const GRANDPARENT_PROPS = {};
    const PARENT_PROPS = {};
    const CHILD_PROPS = {};

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
    EventPluginHub.injection.injectEventPluginsByName({
      TapEventPlugin: TapEventPlugin,
    });
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
