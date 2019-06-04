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
} from 'events/TopLevelEventTypes';
import type {
  DispatchConfig,
  ReactSyntheticEvent,
  EventPriority,
} from 'events/ReactSyntheticEventType';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {EventTypes, PluginModule} from 'events/PluginModuleType';

import {accumulateTwoPhaseDispatches} from 'events/EventPropagators';
import SyntheticEvent from 'events/SyntheticEvent';
import {
  DiscreteEvent,
  UserBlockingEvent,
  ContinuousEvent,
} from 'events/ReactSyntheticEventType';

import * as DOMTopLevelEventTypes from './DOMTopLevelEventTypes';
import warningWithoutStack from 'shared/warningWithoutStack';

import SyntheticAnimationEvent from './SyntheticAnimationEvent';
import SyntheticClipboardEvent from './SyntheticClipboardEvent';
import SyntheticFocusEvent from './SyntheticFocusEvent';
import SyntheticKeyboardEvent from './SyntheticKeyboardEvent';
import SyntheticMouseEvent from './SyntheticMouseEvent';
import SyntheticPointerEvent from './SyntheticPointerEvent';
import SyntheticDragEvent from './SyntheticDragEvent';
import SyntheticTouchEvent from './SyntheticTouchEvent';
import SyntheticTransitionEvent from './SyntheticTransitionEvent';
import SyntheticUIEvent from './SyntheticUIEvent';
import SyntheticWheelEvent from './SyntheticWheelEvent';
import getEventCharCode from './getEventCharCode';

/**
 * Turns
 * ['abort', ...]
 * into
 * eventTypes = {
 *   'abort': {
 *     phasedRegistrationNames: {
 *       bubbled: 'onAbort',
 *       captured: 'onAbortCapture',
 *     },
 *     dependencies: [TOP_ABORT],
 *   },
 *   ...
 * };
 * topLevelEventsToDispatchConfig = new Map([
 *   [TOP_ABORT, { sameConfig }],
 * ]);
 */

type EventTuple = [DOMTopLevelEventType, string, EventPriority];

const eventTuples: Array<EventTuple> = [
  // Discrete events
  [DOMTopLevelEventTypes.TOP_BLUR, 'blur', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_CANCEL, 'cancel', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_CLICK, 'click', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_CLOSE, 'close', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_CONTEXT_MENU, 'contextMenu', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_COPY, 'copy', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_CUT, 'cut', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_AUX_CLICK, 'auxClick', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_DOUBLE_CLICK, 'doubleClick', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_DRAG_END, 'dragEnd', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_DRAG_START, 'dragStart', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_DROP, 'drop', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_FOCUS, 'focus', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_INPUT, 'input', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_INVALID, 'invalid', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_KEY_DOWN, 'keyDown', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_KEY_PRESS, 'keyPress', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_KEY_UP, 'keyUp', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_MOUSE_DOWN, 'mouseDown', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_MOUSE_UP, 'mouseUp', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_PASTE, 'paste', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_PAUSE, 'pause', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_PLAY, 'play', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_POINTER_CANCEL, 'pointerCancel', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_POINTER_DOWN, 'pointerDown', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_POINTER_UP, 'pointerUp', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_RATE_CHANGE, 'rateChange', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_RESET, 'reset', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_SEEKED, 'seeked', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_SUBMIT, 'submit', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_TOUCH_CANCEL, 'touchCancel', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_TOUCH_END, 'touchEnd', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_TOUCH_START, 'touchStart', DiscreteEvent],
  [DOMTopLevelEventTypes.TOP_VOLUME_CHANGE, 'volumeChange', DiscreteEvent],

  // User-blocking events
  [DOMTopLevelEventTypes.TOP_DRAG, 'drag', UserBlockingEvent],
  [DOMTopLevelEventTypes.TOP_DRAG_ENTER, 'dragEnter', UserBlockingEvent],
  [DOMTopLevelEventTypes.TOP_DRAG_EXIT, 'dragExit', UserBlockingEvent],
  [DOMTopLevelEventTypes.TOP_DRAG_LEAVE, 'dragLeave', UserBlockingEvent],
  [DOMTopLevelEventTypes.TOP_DRAG_OVER, 'dragOver', UserBlockingEvent],
  [DOMTopLevelEventTypes.TOP_MOUSE_MOVE, 'mouseMove', UserBlockingEvent],
  [DOMTopLevelEventTypes.TOP_MOUSE_OUT, 'mouseOut', UserBlockingEvent],
  [DOMTopLevelEventTypes.TOP_MOUSE_OVER, 'mouseOver', UserBlockingEvent],
  [DOMTopLevelEventTypes.TOP_POINTER_MOVE, 'pointerMove', UserBlockingEvent],
  [DOMTopLevelEventTypes.TOP_POINTER_OUT, 'pointerOut', UserBlockingEvent],
  [DOMTopLevelEventTypes.TOP_POINTER_OVER, 'pointerOver', UserBlockingEvent],
  [DOMTopLevelEventTypes.TOP_SCROLL, 'scroll', UserBlockingEvent],
  [DOMTopLevelEventTypes.TOP_TOGGLE, 'toggle', UserBlockingEvent],
  [DOMTopLevelEventTypes.TOP_TOUCH_MOVE, 'touchMove', UserBlockingEvent],
  [DOMTopLevelEventTypes.TOP_WHEEL, 'wheel', UserBlockingEvent],

  // Continuous events
  [DOMTopLevelEventTypes.TOP_ABORT, 'abort', ContinuousEvent],
  [DOMTopLevelEventTypes.TOP_ANIMATION_END, 'animationEnd', ContinuousEvent],
  [
    DOMTopLevelEventTypes.TOP_ANIMATION_ITERATION,
    'animationIteration',
    ContinuousEvent,
  ],
  [
    DOMTopLevelEventTypes.TOP_ANIMATION_START,
    'animationStart',
    ContinuousEvent,
  ],
  [DOMTopLevelEventTypes.TOP_CAN_PLAY, 'canPlay', ContinuousEvent],
  [
    DOMTopLevelEventTypes.TOP_CAN_PLAY_THROUGH,
    'canPlayThrough',
    ContinuousEvent,
  ],
  [
    DOMTopLevelEventTypes.TOP_DURATION_CHANGE,
    'durationChange',
    ContinuousEvent,
  ],
  [DOMTopLevelEventTypes.TOP_EMPTIED, 'emptied', ContinuousEvent],
  [DOMTopLevelEventTypes.TOP_ENCRYPTED, 'encrypted', ContinuousEvent],
  [DOMTopLevelEventTypes.TOP_ENDED, 'ended', ContinuousEvent],
  [DOMTopLevelEventTypes.TOP_ERROR, 'error', ContinuousEvent],
  [
    DOMTopLevelEventTypes.TOP_GOT_POINTER_CAPTURE,
    'gotPointerCapture',
    ContinuousEvent,
  ],
  [DOMTopLevelEventTypes.TOP_LOAD, 'load', ContinuousEvent],
  [DOMTopLevelEventTypes.TOP_LOADED_DATA, 'loadedData', ContinuousEvent],
  [
    DOMTopLevelEventTypes.TOP_LOADED_METADATA,
    'loadedMetadata',
    ContinuousEvent,
  ],
  [DOMTopLevelEventTypes.TOP_LOAD_START, 'loadStart', ContinuousEvent],
  [
    DOMTopLevelEventTypes.TOP_LOST_POINTER_CAPTURE,
    'lostPointerCapture',
    ContinuousEvent,
  ],
  [DOMTopLevelEventTypes.TOP_PLAYING, 'playing', ContinuousEvent],
  [DOMTopLevelEventTypes.TOP_PROGRESS, 'progress', ContinuousEvent],
  [DOMTopLevelEventTypes.TOP_SEEKING, 'seeking', ContinuousEvent],
  [DOMTopLevelEventTypes.TOP_STALLED, 'stalled', ContinuousEvent],
  [DOMTopLevelEventTypes.TOP_SUSPEND, 'suspend', ContinuousEvent],
  [DOMTopLevelEventTypes.TOP_TIME_UPDATE, 'timeUpdate', ContinuousEvent],
  [DOMTopLevelEventTypes.TOP_TRANSITION_END, 'transitionEnd', ContinuousEvent],
  [DOMTopLevelEventTypes.TOP_WAITING, 'waiting', ContinuousEvent],
];

