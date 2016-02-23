/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule EnterLeaveEventPlugin
 */

'use strict';

const EventConstants = require('EventConstants');
const EventPropagators = require('EventPropagators');
const ReactDOMComponentTree = require('ReactDOMComponentTree');
const SyntheticMouseEvent = require('SyntheticMouseEvent');

const keyOf = require('keyOf');

const topLevelTypes = EventConstants.topLevelTypes;

const eventTypes = {
  mouseEnter: {
    registrationName: keyOf({onMouseEnter: null}),
    dependencies: [
      topLevelTypes.topMouseOut,
      topLevelTypes.topMouseOver,
    ],
  },
  mouseLeave: {
    registrationName: keyOf({onMouseLeave: null}),
    dependencies: [
      topLevelTypes.topMouseOut,
      topLevelTypes.topMouseOver,
    ],
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
    nativeEventTarget
  ) {
    if (topLevelType === topLevelTypes.topMouseOver &&
        (nativeEvent.relatedTarget || nativeEvent.fromElement)) {
      return null;
    }
    if (topLevelType !== topLevelTypes.topMouseOut &&
        topLevelType !== topLevelTypes.topMouseOver) {
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
    if (topLevelType === topLevelTypes.topMouseOut) {
      from = targetInst;
      const related = nativeEvent.relatedTarget || nativeEvent.toElement;
      to = related ?
        ReactDOMComponentTree.getClosestInstanceFromNode(related) : null;
    } else {
      // Moving to a node from outside the window.
      from = null;
      to = targetInst;
    }

    if (from === to) {
      // Nothing pertains to our managed components.
      return null;
    }

    const fromNode =
      from == null ? win : ReactDOMComponentTree.getNodeFromInstance(from);
    const toNode =
      to == null ? win : ReactDOMComponentTree.getNodeFromInstance(to);

    const leave = SyntheticMouseEvent.getPooled(
      eventTypes.mouseLeave,
      from,
      nativeEvent,
      nativeEventTarget
    );
    leave.type = 'mouseleave';
    leave.target = fromNode;
    leave.relatedTarget = toNode;

    const enter = SyntheticMouseEvent.getPooled(
      eventTypes.mouseEnter,
      to,
      nativeEvent,
      nativeEventTarget
    );
    enter.type = 'mouseenter';
    enter.target = toNode;
    enter.relatedTarget = fromNode;

    EventPropagators.accumulateEnterLeaveDispatches(leave, enter, from, to);

    return [leave, enter];
  },

};

module.exports = EnterLeaveEventPlugin;
