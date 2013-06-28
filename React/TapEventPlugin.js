/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule TapEventPlugin
 */

"use strict";

var AbstractEvent = require("./AbstractEvent");
var EventPluginUtils = require("./EventPluginUtils");
var EventPropagators = require("./EventPropagators");

var keyOf = require("./keyOf");

var isStartish = EventPluginUtils.isStartish;
var isEndish = EventPluginUtils.isEndish;
var storePageCoordsIn = EventPluginUtils.storePageCoordsIn;
var eventDistance = EventPluginUtils.eventDistance;

/**
 * The number of pixels that are tolerated in between a touchStart and
 * touchEnd in order to still be considered a 'tap' event.
 */
var tapMoveThreshold = 10;
var startCoords = {x: null, y: null};

var abstractEventTypes = {
  touchTap: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchTap: null}),
      captured: keyOf({onTouchTapCapture: null})
    }
  }
};

/**
 * @see EventPluginHub.extractAbstractEvents
 */
var extractAbstractEvents = function(
    topLevelType,
    nativeEvent,
    renderedTargetID,
    renderedTarget) {

  if (!isStartish(topLevelType) && !isEndish(topLevelType)) {
    return;
  }
  var abstractEvent;
  var dist = eventDistance(startCoords, nativeEvent);
  if (isEndish(topLevelType) && dist < tapMoveThreshold) {
    var type = abstractEventTypes.touchTap;
    var abstractTargetID = renderedTargetID;
    abstractEvent = AbstractEvent.getPooled(
      type,
      abstractTargetID,
      topLevelType,
      nativeEvent
    );
  }
  if (isStartish(topLevelType)) {
    storePageCoordsIn(startCoords, nativeEvent);
  } else if (isEndish(topLevelType)) {
    startCoords.x = 0;
    startCoords.y = 0;
  }
  EventPropagators.accumulateTwoPhaseDispatches(abstractEvent);
  return abstractEvent;
};

var TapEventPlugin = {
  tapMoveThreshold: tapMoveThreshold,
  startCoords: startCoords,
  abstractEventTypes: abstractEventTypes,
  extractAbstractEvents: extractAbstractEvents
};

module.exports = TapEventPlugin;
