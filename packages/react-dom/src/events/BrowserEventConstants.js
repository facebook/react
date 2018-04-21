/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as TopLevelEventTypes from 'events/TopLevelEventTypes';
import type {TopLevelType} from 'events/TopLevelEventTypes';
import invariant from 'fbjs/lib/invariant';

import getVendorPrefixedEventName from './getVendorPrefixedEventName';

/**
 * Small helper function to create a map using the Map constructor arguments.
 * This is needed because IE11 does not implement that constructor.
 */
function makeMap<K, V>(values: Array<[K, V]>): Map<K, V> {
  const map: Map<K, V> = new Map();
  values.forEach(([k, v]) => {
    map.set(k, v);
  });
  return map;
}

/**
 * Types of raw signals from the browser caught at the top level.
 *
 * For events like 'submit' or audio/video events which don't consistently
 * bubble (which we trap at a lower node than `document`), binding
 * at `document` would cause duplicate events so we don't include them here.
 */
export const topLevelTypes: Map<TopLevelType, string> = makeMap([
  [
    TopLevelEventTypes.TOP_ANIMATION_END,
    getVendorPrefixedEventName('animationend'),
  ],
  [
    TopLevelEventTypes.TOP_ANIMATION_ITERATION,
    getVendorPrefixedEventName('animationiteration'),
  ],
  [
    TopLevelEventTypes.TOP_ANIMATION_START,
    getVendorPrefixedEventName('animationstart'),
  ],
  [TopLevelEventTypes.TOP_BLUR, 'blur'],
  [TopLevelEventTypes.TOP_CANCEL, 'cancel'],
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
  [TopLevelEventTypes.TOP_FOCUS, 'focus'],
  [TopLevelEventTypes.TOP_KEY_DOWN, 'keydown'],
  [TopLevelEventTypes.TOP_KEY_PRESS, 'keypress'],
  [TopLevelEventTypes.TOP_KEY_UP, 'keyup'],
  [TopLevelEventTypes.TOP_LOAD, 'load'],
  [TopLevelEventTypes.TOP_LOAD_START, 'loadstart'],
  [TopLevelEventTypes.TOP_MOUSE_DOWN, 'mousedown'],
  [TopLevelEventTypes.TOP_MOUSE_MOVE, 'mousemove'],
  [TopLevelEventTypes.TOP_MOUSE_OUT, 'mouseout'],
  [TopLevelEventTypes.TOP_MOUSE_OVER, 'mouseover'],
  [TopLevelEventTypes.TOP_MOUSE_UP, 'mouseup'],
  [TopLevelEventTypes.TOP_PASTE, 'paste'],
  [TopLevelEventTypes.TOP_SCROLL, 'scroll'],
  [TopLevelEventTypes.TOP_SELECTION_CHANGE, 'selectionchange'],
  [TopLevelEventTypes.TOP_TEXT_INPUT, 'textInput'],
  [TopLevelEventTypes.TOP_TOGGLE, 'toggle'],
  [TopLevelEventTypes.TOP_TOUCH_CANCEL, 'touchcancel'],
  [TopLevelEventTypes.TOP_TOUCH_END, 'touchend'],
  [TopLevelEventTypes.TOP_TOUCH_MOVE, 'touchmove'],
  [TopLevelEventTypes.TOP_TOUCH_START, 'touchstart'],
  [
    TopLevelEventTypes.TOP_TRANSITION_END,
    getVendorPrefixedEventName('transitionend'),
  ],
  [TopLevelEventTypes.TOP_WHEEL, 'wheel'],
]);

// There are so many media events, it makes sense to just
// maintain a list of them. Note these aren't technically
// "top-level" since they don't bubble. We should come up
// with a better naming convention if we come to refactoring
// the event system.
export const mediaEventTypes: Map<TopLevelType, string> = makeMap([
  [TopLevelEventTypes.TOP_ABORT, 'abort'],
  [TopLevelEventTypes.TOP_CAN_PLAY, 'canplay'],
  [TopLevelEventTypes.TOP_CAN_PLAY_THROUGH, 'canplaythrough'],
  [TopLevelEventTypes.TOP_DURATION_CHANGE, 'durationchange'],
  [TopLevelEventTypes.TOP_EMPTIED, 'emptied'],
  [TopLevelEventTypes.TOP_ENCRYPTED, 'encrypted'],
  [TopLevelEventTypes.TOP_ENDED, 'ended'],
  [TopLevelEventTypes.TOP_ERROR, 'error'],
  [TopLevelEventTypes.TOP_LOADED_DATA, 'loadeddata'],
  [TopLevelEventTypes.TOP_LOADED_METADATA, 'loadedmetadata'],
  [TopLevelEventTypes.TOP_LOAD_START, 'loadstart'],
  [TopLevelEventTypes.TOP_PAUSE, 'pause'],
  [TopLevelEventTypes.TOP_PLAY, 'play'],
  [TopLevelEventTypes.TOP_PLAYING, 'playing'],
  [TopLevelEventTypes.TOP_PROGRESS, 'progress'],
  [TopLevelEventTypes.TOP_RATE_CHANGE, 'ratechange'],
  [TopLevelEventTypes.TOP_SEEKED, 'seeked'],
  [TopLevelEventTypes.TOP_SEEKING, 'seeking'],
  [TopLevelEventTypes.TOP_STALLED, 'stalled'],
  [TopLevelEventTypes.TOP_SUSPEND, 'suspend'],
  [TopLevelEventTypes.TOP_TIME_UPDATE, 'timeupdate'],
  [TopLevelEventTypes.TOP_VOLUME_CHANGE, 'volumechange'],
  [TopLevelEventTypes.TOP_WAITING, 'waiting'],
]);

const nonTopEventTypes: Map<TopLevelType, string> = makeMap([
  [TopLevelEventTypes.TOP_INPUT, 'input'],
  [TopLevelEventTypes.TOP_INVALID, 'invalid'],
  [TopLevelEventTypes.TOP_RESET, 'reset'],
  [TopLevelEventTypes.TOP_SUBMIT, 'submit'],
]);

export function getRawEventName(topLevelType: TopLevelType): string {
  const eventName =
    topLevelTypes.get(topLevelType) ||
    mediaEventTypes.get(topLevelType) ||
    nonTopEventTypes.get(topLevelType);

  invariant(
    eventName,
    'BrowserEventConstants: Could not look up raw event name of topLevelType.',
  );
  return eventName;
}
