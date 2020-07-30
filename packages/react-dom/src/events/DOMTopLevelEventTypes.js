/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import getVendorPrefixedEventName from './getVendorPrefixedEventName';

export const TOP_ABORT = 'abort';
export const TOP_ANIMATION_END = getVendorPrefixedEventName('animationend');
export const TOP_ANIMATION_ITERATION = getVendorPrefixedEventName(
  'animationiteration',
);
export const TOP_ANIMATION_START = getVendorPrefixedEventName('animationstart');
export const TOP_CAN_PLAY = 'canplay';
export const TOP_CAN_PLAY_THROUGH = 'canplaythrough';
export const TOP_CANCEL = 'cancel';
export const TOP_CHANGE = 'change';
export const TOP_CLICK = 'click';
export const TOP_CLOSE = 'close';
export const TOP_COMPOSITION_END = 'compositionend';
export const TOP_COMPOSITION_START = 'compositionstart';
export const TOP_COMPOSITION_UPDATE = 'compositionupdate';
export const TOP_CONTEXT_MENU = 'contextmenu';
export const TOP_COPY = 'copy';
export const TOP_CUT = 'cut';
export const TOP_DOUBLE_CLICK = 'dblclick';
export const TOP_AUX_CLICK = 'auxclick';
export const TOP_DRAG = 'drag';
export const TOP_DRAG_END = 'dragend';
export const TOP_DRAG_ENTER = 'dragenter';
export const TOP_DRAG_EXIT = 'dragexit';
export const TOP_DRAG_LEAVE = 'dragleave';
export const TOP_DRAG_OVER = 'dragover';
export const TOP_DRAG_START = 'dragstart';
export const TOP_DROP = 'drop';
export const TOP_DURATION_CHANGE = 'durationchange';
export const TOP_EMPTIED = 'emptied';
export const TOP_ENCRYPTED = 'encrypted';
export const TOP_ENDED = 'ended';
export const TOP_ERROR = 'error';
export const TOP_GOT_POINTER_CAPTURE = 'gotpointercapture';
export const TOP_INPUT = 'input';
export const TOP_INVALID = 'invalid';
export const TOP_KEY_DOWN = 'keydown';
export const TOP_KEY_PRESS = 'keypress';
export const TOP_KEY_UP = 'keyup';
export const TOP_LOAD = 'load';
export const TOP_LOAD_START = 'loadstart';
export const TOP_LOADED_DATA = 'loadeddata';
export const TOP_LOADED_METADATA = 'loadedmetadata';
export const TOP_LOST_POINTER_CAPTURE = 'lostpointercapture';
export const TOP_MOUSE_DOWN = 'mousedown';
export const TOP_MOUSE_MOVE = 'mousemove';
export const TOP_MOUSE_OUT = 'mouseout';
export const TOP_MOUSE_OVER = 'mouseover';
export const TOP_MOUSE_UP = 'mouseup';
export const TOP_PASTE = 'paste';
export const TOP_PAUSE = 'pause';
export const TOP_PLAY = 'play';
export const TOP_PLAYING = 'playing';
export const TOP_POINTER_CANCEL = 'pointercancel';
export const TOP_POINTER_DOWN = 'pointerdown';
export const TOP_POINTER_ENTER = 'pointerenter';
export const TOP_POINTER_LEAVE = 'pointerleave';
export const TOP_POINTER_MOVE = 'pointermove';
export const TOP_POINTER_OUT = 'pointerout';
export const TOP_POINTER_OVER = 'pointerover';
export const TOP_POINTER_UP = 'pointerup';
export const TOP_PROGRESS = 'progress';
export const TOP_RATE_CHANGE = 'ratechange';
export const TOP_RESET = 'reset';
export const TOP_SCROLL = 'scroll';
export const TOP_SEEKED = 'seeked';
export const TOP_SEEKING = 'seeking';
export const TOP_SELECTION_CHANGE = 'selectionchange';
export const TOP_STALLED = 'stalled';
export const TOP_SUBMIT = 'submit';
export const TOP_SUSPEND = 'suspend';
export const TOP_TEXT_INPUT = 'textInput';
export const TOP_TIME_UPDATE = 'timeupdate';
export const TOP_TOGGLE = 'toggle';
export const TOP_TOUCH_CANCEL = 'touchcancel';
export const TOP_TOUCH_END = 'touchend';
export const TOP_TOUCH_MOVE = 'touchmove';
export const TOP_TOUCH_START = 'touchstart';
export const TOP_TRANSITION_END = getVendorPrefixedEventName('transitionend');
export const TOP_VOLUME_CHANGE = 'volumechange';
export const TOP_WAITING = 'waiting';
export const TOP_WHEEL = 'wheel';
export const TOP_AFTER_BLUR = 'afterblur';
export const TOP_BEFORE_BLUR = 'beforeblur';
export const TOP_FOCUS_IN = 'focusin';
export const TOP_FOCUS_OUT = 'focusout';
