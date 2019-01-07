/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {traverseTwoPhase} from './ReactFireEventTraversal';
import type {ProxyContext} from './ReactFireEvents';
import {
  BLUR,
  CLICK,
  FOCUS,
  KEY_PRESS,
  KEY_UP,
  KEY_DOWN,
  PASTE,
  POINTER_UP,
  CONTEXT_MENU,
  AUX_CLICK,
  DOUBLE_CLICK,
  MOUSE_OVER,
  MOUSE_OUT,
  MOUSE_DOWN,
  MOUSE_MOVE,
  MOUSE_UP,
  DRAG,
  DRAG_END,
  DRAG_ENTER,
  DRAG_EXIT,
  DRAG_LEAVE,
  DRAG_OVER,
  DRAG_START,
  DROP,
  SCROLL,
  WHEEL,
  TOUCH_CANCEL,
  TOUCH_END,
  TOUCH_MOVE,
  TOUCH_START,
  ANIMATION_END,
  ANIMATION_ITERATION,
  ANIMATION_START,
  TRANSITION_END,
  COPY,
  CUT,
  GOT_POINTER_CAPTURE,
  LOST_POINTER_CAPTURE,
  POINTER_CANCEL,
  POINTER_OVER,
  POINTER_OUT,
  POINTER_MOVE,
  POINTER_DOWN,
  ABORT,
  CANCEL,
  CAN_PLAY,
  CAN_PLAY_THROUGH,
  CLOSE,
  DURATION_CHANGE,
  EMPTIED,
  ENCRYPTED,
  ENDED,
  ERROR,
  INPUT,
  INVALID,
  LOAD,
  LOADED_DATA,
  LOADED_METADATA,
  LOAD_START,
  PAUSE,
  PLAY,
  PLAYING,
  PROGRESS,
  RATE_CHANGE,
  RESET,
  SEEKED,
  SEEKING,
  STALLED,
  SUBMIT,
  SUSPEND,
  TIME_UPDATE,
  TOGGLE,
  VOLUME_CHANGE,
  WAITING,
} from './ReactFireEventTypes';
import {
  mediaEventTypes,
  interactiveEvents,
  nonInteractiveEvents,
} from './ReactFireEventTypes';
import {getEventCharCode} from '../ReactFireUtils';
import {
  getPooledSyntheticEvent,
  SyntheticEvent,
} from './synthetic/ReactFireSyntheticEvent';
import {SyntheticKeyboardEvent} from './synthetic/ReactFireSyntheticKeyboardEvent';
import {SyntheticUIEvent} from './synthetic/ReactFireSyntheticUIEvent';
import {SyntheticFocusEvent} from './synthetic/ReactFireSyntheticFocusEvent';
import {SyntheticMouseEvent} from './synthetic/ReactFireSyntheticMouseEvent';
import {SyntheticAnimationEvent} from './synthetic/ReactFireSyntheticAnimationEvent';
import {SyntheticTransitionEvent} from './synthetic/ReactFireSyntheticTransitionEvent';
import {SyntheticPointerEvent} from './synthetic/ReactFireSyntheticPointerEvent';
import {SyntheticDragEvent} from './synthetic/ReactFireSyntheticDragEvent';
import {SyntheticWheelEvent} from './synthetic/ReactFireSyntheticWheelEvent';
import {SyntheticClipboardEvent} from './synthetic/ReactFireSyntheticClipboardEvent';
import {SyntheticTouchEvent} from './synthetic/ReactFireSyntheticTouchEvent';

import warningWithoutStack from 'shared/warningWithoutStack';

let knownHTMLTopLevelTypes;

if (__DEV__) {
  knownHTMLTopLevelTypes = [
    ABORT,
    CANCEL,
    CAN_PLAY,
    CAN_PLAY_THROUGH,
    CLOSE,
    DURATION_CHANGE,
    EMPTIED,
    ENCRYPTED,
    ENDED,
    ERROR,
    INPUT,
    INVALID,
    LOAD,
    LOADED_DATA,
    LOADED_METADATA,
    LOAD_START,
    PAUSE,
    PLAY,
    PLAYING,
    PROGRESS,
    RATE_CHANGE,
    RESET,
    SEEKED,
    SEEKING,
    STALLED,
    SUBMIT,
    SUSPEND,
    TIME_UPDATE,
    TOGGLE,
    VOLUME_CHANGE,
    WAITING,
  ];
}

