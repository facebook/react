/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMTopLevelEventType} from 'events/TopLevelEventTypes';

import {
  unsafeCastStringToDOMTopLevelType,
  unsafeCastDOMTopLevelTypeToString,
} from 'events/TopLevelEventTypes';
import getVendorPrefixedEventName from './getVendorPrefixedEventName';

/**
 * To identify top level events in ReactDOM, we use constants defined by this
 * module. This is the only module that uses the unsafe* methods to express
 * that the constants actually correspond to the browser event names. This lets
 * us save some bundle size by avoiding a top level type -> event name map.
 * The rest of ReactDOM code should import top level types from this file.
 */
export const TOP_ABORT = unsafeCastStringToDOMTopLevelType('abort');
export const TOP_ANIMATION_END = unsafeCastStringToDOMTopLevelType(
  getVendorPrefixedEventName('animationend'),
);
export const TOP_ANIMATION_ITERATION = unsafeCastStringToDOMTopLevelType(
  getVendorPrefixedEventName('animationiteration'),
);
export const TOP_ANIMATION_START = unsafeCastStringToDOMTopLevelType(
  getVendorPrefixedEventName('animationstart'),
);
export const TOP_BLUR = unsafeCastStringToDOMTopLevelType('blur');
export const TOP_CAN_PLAY = unsafeCastStringToDOMTopLevelType('canplay');
export const TOP_CAN_PLAY_THROUGH = unsafeCastStringToDOMTopLevelType(
  'canplaythrough',
);
export const TOP_CANCEL = unsafeCastStringToDOMTopLevelType('cancel');
export const TOP_CHANGE = unsafeCastStringToDOMTopLevelType('change');
export const TOP_CLICK = unsafeCastStringToDOMTopLevelType('click');
export const TOP_CLOSE = unsafeCastStringToDOMTopLevelType('close');
export const TOP_COMPOSITION_END = unsafeCastStringToDOMTopLevelType(
  'compositionend',
);
export const TOP_COMPOSITION_START = unsafeCastStringToDOMTopLevelType(
  'compositionstart',
);
export const TOP_COMPOSITION_UPDATE = unsafeCastStringToDOMTopLevelType(
  'compositionupdate',
);
export const TOP_CONTEXT_MENU = unsafeCastStringToDOMTopLevelType(
  'contextmenu',
);
export const TOP_COPY = unsafeCastStringToDOMTopLevelType('copy');
export const TOP_CUT = unsafeCastStringToDOMTopLevelType('cut');
export const TOP_DOUBLE_CLICK = unsafeCastStringToDOMTopLevelType('dblclick');
export const TOP_AUX_CLICK = unsafeCastStringToDOMTopLevelType('auxclick');
export const TOP_DRAG = unsafeCastStringToDOMTopLevelType('drag');
export const TOP_DRAG_END = unsafeCastStringToDOMTopLevelType('dragend');
export const TOP_DRAG_ENTER = unsafeCastStringToDOMTopLevelType('dragenter');
export const TOP_DRAG_EXIT = unsafeCastStringToDOMTopLevelType('dragexit');
export const TOP_DRAG_LEAVE = unsafeCastStringToDOMTopLevelType('dragleave');
export const TOP_DRAG_OVER = unsafeCastStringToDOMTopLevelType('dragover');
export const TOP_DRAG_START = unsafeCastStringToDOMTopLevelType('dragstart');
export const TOP_DROP = unsafeCastStringToDOMTopLevelType('drop');
export const TOP_DURATION_CHANGE = unsafeCastStringToDOMTopLevelType(
  'durationchange',
);
export const TOP_EMPTIED = unsafeCastStringToDOMTopLevelType('emptied');
export const TOP_ENCRYPTED = unsafeCastStringToDOMTopLevelType('encrypted');
export const TOP_ENDED = unsafeCastStringToDOMTopLevelType('ended');
export const TOP_ERROR = unsafeCastStringToDOMTopLevelType('error');
export const TOP_FOCUS = unsafeCastStringToDOMTopLevelType('focus');
export const TOP_GOT_POINTER_CAPTURE = unsafeCastStringToDOMTopLevelType(
  'gotpointercapture',
);
export const TOP_INPUT = unsafeCastStringToDOMTopLevelType('input');
export const TOP_INVALID = unsafeCastStringToDOMTopLevelType('invalid');
export const TOP_KEY_DOWN = unsafeCastStringToDOMTopLevelType('keydown');
export const TOP_KEY_PRESS = unsafeCastStringToDOMTopLevelType('keypress');
export const TOP_KEY_UP = unsafeCastStringToDOMTopLevelType('keyup');
export const TOP_LOAD = unsafeCastStringToDOMTopLevelType('load');
export const TOP_LOAD_START = unsafeCastStringToDOMTopLevelType('loadstart');
export const TOP_LOADED_DATA = unsafeCastStringToDOMTopLevelType('loadeddata');
export const TOP_LOADED_METADATA = unsafeCastStringToDOMTopLevelType(
  'loadedmetadata',
);
export const TOP_LOST_POINTER_CAPTURE = unsafeCastStringToDOMTopLevelType(
  'lostpointercapture',
);
export const TOP_MOUSE_DOWN = unsafeCastStringToDOMTopLevelType('mousedown');
export const TOP_MOUSE_MOVE = unsafeCastStringToDOMTopLevelType('mousemove');
export const TOP_MOUSE_OUT = unsafeCastStringToDOMTopLevelType('mouseout');
export const TOP_MOUSE_OVER = unsafeCastStringToDOMTopLevelType('mouseover');
export const TOP_MOUSE_UP = unsafeCastStringToDOMTopLevelType('mouseup');
export const TOP_PASTE = unsafeCastStringToDOMTopLevelType('paste');
export const TOP_PAUSE = unsafeCastStringToDOMTopLevelType('pause');
export const TOP_PLAY = unsafeCastStringToDOMTopLevelType('play');
export const TOP_PLAYING = unsafeCastStringToDOMTopLevelType('playing');
export const TOP_POINTER_CANCEL = unsafeCastStringToDOMTopLevelType(
  'pointercancel',
);
export const TOP_POINTER_DOWN = unsafeCastStringToDOMTopLevelType(
  'pointerdown',
);
export const TOP_POINTER_ENTER = unsafeCastStringToDOMTopLevelType(
  'pointerenter',
);
export const TOP_POINTER_LEAVE = unsafeCastStringToDOMTopLevelType(
  'pointerleave',
);
export const TOP_POINTER_MOVE = unsafeCastStringToDOMTopLevelType(
  'pointermove',
);
export const TOP_POINTER_OUT = unsafeCastStringToDOMTopLevelType('pointerout');
export const TOP_POINTER_OVER = unsafeCastStringToDOMTopLevelType(
  'pointerover',
);
export const TOP_POINTER_UP = unsafeCastStringToDOMTopLevelType('pointerup');
export const TOP_PROGRESS = unsafeCastStringToDOMTopLevelType('progress');
export const TOP_RATE_CHANGE = unsafeCastStringToDOMTopLevelType('ratechange');
export const TOP_RESET = unsafeCastStringToDOMTopLevelType('reset');
export const TOP_SCROLL = unsafeCastStringToDOMTopLevelType('scroll');
export const TOP_SEEKED = unsafeCastStringToDOMTopLevelType('seeked');
export const TOP_SEEKING = unsafeCastStringToDOMTopLevelType('seeking');
export const TOP_SELECTION_CHANGE = unsafeCastStringToDOMTopLevelType(
  'selectionchange',
);
export const TOP_STALLED = unsafeCastStringToDOMTopLevelType('stalled');
export const TOP_SUBMIT = unsafeCastStringToDOMTopLevelType('submit');
export const TOP_SUSPEND = unsafeCastStringToDOMTopLevelType('suspend');
export const TOP_TEXT_INPUT = unsafeCastStringToDOMTopLevelType('textInput');
export const TOP_TIME_UPDATE = unsafeCastStringToDOMTopLevelType('timeupdate');
export const TOP_TOGGLE = unsafeCastStringToDOMTopLevelType('toggle');
export const TOP_TOUCH_CANCEL = unsafeCastStringToDOMTopLevelType(
  'touchcancel',
);
export const TOP_TOUCH_END = unsafeCastStringToDOMTopLevelType('touchend');
export const TOP_TOUCH_MOVE = unsafeCastStringToDOMTopLevelType('touchmove');
export const TOP_TOUCH_START = unsafeCastStringToDOMTopLevelType('touchstart');
export const TOP_TRANSITION_END = unsafeCastStringToDOMTopLevelType(
  getVendorPrefixedEventName('transitionend'),
);
export const TOP_VOLUME_CHANGE = unsafeCastStringToDOMTopLevelType(
  'volumechange',
);
export const TOP_WAITING = unsafeCastStringToDOMTopLevelType('waiting');
export const TOP_WHEEL = unsafeCastStringToDOMTopLevelType('wheel');

// List of events that need to be individually attached to media elements.
// Note that events in this list will *not* be listened to at the top level
// unless they're explicitly whitelisted in `ReactBrowserEventEmitter.listenTo`.
export const mediaEventTypes = [
  TOP_ABORT,
  TOP_CAN_PLAY,
  TOP_CAN_PLAY_THROUGH,
  TOP_DURATION_CHANGE,
  TOP_EMPTIED,
  TOP_ENCRYPTED,
  TOP_ENDED,
  TOP_ERROR,
  TOP_LOADED_DATA,
  TOP_LOADED_METADATA,
  TOP_LOAD_START,
  TOP_PAUSE,
  TOP_PLAY,
  TOP_PLAYING,
  TOP_PROGRESS,
  TOP_RATE_CHANGE,
  TOP_SEEKED,
  TOP_SEEKING,
  TOP_STALLED,
  TOP_SUSPEND,
  TOP_TIME_UPDATE,
  TOP_VOLUME_CHANGE,
  TOP_WAITING,
];

export function getRawEventName(topLevelType: DOMTopLevelEventType): string {
  return unsafeCastDOMTopLevelTypeToString(topLevelType);
}
