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
import type {
  AnyNativeEvent,
  DispatchQueue,
} from '../../events/PluginModuleType';
import type {EventSystemFlags} from '../EventSystemFlags';

import SyntheticEvent from '../../events/SyntheticEvent';

import * as DOMTopLevelEventTypes from '../DOMTopLevelEventTypes';
import {
  topLevelEventsToReactNames,
  registerSimpleEvents,
} from '../DOMEventProperties';
import {
  accumulateSinglePhaseListeners,
  accumulateEventHandleTargetListeners,
} from '../DOMModernPluginEventSystem';
import {IS_TARGET_PHASE_ONLY} from '../EventSystemFlags';
import SyntheticAnimationEvent from '../SyntheticAnimationEvent';
import SyntheticClipboardEvent from '../SyntheticClipboardEvent';
import SyntheticFocusEvent from '../SyntheticFocusEvent';
import SyntheticKeyboardEvent from '../SyntheticKeyboardEvent';
import SyntheticMouseEvent from '../SyntheticMouseEvent';
import SyntheticPointerEvent from '../SyntheticPointerEvent';
import SyntheticDragEvent from '../SyntheticDragEvent';
import SyntheticTouchEvent from '../SyntheticTouchEvent';
import SyntheticTransitionEvent from '../SyntheticTransitionEvent';
import SyntheticUIEvent from '../SyntheticUIEvent';
import SyntheticWheelEvent from '../SyntheticWheelEvent';
import getEventCharCode from '../getEventCharCode';
import {IS_CAPTURE_PHASE} from '../EventSystemFlags';

import {enableCreateEventHandleAPI} from 'shared/ReactFeatureFlags';

function extractEvents(
  dispatchQueue: DispatchQueue,
  topLevelType: TopLevelType,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: null | EventTarget,
): void {
  const reactName = topLevelEventsToReactNames.get(topLevelType);
  if (reactName === undefined) {
    return;
  }
  let EventConstructor;
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
      EventConstructor = SyntheticKeyboardEvent;
      break;
    case DOMTopLevelEventTypes.TOP_BLUR:
    case DOMTopLevelEventTypes.TOP_FOCUS:
    case DOMTopLevelEventTypes.TOP_BEFORE_BLUR:
    case DOMTopLevelEventTypes.TOP_AFTER_BLUR:
      EventConstructor = SyntheticFocusEvent;
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
      EventConstructor = SyntheticMouseEvent;
      break;
    case DOMTopLevelEventTypes.TOP_DRAG:
    case DOMTopLevelEventTypes.TOP_DRAG_END:
    case DOMTopLevelEventTypes.TOP_DRAG_ENTER:
    case DOMTopLevelEventTypes.TOP_DRAG_EXIT:
    case DOMTopLevelEventTypes.TOP_DRAG_LEAVE:
    case DOMTopLevelEventTypes.TOP_DRAG_OVER:
    case DOMTopLevelEventTypes.TOP_DRAG_START:
    case DOMTopLevelEventTypes.TOP_DROP:
      EventConstructor = SyntheticDragEvent;
      break;
    case DOMTopLevelEventTypes.TOP_TOUCH_CANCEL:
    case DOMTopLevelEventTypes.TOP_TOUCH_END:
    case DOMTopLevelEventTypes.TOP_TOUCH_MOVE:
    case DOMTopLevelEventTypes.TOP_TOUCH_START:
      EventConstructor = SyntheticTouchEvent;
      break;
    case DOMTopLevelEventTypes.TOP_ANIMATION_END:
    case DOMTopLevelEventTypes.TOP_ANIMATION_ITERATION:
    case DOMTopLevelEventTypes.TOP_ANIMATION_START:
      EventConstructor = SyntheticAnimationEvent;
      break;
    case DOMTopLevelEventTypes.TOP_TRANSITION_END:
      EventConstructor = SyntheticTransitionEvent;
      break;
    case DOMTopLevelEventTypes.TOP_SCROLL:
      EventConstructor = SyntheticUIEvent;
      break;
    case DOMTopLevelEventTypes.TOP_WHEEL:
      EventConstructor = SyntheticWheelEvent;
      break;
    case DOMTopLevelEventTypes.TOP_COPY:
    case DOMTopLevelEventTypes.TOP_CUT:
    case DOMTopLevelEventTypes.TOP_PASTE:
      EventConstructor = SyntheticClipboardEvent;
      break;
    case DOMTopLevelEventTypes.TOP_GOT_POINTER_CAPTURE:
    case DOMTopLevelEventTypes.TOP_LOST_POINTER_CAPTURE:
    case DOMTopLevelEventTypes.TOP_POINTER_CANCEL:
    case DOMTopLevelEventTypes.TOP_POINTER_DOWN:
    case DOMTopLevelEventTypes.TOP_POINTER_MOVE:
    case DOMTopLevelEventTypes.TOP_POINTER_OUT:
    case DOMTopLevelEventTypes.TOP_POINTER_OVER:
    case DOMTopLevelEventTypes.TOP_POINTER_UP:
      EventConstructor = SyntheticPointerEvent;
      break;
    default:
      // Unknown event. This is used by createEventHandle.
      EventConstructor = SyntheticEvent;
      break;
  }
  const event = new EventConstructor(
    reactName,
    null,
    nativeEvent,
    nativeEventTarget,
  );

  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  if (
    enableCreateEventHandleAPI &&
    eventSystemFlags !== undefined &&
    eventSystemFlags & IS_TARGET_PHASE_ONLY &&
    targetContainer != null
  ) {
    accumulateEventHandleTargetListeners(
      dispatchQueue,
      event,
      targetContainer,
      inCapturePhase,
    );
  } else {
    // We traverse only capture or bubble phase listeners
    accumulateSinglePhaseListeners(
      targetInst,
      dispatchQueue,
      event,
      inCapturePhase,
    );
  }
  return event;
}

export {registerSimpleEvents as registerEvents, extractEvents};
