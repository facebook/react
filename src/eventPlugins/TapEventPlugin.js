/**
 * @providesModule TapEventPlugin
 */

"use strict";

var AbstractEvent = require('AbstractEvent');
var EventPluginUtils = require('EventPluginUtils');
var EventPropagators = require('EventPropagators');

var keyOf = require('keyOf');

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
