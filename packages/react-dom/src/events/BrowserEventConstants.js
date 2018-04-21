/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TopLevelType} from 'events/TopLevelEventTypes';
import invariant from 'fbjs/lib/invariant';

import * as DOMTopLevelEventTypes from './DOMTopLevelEventTypes';
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
    DOMTopLevelEventTypes.TOP_ANIMATION_END,
    getVendorPrefixedEventName('animationend'),
  ],
  [
    DOMTopLevelEventTypes.TOP_ANIMATION_ITERATION,
    getVendorPrefixedEventName('animationiteration'),
  ],
  [
    DOMTopLevelEventTypes.TOP_ANIMATION_START,
    getVendorPrefixedEventName('animationstart'),
  ],
  [DOMTopLevelEventTypes.TOP_BLUR, 'blur'],
  [DOMTopLevelEventTypes.TOP_CANCEL, 'cancel'],
  [DOMTopLevelEventTypes.TOP_CHANGE, 'change'],
  [DOMTopLevelEventTypes.TOP_CLICK, 'click'],
  [DOMTopLevelEventTypes.TOP_CLOSE, 'close'],
  [DOMTopLevelEventTypes.TOP_COMPOSITION_END, 'compositionend'],
  [DOMTopLevelEventTypes.TOP_COMPOSITION_START, 'compositionstart'],
  [DOMTopLevelEventTypes.TOP_COMPOSITION_UPDATE, 'compositionupdate'],
  [DOMTopLevelEventTypes.TOP_CONTEXT_MENU, 'contextmenu'],
  [DOMTopLevelEventTypes.TOP_COPY, 'copy'],
  [DOMTopLevelEventTypes.TOP_CUT, 'cut'],
  [DOMTopLevelEventTypes.TOP_DOUBLE_CLICK, 'dblclick'],
  [DOMTopLevelEventTypes.TOP_DRAG, 'drag'],
  [DOMTopLevelEventTypes.TOP_DRAG_END, 'dragend'],
  [DOMTopLevelEventTypes.TOP_DRAG_ENTER, 'dragenter'],
  [DOMTopLevelEventTypes.TOP_DRAG_EXIT, 'dragexit'],
  [DOMTopLevelEventTypes.TOP_DRAG_LEAVE, 'dragleave'],
  [DOMTopLevelEventTypes.TOP_DRAG_OVER, 'dragover'],
  [DOMTopLevelEventTypes.TOP_DRAG_START, 'dragstart'],
  [DOMTopLevelEventTypes.TOP_DROP, 'drop'],
  [DOMTopLevelEventTypes.TOP_FOCUS, 'focus'],
  [DOMTopLevelEventTypes.TOP_KEY_DOWN, 'keydown'],
  [DOMTopLevelEventTypes.TOP_KEY_PRESS, 'keypress'],
  [DOMTopLevelEventTypes.TOP_KEY_UP, 'keyup'],
  [DOMTopLevelEventTypes.TOP_LOAD, 'load'],
  [DOMTopLevelEventTypes.TOP_LOAD_START, 'loadstart'],
  [DOMTopLevelEventTypes.TOP_MOUSE_DOWN, 'mousedown'],
  [DOMTopLevelEventTypes.TOP_MOUSE_MOVE, 'mousemove'],
  [DOMTopLevelEventTypes.TOP_MOUSE_OUT, 'mouseout'],
  [DOMTopLevelEventTypes.TOP_MOUSE_OVER, 'mouseover'],
  [DOMTopLevelEventTypes.TOP_MOUSE_UP, 'mouseup'],
  [DOMTopLevelEventTypes.TOP_PASTE, 'paste'],
  [DOMTopLevelEventTypes.TOP_SCROLL, 'scroll'],
  [DOMTopLevelEventTypes.TOP_SELECTION_CHANGE, 'selectionchange'],
  [DOMTopLevelEventTypes.TOP_TEXT_INPUT, 'textInput'],
  [DOMTopLevelEventTypes.TOP_TOGGLE, 'toggle'],
  [DOMTopLevelEventTypes.TOP_TOUCH_CANCEL, 'touchcancel'],
  [DOMTopLevelEventTypes.TOP_TOUCH_END, 'touchend'],
  [DOMTopLevelEventTypes.TOP_TOUCH_MOVE, 'touchmove'],
  [DOMTopLevelEventTypes.TOP_TOUCH_START, 'touchstart'],
  [
    DOMTopLevelEventTypes.TOP_TRANSITION_END,
    getVendorPrefixedEventName('transitionend'),
  ],
  [DOMTopLevelEventTypes.TOP_WHEEL, 'wheel'],
]);

