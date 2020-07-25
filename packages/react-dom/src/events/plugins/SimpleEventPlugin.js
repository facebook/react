/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TopLevelType} from '../../events/TopLevelEventTypes';
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

import * as DOMTopLevelEventTypes from '../DOMTopLevelEventTypes';
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
import {IS_CAPTURE_PHASE, IS_NON_DELEGATED} from '../EventSystemFlags';

import {enableCreateEventHandleAPI} from 'shared/ReactFeatureFlags';

function extractEvents(
  dispatchQueue: DispatchQueue,
  topLevelType: TopLevelType,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
): void {
  const reactName = topLevelEventsToReactNames.get(topLevelType);
  if (reactName === undefined) {
    return;
  }
  let EventInterface;
  switch (topLevelType) {
    case DOMTopLevelEventTypes.TOP_KEY_PRESS:
      // Firefox creates a keypress event for function keys too. This removes
      // the unwanted keypress events. Enter is however both printable and
      // non-printable. One would expect Tab to be as well (but it isn't).
      if (getEventCharCode(((nativeEvent: any): KeyboardEvent)) === 0) {
        return;
      }
    /* falls through */
    case DOMTopLevelEventTypes.TOP_KEY_DOWN:
    case DOMTopLevelEventTypes.TOP_KEY_UP:
      EventInterface = KeyboardEventInterface;
      break;
    case DOMTopLevelEventTypes.TOP_FOCUS_IN:
    case DOMTopLevelEventTypes.TOP_FOCUS_OUT:
    case DOMTopLevelEventTypes.TOP_BEFORE_BLUR:
    case DOMTopLevelEventTypes.TOP_AFTER_BLUR:
      EventInterface = FocusEventInterface;
      break;
    case DOMTopLevelEventTypes.TOP_CLICK:
      // Firefox creates a click event on right mouse clicks. This removes the
      // unwanted click events.
      if (nativeEvent.button === 2) {
        return;
      }
    /* falls through */
    case DOMTopLevelEventTypes.TOP_AUX_CLICK:
    case DOMTopLevelEventTypes.TOP_DOUBLE_CLICK:
    case DOMTopLevelEventTypes.TOP_MOUSE_DOWN:
    case DOMTopLevelEventTypes.TOP_MOUSE_MOVE:
    case DOMTopLevelEventTypes.TOP_MOUSE_UP:
    // TODO: Disabled elements should not respond to mouse events
    /* falls through */
    case DOMTopLevelEventTypes.TOP_MOUSE_OUT:
    case DOMTopLevelEventTypes.TOP_MOUSE_OVER:
    case DOMTopLevelEventTypes.TOP_CONTEXT_MENU:
      EventInterface = MouseEventInterface;
      break;
    case DOMTopLevelEventTypes.TOP_DRAG:
    case DOMTopLevelEventTypes.TOP_DRAG_END:
    case DOMTopLevelEventTypes.TOP_DRAG_ENTER:
    case DOMTopLevelEventTypes.TOP_DRAG_EXIT:
    case DOMTopLevelEventTypes.TOP_DRAG_LEAVE:
    case DOMTopLevelEventTypes.TOP_DRAG_OVER:
    case DOMTopLevelEventTypes.TOP_DRAG_START:
    case DOMTopLevelEventTypes.TOP_DROP:
      EventInterface = DragEventInterface;
      break;
    case DOMTopLevelEventTypes.TOP_TOUCH_CANCEL:
    case DOMTopLevelEventTypes.TOP_TOUCH_END:
    case DOMTopLevelEventTypes.TOP_TOUCH_MOVE:
    case DOMTopLevelEventTypes.TOP_TOUCH_START:
      EventInterface = TouchEventInterface;
      break;
    case DOMTopLevelEventTypes.TOP_ANIMATION_END:
    case DOMTopLevelEventTypes.TOP_ANIMATION_ITERATION:
    case DOMTopLevelEventTypes.TOP_ANIMATION_START:
      EventInterface = AnimationEventInterface;
      break;
    case DOMTopLevelEventTypes.TOP_TRANSITION_END:
      EventInterface = TransitionEventInterface;
      break;
    case DOMTopLevelEventTypes.TOP_SCROLL:
      EventInterface = UIEventInterface;
      break;
    case DOMTopLevelEventTypes.TOP_WHEEL:
      EventInterface = WheelEventInterface;
      break;
    case DOMTopLevelEventTypes.TOP_COPY:
    case DOMTopLevelEventTypes.TOP_CUT:
    case DOMTopLevelEventTypes.TOP_PASTE:
      EventInterface = ClipboardEventInterface;
      break;
    case DOMTopLevelEventTypes.TOP_GOT_POINTER_CAPTURE:
    case DOMTopLevelEventTypes.TOP_LOST_POINTER_CAPTURE:
    case DOMTopLevelEventTypes.TOP_POINTER_CANCEL:
    case DOMTopLevelEventTypes.TOP_POINTER_DOWN:
    case DOMTopLevelEventTypes.TOP_POINTER_MOVE:
    case DOMTopLevelEventTypes.TOP_POINTER_OUT:
    case DOMTopLevelEventTypes.TOP_POINTER_OVER:
    case DOMTopLevelEventTypes.TOP_POINTER_UP:
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
    // When we encounter a non-delegated event in the capture phase,
    // we shouldn't emuluate capture bubbling. This is because we'll
    // add a native capture event listener to each element directly,
    // not the root, and native capture listeners always fire even
    // if the event doesn't bubble.
    const isNonDelegatedEvent = (eventSystemFlags & IS_NON_DELEGATED) !== 0;
    // TODO: We may also want to re-use the accumulateTargetOnly flag to
    // special case bubbling for onScroll/media events at a later point.
    const accumulateTargetOnly = inCapturePhase && isNonDelegatedEvent;

    // We traverse only capture or bubble phase listeners
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
