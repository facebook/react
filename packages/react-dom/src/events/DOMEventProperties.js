/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventPriority} from 'shared/ReactTypes';
import type {DOMEventName} from '../events/DOMEventNames';

import {registerTwoPhaseEvent} from './EventRegistry';
import * as DOMEventNames from './DOMEventNames';
import {
  DiscreteEvent,
  UserBlockingEvent,
  ContinuousEvent,
} from 'shared/ReactTypes';

import {enableCreateEventHandleAPI} from 'shared/ReactFeatureFlags';

export const topLevelEventsToReactNames: Map<
  DOMEventName,
  string | null,
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
  DOMEventNames.TOP_CANCEL, 'cancel',
  DOMEventNames.TOP_CLICK, 'click',
  DOMEventNames.TOP_CLOSE, 'close',
  DOMEventNames.TOP_CONTEXT_MENU, 'contextMenu',
  DOMEventNames.TOP_COPY, 'copy',
  DOMEventNames.TOP_CUT, 'cut',
  DOMEventNames.TOP_AUX_CLICK, 'auxClick',
  DOMEventNames.TOP_DOUBLE_CLICK, 'doubleClick',
  DOMEventNames.TOP_DRAG_END, 'dragEnd',
  DOMEventNames.TOP_DRAG_START, 'dragStart',
  DOMEventNames.TOP_DROP, 'drop',
  DOMEventNames.TOP_FOCUS_IN, 'focus',
  DOMEventNames.TOP_FOCUS_OUT, 'blur',
  DOMEventNames.TOP_INPUT, 'input',
  DOMEventNames.TOP_INVALID, 'invalid',
  DOMEventNames.TOP_KEY_DOWN, 'keyDown',
  DOMEventNames.TOP_KEY_PRESS, 'keyPress',
  DOMEventNames.TOP_KEY_UP, 'keyUp',
  DOMEventNames.TOP_MOUSE_DOWN, 'mouseDown',
  DOMEventNames.TOP_MOUSE_UP, 'mouseUp',
  DOMEventNames.TOP_PASTE, 'paste',
  DOMEventNames.TOP_PAUSE, 'pause',
  DOMEventNames.TOP_PLAY, 'play',
  DOMEventNames.TOP_POINTER_CANCEL, 'pointerCancel',
  DOMEventNames.TOP_POINTER_DOWN, 'pointerDown',
  DOMEventNames.TOP_POINTER_UP, 'pointerUp',
  DOMEventNames.TOP_RATE_CHANGE, 'rateChange',
  DOMEventNames.TOP_RESET, 'reset',
  DOMEventNames.TOP_SEEKED, 'seeked',
  DOMEventNames.TOP_SUBMIT, 'submit',
  DOMEventNames.TOP_TOUCH_CANCEL, 'touchCancel',
  DOMEventNames.TOP_TOUCH_END, 'touchEnd',
  DOMEventNames.TOP_TOUCH_START, 'touchStart',
  DOMEventNames.TOP_VOLUME_CHANGE, 'volumeChange',
];

const otherDiscreteEvents = [
  DOMEventNames.TOP_CHANGE,
  DOMEventNames.TOP_SELECTION_CHANGE,
  DOMEventNames.TOP_TEXT_INPUT,
  DOMEventNames.TOP_COMPOSITION_START,
  DOMEventNames.TOP_COMPOSITION_END,
  DOMEventNames.TOP_COMPOSITION_UPDATE,
];

if (enableCreateEventHandleAPI) {
  otherDiscreteEvents.push(
    DOMEventNames.TOP_BEFORE_BLUR,
    DOMEventNames.TOP_AFTER_BLUR,
  );
}

// prettier-ignore
const userBlockingPairsForSimpleEventPlugin = [
  DOMEventNames.TOP_DRAG, 'drag',
  DOMEventNames.TOP_DRAG_ENTER, 'dragEnter',
  DOMEventNames.TOP_DRAG_EXIT, 'dragExit',
  DOMEventNames.TOP_DRAG_LEAVE, 'dragLeave',
  DOMEventNames.TOP_DRAG_OVER, 'dragOver',
  DOMEventNames.TOP_MOUSE_MOVE, 'mouseMove',
  DOMEventNames.TOP_MOUSE_OUT, 'mouseOut',
  DOMEventNames.TOP_MOUSE_OVER, 'mouseOver',
  DOMEventNames.TOP_POINTER_MOVE, 'pointerMove',
  DOMEventNames.TOP_POINTER_OUT, 'pointerOut',
  DOMEventNames.TOP_POINTER_OVER, 'pointerOver',
  DOMEventNames.TOP_SCROLL, 'scroll',
  DOMEventNames.TOP_TOGGLE, 'toggle',
  DOMEventNames.TOP_TOUCH_MOVE, 'touchMove',
  DOMEventNames.TOP_WHEEL, 'wheel',
];

