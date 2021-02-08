/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMEventName} from './DOMEventNames';

import {registerTwoPhaseEvent} from './EventRegistry';
import {
  ANIMATION_END,
  ANIMATION_ITERATION,
  ANIMATION_START,
  TRANSITION_END,
} from './DOMEventNames';

import {enableCreateEventHandleAPI} from 'shared/ReactFeatureFlags';

export const topLevelEventsToReactNames: Map<
  DOMEventName,
  string | null,
> = new Map();

// prettier-ignore
const simpleEventPluginNames = [
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

if (enableCreateEventHandleAPI) {
  // Special case: these two events don't have on* React handler
  // and are only accessible via the createEventHandle API.
  topLevelEventsToReactNames.set('beforeblur', null);
  topLevelEventsToReactNames.set('afterblur', null);
}

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
export function registerSimpleEvents() {
  // As the event types are in pairs of two, we need to iterate
  // through in twos. The events are in pairs of two to save code
  // and improve init perf of processing this array, as it will
  // result in far fewer object allocations and property accesses
  // if we only use three arrays to process all the categories of
  // instead of tuples.
  for (let i = 0; i < simpleEventPluginNames.length; i += 2) {
    const topEvent = ((simpleEventPluginNames[i]: any): DOMEventName);
    const event = ((simpleEventPluginNames[i + 1]: any): string);
    const capitalizedEvent = event[0].toUpperCase() + event.slice(1);
    const reactName = 'on' + capitalizedEvent;
    topLevelEventsToReactNames.set(topEvent, reactName);
    registerTwoPhaseEvent(reactName, [topEvent]);
  }
}