const eventTypes: EventTypes = {};
const topLevelEventsToDispatchConfig: {
  [key: TopLevelType]: DispatchConfig,
} = {};

for (let i = 0; i < eventTuples.length; i++) {
  const eventTuple = eventTuples[i];
  const topEvent = eventTuple[0];
  const event = eventTuple[1];
  const eventPriority = eventTuple[2];

  const capitalizedEvent = event[0].toUpperCase() + event.slice(1);
  const onEvent = 'on' + capitalizedEvent;

  const config = {
    phasedRegistrationNames: {
      bubbled: onEvent,
      captured: onEvent + 'Capture',
    },
    dependencies: [topEvent],
    eventPriority,
  };
  eventTypes[event] = config;
  topLevelEventsToDispatchConfig[topEvent] = config;
}

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

const SimpleEventPlugin: PluginModule<MouseEvent> & {
  getEventPriority: (topLevelType: TopLevelType) => EventPriority,
} = {
  eventTypes: eventTypes,

  getEventPriority(topLevelType: TopLevelType): EventPriority {
    const config = topLevelEventsToDispatchConfig[topLevelType];
    return config !== undefined ? config.eventPriority : ContinuousEvent;
  },

  extractEvents: function(
    topLevelType: TopLevelType,
    targetInst: null | Fiber,
    nativeEvent: MouseEvent,
    nativeEventTarget: EventTarget,
  ): null | ReactSyntheticEvent {
    const dispatchConfig = topLevelEventsToDispatchConfig[topLevelType];
    if (!dispatchConfig) {
      return null;
    }
    let EventConstructor;
    switch (topLevelType) {
      case DOMTopLevelEventTypes.TOP_KEY_PRESS:
        // Firefox creates a keypress event for function keys too. This removes
        // the unwanted keypress events. Enter is however both printable and
        // non-printable. One would expect Tab to be as well (but it isn't).
        if (getEventCharCode(nativeEvent) === 0) {
          return null;
        }
      /* falls through */
      case DOMTopLevelEventTypes.TOP_KEY_DOWN:
      case DOMTopLevelEventTypes.TOP_KEY_UP:
        EventConstructor = SyntheticKeyboardEvent;
        break;
      case DOMTopLevelEventTypes.TOP_BLUR:
      case DOMTopLevelEventTypes.TOP_FOCUS:
        EventConstructor = SyntheticFocusEvent;
        break;
      case DOMTopLevelEventTypes.TOP_CLICK:
        // Firefox creates a click event on right mouse clicks. This removes the
        // unwanted click events.
        if (nativeEvent.button === 2) {
          return null;
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
          if (knownHTMLTopLevelTypes.indexOf(topLevelType) === -1) {
            warningWithoutStack(
              false,
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
      targetInst,
      nativeEvent,
      nativeEventTarget,
    );
    accumulateTwoPhaseDispatches(event);
    return event;
  },
};

export default SimpleEventPlugin;
