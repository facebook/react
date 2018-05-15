/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TopLevelType} from 'events/TopLevelEventTypes';
import getVendorPrefixedEventName from './getVendorPrefixedEventName';

/**
 * To identify top level events in react-dom, we use constants defined by this
 * module. Those are completely opaque to every other module but we rely on them
 * being the raw DOM event names inside this module. This allows us to build a
 * very efficient mapping from top level identifiers to the raw event type.
 *
 * The use of an `opaque` flow type makes sure that we can only access the value
 * of a constant in this module.
 */

// eslint-disable-next-line no-undef
export opaque type DOMTopLevelEventType =
  | 'abort'
  | 'animationend'
  | 'animationiteration'
  | 'animationstart'
  | 'blur'
  | 'canplay'
  | 'canplaythrough'
  | 'cancel'
  | 'change'
  | 'click'
  | 'close'
  | 'compositionend'
  | 'compositionstart'
  | 'compositionupdate'
  | 'contextmenu'
  | 'copy'
  | 'cut'
  | 'dblclick'
  | 'drag'
  | 'dragend'
  | 'dragenter'
  | 'dragexit'
  | 'dragleave'
  | 'dragover'
  | 'dragstart'
  | 'drop'
  | 'durationchange'
  | 'emptied'
  | 'encrypted'
  | 'ended'
  | 'error'
  | 'focus'
  | 'input'
  | 'invalid'
  | 'keydown'
  | 'keypress'
  | 'keyup'
  | 'load'
  | 'loadstart'
  | 'loadeddata'
  | 'loadedmetadata'
  | 'mousedown'
  | 'mousemove'
  | 'mouseout'
  | 'mouseover'
  | 'mouseup'
  | 'paste'
  | 'pause'
  | 'play'
  | 'playing'
  | 'progress'
  | 'ratechange'
  | 'reset'
  | 'scroll'
  | 'seeked'
  | 'seeking'
  | 'selectionchange'
  | 'stalled'
  | 'submit'
  | 'suspend'
  | 'textInput'
  | 'timeupdate'
  | 'toggle'
  | 'touchcancel'
  | 'touchend'
  | 'touchmove'
  | 'touchstart'
  | 'transitionend'
  | 'volumechange'
  | 'waiting'
  | 'wheel';

export const TOP_ABORT: TopLevelType = 'abort';
export const TOP_ANIMATION_END: TopLevelType = getVendorPrefixedEventName(
  'animationend',
);
export const TOP_ANIMATION_ITERATION: TopLevelType = getVendorPrefixedEventName(
  'animationiteration',
);
export const TOP_ANIMATION_START: TopLevelType = getVendorPrefixedEventName(
  'animationstart',
);
export const TOP_BLUR: TopLevelType = 'blur';
export const TOP_CAN_PLAY: TopLevelType = 'canplay';
export const TOP_CAN_PLAY_THROUGH: TopLevelType = 'canplaythrough';
export const TOP_CANCEL: TopLevelType = 'cancel';
export const TOP_CHANGE: TopLevelType = 'change';
export const TOP_CLICK: TopLevelType = 'click';
export const TOP_CLOSE: TopLevelType = 'close';
export const TOP_COMPOSITION_END: TopLevelType = 'compositionend';
export const TOP_COMPOSITION_START: TopLevelType = 'compositionstart';
export const TOP_COMPOSITION_UPDATE: TopLevelType = 'compositionupdate';
export const TOP_CONTEXT_MENU: TopLevelType = 'contextmenu';
export const TOP_COPY: TopLevelType = 'copy';
export const TOP_CUT: TopLevelType = 'cut';
export const TOP_DOUBLE_CLICK: TopLevelType = 'dblclick';
export const TOP_DRAG: TopLevelType = 'drag';
export const TOP_DRAG_END: TopLevelType = 'dragend';
export const TOP_DRAG_ENTER: TopLevelType = 'dragenter';
export const TOP_DRAG_EXIT: TopLevelType = 'dragexit';
export const TOP_DRAG_LEAVE: TopLevelType = 'dragleave';
export const TOP_DRAG_OVER: TopLevelType = 'dragover';
export const TOP_DRAG_START: TopLevelType = 'dragstart';
export const TOP_DROP: TopLevelType = 'drop';
export const TOP_DURATION_CHANGE: TopLevelType = 'durationchange';
export const TOP_EMPTIED: TopLevelType = 'emptied';
export const TOP_ENCRYPTED: TopLevelType = 'encrypted';
export const TOP_ENDED: TopLevelType = 'ended';
export const TOP_ERROR: TopLevelType = 'error';
export const TOP_FOCUS: TopLevelType = 'focus';
export const TOP_INPUT: TopLevelType = 'input';
export const TOP_INVALID: TopLevelType = 'invalid';
export const TOP_KEY_DOWN: TopLevelType = 'keydown';
export const TOP_KEY_PRESS: TopLevelType = 'keypress';
export const TOP_KEY_UP: TopLevelType = 'keyup';
export const TOP_LOAD: TopLevelType = 'load';
export const TOP_LOAD_START: TopLevelType = 'loadstart';
export const TOP_LOADED_DATA: TopLevelType = 'loadeddata';
export const TOP_LOADED_METADATA: TopLevelType = 'loadedmetadata';
export const TOP_MOUSE_DOWN: TopLevelType = 'mousedown';
export const TOP_MOUSE_MOVE: TopLevelType = 'mousemove';
export const TOP_MOUSE_OUT: TopLevelType = 'mouseout';
export const TOP_MOUSE_OVER: TopLevelType = 'mouseover';
export const TOP_MOUSE_UP: TopLevelType = 'mouseup';
export const TOP_PASTE: TopLevelType = 'paste';
export const TOP_PAUSE: TopLevelType = 'pause';
export const TOP_PLAY: TopLevelType = 'play';
export const TOP_PLAYING: TopLevelType = 'playing';
export const TOP_PROGRESS: TopLevelType = 'progress';
export const TOP_RATE_CHANGE: TopLevelType = 'ratechange';
export const TOP_RESET: TopLevelType = 'reset';
export const TOP_SCROLL: TopLevelType = 'scroll';
export const TOP_SEEKED: TopLevelType = 'seeked';
export const TOP_SEEKING: TopLevelType = 'seeking';
export const TOP_SELECTION_CHANGE: TopLevelType = 'selectionchange';
export const TOP_STALLED: TopLevelType = 'stalled';
export const TOP_SUBMIT: TopLevelType = 'submit';
export const TOP_SUSPEND: TopLevelType = 'suspend';
export const TOP_TEXT_INPUT: TopLevelType = 'textInput';
export const TOP_TIME_UPDATE: TopLevelType = 'timeupdate';
export const TOP_TOGGLE: TopLevelType = 'toggle';
export const TOP_TOUCH_CANCEL: TopLevelType = 'touchcancel';
export const TOP_TOUCH_END: TopLevelType = 'touchend';
export const TOP_TOUCH_MOVE: TopLevelType = 'touchmove';
export const TOP_TOUCH_START: TopLevelType = 'touchstart';
export const TOP_TRANSITION_END: TopLevelType = getVendorPrefixedEventName(
  'transitionend',
);
export const TOP_VOLUME_CHANGE: TopLevelType = 'volumechange';
export const TOP_WAITING: TopLevelType = 'waiting';
export const TOP_WHEEL: TopLevelType = 'wheel';

export const mediaEventTypes: Array<TopLevelType> = [
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

export function getRawEventName(topLevelType: TopLevelType): string {
  return topLevelType;
}