// There are so many media events, it makes sense to just
// maintain a list of them. Note these aren't technically
// "top-level" since they don't bubble. We should come up
// with a better naming convention if we come to refactoring
// the event system.
export const mediaEventTypes: Map<TopLevelType, string> = makeMap([
  [DOMTopLevelEventTypes.TOP_ABORT, 'abort'],
  [DOMTopLevelEventTypes.TOP_CAN_PLAY, 'canplay'],
  [DOMTopLevelEventTypes.TOP_CAN_PLAY_THROUGH, 'canplaythrough'],
  [DOMTopLevelEventTypes.TOP_DURATION_CHANGE, 'durationchange'],
  [DOMTopLevelEventTypes.TOP_EMPTIED, 'emptied'],
  [DOMTopLevelEventTypes.TOP_ENCRYPTED, 'encrypted'],
  [DOMTopLevelEventTypes.TOP_ENDED, 'ended'],
  [DOMTopLevelEventTypes.TOP_ERROR, 'error'],
  [DOMTopLevelEventTypes.TOP_LOADED_DATA, 'loadeddata'],
  [DOMTopLevelEventTypes.TOP_LOADED_METADATA, 'loadedmetadata'],
  [DOMTopLevelEventTypes.TOP_LOAD_START, 'loadstart'],
  [DOMTopLevelEventTypes.TOP_PAUSE, 'pause'],
  [DOMTopLevelEventTypes.TOP_PLAY, 'play'],
  [DOMTopLevelEventTypes.TOP_PLAYING, 'playing'],
  [DOMTopLevelEventTypes.TOP_PROGRESS, 'progress'],
  [DOMTopLevelEventTypes.TOP_RATE_CHANGE, 'ratechange'],
  [DOMTopLevelEventTypes.TOP_SEEKED, 'seeked'],
  [DOMTopLevelEventTypes.TOP_SEEKING, 'seeking'],
  [DOMTopLevelEventTypes.TOP_STALLED, 'stalled'],
  [DOMTopLevelEventTypes.TOP_SUSPEND, 'suspend'],
  [DOMTopLevelEventTypes.TOP_TIME_UPDATE, 'timeupdate'],
  [DOMTopLevelEventTypes.TOP_VOLUME_CHANGE, 'volumechange'],
  [DOMTopLevelEventTypes.TOP_WAITING, 'waiting'],
]);

const nonTopEventTypes: Map<TopLevelType, string> = makeMap([
  [DOMTopLevelEventTypes.TOP_INPUT, 'input'],
  [DOMTopLevelEventTypes.TOP_INVALID, 'invalid'],
  [DOMTopLevelEventTypes.TOP_RESET, 'reset'],
  [DOMTopLevelEventTypes.TOP_SUBMIT, 'submit'],
]);

export function getRawEventName(topLevelType: TopLevelType): string {
  const eventName =
    topLevelTypes.get(topLevelType) ||
    mediaEventTypes.get(topLevelType) ||
    nonTopEventTypes.get(topLevelType);

  invariant(
    eventName,
    'BrowserEventConstants: Could not look up raw event name of topLevelType: %s.',
    topLevelType,
  );
  return eventName;
}
