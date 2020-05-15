/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventPriority} from 'shared/ReactTypes';
import type {
  TopLevelType,
  DOMTopLevelEventType,
} from 'legacy-events/TopLevelEventTypes';
import type {
  DispatchConfig,
  CustomDispatchConfig,
} from 'legacy-events/ReactSyntheticEventType';

import * as DOMTopLevelEventTypes from './DOMTopLevelEventTypes';
import {
  DiscreteEvent,
  UserBlockingEvent,
  ContinuousEvent,
} from 'shared/ReactTypes';

import {enableCreateEventHandleAPI} from 'shared/ReactFeatureFlags';

// Needed for SimpleEventPlugin, rather than
// do it in two places, which duplicates logic
// and increases the bundle size, we do it all
// here once. If we remove or refactor the
// SimpleEventPlugin, we should also remove or
// update the below line.
export const simpleEventPluginEventTypes = {};

export const topLevelEventsToDispatchConfig: Map<
  TopLevelType,
  DispatchConfig | CustomDispatchConfig,
> = new Map();

const eventPriorities = new Map();

// We store most of the events in this module in pairs of two strings so we can re-use
// the code required to apply the same logic for event prioritization and that of the
// SimpleEventPlugin. This complicates things slightly, but the aim is to reduce code
// duplication (for which there would be quite a bit). For the events that are not needed
// for the SimpleEventPlugin (otherDiscreteEvents) we process them separately as an
// array of top level events.

// Lastly, we ignore prettier so we can keep the formatting sane.

// prettier-ignore
const discreteEventPairsForSimpleEventPlugin = [
  DOMTopLevelEventTypes.TOP_BLUR, 'blur',
  DOMTopLevelEventTypes.TOP_CANCEL, 'cancel',
  DOMTopLevelEventTypes.TOP_CLICK, 'click',
  DOMTopLevelEventTypes.TOP_CLOSE, 'close',
  DOMTopLevelEventTypes.TOP_CONTEXT_MENU, 'contextMenu',
  DOMTopLevelEventTypes.TOP_COPY, 'copy',
  DOMTopLevelEventTypes.TOP_CUT, 'cut',
  DOMTopLevelEventTypes.TOP_AUX_CLICK, 'auxClick',
  DOMTopLevelEventTypes.TOP_DOUBLE_CLICK, 'doubleClick',
  DOMTopLevelEventTypes.TOP_DRAG_END, 'dragEnd',
  DOMTopLevelEventTypes.TOP_DRAG_START, 'dragStart',
  DOMTopLevelEventTypes.TOP_DROP, 'drop',
  DOMTopLevelEventTypes.TOP_FOCUS, 'focus',
  DOMTopLevelEventTypes.TOP_INPUT, 'input',
  DOMTopLevelEventTypes.TOP_INVALID, 'invalid',
  DOMTopLevelEventTypes.TOP_KEY_DOWN, 'keyDown',
  DOMTopLevelEventTypes.TOP_KEY_PRESS, 'keyPress',
  DOMTopLevelEventTypes.TOP_KEY_UP, 'keyUp',
  DOMTopLevelEventTypes.TOP_MOUSE_DOWN, 'mouseDown',
  DOMTopLevelEventTypes.TOP_MOUSE_UP, 'mouseUp',
  DOMTopLevelEventTypes.TOP_PASTE, 'paste',
  DOMTopLevelEventTypes.TOP_PAUSE, 'pause',
  DOMTopLevelEventTypes.TOP_PLAY, 'play',
  DOMTopLevelEventTypes.TOP_POINTER_CANCEL, 'pointerCancel',
  DOMTopLevelEventTypes.TOP_POINTER_DOWN, 'pointerDown',
  DOMTopLevelEventTypes.TOP_POINTER_UP, 'pointerUp',
  DOMTopLevelEventTypes.TOP_RATE_CHANGE, 'rateChange',
  DOMTopLevelEventTypes.TOP_RESET, 'reset',
  DOMTopLevelEventTypes.TOP_SEEKED, 'seeked',
  DOMTopLevelEventTypes.TOP_SUBMIT, 'submit',
  DOMTopLevelEventTypes.TOP_TOUCH_CANCEL, 'touchCancel',
  DOMTopLevelEventTypes.TOP_TOUCH_END, 'touchEnd',
  DOMTopLevelEventTypes.TOP_TOUCH_START, 'touchStart',
  DOMTopLevelEventTypes.TOP_VOLUME_CHANGE, 'volumeChange',
];

