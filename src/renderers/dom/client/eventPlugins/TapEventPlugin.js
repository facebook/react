/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TapEventPlugin
 */

'use strict';

const EventConstants = require('EventConstants');
const EventPluginUtils = require('EventPluginUtils');
const EventPropagators = require('EventPropagators');
const SyntheticUIEvent = require('SyntheticUIEvent');
const TouchEventUtils = require('TouchEventUtils');
const ViewportMetrics = require('ViewportMetrics');

const keyOf = require('keyOf');
const topLevelTypes = EventConstants.topLevelTypes;

const isStartish = EventPluginUtils.isStartish;
const isEndish = EventPluginUtils.isEndish;

/**
 * Number of pixels that are tolerated in between a `touchStart` and `touchEnd`
 * in order to still be considered a 'tap' event.
 */
const tapMoveThreshold = 10;
const startCoords = {x: null, y: null};

const Axis = {
  x: {page: 'pageX', client: 'clientX', envScroll: 'currentPageScrollLeft'},
  y: {page: 'pageY', client: 'clientY', envScroll: 'currentPageScrollTop'},
};

function getAxisCoordOfEvent(axis, nativeEvent) {
  const singleTouch = TouchEventUtils.extractSingleTouch(nativeEvent);
  if (singleTouch) {
    return singleTouch[axis.page];
  }
  return axis.page in nativeEvent ?
    nativeEvent[axis.page] :
    nativeEvent[axis.client] + ViewportMetrics[axis.envScroll];
}

function getDistance(coords, nativeEvent) {
  const pageX = getAxisCoordOfEvent(Axis.x, nativeEvent);
  const pageY = getAxisCoordOfEvent(Axis.y, nativeEvent);
  return Math.pow(
    Math.pow(pageX - coords.x, 2) + Math.pow(pageY - coords.y, 2),
    0.5
  );
}

const touchEvents = [
  topLevelTypes.topTouchStart,
  topLevelTypes.topTouchCancel,
  topLevelTypes.topTouchEnd,
  topLevelTypes.topTouchMove,
];

const dependencies = [
  topLevelTypes.topMouseDown,
  topLevelTypes.topMouseMove,
  topLevelTypes.topMouseUp,
].concat(touchEvents);

const eventTypes = {
  touchTap: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchTap: null}),
      captured: keyOf({onTouchTapCapture: null}),
    },
    dependencies: dependencies,
  },
};

let usedTouch = false;
let usedTouchTime = 0;
const TOUCH_DELAY = 1000;

const TapEventPlugin = {

  tapMoveThreshold: tapMoveThreshold,

  eventTypes: eventTypes,

  extractEvents: function(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    if (!isStartish(topLevelType) && !isEndish(topLevelType)) {
      return null;
    }
    // on ios, there is a delay after touch event and synthetic
    // mouse events, so that user can perform double tap
    // solution: ignore mouse events following touchevent within small timeframe
    if (touchEvents.indexOf(topLevelType) !== -1) {
      usedTouch = true;
      usedTouchTime = Date.now();
    } else {
      if (usedTouch && (Date.now() - usedTouchTime < TOUCH_DELAY)) {
        return null;
      }
    }
    let event = null;
    const distance = getDistance(startCoords, nativeEvent);
    if (isEndish(topLevelType) && distance < tapMoveThreshold) {
      event = SyntheticUIEvent.getPooled(
        eventTypes.touchTap,
        targetInst,
        nativeEvent,
        nativeEventTarget
      );
    }
    if (isStartish(topLevelType)) {
      startCoords.x = getAxisCoordOfEvent(Axis.x, nativeEvent);
      startCoords.y = getAxisCoordOfEvent(Axis.y, nativeEvent);
    } else if (isEndish(topLevelType)) {
      startCoords.x = 0;
      startCoords.y = 0;
    }
    EventPropagators.accumulateTwoPhaseDispatches(event);
    return event;
  },

};

module.exports = TapEventPlugin;
