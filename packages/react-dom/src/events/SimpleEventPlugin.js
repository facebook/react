/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TopLevelTypes} from 'events/TopLevelEventTypes';
import type {
  DispatchConfig,
  ReactSyntheticEvent,
} from 'events/ReactSyntheticEventType';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {EventTypes, PluginModule} from 'events/PluginModuleType';

import {accumulateTwoPhaseDispatches} from 'events/EventPropagators';
import SyntheticEvent from 'events/SyntheticEvent';

import * as TopLevelEventTypes from 'events/TopLevelEventTypes';
import warning from 'fbjs/lib/warning';

import SyntheticAnimationEvent from './SyntheticAnimationEvent';
import SyntheticClipboardEvent from './SyntheticClipboardEvent';
import SyntheticFocusEvent from './SyntheticFocusEvent';
import SyntheticKeyboardEvent from './SyntheticKeyboardEvent';
import SyntheticMouseEvent from './SyntheticMouseEvent';
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
type EventTuple = [TopLevelTypes, string];
const interactiveEventTypeNames: Array<EventTuple> = [
  [TopLevelEventTypes.TOP_BLUR, 'blur'],
  [TopLevelEventTypes.TOP_CANCEL, 'cancel'],
  [TopLevelEventTypes.TOP_CLICK, 'click'],
  [TopLevelEventTypes.TOP_CLOSE, 'close'],
  [TopLevelEventTypes.TOP_CONTEXT_MENU, 'contextMenu'],
  [TopLevelEventTypes.TOP_COPY, 'copy'],
  [TopLevelEventTypes.TOP_CUT, 'cut'],
  [TopLevelEventTypes.TOP_DOUBLE_CLICK, 'doubleClick'],
  [TopLevelEventTypes.TOP_DRAG_END, 'dragEnd'],
  [TopLevelEventTypes.TOP_DRAG_START, 'dragStart'],
  [TopLevelEventTypes.TOP_DROP, 'drop'],
  [TopLevelEventTypes.TOP_FOCUS, 'focus'],
  [TopLevelEventTypes.TOP_INPUT, 'input'],
  [TopLevelEventTypes.TOP_INVALID, 'invalid'],
  [TopLevelEventTypes.TOP_KEY_DOWN, 'keyDown'],
  [TopLevelEventTypes.TOP_KEY_PRESS, 'keyPress'],
  [TopLevelEventTypes.TOP_KEY_UP, 'keyUp'],
  [TopLevelEventTypes.TOP_MOUSE_DOWN, 'mouseDown'],
  [TopLevelEventTypes.TOP_MOUSE_UP, 'mouseUp'],
  [TopLevelEventTypes.TOP_PASTE, 'paste'],
  [TopLevelEventTypes.TOP_PAUSE, 'pause'],
  [TopLevelEventTypes.TOP_PLAY, 'play'],
  [TopLevelEventTypes.TOP_RATE_CHANGE, 'rateChange'],
  [TopLevelEventTypes.TOP_RESET, 'reset'],
  [TopLevelEventTypes.TOP_SEEKED, 'seeked'],
  [TopLevelEventTypes.TOP_SUBMIT, 'submit'],
  [TopLevelEventTypes.TOP_TOUCH_CANCEL, 'touchCancel'],
  [TopLevelEventTypes.TOP_TOUCH_END, 'touchEnd'],
  [TopLevelEventTypes.TOP_TOUCH_START, 'touchStart'],
  [TopLevelEventTypes.TOP_VOLUME_CHANGE, 'volumeChange'],
];
const nonInteractiveEventTypeNames: Array<EventTuple> = [
  [TopLevelEventTypes.TOP_ABORT, 'abort'],
  [TopLevelEventTypes.TOP_ANIMATION_END, 'animationEnd'],
  [TopLevelEventTypes.TOP_ANIMATION_ITERATION, 'animationIteration'],
  [TopLevelEventTypes.TOP_ANIMATION_START, 'animationStart'],
  [TopLevelEventTypes.TOP_CAN_PLAY, 'canPlay'],
  [TopLevelEventTypes.TOP_CAN_PLAY_THROUGH, 'canPlayThrough'],
  [TopLevelEventTypes.TOP_DRAG, 'drag'],
  [TopLevelEventTypes.TOP_DRAG_ENTER, 'dragEnter'],
  [TopLevelEventTypes.TOP_DRAG_EXIT, 'dragExit'],
  [TopLevelEventTypes.TOP_DRAG_LEAVE, 'dragLeave'],
  [TopLevelEventTypes.TOP_DRAG_OVER, 'dragOver'],
  [TopLevelEventTypes.TOP_DURATION_CHANGE, 'durationChange'],
  [TopLevelEventTypes.TOP_EMPTIED, 'emptied'],
  [TopLevelEventTypes.TOP_ENCRYPTED, 'encrypted'],
  [TopLevelEventTypes.TOP_ENDED, 'ended'],
  [TopLevelEventTypes.TOP_ERROR, 'error'],
  [TopLevelEventTypes.TOP_LOAD, 'load'],
  [TopLevelEventTypes.TOP_LOADED_DATA, 'loadedData'],
  [TopLevelEventTypes.TOP_LOADED_METADATA, 'loadedMetadata'],
  [TopLevelEventTypes.TOP_LOAD_START, 'loadStart'],
  [TopLevelEventTypes.TOP_MOUSE_MOVE, 'mouseMove'],
  [TopLevelEventTypes.TOP_MOUSE_OUT, 'mouseOut'],
  [TopLevelEventTypes.TOP_MOUSE_OVER, 'mouseOver'],
  [TopLevelEventTypes.TOP_PLAYING, 'playing'],
  [TopLevelEventTypes.TOP_PROGRESS, 'progress'],
  [TopLevelEventTypes.TOP_SCROLL, 'scroll'],
  [TopLevelEventTypes.TOP_SEEKING, 'seeking'],
  [TopLevelEventTypes.TOP_STALLED, 'stalled'],
  [TopLevelEventTypes.TOP_SUSPEND, 'suspend'],
  [TopLevelEventTypes.TOP_TIME_UPDATE, 'timeUpdate'],
  [TopLevelEventTypes.TOP_TOGGLE, 'toggle'],
  [TopLevelEventTypes.TOP_TOUCH_MOVE, 'touchMove'],
  [TopLevelEventTypes.TOP_TRANSITION_END, 'transitionEnd'],
  [TopLevelEventTypes.TOP_WAITING, 'waiting'],
  [TopLevelEventTypes.TOP_WHEEL, 'wheel'],
];