// prettier-ignore
const continuousPairsForSimpleEventPlugin = [
  DOMEventNames.TOP_ABORT, 'abort',
  DOMEventNames.TOP_ANIMATION_END, 'animationEnd',
  DOMEventNames.TOP_ANIMATION_ITERATION, 'animationIteration',
  DOMEventNames.TOP_ANIMATION_START, 'animationStart',
  DOMEventNames.TOP_CAN_PLAY, 'canPlay',
  DOMEventNames.TOP_CAN_PLAY_THROUGH, 'canPlayThrough',
  DOMEventNames.TOP_DURATION_CHANGE, 'durationChange',
  DOMEventNames.TOP_EMPTIED, 'emptied',
  DOMEventNames.TOP_ENCRYPTED, 'encrypted',
  DOMEventNames.TOP_ENDED, 'ended',
  DOMEventNames.TOP_ERROR, 'error',
  DOMEventNames.TOP_GOT_POINTER_CAPTURE, 'gotPointerCapture',
  DOMEventNames.TOP_LOAD, 'load',
  DOMEventNames.TOP_LOADED_DATA, 'loadedData',
  DOMEventNames.TOP_LOADED_METADATA, 'loadedMetadata',
  DOMEventNames.TOP_LOAD_START, 'loadStart',
  DOMEventNames.TOP_LOST_POINTER_CAPTURE, 'lostPointerCapture',
  DOMEventNames.TOP_PLAYING, 'playing',
  DOMEventNames.TOP_PROGRESS, 'progress',
  DOMEventNames.TOP_SEEKING, 'seeking',
  DOMEventNames.TOP_STALLED, 'stalled',
  DOMEventNames.TOP_SUSPEND, 'suspend',
  DOMEventNames.TOP_TIME_UPDATE, 'timeUpdate',
  DOMEventNames.TOP_TRANSITION_END, 'transitionEnd',
  DOMEventNames.TOP_WAITING, 'waiting',
];

/**
 * Turns
 * ['abort', ...]
 *
 * into
 *
 * topLevelEventsToReactNames = new Map([
 *   [TOP_ABORT, 'onAbort'],
 * ]);
 *
 * and registers them.
 */
function registerSimplePluginEventsAndSetTheirPriorities(
  eventTypes: Array<DOMEventName | string>,
  priority: EventPriority,
): void {
  // As the event types are in pairs of two, we need to iterate
  // through in twos. The events are in pairs of two to save code
  // and improve init perf of processing this array, as it will
  // result in far fewer object allocations and property accesses
  // if we only use three arrays to process all the categories of
  // instead of tuples.
  for (let i = 0; i < eventTypes.length; i += 2) {
    const topEvent = ((eventTypes[i]: any): DOMEventName);
    const event = ((eventTypes[i + 1]: any): string);
    const capitalizedEvent = event[0].toUpperCase() + event.slice(1);
    const reactName = 'on' + capitalizedEvent;
    eventPriorities.set(topEvent, priority);
    topLevelEventsToReactNames.set(topEvent, reactName);
    registerTwoPhaseEvent(reactName, [topEvent]);
  }
}

function setEventPriorities(
  eventTypes: Array<DOMEventName | string>,
  priority: EventPriority,
): void {
  for (let i = 0; i < eventTypes.length; i++) {
    eventPriorities.set(eventTypes[i], priority);
  }
}

export function getEventPriorityForPluginSystem(
  domEventName: DOMEventName,
): EventPriority {
  const priority = eventPriorities.get(domEventName);
  // Default to a ContinuousEvent. Note: we might
  // want to warn if we can't detect the priority
  // for the event.
  return priority === undefined ? ContinuousEvent : priority;
}

export function getEventPriorityForListenerSystem(
  type: DOMEventName,
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

export function registerSimpleEvents() {
  registerSimplePluginEventsAndSetTheirPriorities(
    discreteEventPairsForSimpleEventPlugin,
    DiscreteEvent,
  );
  registerSimplePluginEventsAndSetTheirPriorities(
    userBlockingPairsForSimpleEventPlugin,
    UserBlockingEvent,
  );
  registerSimplePluginEventsAndSetTheirPriorities(
    continuousPairsForSimpleEventPlugin,
    ContinuousEvent,
  );
  setEventPriorities(otherDiscreteEvents, DiscreteEvent);
}
