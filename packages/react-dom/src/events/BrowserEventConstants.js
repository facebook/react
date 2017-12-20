/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import getVendorPrefixedEventName from './getVendorPrefixedEventName';
import {topLevelEventsToDispatchConfig} from './SimpleEventPlugin';
import * as TopLevelEventTypes from 'events/TopLevelEventTypes';

/**
 * Types of raw signals from the browser caught at the top level.
 *
 * For events like 'submit' which don't consistently bubble (which we
 * trap at a lower node than `document`), binding at `document` would
 * cause duplicate events so we don't include them here.
 */
const cache = new Map([
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
  [TopLevelEventTypes.TOP_CHANGE, 'change'],
  [TopLevelEventTypes.TOP_COMPOSITION_END, 'compositionend'],
  [TopLevelEventTypes.TOP_COMPOSITION_START, 'compositionstart'],
  [TopLevelEventTypes.TOP_COMPOSITION_UPDATE, 'compositionupdate'],
  [TopLevelEventTypes.TOP_DOUBLE_CLICK, 'dblclick'],
  [TopLevelEventTypes.TOP_SELECTION_CHANGE, 'selectionchange'],
  [TopLevelEventTypes.TOP_TEXT_INPUT, 'textInput'],
  [TopLevelEventTypes.TOP_TOGGLE, 'toggle'],
  [
    TopLevelEventTypes.TOP_TRANSITION_END,
    getVendorPrefixedEventName('transitionend') || 'transitionend',
  ],
]);

export function getRawEventName(topLevelType) {
  const maybeName = cache.get(topLevelType);
  if (typeof maybeName === 'string') {
    return maybeName;
  }
  // Fallback
  const config = topLevelEventsToDispatchConfig.get(topLevelTypes);
  const name = phasedRegistrationNames.bubbled.slice(2);
  cache.set(topLevelType, name);
  // TODO: this is not exactly the same because we used to
  // intentionally skip over some events?
  return name;
}

export type TopLevelTypes = $Enum<typeof topLevelTypes>;
