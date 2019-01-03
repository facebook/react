/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export const BLUR = 'blur';
export const CONTEXT_MENU = 'contextMenu';
export const DRAG_START = 'dragstart';
export const DRAG_END = 'dragend';
export const FOCUS = 'focus';
export const KEY_DOWN = 'keydown';
export const KEY_UP = 'keyup';
export const MOUSE_MOVE = 'mousemove';
export const MOUSE_DOWN = 'mousedown';
export const MOUSE_UP = 'mouseup';
export const MOUSE_OVER = 'mouseover';
export const MOUSE_OUT = 'mouseout';
export const MOUSE_LEAVE = 'mouseleave';
export const MOUSE_ENTER = 'mouseenter';
export const KEY_PRESS = 'keypress';
export const SELECTION_CHANGE = 'selectionchange';
export const COMPOSITION_END = 'compositionend';
export const COMPOSITION_START = 'compositionstart';
export const COMPOSITION_UPDATE = 'compositionupdate';
export const TEXT_INPUT = 'textInput';
export const PASTE = 'paste';
export const CLICK = 'click';
export const DOUBLE_CLICK = 'dblclick';
export const INPUT = 'input';
export const CHANGE = 'change';
export const SCROLL = 'scroll';
export const CANCEL = 'cancel';
export const CLOSE = 'close';
export const POINTER_OUT = 'pointerout';
export const POINTER_OVER = 'pointerover';
export const POINTER_LEAVE = 'pointerleave';
export const POINTER_ENTER = 'pointerenter';
export const POINTER_CANCEL = 'pointercancel';
export const POINTER_DOWN = 'pointerdown';
export const POINTER_UP = 'pointerup';
export const POINTER_MOVE = 'pointermove';
export const POINTER_CHANGE = 'pointerchange';
export const INVALID = 'invalid';
export const SUBMIT = 'submit';
export const RESET = 'reset';
export const LOAD = 'load';
export const LOAD_START = 'loadstart';
export const LOADED_METADATA = 'loadedmetadata';
export const LOADED_DATA = 'loadeddata';
export const ERROR = 'error';
export const PAUSE = 'pause';
export const PLAY = 'play';
export const PLAYING = 'playing';
export const TOUCH_MOVE = 'touchmove';
export const TOUCH_START = 'touchstart';
export const TOUCH_END = 'touchend';
export const TOUCH_CANCEL = 'touchcancel';
export const ABORT = 'abort';
export const TOGGLE = 'toggle';
export const COPY = 'copy';
export const DROP = 'drop';
export const CUT = 'cut';
export const AUX_CLICK = 'auxclick';
export const ENDED = 'ended';
export const SEEKED = 'seeked';
export const SEEKING = 'seeking';
export const STALLED = 'stalled';
export const SUSPEND = 'suspend';
export const TIME_CHANGE = 'timechange';
export const TIME_UPDATE = 'timeupdate';
export const VOLUME_CHANGE = 'volumechange';
export const WAITING = 'waiting';
export const PROGRESS = 'progress';
export const RATE_CHANGE = 'ratechange';
export const CAN_PLAY = 'canplay';
export const ENCRYPTED = 'encrypted';
export const EMPTIED = 'emptied';
export const DURATION_CHANGE = 'durationchange';
export const CAN_PLAY_THROUGH = 'canplaythrough';
export const ANIMATION_END = 'animationend';
export const ANIMATION_ITERATION = 'animationiteration';
export const ANIMATION_START = 'animationstart';
export const WHEEL = 'wheel';
export const TRANSITION_END = 'transitionend';
export const LOST_POINTER_CAPTURE = 'lostpointercapture';
export const GOT_POINTER_CAPTURE = 'gotpointercapture';
export const DRAG = 'drag';
export const DRAG_ENTER = 'dragenter';
export const DRAG_EXIT = 'dragexit';
export const DRAG_LEAVE = 'dragleave';
export const DRAG_OVER = 'dragover';

