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

export const TOP_ABORT = (('abort': any): TopLevelType);
export const TOP_ANIMATION_END = ((getVendorPrefixedEventName(
  'animationend',
): any): TopLevelType);
export const TOP_ANIMATION_ITERATION = ((getVendorPrefixedEventName(
  'animationiteration',
): any): TopLevelType);
export const TOP_ANIMATION_START = ((getVendorPrefixedEventName(
  'animationstart',
): any): TopLevelType);
export const TOP_BLUR = (('blur': any): TopLevelType);
export const TOP_CAN_PLAY = (('canplay': any): TopLevelType);
export const TOP_CAN_PLAY_THROUGH = (('canplaythrough': any): TopLevelType);
export const TOP_CANCEL = (('cancel': any): TopLevelType);
export const TOP_CHANGE = (('change': any): TopLevelType);
export const TOP_CLICK = (('click': any): TopLevelType);
export const TOP_CLOSE = (('close': any): TopLevelType);
export const TOP_COMPOSITION_END = (('compositionend': any): TopLevelType);
export const TOP_COMPOSITION_START = (('compositionstart': any): TopLevelType);
export const TOP_COMPOSITION_UPDATE = (('compositionupdate': any): TopLevelType);
export const TOP_CONTEXT_MENU = (('contextmenu': any): TopLevelType);
export const TOP_COPY = (('copy': any): TopLevelType);
export const TOP_CUT = (('cut': any): TopLevelType);
export const TOP_DOUBLE_CLICK = (('dblclick': any): TopLevelType);
export const TOP_DRAG = (('drag': any): TopLevelType);
export const TOP_DRAG_END = (('dragend': any): TopLevelType);
export const TOP_DRAG_ENTER = (('dragenter': any): TopLevelType);
export const TOP_DRAG_EXIT = (('dragexit': any): TopLevelType);
export const TOP_DRAG_LEAVE = (('dragleave': any): TopLevelType);
export const TOP_DRAG_OVER = (('dragover': any): TopLevelType);
export const TOP_DRAG_START = (('dragstart': any): TopLevelType);
export const TOP_DROP = (('drop': any): TopLevelType);
export const TOP_DURATION_CHANGE = (('durationchange': any): TopLevelType);
export const TOP_EMPTIED = (('emptied': any): TopLevelType);
export const TOP_ENCRYPTED = (('encrypted': any): TopLevelType);
export const TOP_ENDED = (('ended': any): TopLevelType);
export const TOP_ERROR = (('error': any): TopLevelType);
export const TOP_FOCUS = (('focus': any): TopLevelType);
export const TOP_INPUT = (('input': any): TopLevelType);
export const TOP_INVALID = (('invalid': any): TopLevelType);
export const TOP_KEY_DOWN = (('keydown': any): TopLevelType);
export const TOP_KEY_PRESS = (('keypress': any): TopLevelType);
export const TOP_KEY_UP = (('keyup': any): TopLevelType);
export const TOP_LOAD = (('load': any): TopLevelType);
export const TOP_LOAD_START = (('loadstart': any): TopLevelType);
export const TOP_LOADED_DATA = (('loadeddata': any): TopLevelType);
export const TOP_LOADED_METADATA = (('loadedmetadata': any): TopLevelType);
export const TOP_MOUSE_DOWN = (('mousedown': any): TopLevelType);
export const TOP_MOUSE_MOVE = (('mousemove': any): TopLevelType);
export const TOP_MOUSE_OUT = (('mouseout': any): TopLevelType);
export const TOP_MOUSE_OVER = (('mouseover': any): TopLevelType);
export const TOP_MOUSE_UP = (('mouseup': any): TopLevelType);
export const TOP_PASTE = (('paste': any): TopLevelType);
export const TOP_PAUSE = (('pause': any): TopLevelType);
export const TOP_PLAY = (('play': any): TopLevelType);
export const TOP_PLAYING = (('playing': any): TopLevelType);
export const TOP_PROGRESS = (('progress': any): TopLevelType);
export const TOP_RATE_CHANGE = (('ratechange': any): TopLevelType);
export const TOP_RESET = (('reset': any): TopLevelType);
export const TOP_SCROLL = (('scroll': any): TopLevelType);
export const TOP_SEEKED = (('seeked': any): TopLevelType);
export const TOP_SEEKING = (('seeking': any): TopLevelType);
export const TOP_SELECTION_CHANGE = (('selectionchange': any): TopLevelType);
export const TOP_STALLED = (('stalled': any): TopLevelType);
export const TOP_SUBMIT = (('submit': any): TopLevelType);
export const TOP_SUSPEND = (('suspend': any): TopLevelType);
export const TOP_TEXT_INPUT = (('textInput': any): TopLevelType);
export const TOP_TIME_UPDATE = (('timeupdate': any): TopLevelType);
export const TOP_TOGGLE = (('toggle': any): TopLevelType);
export const TOP_TOUCH_CANCEL = (('touchcancel': any): TopLevelType);
export const TOP_TOUCH_END = (('touchend': any): TopLevelType);
export const TOP_TOUCH_MOVE = (('touchmove': any): TopLevelType);
export const TOP_TOUCH_START = (('touchstart': any): TopLevelType);
export const TOP_TRANSITION_END = ((getVendorPrefixedEventName(
  'transitionend',
): any): TopLevelType);
export const TOP_VOLUME_CHANGE = (('volumechange': any): TopLevelType);
export const TOP_WAITING = (('waiting': any): TopLevelType);
export const TOP_WHEEL = (('wheel': any): TopLevelType);

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

export function getRawEventName(topLevelType: TopLevelType): string {
  return (topLevelType: any);
}
