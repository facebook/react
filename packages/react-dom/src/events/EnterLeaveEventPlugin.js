/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {accumulateEnterLeaveDispatches} from 'legacy-events/EventPropagators';

import {
  TOP_MOUSE_OUT,
  TOP_MOUSE_OVER,
  TOP_POINTER_OUT,
  TOP_POINTER_OVER,
} from './DOMTopLevelEventTypes';
import {IS_REPLAYED} from 'legacy-events/EventSystemFlags';
import SyntheticMouseEvent from './SyntheticMouseEvent';
import SyntheticPointerEvent from './SyntheticPointerEvent';
import {
  getClosestInstanceFromNode,
  getNodeFromInstance,
} from '../client/ReactDOMComponentTree';
import {HostComponent, HostText} from 'shared/ReactWorkTags';
import {getNearestMountedFiber} from 'react-reconciler/reflection';

const eventTypes = {
  mouseEnter: {
    registrationName: 'onMouseEnter',
    dependencies: [TOP_MOUSE_OUT, TOP_MOUSE_OVER],
  },
  mouseLeave: {
    registrationName: 'onMouseLeave',
    dependencies: [TOP_MOUSE_OUT, TOP_MOUSE_OVER],
  },
  pointerEnter: {
    registrationName: 'onPointerEnter',
    dependencies: [TOP_POINTER_OUT, TOP_POINTER_OVER],
  },
  pointerLeave: {
    registrationName: 'onPointerLeave',
    dependencies: [TOP_POINTER_OUT, TOP_POINTER_OVER],
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
    eventSystemFlags,
    targetInst,
    nativeEvent,
    nativeEventTarget,
  ) {
    const isOverEvent =
      topLevelType === TOP_MOUSE_OVER || topLevelType === TOP_POINTER_OVER;
    const isOutEvent =
      topLevelType === TOP_MOUSE_OUT || topLevelType === TOP_POINTER_OUT;

    if (
      isOverEvent &&
      (eventSystemFlags & IS_REPLAYED) === 0 &&
      (nativeEvent.relatedTarget || nativeEvent.fromElement)
    ) {
      // If this is an over event with a target, then we've already dispatched
      // the event in the out event of the other target. If this is replayed,
      // then it's because we couldn't dispatch against this target previously
      // so we have to do it now instead.
      return null;
    }

    if (!isOutEvent && !isOverEvent) {
      // Must not be a mouse or pointer in or out - ignoring.
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
    if (isOutEvent) {
      from = targetInst;
      const related = nativeEvent.relatedTarget || nativeEvent.toElement;
      to = related ? getClosestInstanceFromNode(related) : null;
      if (to !== null) {
        const nearestMounted = getNearestMountedFiber(to);
        if (
          to !== nearestMounted ||
          (to.tag !== HostComponent && to.tag !== HostText)
        ) {
          to = null;
        }
      }
    } else {
      // Moving to a node from outside the window.
      from = null;
      to = targetInst;
    }

    if (from === to) {
      // Nothing pertains to our managed components.
      return null;
    }

    let eventInterface, leaveEventType, enterEventType, eventTypePrefix;

    if (topLevelType === TOP_MOUSE_OUT || topLevelType === TOP_MOUSE_OVER) {
      eventInterface = SyntheticMouseEvent;
      leaveEventType = eventTypes.mouseLeave;
      enterEventType = eventTypes.mouseEnter;
      eventTypePrefix = 'mouse';
    } else if (
      topLevelType === TOP_POINTER_OUT ||
      topLevelType === TOP_POINTER_OVER
    ) {
      eventInterface = SyntheticPointerEvent;
      leaveEventType = eventTypes.pointerLeave;
      enterEventType = eventTypes.pointerEnter;
      eventTypePrefix = 'pointer';
    }

    const fromNode = from == null ? win : getNodeFromInstance(from);
    const toNode = to == null ? win : getNodeFromInstance(to);

    const leave = eventInterface.getPooled(
      leaveEventType,
      from,
      nativeEvent,
      nativeEventTarget,
    );
    leave.type = eventTypePrefix + 'leave';
    leave.target = fromNode;
    leave.relatedTarget = toNode;

    const enter = eventInterface.getPooled(
      enterEventType,
      to,
      nativeEvent,
      nativeEventTarget,
    );
    enter.type = eventTypePrefix + 'enter';
    enter.target = toNode;
    enter.relatedTarget = fromNode;

    accumulateEnterLeaveDispatches(leave, enter, from, to);

    return [leave, enter];
  },
};

export default EnterLeaveEventPlugin;