const eventTypes: EventTypes = {};
const topLevelEventsToDispatchConfig: Map<TopLevelTypes, DispatchConfig> = new Map();

function addEventTypeNameToConfig(eventTuple: EventTuple, isInteractive: boolean) {
  const topEvent = eventTuple[0];
  const event = eventTuple[1];
  const capitalizedEvent = event[0].toUpperCase() + event.slice(1);
  const onEvent = 'on' + capitalizedEvent;

  const type = {
    phasedRegistrationNames: {
      bubbled: onEvent,
      captured: onEvent + 'Capture',
    },
    dependencies: [topEvent],
    isInteractive,
  };
  eventTypes[event] = type;
  topLevelEventsToDispatchConfig.set(topEvent, type);
}

interactiveEventTypeNames.forEach(eventTuple => {
  addEventTypeNameToConfig(eventTuple, true);
});
nonInteractiveEventTypeNames.forEach(eventTuple => {
  addEventTypeNameToConfig(eventTuple, false);
});

// Only used in DEV for exhaustiveness validation.
const knownHTMLTopLevelTypes: Array<TopLevelTypes> = [
  TopLevelEventTypes.TOP_ABORT,
  TopLevelEventTypes.TOP_CANCEL,
  TopLevelEventTypes.TOP_CAN_PLAY,
  TopLevelEventTypes.TOP_CAN_PLAY_THROUGH,
  TopLevelEventTypes.TOP_CLOSE,
  TopLevelEventTypes.TOP_DURATION_CHANGE,
  TopLevelEventTypes.TOP_EMPTIED,
  TopLevelEventTypes.TOP_ENCRYPTED,
  TopLevelEventTypes.TOP_ENDED,
  TopLevelEventTypes.TOP_ERROR,
  TopLevelEventTypes.TOP_INPUT,
  TopLevelEventTypes.TOP_INVALID,
  TopLevelEventTypes.TOP_LOAD,
  TopLevelEventTypes.TOP_LOADED_DATA,
  TopLevelEventTypes.TOP_LOADED_METADATA,
  TopLevelEventTypes.TOP_LOAD_START,
  TopLevelEventTypes.TOP_PAUSE,
  TopLevelEventTypes.TOP_PLAY,
  TopLevelEventTypes.TOP_PLAYING,
  TopLevelEventTypes.TOP_PROGRESS,
  TopLevelEventTypes.TOP_RATE_CHANGE,
  TopLevelEventTypes.TOP_RESET,
  TopLevelEventTypes.TOP_SEEKED,
  TopLevelEventTypes.TOP_SEEKING,
  TopLevelEventTypes.TOP_STALLED,
  TopLevelEventTypes.TOP_SUBMIT,
  TopLevelEventTypes.TOP_SUSPEND,
  TopLevelEventTypes.TOP_TIME_UPDATE,
  TopLevelEventTypes.TOP_TOGGLE,
  TopLevelEventTypes.TOP_VOLUME_CHANGE,
  TopLevelEventTypes.TOP_WAITING,
];

