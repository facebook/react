/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule SyntheticTouchEvent
 */

'use strict';

var SyntheticUIEvent = require('SyntheticUIEvent');

var getEventModifierState = require('getEventModifierState');

/**
 * @interface TouchEvent
 * @see http://www.w3.org/TR/touch-events/
 */
var TouchEventInterface = {
  touches: null,
  targetTouches: null,
  changedTouches: null,
  altKey: null,
  metaKey: null,
  ctrlKey: null,
  shiftKey: null,
  getModifierState: getEventModifierState,
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticTouchEvent(
  dispatchConfig,
  dispatchMarker,
  nativeEvent,
  nativeEventTarget,
) {
  return SyntheticUIEvent.call(
    this,
    dispatchConfig,
    dispatchMarker,
    nativeEvent,
    nativeEventTarget,
  );
}

SyntheticUIEvent.augmentClass(SyntheticTouchEvent, TouchEventInterface);

module.exports = SyntheticTouchEvent;
