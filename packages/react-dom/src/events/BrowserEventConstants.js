/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import getVendorPrefixedEventName from './getVendorPrefixedEventName';
import * as TopLevelEventTypes from 'events/TopLevelEventTypes';

/**
 * Types of raw signals from the browser caught at the top level.
 *
 * For events like 'submit' which don't consistently bubble (which we
 * trap at a lower node than `document`), binding at `document` would
 * cause duplicate events so we don't include them here.
 */
const topLevelTypes = new Map([
  [TopLevelEventTypes.TOP_ABORT, 'abort'],
  [
    TopLevelEventTypes.TOP_ANIMATION_END,
    getVendorPrefixedEventName('animationend') || 'animationend',
  ],
  [
    TopLevelEventTypes.TOP_ANIMATION_ITERATION,
    getVendorPrefixedEventName('animationiteration') || 'animationiteration',
  ],
  [
    TopLevelEventTypes.TOP_ANIMATION_START,
    getVendorPrefixedEventName('animationstart') || 'animationstart',
  ],
  [TopLevelEventTypes.TOP_BLUR, 'blur'],
  [TopLevelEventTypes.TOP_CANCEL, 'cancel'],
  [TopLevelEventTypes.TOP_CAN_PLAY, 'canplay'],
  [TopLevelEventTypes.TOP_CAN_PLAY_THROUGH, 'canplaythrough'],
  [TopLevelEventTypes.TOP_CHANGE, 'change'],
  [TopLevelEventTypes.TOP_CLICK, 'click'],
  [TopLevelEventTypes.TOP_CLOSE, 'close'],
  [TopLevelEventTypes.TOP_COMPOSITION_END, 'compositionend'],
  [TopLevelEventTypes.TOP_COMPOSITION_START, 'compositionstart'],
  [TopLevelEventTypes.TOP_COMPOSITION_UPDATE, 'compositionupdate'],
  [TopLevelEventTypes.TOP_CONTEXT_MENU, 'contextmenu'],
  [TopLevelEventTypes.TOP_COPY, 'copy'],
  [TopLevelEventTypes.TOP_CUT, 'cut'],
  [TopLevelEventTypes.TOP_DOUBLE_CLICK, 'dblclick'],
  [TopLevelEventTypes.TOP_DRAG, 'drag'],
  [TopLevelEventTypes.TOP_DRAG_END, 'dragend'],
  [TopLevelEventTypes.TOP_DRAG_ENTER, 'dragenter'],
  [TopLevelEventTypes.TOP_DRAG_EXIT, 'dragexit'],
  [TopLevelEventTypes.TOP_DRAG_LEAVE, 'dragleave'],
  [TopLevelEventTypes.TOP_DRAG_OVER, 'dragover'],
  [TopLevelEventTypes.TOP_DRAG_START, 'dragstart'],
  [TopLevelEventTypes.TOP_DROP, 'drop'],
  [TopLevelEventTypes.TOP_DURATION_CHANGE, 'durationchange'],
  [TopLevelEventTypes.TOP_EMPTIED, 'emptied'],
  [TopLevelEventTypes.TOP_ENCRYPTED, 'encrypted'],
  [TopLevelEventTypes.TOP_ENDED, 'ended'],
  [TopLevelEventTypes.TOP_ERROR, 'error'],
  [TopLevelEventTypes.TOP_FOCUS, 'focus'],
  [TopLevelEventTypes.TOP_INPUT, 'input'],
  [TopLevelEventTypes.TOP_KEY_DOWN, 'keydown'],
  [TopLevelEventTypes.TOP_KEY_PRESS, 'keypress'],
  [TopLevelEventTypes.TOP_KEY_UP, 'keyup'],
  [TopLevelEventTypes.TOP_LOADED_DATA, 'loadeddata'],
  [TopLevelEventTypes.TOP_LOAD, 'load'],
  [TopLevelEventTypes.TOP_LOADED_METADATA, 'loadedmetadata'],
  [TopLevelEventTypes.TOP_LOAD_START, 'loadstart'],
  [TopLevelEventTypes.TOP_MOUSE_DOWN, 'mousedown'],
  [TopLevelEventTypes.TOP_MOUSE_MOVE, 'mousemove'],
  [TopLevelEventTypes.TOP_MOUSE_OUT, 'mouseout'],
  [TopLevelEventTypes.TOP_MOUSE_OVER, 'mouseover'],
  [TopLevelEventTypes.TOP_MOUSE_UP, 'mouseup'],
  [TopLevelEventTypes.TOP_PASTE, 'paste'],
  [TopLevelEventTypes.TOP_PAUSE, 'pause'],
  [TopLevelEventTypes.TOP_PLAY, 'play'],
  [TopLevelEventTypes.TOP_PLAYING, 'playing'],
  [TopLevelEventTypes.TOP_PROGRESS, 'progress'],
  [TopLevelEventTypes.TOP_RATE_CHANGE, 'ratechange'],
  [TopLevelEventTypes.TOP_SCROLL, 'scroll'],
  [TopLevelEventTypes.TOP_SEEKED, 'seeked'],
  [TopLevelEventTypes.TOP_SEEKING, 'seeking'],
  [TopLevelEventTypes.TOP_SELECTION_CHANGE, 'selectionchange'],
  [TopLevelEventTypes.TOP_STALLED, 'stalled'],
  [TopLevelEventTypes.TOP_SUSPEND, 'suspend'],
  [TopLevelEventTypes.TOP_TEXT_INPUT, 'textInput'],
  [TopLevelEventTypes.TOP_TIME_UPDATE, 'timeupdate'],
  [TopLevelEventTypes.TOP_TOGGLE, 'toggle'],
  [TopLevelEventTypes.TOP_TOUCH_CANCEL, 'touchcancel'],
  [TopLevelEventTypes.TOP_TOUCH_END, 'touchend'],
  [TopLevelEventTypes.TOP_TOUCH_MOVE, 'touchmove'],
  [TopLevelEventTypes.TOP_TOUCH_START, 'touchstart'],
  [
    TopLevelEventTypes.TOP_TRANSITION_END,
    getVendorPrefixedEventName('transitionend') || 'transitionend',
  ],
  [TopLevelEventTypes.TOP_VOLUME_CHANGE, 'volumechange'],
  [TopLevelEventTypes.TOP_WAITING, 'waiting'],
  [TopLevelEventTypes.TOP_WHEEL, 'wheel'],
]);

export type TopLevelTypes = $Enum<typeof topLevelTypes>;

const BrowserEventConstants = {
  topLevelTypes,
};

export default BrowserEventConstants;