const SimpleEventPlugin: PluginModule<MouseEvent> = {
  eventTypes: eventTypes,

  isInteractiveTopLevelEventType(topLevelType: TopLevelTypes): boolean {
    const config = topLevelEventsToDispatchConfig.get(topLevelType);
    return config !== undefined && config.isInteractive === true;
  },

  extractEvents: function(
    topLevelType: TopLevelTypes,
    targetInst: Fiber,
    nativeEvent: MouseEvent,
    nativeEventTarget: EventTarget,
  ): null | ReactSyntheticEvent {
    const dispatchConfig = topLevelEventsToDispatchConfig.get(topLevelType);
    if (!dispatchConfig) {
      return null;
    }
    let EventConstructor;
    switch (topLevelType) {
      case TopLevelEventTypes.TOP_KEY_PRESS:
        // Firefox creates a keypress event for function keys too. This removes
        // the unwanted keypress events. Enter is however both printable and
        // non-printable. One would expect Tab to be as well (but it isn't).
        if (getEventCharCode(nativeEvent) === 0) {
          return null;
        }
      /* falls through */
      case TopLevelEventTypes.TOP_KEY_DOWN:
      case TopLevelEventTypes.TOP_KEY_UP:
        EventConstructor = SyntheticKeyboardEvent;
        break;
      case TopLevelEventTypes.TOP_BLUR:
      case TopLevelEventTypes.TOP_FOCUS:
        EventConstructor = SyntheticFocusEvent;
        break;
      case TopLevelEventTypes.TOP_CLICK:
        // Firefox creates a click event on right mouse clicks. This removes the
        // unwanted click events.
        if (nativeEvent.button === 2) {
          return null;
        }
      /* falls through */
      case TopLevelEventTypes.TOP_DOUBLE_CLICK:
      case TopLevelEventTypes.TOP_MOUSE_DOWN:
      case TopLevelEventTypes.TOP_MOUSE_MOVE:
      case TopLevelEventTypes.TOP_MOUSE_UP:
      // TODO: Disabled elements should not respond to mouse events
      /* falls through */
      case TopLevelEventTypes.TOP_MOUSE_OUT:
      case TopLevelEventTypes.TOP_MOUSE_OVER:
      case TopLevelEventTypes.TOP_CONTEXT_MENU:
        EventConstructor = SyntheticMouseEvent;
        break;
      case TopLevelEventTypes.TOP_DRAG:
      case TopLevelEventTypes.TOP_DRAG_END:
      case TopLevelEventTypes.TOP_DRAG_ENTER:
      case TopLevelEventTypes.TOP_DRAG_EXIT:
      case TopLevelEventTypes.TOP_DRAG_LEAVE:
      case TopLevelEventTypes.TOP_DRAG_OVER:
      case TopLevelEventTypes.TOP_DRAG_START:
      case TopLevelEventTypes.TOP_DROP:
        EventConstructor = SyntheticDragEvent;
        break;
      case TopLevelEventTypes.TOP_TOUCH_CANCEL:
      case TopLevelEventTypes.TOP_TOUCH_END:
      case TopLevelEventTypes.TOP_TOUCH_MOVE:
      case TopLevelEventTypes.TOP_TOUCH_START:
        EventConstructor = SyntheticTouchEvent;
        break;
      case TopLevelEventTypes.TOP_ANIMATION_END:
      case TopLevelEventTypes.TOP_ANIMATION_ITERATION:
      case TopLevelEventTypes.TOP_ANIMATION_START:
        EventConstructor = SyntheticAnimationEvent;
        break;
      case TopLevelEventTypes.TOP_TRANSITION_END:
        EventConstructor = SyntheticTransitionEvent;
        break;
      case TopLevelEventTypes.TOP_SCROLL:
        EventConstructor = SyntheticUIEvent;
        break;
      case TopLevelEventTypes.TOP_WHEEL:
        EventConstructor = SyntheticWheelEvent;
        break;
      case TopLevelEventTypes.TOP_COPY:
      case TopLevelEventTypes.TOP_CUT:
      case TopLevelEventTypes.TOP_PASTE:
        EventConstructor = SyntheticClipboardEvent;
        break;
      default:
        if (__DEV__) {
          if (knownHTMLTopLevelTypes.indexOf(topLevelType) === -1) {
            warning(
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