export const interactiveEvents: Set<string> = new Set([
  BLUR,
  CANCEL,
  CLICK,
  CLOSE,
  CONTEXT_MENU,
  COPY,
  CUT,
  AUX_CLICK,
  DOUBLE_CLICK,
  DRAG_END,
  DRAG_START,
  DROP,
  FOCUS,
  INPUT,
  INVALID,
  KEY_DOWN,
  KEY_PRESS,
  KEY_UP,
  MOUSE_DOWN,
  MOUSE_UP,
  PASTE,
  PAUSE,
  PLAY,
  POINTER_CANCEL,
  POINTER_DOWN,
  POINTER_UP,
  POINTER_CHANGE,
  RESET,
  SEEKED,
  SUBMIT,
  TOUCH_CANCEL,
  TOUCH_END,
  TOUCH_START,
  VOLUME_CHANGE,
]);

export const nonInteractiveEvents: Set<string> = new Set([
  ABORT,
  ANIMATION_END,
  ANIMATION_ITERATION,
  ANIMATION_START,
  CAN_PLAY,
  CAN_PLAY_THROUGH,
  DRAG,
  DRAG_ENTER,
  DRAG_EXIT,
  DRAG_LEAVE,
  DRAG_OVER,
  DURATION_CHANGE,
  EMPTIED,
  ENCRYPTED,
  ENDED,
  ERROR,
  GOT_POINTER_CAPTURE,
  LOAD,
  LOADED_DATA,
  LOADED_METADATA,
  LOAD_START,
  LOST_POINTER_CAPTURE,
  MOUSE_MOVE,
  MOUSE_OUT,
  MOUSE_OVER,
  PLAYING,
  POINTER_MOVE,
  POINTER_OUT,
  POINTER_OVER,
  PROGRESS,
  SCROLL,
  SEEKING,
  STALLED,
  SUSPEND,
  TIME_UPDATE,
  TOGGLE,
  TOUCH_MOVE,
  TRANSITION_END,
  WAITING,
  WHEEL,
]);

export const mediaEventTypesArr: Array<string> = [
  ABORT,
  CAN_PLAY,
  CAN_PLAY_THROUGH,
  DURATION_CHANGE,
  EMPTIED,
  ENCRYPTED,
  ENDED,
  ERROR,
  LOADED_DATA,
  LOADED_METADATA,
  LOAD_START,
  PAUSE,
  PLAY,
  PLAYING,
  PROGRESS,
  RATE_CHANGE,
  SEEKED,
  SEEKING,
  STALLED,
  SUSPEND,
  TIME_CHANGE,
  TIME_UPDATE,
  VOLUME_CHANGE,
  WAITING,
];

export const mediaEventTypes: Set<string> = new Set(mediaEventTypesArr);

/**
 * Normalization of deprecated HTML5 `key` values
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
 */
export const normalizeKey = {
  Esc: 'Escape',
  Spacebar: ' ',
  Left: 'ArrowLeft',
  Up: 'ArrowUp',
  Right: 'ArrowRight',
  Down: 'ArrowDown',
  Del: 'Delete',
  Win: 'OS',
  Menu: 'ContextMenu',
  Apps: 'ContextMenu',
  Scroll: 'ScrollLock',
  MozPrintableKey: 'Unidentified',
};

/**
 * Translation from legacy `keyCode` to HTML5 `key`
 * Only special keys supported, all others depend on keyboard layout or browser
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
 */
export const translateToKey = {
  '8': 'Backspace',
  '9': 'Tab',
  '12': 'Clear',
  '13': 'Enter',
  '16': 'Shift',
  '17': 'Control',
  '18': 'Alt',
  '19': 'Pause',
  '20': 'CapsLock',
  '27': 'Escape',
  '32': ' ',
  '33': 'PageUp',
  '34': 'PageDown',
  '35': 'End',
  '36': 'Home',
  '37': 'ArrowLeft',
  '38': 'ArrowUp',
  '39': 'ArrowRight',
  '40': 'ArrowDown',
  '45': 'Insert',
  '46': 'Delete',
  '112': 'F1',
  '113': 'F2',
  '114': 'F3',
  '115': 'F4',
  '116': 'F5',
  '117': 'F6',
  '118': 'F7',
  '119': 'F8',
  '120': 'F9',
  '121': 'F10',
  '122': 'F11',
  '123': 'F12',
  '144': 'NumLock',
  '145': 'ScrollLock',
  '224': 'Meta',
};
