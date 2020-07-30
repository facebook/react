/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from '../PluginModuleType';
import type {DOMEventName} from '../DOMEventNames';
import type {DispatchQueue} from '../DOMPluginEventSystem';
import type {EventSystemFlags} from '../EventSystemFlags';

import {registerDirectEvent} from '../EventRegistry';
import {IS_REPLAYED} from 'react-dom/src/events/EventSystemFlags';
import {
  SyntheticEvent,
  MouseEventInterface,
  PointerEventInterface,
} from '../SyntheticEvent';
import {
  getClosestInstanceFromNode,
  getNodeFromInstance,
} from '../../client/ReactDOMComponentTree';
import {accumulateEnterLeaveTwoPhaseListeners} from '../DOMPluginEventSystem';

import {HostComponent, HostText} from 'react-reconciler/src/ReactWorkTags';
import {getNearestMountedFiber} from 'react-reconciler/src/ReactFiberTreeReflection';

function registerEvents() {
  registerDirectEvent('onMouseEnter', ['mouseout', 'mouseover']);
  registerDirectEvent('onMouseLeave', ['mouseout', 'mouseover']);
  registerDirectEvent('onPointerEnter', ['pointerout', 'pointerover']);
  registerDirectEvent('onPointerLeave', ['pointerout', 'pointerover']);
}

/**
 * For almost every interaction we care about, there will be both a top-level
 * `mouseover` and `mouseout` event that occurs. Only use `mouseout` so that
 * we do not extract duplicate events. However, moving the mouse into the
 * browser from outside will not fire a `mouseout` event. In this case, we use
 * the `mouseover` top-level event.
 */
function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
) {
  const isOverEvent =
    domEventName === 'mouseover' || domEventName === 'pointerover';
  const isOutEvent =
    domEventName === 'mouseout' || domEventName === 'pointerout';

  if (isOverEvent && (eventSystemFlags & IS_REPLAYED) === 0) {
    const related =
      (nativeEvent: any).relatedTarget || (nativeEvent: any).fromElement;
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
  // TODO: why is this nullable in the types but we read from it?
  if ((nativeEventTarget: any).window === nativeEventTarget) {
    // `nativeEventTarget` is probably a window object.
    win = nativeEventTarget;
  } else {
    // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
    const doc = (nativeEventTarget: any).ownerDocument;
    if (doc) {
      win = doc.defaultView || doc.parentWindow;
    } else {
      win = window;
    }
  }

  let from;
  let to;
  if (isOutEvent) {
    const related = nativeEvent.relatedTarget || (nativeEvent: any).toElement;
    from = targetInst;
    to = related ? getClosestInstanceFromNode((related: any)) : null;
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

  let eventInterface = MouseEventInterface;
  let leaveEventType = 'onMouseLeave';
  let enterEventType = 'onMouseEnter';
  let eventTypePrefix = 'mouse';
  if (domEventName === 'pointerout' || domEventName === 'pointerover') {
    eventInterface = PointerEventInterface;
    leaveEventType = 'onPointerLeave';
    enterEventType = 'onPointerEnter';
    eventTypePrefix = 'pointer';
  }

  const fromNode = from == null ? win : getNodeFromInstance(from);
  const toNode = to == null ? win : getNodeFromInstance(to);

  const leave = new SyntheticEvent(
    leaveEventType,
    from,
    nativeEvent,
    nativeEventTarget,
    eventInterface,
  );
  leave.type = eventTypePrefix + 'leave';
  leave.target = fromNode;
  leave.relatedTarget = toNode;

  let enter = new SyntheticEvent(
    enterEventType,
    to,
    nativeEvent,
    nativeEventTarget,
    eventInterface,
  );
  enter.type = eventTypePrefix + 'enter';
  enter.target = toNode;
  enter.relatedTarget = fromNode;

  // If we are not processing the first ancestor, then we
  // should not process the same nativeEvent again, as we
  // will have already processed it in the first ancestor.
  const nativeTargetInst = getClosestInstanceFromNode((nativeEventTarget: any));
  if (nativeTargetInst !== targetInst) {
    enter = null;
  }

  accumulateEnterLeaveTwoPhaseListeners(dispatchQueue, leave, enter, from, to);
}

export {registerEvents, extractEvents};
