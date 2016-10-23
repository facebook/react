/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SyntheticTouchEvent
 */

'use strict';

var SyntheticUIEvent = require('SyntheticUIEvent');

var getEventModifierState = require('getEventModifierState');

var currentTargetDict = {};

/**
 * Set the currentTarget for each Touch in the touches.
 * @param {TouchList} touches
 * @param {Boolean} changed - true for changedTouches, false otherwise
 */
function addCurrentTarget(touches, changed) {
  for (var i = 0; i < touches.length; i++) {
    var touch = touches[i];
    if (changed) {
      var currentTarget = document.elementFromPoint(touch.clientX, touch.clientY);
      touch.currentTarget = currentTarget;
      if (touch.type === 'touchend' || touch.type === 'touchcancel') {
        delete currentTargetDict[touch.identifier];
      } else {
        currentTargetDict[touch.identifier] = currentTarget;
      }
    } else {
      touch.currentTarget = currentTargetDict[touch.identifier];
    }
  }
}

/**
 * @interface TouchEvent
 * @see http://www.w3.org/TR/touch-events/
 */
var TouchEventInterface = {
  // changedTouches should appear first so that its normalize function can
  // update currentTargetDict first before the normalize functions for touches
  // and targetTouches is called.  It would be nice to not have this dependency,
  // but calling elementFromPoint to get the current target is expensive so we
  // cache the results the changedTouches' normalize function.
  changedTouches: function(nativeEvent) {
    addCurrentTarget(nativeEvent.changedTouches, true);
    return nativeEvent.changedTouches;
  },
  touches: function(nativeEvent) {
    addCurrentTarget(nativeEvent.touches, false);
    return nativeEvent.touches;
  },
  targetTouches: function(nativeEvent) {
    addCurrentTarget(nativeEvent.targetTouches, false);
    return nativeEvent.targetTouches;
  },
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
function SyntheticTouchEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
  return SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);
}

SyntheticUIEvent.augmentClass(SyntheticTouchEvent, TouchEventInterface);

module.exports = SyntheticTouchEvent;
