/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule SyntheticAnimationEvent
 */

'use strict';

var SyntheticEvent = require('SyntheticEvent');

/**
 * @interface Event
 * @see http://www.w3.org/TR/css3-animations/#AnimationEvent-interface
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AnimationEvent
 */
var AnimationEventInterface = {
  animationName: null,
  elapsedTime: null,
  pseudoElement: null,
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticEvent}
 */
function SyntheticAnimationEvent(
  dispatchConfig,
  dispatchMarker,
  nativeEvent,
  nativeEventTarget,
) {
  return SyntheticEvent.call(
    this,
    dispatchConfig,
    dispatchMarker,
    nativeEvent,
    nativeEventTarget,
  );
}

SyntheticEvent.augmentClass(SyntheticAnimationEvent, AnimationEventInterface);

module.exports = SyntheticAnimationEvent;