const otherDiscreteEvents = [
  DOMTopLevelEventTypes.TOP_CHANGE,
  DOMTopLevelEventTypes.TOP_SELECTION_CHANGE,
  DOMTopLevelEventTypes.TOP_TEXT_INPUT,
  DOMTopLevelEventTypes.TOP_COMPOSITION_START,
  DOMTopLevelEventTypes.TOP_COMPOSITION_END,
  DOMTopLevelEventTypes.TOP_COMPOSITION_UPDATE,
];

if (enableCreateEventHandleAPI) {
  otherDiscreteEvents.push(
    DOMTopLevelEventTypes.TOP_BEFORE_BLUR,
    DOMTopLevelEventTypes.TOP_AFTER_BLUR,
  );
}

// prettier-ignore
const userBlockingPairsForSimpleEventPlugin = [
  DOMTopLevelEventTypes.TOP_DRAG, 'drag',
  DOMTopLevelEventTypes.TOP_DRAG_ENTER, 'dragEnter',
  DOMTopLevelEventTypes.TOP_DRAG_EXIT, 'dragExit',
  DOMTopLevelEventTypes.TOP_DRAG_LEAVE, 'dragLeave',
  DOMTopLevelEventTypes.TOP_DRAG_OVER, 'dragOver',
  DOMTopLevelEventTypes.TOP_MOUSE_MOVE, 'mouseMove',
  DOMTopLevelEventTypes.TOP_MOUSE_OUT, 'mouseOut',
  DOMTopLevelEventTypes.TOP_MOUSE_OVER, 'mouseOver',
  DOMTopLevelEventTypes.TOP_POINTER_MOVE, 'pointerMove',
  DOMTopLevelEventTypes.TOP_POINTER_OUT, 'pointerOut',
  DOMTopLevelEventTypes.TOP_POINTER_OVER, 'pointerOver',
  DOMTopLevelEventTypes.TOP_SCROLL, 'scroll',
  DOMTopLevelEventTypes.TOP_TOGGLE, 'toggle',
  DOMTopLevelEventTypes.TOP_TOUCH_MOVE, 'touchMove',
  DOMTopLevelEventTypes.TOP_WHEEL, 'wheel',
];

