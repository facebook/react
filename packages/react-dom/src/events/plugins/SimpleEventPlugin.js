/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMEventName} from '../../events/DOMEventNames';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {AnyNativeEvent} from '../../events/PluginModuleType';
import type {DispatchQueue} from '../DOMPluginEventSystem';
import type {EventSystemFlags} from '../EventSystemFlags';

import {
  SyntheticEvent,
  AnimationEventInterface,
  ClipboardEventInterface,
  FocusEventInterface,
  KeyboardEventInterface,
  MouseEventInterface,
  PointerEventInterface,
  DragEventInterface,
  TouchEventInterface,
  TransitionEventInterface,
  UIEventInterface,
  WheelEventInterface,
} from '../../events/SyntheticEvent';

import {
  ANIMATION_END,
  ANIMATION_ITERATION,
  ANIMATION_START,
  TRANSITION_END,
} from '../DOMEventNames';
import {
  topLevelEventsToReactNames,
  registerSimpleEvents,
} from '../DOMEventProperties';
import {
  accumulateSinglePhaseListeners,
  accumulateEventHandleNonManagedNodeListeners,
} from '../DOMPluginEventSystem';
import {IS_EVENT_HANDLE_NON_MANAGED_NODE} from '../EventSystemFlags';

import getEventCharCode from '../getEventCharCode';
import {IS_CAPTURE_PHASE} from '../EventSystemFlags';

import {
  enableCreateEventHandleAPI,
  disableOnScrollBubbling,
} from 'shared/ReactFeatureFlags';

function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
): void {
  const reactName = topLevelEventsToReactNames.get(domEventName);
  if (reactName === undefined) {
    return;
  }
  let EventInterface;
  let reactEventType = domEventName;
  switch (domEventName) {
    case 'keypress':
      // Firefox creates a keypress event for function keys too. This removes
      // the unwanted keypress events. Enter is however both printable and
      // non-printable. One would expect Tab to be as well (but it isn't).
      if (getEventCharCode(((nativeEvent: any): KeyboardEvent)) === 0) {
        return;
      }
    /* falls through */
    case 'keydown':
    case 'keyup':
      EventInterface = KeyboardEventInterface;
      break;
    case 'focusin':
      reactEventType = 'focus';
      EventInterface = FocusEventInterface;
      break;
    case 'focusout':
      reactEventType = 'blur';
      EventInterface = FocusEventInterface;
      break;
    case 'beforeblur':
    case 'afterblur':
      EventInterface = FocusEventInterface;
      break;
    case 'click':
      // Firefox creates a click event on right mouse clicks. This removes the
      // unwanted click events.
      if (nativeEvent.button === 2) {
        return;
      }
    /* falls through */
    case 'auxclick':
    case 'dblclick':
    case 'mousedown':
    case 'mousemove':
    case 'mouseup':
    // TODO: Disabled elements should not respond to mouse events
    /* falls through */
    case 'mouseout':
    case 'mouseover':
    case 'contextmenu':
      EventInterface = MouseEventInterface;
      break;
    case 'drag':
    case 'dragend':
    case 'dragenter':
    case 'dragexit':
    case 'dragleave':
    case 'dragover':
    case 'dragstart':
    case 'drop':
      EventInterface = DragEventInterface;
      break;
    case 'touchcancel':
    case 'touchend':
    case 'touchmove':
    case 'touchstart':
      EventInterface = TouchEventInterface;
      break;
    case ANIMATION_END:
    case ANIMATION_ITERATION:
    case ANIMATION_START:
      EventInterface = AnimationEventInterface;
      break;
    case TRANSITION_END:
      EventInterface = TransitionEventInterface;
      break;
    case 'scroll':
      EventInterface = UIEventInterface;
      break;
    case 'wheel':
      EventInterface = WheelEventInterface;
      break;
    case 'copy':
    case 'cut':
    case 'paste':
      EventInterface = ClipboardEventInterface;
      break;
    case 'gotpointercapture':
    case 'lostpointercapture':
    case 'pointercancel':
    case 'pointerdown':
    case 'pointermove':
    case 'pointerout':
    case 'pointerover':
    case 'pointerup':
      EventInterface = PointerEventInterface;
      break;
    default:
      // Unknown event. This is used by createEventHandle.
      break;
  }
  const event = new SyntheticEvent(
    reactName,
    reactEventType,
    null,
    nativeEvent,
    nativeEventTarget,
    EventInterface,
  );

  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  if (
    enableCreateEventHandleAPI &&
    eventSystemFlags & IS_EVENT_HANDLE_NON_MANAGED_NODE
  ) {
    accumulateEventHandleNonManagedNodeListeners(
      dispatchQueue,
      event,
      targetContainer,
      inCapturePhase,
    );
  } else {
    // Some events don't bubble in the browser.
    // In the past, React has always bubbled them, but this can be surprising.
    // We're going to try aligning closer to the browser behavior by not bubbling
    // them in React either. We'll start by not bubbling onScroll, and then expand.
    let accumulateTargetOnly = false;
    if (disableOnScrollBubbling) {
      accumulateTargetOnly =
        !inCapturePhase &&
        // TODO: ideally, we'd eventually add all events from
        // nonDelegatedEvents list in DOMPluginEventSystem.
        // Then we can remove this special list.
        domEventName === 'scroll';
    }

    accumulateSinglePhaseListeners(
      targetInst,
      dispatchQueue,
      event,
      inCapturePhase,
      accumulateTargetOnly,
    );
  }
}

export {registerSimpleEvents as registerEvents, extractEvents};
