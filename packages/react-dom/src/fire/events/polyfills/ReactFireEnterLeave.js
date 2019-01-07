/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  MOUSE_OVER,
  MOUSE_OUT,
  POINTER_OVER,
  POINTER_OUT,
} from '../ReactFireEventTypes';
import {
  getClosestFiberFromDOMNode,
  getDOMNodeFromFiber,
} from '../../ReactFireInternal';
import {traverseEnterLeave} from '../ReactFireEventTraversal';
import {getPooledSyntheticEvent} from '../synthetic/ReactFireSyntheticEvent';
import {SyntheticPointerEvent} from '../synthetic/ReactFireSyntheticPointerEvent';
import {SyntheticMouseEvent} from '../synthetic/ReactFireSyntheticMouseEvent';

function polyfilledEventListener(eventName, nativeEvent, eventTarget, proxyContext) {
  const isOverEvent = eventName === MOUSE_OVER || eventName === POINTER_OVER;
  const isOutEvent = eventName === MOUSE_OUT || eventName === POINTER_OUT;

  if (isOverEvent && (nativeEvent.relatedTarget || nativeEvent.fromElement)) {
    return null;
  }

  if (!isOutEvent && !isOverEvent) {
    // Must not be a mouse or pointer in or out - ignoring.
    return null;
  }

  let win;
  if (eventTarget.window === eventTarget) {
    // `nativeEventTarget` is probably a window object.
    win = eventTarget;
  } else {
    // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
    const doc = eventTarget.ownerDocument;
    if (doc) {
      win = doc.defaultView || doc.parentWindow;
    } else {
      win = window;
    }
  }

  let from;
  let to;
  if (isOutEvent) {
    from = getClosestFiberFromDOMNode(eventTarget);
    const related = nativeEvent.relatedTarget || nativeEvent.toElement;
    to = related ? getClosestFiberFromDOMNode(related) : null;
  } else {
    // Moving to a node from outside the window.
    from = null;
    to = getClosestFiberFromDOMNode(eventTarget);
  }

  if (from === to) {
    // Nothing pertains to our managed components.
    return null;
  }

  let eventInterface, eventTypePrefix;

  if (eventName === MOUSE_OUT || eventName === MOUSE_OVER) {
    eventInterface = SyntheticMouseEvent;
    eventTypePrefix = 'mouse';
  } else if (
    eventName === POINTER_OUT ||
    eventName === POINTER_OVER
  ) {
    eventInterface = SyntheticPointerEvent;
    eventTypePrefix = 'pointer';
  }

  const fromNode = from == null ? win : getDOMNodeFromFiber(from);
  const toNode = to == null ? win : getDOMNodeFromFiber(to);

  const leave = getPooledSyntheticEvent(
    eventInterface,
    nativeEvent,
    proxyContext,
  );
  leave.type = eventTypePrefix + 'leave';
  leave.target = fromNode;
  leave.relatedTarget = toNode;

  const enter = getPooledSyntheticEvent(
    eventInterface,
    nativeEvent,
    proxyContext,
  );
  enter.type = eventTypePrefix + 'enter';
  enter.target = toNode;
  enter.relatedTarget = fromNode;

  traverseEnterLeave(leave, enter, from, to, proxyContext);
}

const mouseEnterLeave = [MOUSE_OUT, MOUSE_OVER];

export const onMouseEnterLeaveHeuristics = [
  mouseEnterLeave,
  polyfilledEventListener,
];

const pointerEnterLeave = [POINTER_OUT, POINTER_OVER];

export const onPointerEnterLeaveHeuristics = [
  pointerEnterLeave,
  polyfilledEventListener,
];