// prettier-ignore
const continuousPairsForSimpleEventPlugin = [
  DOMTopLevelEventTypes.TOP_ABORT, 'abort',
  DOMTopLevelEventTypes.TOP_ANIMATION_END, 'animationEnd',
  DOMTopLevelEventTypes.TOP_ANIMATION_ITERATION, 'animationIteration',
  DOMTopLevelEventTypes.TOP_ANIMATION_START, 'animationStart',
  DOMTopLevelEventTypes.TOP_CAN_PLAY, 'canPlay',
  DOMTopLevelEventTypes.TOP_CAN_PLAY_THROUGH, 'canPlayThrough',
  DOMTopLevelEventTypes.TOP_DURATION_CHANGE, 'durationChange',
  DOMTopLevelEventTypes.TOP_EMPTIED, 'emptied',
  DOMTopLevelEventTypes.TOP_ENCRYPTED, 'encrypted',
  DOMTopLevelEventTypes.TOP_ENDED, 'ended',
  DOMTopLevelEventTypes.TOP_ERROR, 'error',
  DOMTopLevelEventTypes.TOP_GOT_POINTER_CAPTURE, 'gotPointerCapture',
  DOMTopLevelEventTypes.TOP_LOAD, 'load',
  DOMTopLevelEventTypes.TOP_LOADED_DATA, 'loadedData',
  DOMTopLevelEventTypes.TOP_LOADED_METADATA, 'loadedMetadata',
  DOMTopLevelEventTypes.TOP_LOAD_START, 'loadStart',
  DOMTopLevelEventTypes.TOP_LOST_POINTER_CAPTURE, 'lostPointerCapture',
  DOMTopLevelEventTypes.TOP_PLAYING, 'playing',
  DOMTopLevelEventTypes.TOP_PROGRESS, 'progress',
  DOMTopLevelEventTypes.TOP_SEEKING, 'seeking',
  DOMTopLevelEventTypes.TOP_STALLED, 'stalled',
  DOMTopLevelEventTypes.TOP_SUSPEND, 'suspend',
  DOMTopLevelEventTypes.TOP_TIME_UPDATE, 'timeUpdate',
  DOMTopLevelEventTypes.TOP_TRANSITION_END, 'transitionEnd',
  DOMTopLevelEventTypes.TOP_WAITING, 'waiting',
];

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

function processSimpleEventPluginPairsByPriority(
  eventTypes: Array<DOMTopLevelEventType | string>,
  priority: EventPriority,
): void {
  // As the event types are in pairs of two, we need to iterate
  // through in twos. The events are in pairs of two to save code
  // and improve init perf of processing this array, as it will
  // result in far fewer object allocations and property accesses
  // if we only use three arrays to process all the categories of
  // instead of tuples.
  for (let i = 0; i < eventTypes.length; i += 2) {
    const topEvent = ((eventTypes[i]: any): DOMTopLevelEventType);
    const event = ((eventTypes[i + 1]: any): string);
    const capitalizedEvent = event[0].toUpperCase() + event.slice(1);
    const onEvent = 'on' + capitalizedEvent;

    const config = {
      phasedRegistrationNames: {
        bubbled: onEvent,
        captured: onEvent + 'Capture',
      },
      dependencies: [topEvent],
      eventPriority: priority,
    };
    eventPriorities.set(topEvent, priority);
    topLevelEventsToDispatchConfig.set(topEvent, config);
    simpleEventPluginEventTypes[event] = config;
  }
}

function processTopEventPairsByPriority(
  eventTypes: Array<DOMTopLevelEventType | string>,
  priority: EventPriority,
): void {
  for (let i = 0; i < eventTypes.length; i++) {
    eventPriorities.set(eventTypes[i], priority);
  }
}

// SimpleEventPlugin
processSimpleEventPluginPairsByPriority(
  discreteEventPairsForSimpleEventPlugin,
  DiscreteEvent,
);
processSimpleEventPluginPairsByPriority(
  userBlockingPairsForSimpleEventPlugin,
  UserBlockingEvent,
);
processSimpleEventPluginPairsByPriority(
  continuousPairsForSimpleEventPlugin,
  ContinuousEvent,
);
// Not used by SimpleEventPlugin
processTopEventPairsByPriority(otherDiscreteEvents, DiscreteEvent);

export function getEventPriorityForPluginSystem(
  topLevelType: TopLevelType,
): EventPriority {
  const priority = eventPriorities.get(topLevelType);
  // Default to a ContinuousEvent. Note: we might
  // want to warn if we can't detect the priority
  // for the event.
  return priority === undefined ? ContinuousEvent : priority;
}

export function getEventPriorityForListenerSystem(
  type: DOMTopLevelEventType,
): EventPriority {
  const priority = eventPriorities.get(type);
  if (priority !== undefined) {
    return priority;
  }
  if (__DEV__) {
    console.warn(
      'The event "type" provided to createEventHandle() does not have a known priority type.' +
        ' It is recommended to provide a "priority" option to specify a priority.',
    );
  }
  return ContinuousEvent;
}
