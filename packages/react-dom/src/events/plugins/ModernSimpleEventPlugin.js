/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  TopLevelType,
  DOMTopLevelEventType,
} from 'legacy-events/TopLevelEventTypes';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {
  ModernPluginModule,
  DispatchQueue,
} from 'legacy-events/PluginModuleType';
import type {EventSystemFlags} from '../EventSystemFlags';

import SyntheticEvent from 'legacy-events/SyntheticEvent';

import * as DOMTopLevelEventTypes from '../DOMTopLevelEventTypes';
import {
  topLevelEventsToDispatchConfig,
  simpleEventPluginEventTypes,
} from '../DOMEventProperties';
import {
  accumulateTwoPhaseListeners,
  accumulateEventTargetListeners,
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

import {enableCreateEventHandleAPI} from 'shared/ReactFeatureFlags';

// Only used in DEV for exhaustiveness validation.
const knownHTMLTopLevelTypes: Array<DOMTopLevelEventType> = [
  DOMTopLevelEventTypes.TOP_ABORT,
  DOMTopLevelEventTypes.TOP_CANCEL,
  DOMTopLevelEventTypes.TOP_CAN_PLAY,
  DOMTopLevelEventTypes.TOP_CAN_PLAY_THROUGH,
  DOMTopLevelEventTypes.TOP_CLOSE,
  DOMTopLevelEventTypes.TOP_DURATION_CHANGE,
  DOMTopLevelEventTypes.TOP_EMPTIED,
  DOMTopLevelEventTypes.TOP_ENCRYPTED,
  DOMTopLevelEventTypes.TOP_ENDED,
  DOMTopLevelEventTypes.TOP_ERROR,
  DOMTopLevelEventTypes.TOP_INPUT,
  DOMTopLevelEventTypes.TOP_INVALID,
  DOMTopLevelEventTypes.TOP_LOAD,
  DOMTopLevelEventTypes.TOP_LOADED_DATA,
  DOMTopLevelEventTypes.TOP_LOADED_METADATA,
  DOMTopLevelEventTypes.TOP_LOAD_START,
  DOMTopLevelEventTypes.TOP_PAUSE,
  DOMTopLevelEventTypes.TOP_PLAY,
  DOMTopLevelEventTypes.TOP_PLAYING,
  DOMTopLevelEventTypes.TOP_PROGRESS,
  DOMTopLevelEventTypes.TOP_RATE_CHANGE,
  DOMTopLevelEventTypes.TOP_RESET,
  DOMTopLevelEventTypes.TOP_SEEKED,
  DOMTopLevelEventTypes.TOP_SEEKING,
  DOMTopLevelEventTypes.TOP_STALLED,
  DOMTopLevelEventTypes.TOP_SUBMIT,
  DOMTopLevelEventTypes.TOP_SUSPEND,
  DOMTopLevelEventTypes.TOP_TIME_UPDATE,
  DOMTopLevelEventTypes.TOP_TOGGLE,
  DOMTopLevelEventTypes.TOP_VOLUME_CHANGE,
  DOMTopLevelEventTypes.TOP_WAITING,
];

const SimpleEventPlugin: ModernPluginModule<MouseEvent> = {
  // simpleEventPluginEventTypes gets populated from
  // the DOMEventProperties module.
  eventTypes: simpleEventPluginEventTypes,
  extractEvents: function(
    dispatchQueue: DispatchQueue,
    topLevelType: TopLevelType,
    targetInst: null | Fiber,
    nativeEvent: MouseEvent,
    nativeEventTarget: null | EventTarget,
    eventSystemFlags: EventSystemFlags,
    targetContainer: null | EventTarget,
  ): void {
    const dispatchConfig = topLevelEventsToDispatchConfig.get(topLevelType);
    if (!dispatchConfig) {
      return;
    }
    let EventConstructor;
    switch (topLevelType) {
      case DOMTopLevelEventTypes.TOP_KEY_PRESS:
        // Firefox creates a keypress event for function keys too. This removes
        // the unwanted keypress events. Enter is however both printable and
        // non-printable. One would expect Tab to be as well (but it isn't).
        if (getEventCharCode(nativeEvent) === 0) {
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
        if (__DEV__) {
          if (
            knownHTMLTopLevelTypes.indexOf(topLevelType) === -1 &&
            dispatchConfig.customEvent !== true
          ) {
            console.error(
              'SimpleEventPlugin: Unhandled event type, `%s`. This warning ' +
                'is likely caused by a bug in React. Please file an issue.',
              topLevelType,
            );
          }
        }
        // HTML Events
        // @see http://www.w3.org/TR/html5/index.html#events-0
        EventConstructor = SyntheticEvent;
        break;
    }
    const event = EventConstructor.getPooled(
      dispatchConfig,
      null,
      nativeEvent,
      nativeEventTarget,
    );

    if (
      enableCreateEventHandleAPI &&
      eventSystemFlags !== undefined &&
      eventSystemFlags & IS_TARGET_PHASE_ONLY &&
      targetContainer != null
    ) {
      accumulateEventTargetListeners(dispatchQueue, event, targetContainer);
    } else {
      accumulateTwoPhaseListeners(targetInst, dispatchQueue, event, true);
    }
    return event;
  },
};

export default SimpleEventPlugin;
