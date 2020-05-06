/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TOP_MOUSE_OUT,
  TOP_MOUSE_OVER,
  TOP_POINTER_OUT,
  TOP_POINTER_OVER,
} from '../DOMTopLevelEventTypes';
import {IS_REPLAYED} from 'react-dom/src/events/EventSystemFlags';
import SyntheticMouseEvent from '../SyntheticMouseEvent';
import SyntheticPointerEvent from '../SyntheticPointerEvent';
import {
  getClosestInstanceFromNode,
  getNodeFromInstance,
} from '../../client/ReactDOMComponentTree';
import {accumulateEnterLeaveListeners} from '../DOMModernPluginEventSystem';

import {HostComponent, HostText} from 'react-reconciler/src/ReactWorkTags';
import {getNearestMountedFiber} from 'react-reconciler/src/ReactFiberTreeReflection';

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
    dispatchQueue,
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    container,
  ) {
    const isOverEvent =
      topLevelType === TOP_MOUSE_OVER || topLevelType === TOP_POINTER_OVER;
    const isOutEvent =
      topLevelType === TOP_MOUSE_OUT || topLevelType === TOP_POINTER_OUT;

    if (isOverEvent && (eventSystemFlags & IS_REPLAYED) === 0) {
      const related = nativeEvent.relatedTarget || nativeEvent.fromElement;
      if (related) {
        // Due to the fact we don't add listeners to the document with the
        // modern event system and instead attach listeners to roots, we
        // need to handle the over event case. To ensure this, we just need to
        // make sure the node that we're coming from is managed by React.
        const inst = getClosestInstanceFromNode(related);
        if (inst !== null) {
          return;
        }
      }
    }

    if (!isOutEvent && !isOverEvent) {
      // Must not be a mouse or pointer in or out - ignoring.
      return;
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
      const related = nativeEvent.relatedTarget || nativeEvent.toElement;
      from = targetInst;
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
      return;
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

    let enter = eventInterface.getPooled(
      enterEventType,
      to,
      nativeEvent,
      nativeEventTarget,
    );
    enter.type = eventTypePrefix + 'enter';
    enter.target = toNode;
    enter.relatedTarget = fromNode;

    // If we are not processing the first ancestor, then we
    // should not process the same nativeEvent again, as we
    // will have already processed it in the first ancestor.
    const nativeTargetInst = getClosestInstanceFromNode(nativeEventTarget);
    if (nativeTargetInst !== targetInst) {
      enter = null;
    }

    accumulateEnterLeaveListeners(dispatchQueue, leave, enter, from, to);
  },
};

export default EnterLeaveEventPlugin;
