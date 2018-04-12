/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {isStartish, isEndish} from 'events/EventPluginUtils';
import {accumulateTwoPhaseDispatches} from 'events/EventPropagators';
import TouchEventUtils from 'fbjs/lib/TouchEventUtils';

import SyntheticUIEvent from './SyntheticUIEvent';

/**
 * We are extending the Flow 'Touch' declaration to enable using bracket
 * notation to access properties.
 * Without this adjustment Flow throws
 * "Indexable signature not found in Touch".
 * See https://github.com/facebook/flow/issues/1323
 */
type TouchPropertyKey = 'clientX' | 'clientY' | 'pageX' | 'pageY';

declare class _Touch extends Touch {
  [key: TouchPropertyKey]: number;
}

type AxisCoordinateData = {
  page: TouchPropertyKey,
  client: TouchPropertyKey,
  envScroll: 'currentPageScrollLeft' | 'currentPageScrollTop',
};

type AxisType = {
  x: AxisCoordinateData,
  y: AxisCoordinateData,
};

type CoordinatesType = {
  x: number,
  y: number,
};

/**
 * Number of pixels that are tolerated in between a `touchStart` and `touchEnd`
 * in order to still be considered a 'tap' event.
 */
const tapMoveThreshold = 10;
const startCoords: CoordinatesType = {x: 0, y: 0};

const Axis: AxisType = {
  x: {page: 'pageX', client: 'clientX', envScroll: 'currentPageScrollLeft'},
  y: {page: 'pageY', client: 'clientY', envScroll: 'currentPageScrollTop'},
};

function getAxisCoordOfEvent(
  axis: AxisCoordinateData,
  nativeEvent: _Touch,
): number {
  const singleTouch = TouchEventUtils.extractSingleTouch(nativeEvent);
  if (singleTouch) {
    return singleTouch[axis.page];
  }
  return nativeEvent[axis.page];
}

function getDistance(coords: CoordinatesType, nativeEvent: _Touch): number {
  const pageX = getAxisCoordOfEvent(Axis.x, nativeEvent);
  const pageY = getAxisCoordOfEvent(Axis.y, nativeEvent);
  return Math.pow(
    Math.pow(pageX - coords.x, 2) + Math.pow(pageY - coords.y, 2),
    0.5,
  );
}

const touchEvents = [
  'topTouchStart',
  'topTouchCancel',
  'topTouchEnd',
  'topTouchMove',
];

const dependencies = ['topMouseDown', 'topMouseMove', 'topMouseUp'].concat(
  touchEvents,
);

const eventTypes = {
  touchTap: {
    phasedRegistrationNames: {
      bubbled: 'onTouchTap',
      captured: 'onTouchTapCapture',
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
    topLevelType: mixed,
    targetInst: mixed,
    nativeEvent: _Touch,
    nativeEventTarget: EventTarget,
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
      if (usedTouch && Date.now() - usedTouchTime < TOUCH_DELAY) {
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
        nativeEventTarget,
      );
    }
    if (isStartish(topLevelType)) {
      startCoords.x = getAxisCoordOfEvent(Axis.x, nativeEvent);
      startCoords.y = getAxisCoordOfEvent(Axis.y, nativeEvent);
    } else if (isEndish(topLevelType)) {
      startCoords.x = 0;
      startCoords.y = 0;
    }
    accumulateTwoPhaseDispatches(event);
    return event;
  },
};

export default TapEventPlugin;
