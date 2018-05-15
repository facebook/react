/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

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

export const TOP_ABORT: DOMTopLevelEventType = 'abort';
export const TOP_ANIMATION_END: DOMTopLevelEventType = getVendorPrefixedEventName(
  'animationend',
);
export const TOP_ANIMATION_ITERATION: DOMTopLevelEventType = getVendorPrefixedEventName(
  'animationiteration',
);
export const TOP_ANIMATION_START: DOMTopLevelEventType = getVendorPrefixedEventName(
  'animationstart',
);
export const TOP_BLUR: DOMTopLevelEventType = 'blur';
export const TOP_CAN_PLAY: DOMTopLevelEventType = 'canplay';
export const TOP_CAN_PLAY_THROUGH: DOMTopLevelEventType = 'canplaythrough';
export const TOP_CANCEL: DOMTopLevelEventType = 'cancel';
export const TOP_CHANGE: DOMTopLevelEventType = 'change';
export const TOP_CLICK: DOMTopLevelEventType = 'click';
export const TOP_CLOSE: DOMTopLevelEventType = 'close';
export const TOP_COMPOSITION_END: DOMTopLevelEventType = 'compositionend';
export const TOP_COMPOSITION_START: DOMTopLevelEventType = 'compositionstart';
export const TOP_COMPOSITION_UPDATE: DOMTopLevelEventType = 'compositionupdate';
export const TOP_CONTEXT_MENU: DOMTopLevelEventType = 'contextmenu';
export const TOP_COPY: DOMTopLevelEventType = 'copy';
export const TOP_CUT: DOMTopLevelEventType = 'cut';
export const TOP_DOUBLE_CLICK: DOMTopLevelEventType = 'dblclick';
export const TOP_DRAG: DOMTopLevelEventType = 'drag';
export const TOP_DRAG_END: DOMTopLevelEventType = 'dragend';
export const TOP_DRAG_ENTER: DOMTopLevelEventType = 'dragenter';
export const TOP_DRAG_EXIT: DOMTopLevelEventType = 'dragexit';
export const TOP_DRAG_LEAVE: DOMTopLevelEventType = 'dragleave';
export const TOP_DRAG_OVER: DOMTopLevelEventType = 'dragover';
export const TOP_DRAG_START: DOMTopLevelEventType = 'dragstart';
export const TOP_DROP: DOMTopLevelEventType = 'drop';
export const TOP_DURATION_CHANGE: DOMTopLevelEventType = 'durationchange';
export const TOP_EMPTIED: DOMTopLevelEventType = 'emptied';
export const TOP_ENCRYPTED: DOMTopLevelEventType = 'encrypted';
export const TOP_ENDED: DOMTopLevelEventType = 'ended';
export const TOP_ERROR: DOMTopLevelEventType = 'error';
export const TOP_FOCUS: DOMTopLevelEventType = 'focus';
export const TOP_INPUT: DOMTopLevelEventType = 'input';
export const TOP_INVALID: DOMTopLevelEventType = 'invalid';
export const TOP_KEY_DOWN: DOMTopLevelEventType = 'keydown';
export const TOP_KEY_PRESS: DOMTopLevelEventType = 'keypress';
export const TOP_KEY_UP: DOMTopLevelEventType = 'keyup';
export const TOP_LOAD: DOMTopLevelEventType = 'load';
export const TOP_LOAD_START: DOMTopLevelEventType = 'loadstart';
export const TOP_LOADED_DATA: DOMTopLevelEventType = 'loadeddata';
export const TOP_LOADED_METADATA: DOMTopLevelEventType = 'loadedmetadata';
export const TOP_MOUSE_DOWN: DOMTopLevelEventType = 'mousedown';
export const TOP_MOUSE_MOVE: DOMTopLevelEventType = 'mousemove';
export const TOP_MOUSE_OUT: DOMTopLevelEventType = 'mouseout';
export const TOP_MOUSE_OVER: DOMTopLevelEventType = 'mouseover';
export const TOP_MOUSE_UP: DOMTopLevelEventType = 'mouseup';
export const TOP_PASTE: DOMTopLevelEventType = 'paste';
export const TOP_PAUSE: DOMTopLevelEventType = 'pause';
export const TOP_PLAY: DOMTopLevelEventType = 'play';
export const TOP_PLAYING: DOMTopLevelEventType = 'playing';
export const TOP_PROGRESS: DOMTopLevelEventType = 'progress';
export const TOP_RATE_CHANGE: DOMTopLevelEventType = 'ratechange';
export const TOP_RESET: DOMTopLevelEventType = 'reset';
export const TOP_SCROLL: DOMTopLevelEventType = 'scroll';
export const TOP_SEEKED: DOMTopLevelEventType = 'seeked';
export const TOP_SEEKING: DOMTopLevelEventType = 'seeking';
export const TOP_SELECTION_CHANGE: DOMTopLevelEventType = 'selectionchange';
export const TOP_STALLED: DOMTopLevelEventType = 'stalled';
export const TOP_SUBMIT: DOMTopLevelEventType = 'submit';
export const TOP_SUSPEND: DOMTopLevelEventType = 'suspend';
export const TOP_TEXT_INPUT: DOMTopLevelEventType = 'textInput';
export const TOP_TIME_UPDATE: DOMTopLevelEventType = 'timeupdate';
export const TOP_TOGGLE: DOMTopLevelEventType = 'toggle';
export const TOP_TOUCH_CANCEL: DOMTopLevelEventType = 'touchcancel';
export const TOP_TOUCH_END: DOMTopLevelEventType = 'touchend';
export const TOP_TOUCH_MOVE: DOMTopLevelEventType = 'touchmove';
export const TOP_TOUCH_START: DOMTopLevelEventType = 'touchstart';
export const TOP_TRANSITION_END: DOMTopLevelEventType = getVendorPrefixedEventName(
  'transitionend',
);
export const TOP_VOLUME_CHANGE: DOMTopLevelEventType = 'volumechange';
export const TOP_WAITING: DOMTopLevelEventType = 'waiting';
export const TOP_WHEEL: DOMTopLevelEventType = 'wheel';

export const mediaEventTypes: Array<DOMTopLevelEventType> = [
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
  return topLevelType;
}
