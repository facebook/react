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

import * as DOMEventNames from '../DOMEventNames';
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
  switch (domEventName) {
    case DOMEventNames.TOP_KEY_PRESS:
      // Firefox creates a keypress event for function keys too. This removes
      // the unwanted keypress events. Enter is however both printable and
      // non-printable. One would expect Tab to be as well (but it isn't).
      if (getEventCharCode(((nativeEvent: any): KeyboardEvent)) === 0) {
        return;
      }
    /* falls through */
    case DOMEventNames.TOP_KEY_DOWN:
    case DOMEventNames.TOP_KEY_UP:
      EventInterface = KeyboardEventInterface;
      break;
    case DOMEventNames.TOP_FOCUS_IN:
    case DOMEventNames.TOP_FOCUS_OUT:
    case DOMEventNames.TOP_BEFORE_BLUR:
    case DOMEventNames.TOP_AFTER_BLUR:
      EventInterface = FocusEventInterface;
      break;
    case DOMEventNames.TOP_CLICK:
      // Firefox creates a click event on right mouse clicks. This removes the
      // unwanted click events.
      if (nativeEvent.button === 2) {
        return;
      }
    /* falls through */
    case DOMEventNames.TOP_AUX_CLICK:
    case DOMEventNames.TOP_DOUBLE_CLICK:
    case DOMEventNames.TOP_MOUSE_DOWN:
    case DOMEventNames.TOP_MOUSE_MOVE:
    case DOMEventNames.TOP_MOUSE_UP:
    // TODO: Disabled elements should not respond to mouse events
    /* falls through */
    case DOMEventNames.TOP_MOUSE_OUT:
    case DOMEventNames.TOP_MOUSE_OVER:
    case DOMEventNames.TOP_CONTEXT_MENU:
      EventInterface = MouseEventInterface;
      break;
    case DOMEventNames.TOP_DRAG:
    case DOMEventNames.TOP_DRAG_END:
    case DOMEventNames.TOP_DRAG_ENTER:
    case DOMEventNames.TOP_DRAG_EXIT:
    case DOMEventNames.TOP_DRAG_LEAVE:
    case DOMEventNames.TOP_DRAG_OVER:
    case DOMEventNames.TOP_DRAG_START:
    case DOMEventNames.TOP_DROP:
      EventInterface = DragEventInterface;
      break;
    case DOMEventNames.TOP_TOUCH_CANCEL:
    case DOMEventNames.TOP_TOUCH_END:
    case DOMEventNames.TOP_TOUCH_MOVE:
    case DOMEventNames.TOP_TOUCH_START:
      EventInterface = TouchEventInterface;
      break;
    case DOMEventNames.TOP_ANIMATION_END:
    case DOMEventNames.TOP_ANIMATION_ITERATION:
    case DOMEventNames.TOP_ANIMATION_START:
      EventInterface = AnimationEventInterface;
      break;
    case DOMEventNames.TOP_TRANSITION_END:
      EventInterface = TransitionEventInterface;
      break;
    case DOMEventNames.TOP_SCROLL:
      EventInterface = UIEventInterface;
      break;
    case DOMEventNames.TOP_WHEEL:
      EventInterface = WheelEventInterface;
      break;
    case DOMEventNames.TOP_COPY:
    case DOMEventNames.TOP_CUT:
    case DOMEventNames.TOP_PASTE:
      EventInterface = ClipboardEventInterface;
      break;
    case DOMEventNames.TOP_GOT_POINTER_CAPTURE:
    case DOMEventNames.TOP_LOST_POINTER_CAPTURE:
    case DOMEventNames.TOP_POINTER_CANCEL:
    case DOMEventNames.TOP_POINTER_DOWN:
    case DOMEventNames.TOP_POINTER_MOVE:
    case DOMEventNames.TOP_POINTER_OUT:
    case DOMEventNames.TOP_POINTER_OVER:
    case DOMEventNames.TOP_POINTER_UP:
      EventInterface = PointerEventInterface;
      break;
    default:
      // Unknown event. This is used by createEventHandle.
      break;
  }
  const event = new SyntheticEvent(
    reactName,
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
        domEventName === DOMEventNames.TOP_SCROLL;
    }

    accumulateSinglePhaseListeners(
      targetInst,
      dispatchQueue,
      event,
      inCapturePhase,
      accumulateTargetOnly,
    );
  }
  return event;
}

export {registerSimpleEvents as registerEvents, extractEvents};
