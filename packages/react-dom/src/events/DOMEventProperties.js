/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventPriority} from 'shared/ReactTypes';
import type {DOMEventName} from './DOMEventNames';

import {registerTwoPhaseEvent} from './EventRegistry';
import {
  ANIMATION_END,
  ANIMATION_ITERATION,
  ANIMATION_START,
  TRANSITION_END,
} from './DOMEventNames';
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
  ('cancel': DOMEventName), 'cancel',
  ('click': DOMEventName), 'click',
  ('close': DOMEventName), 'close',
  ('contextmenu': DOMEventName), 'contextMenu',
  ('copy': DOMEventName), 'copy',
  ('cut': DOMEventName), 'cut',
  ('auxclick': DOMEventName), 'auxClick',
  ('dblclick': DOMEventName), 'doubleClick', // Careful!
  ('dragend': DOMEventName), 'dragEnd',
  ('dragstart': DOMEventName), 'dragStart',
  ('drop': DOMEventName), 'drop',
  ('focusin': DOMEventName), 'focus', // Careful!
  ('focusout': DOMEventName), 'blur', // Careful!
  ('input': DOMEventName), 'input',
  ('invalid': DOMEventName), 'invalid',
  ('keydown': DOMEventName), 'keyDown',
  ('keypress': DOMEventName), 'keyPress',
  ('keyup': DOMEventName), 'keyUp',
  ('mousedown': DOMEventName), 'mouseDown',
  ('mouseup': DOMEventName), 'mouseUp',
  ('paste': DOMEventName), 'paste',
  ('pause': DOMEventName), 'pause',
  ('play': DOMEventName), 'play',
  ('pointercancel': DOMEventName), 'pointerCancel',
  ('pointerdown': DOMEventName), 'pointerDown',
  ('pointerup': DOMEventName), 'pointerUp',
  ('ratechange': DOMEventName), 'rateChange',
  ('reset': DOMEventName), 'reset',
  ('seeked': DOMEventName), 'seeked',
  ('submit': DOMEventName), 'submit',
  ('touchcancel': DOMEventName), 'touchCancel',
  ('touchend': DOMEventName), 'touchEnd',
  ('touchstart': DOMEventName), 'touchStart',
  ('volumechange': DOMEventName), 'volumeChange',
];

const otherDiscreteEvents: Array<DOMEventName> = [
  'change',
  'selectionchange',
  'textInput',
  'compositionstart',
  'compositionend',
  'compositionupdate',
];

if (enableCreateEventHandleAPI) {
  // Special case: these two events don't have on* React handler
  // and are only accessible via the createEventHandle API.
  topLevelEventsToReactNames.set('beforeblur', null);
  topLevelEventsToReactNames.set('afterblur', null);
  otherDiscreteEvents.push('beforeblur', 'afterblur');
}

// prettier-ignore
const userBlockingPairsForSimpleEventPlugin: Array<string | DOMEventName> = [
  ('drag': DOMEventName), 'drag',
  ('dragenter': DOMEventName), 'dragEnter',
  ('dragexit': DOMEventName), 'dragExit',
  ('dragleave': DOMEventName), 'dragLeave',
  ('dragover': DOMEventName), 'dragOver',
  ('mousemove': DOMEventName), 'mouseMove',
  ('mouseout': DOMEventName), 'mouseOut',
  ('mouseover': DOMEventName), 'mouseOver',
  ('pointermove': DOMEventName), 'pointerMove',
  ('pointerout': DOMEventName), 'pointerOut',
  ('pointerover': DOMEventName), 'pointerOver',
  ('scroll': DOMEventName), 'scroll',
  ('toggle': DOMEventName), 'toggle',
  ('touchmove': DOMEventName), 'touchMove',
  ('wheel': DOMEventName), 'wheel',
];

// prettier-ignore
const continuousPairsForSimpleEventPlugin: Array<string | DOMEventName> = [
  ('abort': DOMEventName), 'abort',
  (ANIMATION_END: DOMEventName), 'animationEnd',
  (ANIMATION_ITERATION: DOMEventName), 'animationIteration',
  (ANIMATION_START: DOMEventName), 'animationStart',
  ('canplay': DOMEventName), 'canPlay',
  ('canplaythrough': DOMEventName), 'canPlayThrough',
  ('durationchange': DOMEventName), 'durationChange',
  ('emptied': DOMEventName), 'emptied',
  ('encrypted': DOMEventName), 'encrypted',
  ('ended': DOMEventName), 'ended',
  ('error': DOMEventName), 'error',
  ('gotpointercapture': DOMEventName), 'gotPointerCapture',
  ('load': DOMEventName), 'load',
  ('loadeddata': DOMEventName), 'loadedData',
  ('loadedmetadata': DOMEventName), 'loadedMetadata',
  ('loadstart': DOMEventName), 'loadStart',
  ('lostpointercapture': DOMEventName), 'lostPointerCapture',
  ('playing': DOMEventName), 'playing',
  ('progress': DOMEventName), 'progress',
  ('seeking': DOMEventName), 'seeking',
  ('stalled': DOMEventName), 'stalled',
  ('suspend': DOMEventName), 'suspend',
  ('timeupdate': DOMEventName), 'timeUpdate',
  (TRANSITION_END: DOMEventName), 'transitionEnd',
  ('waiting': DOMEventName), 'waiting',
];

/**
 * Turns
 * ['abort', ...]
 *
 * into
 *
 * topLevelEventsToReactNames = new Map([
 *   ['abort', 'onAbort'],
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
  eventTypes: Array<DOMEventName>,
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
      'The event "%s" provided to createEventHandle() does not have a known priority type.' +
        ' This is likely a bug in React.',
      type,
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
