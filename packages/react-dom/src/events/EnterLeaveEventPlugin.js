/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {accumulateEnterLeaveDispatches} from 'events/EventPropagators';

import {TOP_MOUSE_OUT, TOP_MOUSE_OVER} from './DOMTopLevelEventTypes';
import SyntheticMouseEvent from './SyntheticMouseEvent';
import {
  getClosestInstanceFromNode,
  getNodeFromInstance,
} from '../client/ReactDOMComponentTree';

const eventTypes = {
  mouseEnter: {
    registrationName: 'onMouseEnter',
    dependencies: [TOP_MOUSE_OUT, TOP_MOUSE_OVER],
  },
  mouseLeave: {
    registrationName: 'onMouseLeave',
    dependencies: [TOP_MOUSE_OUT, TOP_MOUSE_OVER],
  },
};

const EnterLeaveEventPlugin = {
  eventTypes: eventTypes,

  /**
   * For almost every interaction we care about, there will be both a top-level
   * `mouseover` and `mouseout` event that occurs. Only use `mouseout` so that
   * we do not extract duplicate events. However, moving the mouse into the
   * browser from outside will not fire a `mouseout` event. In this case, we use
   * the `mouseover` top-level event.
   */
  extractEvents: function(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
  ) {
    if (
      topLevelType === TOP_MOUSE_OVER &&
      (nativeEvent.relatedTarget || nativeEvent.fromElement)
    ) {
      return null;
    }
    if (topLevelType !== TOP_MOUSE_OUT && topLevelType !== TOP_MOUSE_OVER) {
      // Must not be a mouse in or mouse out - ignoring.
      return null;
    }

    let win;
    if (nativeEventTarget.window === nativeEventTarget) {
      // `nativeEventTarget` is probably a window object.
      win = nativeEventTarget;
    } else {
      // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
      const doc = nativeEventTarget.ownerDocument;
      if (doc) {
        win = doc.defaultView || doc.parentWindow;
      } else {
        win = window;
      }
    }

    let from;
    let to;
    if (topLevelType === TOP_MOUSE_OUT) {
      from = targetInst;
      const related = nativeEvent.relatedTarget || nativeEvent.toElement;
      to = related ? getClosestInstanceFromNode(related) : null;
    } else {
      // Moving to a node from outside the window.
      from = null;
      to = targetInst;
    }

    if (from === to) {
      // Nothing pertains to our managed components.
      return null;
    }

    const fromNode = from == null ? win : getNodeFromInstance(from);
    const toNode = to == null ? win : getNodeFromInstance(to);

    const leave = SyntheticMouseEvent.getPooled(
      eventTypes.mouseLeave,
      from,
      nativeEvent,
      nativeEventTarget,
    );
    leave.type = 'mouseleave';
    leave.target = fromNode;
    leave.relatedTarget = toNode;

    const enter = SyntheticMouseEvent.getPooled(
      eventTypes.mouseEnter,
      to,
      nativeEvent,
      nativeEventTarget,
    );
    enter.type = 'mouseenter';
    enter.target = toNode;
    enter.relatedTarget = fromNode;

    accumulateEnterLeaveDispatches(leave, enter, from, to);

    return [leave, enter];
  },
};

export default EnterLeaveEventPlugin;
