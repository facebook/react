/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
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
} from '../ReactFireInternal';
import {traverseEnterLeave} from '../ReactFireEventTraversal';

function polyfilledEventListener(eventName, event, eventTarget) {
  const isOverEvent = eventName === MOUSE_OVER || eventName === POINTER_OVER;
  const isOutEvent = eventName === MOUSE_OUT || eventName === POINTER_OUT;

  if (isOverEvent && (event.relatedTarget || event.fromElement)) {
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
    const related = event.relatedTarget || event.toElement;
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

  const fromNode = from == null ? win : getDOMNodeFromFiber(from);
  const toNode = to == null ? win : getDOMNodeFromFiber(to);
  let eventTypePrefix;

  if (eventName === MOUSE_OUT || eventName === MOUSE_OVER) {
    eventTypePrefix = 'mouse';
  } else if (eventName === POINTER_OUT || eventName === POINTER_OVER) {
    eventTypePrefix = 'pointer';
  }
  let type;
  let targetNode;
  let relatedTarget;

  Object.defineProperty(event, 'type', {
    configurable: true,
    get: () => type,
  });
  Object.defineProperty(event, 'target', {
    configurable: true,
    get: () => targetNode,
  });
  Object.defineProperty(event, 'relatedTarget', {
    configurable: true,
    get: () => relatedTarget,
  });

  return traverseEnterLeave.bind(
    null,
    from,
    to,
    () => {
      type = eventTypePrefix + 'leave';
      targetNode = fromNode;
      relatedTarget = toNode;
    },
    () => {
      type = eventTypePrefix + 'enter';
      targetNode = toNode;
      relatedTarget = fromNode;
    },
  );
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