export function dispatchSimpleEvent(
  eventName: string,
  nativeEvent: Event,
  proxyContext: ProxyContext,
) {
  if (
    !nonInteractiveEvents.has(eventName) &&
    !interactiveEvents.has(eventName) &&
    !mediaEventTypes.has(eventName)
  ) {
    return null;
  }
  let SyntheticEventConstructor;
  switch (eventName) {
    case KEY_PRESS:
      // Firefox creates a keypress event for function keys too. This removes
      // the unwanted keypress events. Enter is however both printable and
      // non-printable. One would expect Tab to be as well (but it isn't).
      if (getEventCharCode(nativeEvent) === 0) {
        return null;
      }
    /* falls through */
    case KEY_DOWN:
    case KEY_UP:
      SyntheticEventConstructor = SyntheticKeyboardEvent;
      break;
    case BLUR:
    case FOCUS:
      SyntheticEventConstructor = SyntheticFocusEvent;
      break;
    case CLICK:
      // Firefox creates a click event on right mouse clicks. This removes the
      // unwanted click events.
      if ((nativeEvent: any).button === 2) {
        return null;
      }
    /* falls through */
    case AUX_CLICK:
    case DOUBLE_CLICK:
    case MOUSE_DOWN:
    case MOUSE_MOVE:
    case MOUSE_UP:
    // TODO: Disabled elements should not respond to mouse events
    /* falls through */
    case MOUSE_OUT:
    case MOUSE_OVER:
    case CONTEXT_MENU:
      SyntheticEventConstructor = SyntheticMouseEvent;
      break;
    case DRAG:
    case DRAG_END:
    case DRAG_ENTER:
    case DRAG_EXIT:
    case DRAG_LEAVE:
    case DRAG_OVER:
    case DRAG_START:
    case DROP:
      SyntheticEventConstructor = SyntheticDragEvent;
      break;
    case TOUCH_CANCEL:
    case TOUCH_END:
    case TOUCH_MOVE:
    case TOUCH_START:
      SyntheticEventConstructor = SyntheticTouchEvent;
      break;
    case ANIMATION_END:
    case ANIMATION_ITERATION:
    case ANIMATION_START:
      SyntheticEventConstructor = SyntheticAnimationEvent;
      break;
    case TRANSITION_END:
      SyntheticEventConstructor = SyntheticTransitionEvent;
      break;
    case SCROLL:
      SyntheticEventConstructor = SyntheticUIEvent;
      break;
    case WHEEL:
      SyntheticEventConstructor = SyntheticWheelEvent;
      break;
    case COPY:
    case CUT:
    case PASTE:
      SyntheticEventConstructor = SyntheticClipboardEvent;
      break;
    case GOT_POINTER_CAPTURE:
    case LOST_POINTER_CAPTURE:
    case POINTER_CANCEL:
    case POINTER_DOWN:
    case POINTER_MOVE:
    case POINTER_OUT:
    case POINTER_OVER:
    case POINTER_UP:
      SyntheticEventConstructor = SyntheticPointerEvent;
      break;
    default:
      if (__DEV__) {
        if (knownHTMLTopLevelTypes.indexOf(eventName) === -1) {
          warningWithoutStack(
            false,
            'ReactFireSimpleEvents: Unhandled event type, `%s`. This warning ' +
              'is likely caused by a bug in React. Please file an issue.',
            eventName,
          );
        }
      }
      // HTML Events
      // @see http://www.w3.org/TR/html5/index.html#events-0
      SyntheticEventConstructor = SyntheticEvent;
      break;
  }
  const syntheticEvent = getPooledSyntheticEvent(
    SyntheticEventConstructor,
    nativeEvent,
    proxyContext,
  );
  traverseTwoPhase(syntheticEvent, proxyContext);
}
