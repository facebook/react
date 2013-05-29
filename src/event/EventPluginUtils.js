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
 * @providesModule EventPluginUtils
 */

"use strict";

var EventConstants = require('EventConstants');
var AbstractEvent = require('AbstractEvent');

var invariant = require('invariant');

var topLevelTypes = EventConstants.topLevelTypes;

function isEndish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseUp ||
         topLevelType === topLevelTypes.topTouchEnd ||
         topLevelType === topLevelTypes.topTouchCancel;
}

function isMoveish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseMove ||
         topLevelType === topLevelTypes.topTouchMove;
}
function isStartish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseDown ||
         topLevelType === topLevelTypes.topTouchStart;
}

function storePageCoordsIn(obj, nativeEvent) {
  var pageX = AbstractEvent.eventPageX(nativeEvent);
  var pageY = AbstractEvent.eventPageY(nativeEvent);
  obj.pageX = pageX;
  obj.pageY = pageY;
}

function eventDistance(coords, nativeEvent) {
  var pageX = AbstractEvent.eventPageX(nativeEvent);
  var pageY = AbstractEvent.eventPageY(nativeEvent);
  return Math.pow(
    Math.pow(pageX - coords.pageX, 2) + Math.pow(pageY - coords.pageY, 2),
    0.5
  );
}

var validateEventDispatches;
if (__DEV__) {
  validateEventDispatches = function(abstractEvent) {
    var dispatchListeners = abstractEvent._dispatchListeners;
    var dispatchIDs = abstractEvent._dispatchIDs;

    var listenersIsArr = Array.isArray(dispatchListeners);
    var idsIsArr = Array.isArray(dispatchIDs);
    var IDsLen = idsIsArr ? dispatchIDs.length : dispatchIDs ? 1 : 0;
    var listenersLen = listenersIsArr ?
      dispatchListeners.length :
      dispatchListeners ? 1 : 0;

    invariant(
      idsIsArr === listenersIsArr && IDsLen === listenersLen,
      'EventPluginUtils: Invalid `abstractEvent`.'
    );
  };
}

/**
 * Invokes `cb(abstractEvent, listener, id)`. Avoids using call if no scope is
 * provided. The `(listener,id)` pair effectively forms the "dispatch" but are
 * kept separate to conserve memory.
 */
function forEachEventDispatch(abstractEvent, cb) {
  var dispatchListeners = abstractEvent._dispatchListeners;
  var dispatchIDs = abstractEvent._dispatchIDs;
  if (__DEV__) {
    validateEventDispatches(abstractEvent);
  }
  if (Array.isArray(dispatchListeners)) {
    var i;
    for (
      i = 0;
      i < dispatchListeners.length && !abstractEvent.isPropagationStopped;
      i++) {
      // Listeners and IDs are two parallel arrays that are always in sync.
      cb(abstractEvent, dispatchListeners[i], dispatchIDs[i]);
    }
  } else if (dispatchListeners) {
    cb(abstractEvent, dispatchListeners, dispatchIDs);
  }
}

/**
 * Default implementation of PluginModule.executeDispatch().
 * @param {AbstractEvent} AbstractEvent to handle
 * @param {function} Application-level callback
 * @param {string} domID DOM id to pass to the callback.
 */
function executeDispatch(abstractEvent, listener, domID) {
  listener(abstractEvent, domID);
}

/**
 * Standard/simple iteration through an event's collected dispatches.
 */
function executeDispatchesInOrder(abstractEvent, executeDispatch) {
  forEachEventDispatch(abstractEvent, executeDispatch);
  abstractEvent._dispatchListeners = null;
  abstractEvent._dispatchIDs = null;
}

/**
 * Standard/simple iteration through an event's collected dispatches, but stops
 * at the first dispatch execution returning true, and returns that id.
 *
 * @returns id of the first dispatch execution who's listener returns true, or
 * null if no listener returned true.
 */
function executeDispatchesInOrderStopAtTrue(abstractEvent) {
  var dispatchListeners = abstractEvent._dispatchListeners;
  var dispatchIDs = abstractEvent._dispatchIDs;
  if (__DEV__) {
    validateEventDispatches(abstractEvent);
  }
  if (Array.isArray(dispatchListeners)) {
    var i;
    for (
      i = 0;
      i < dispatchListeners.length && !abstractEvent.isPropagationStopped;
      i++) {
      // Listeners and IDs are two parallel arrays that are always in sync.
      if (dispatchListeners[i](abstractEvent, dispatchIDs[i])) {
        return dispatchIDs[i];
      }
    }
  } else if (dispatchListeners) {
    if (dispatchListeners(abstractEvent, dispatchIDs)) {
      return dispatchIDs;
    }
  }
  return null;
}

/**
 * Execution of a "direct" dispatch - there must be at most one dispatch
 * accumulated on the event or it is considered an error. It doesn't really make
 * sense for an event with multiple dispatches (bubbled) to keep track of the
 * return values at each dispatch execution, but it does tend to make sense when
 * dealing with "direct" dispatches.
 *
 * @returns The return value of executing the single dispatch.
 */
function executeDirectDispatch(abstractEvent) {
  if (__DEV__) {
    validateEventDispatches(abstractEvent);
  }
  var dispatchListener = abstractEvent._dispatchListeners;
  var dispatchID = abstractEvent._dispatchIDs;
  invariant(
    !Array.isArray(dispatchListener),
    'executeDirectDispatch(...): Invalid `abstractEvent`.'
  );
  var res = dispatchListener ?
    dispatchListener(abstractEvent, dispatchID) :
    null;
  abstractEvent._dispatchListeners = null;
  abstractEvent._dispatchIDs = null;
  return res;
}

/**
 * @param {AbstractEvent} abstractEvent
 * @returns {bool} True iff number of dispatches accumulated is greater than 0.
 */
function hasDispatches(abstractEvent) {
  return !!abstractEvent._dispatchListeners;
}

/**
 * General utilities that are useful in creating custom Event Plugins.
 */
var EventPluginUtils = {
  isEndish: isEndish,
  isMoveish: isMoveish,
  isStartish: isStartish,
  storePageCoordsIn: storePageCoordsIn,
  eventDistance: eventDistance,
  executeDispatchesInOrder: executeDispatchesInOrder,
  executeDispatchesInOrderStopAtTrue: executeDispatchesInOrderStopAtTrue,
  executeDirectDispatch: executeDirectDispatch,
  hasDispatches: hasDispatches,
  executeDispatch: executeDispatch
};

module.exports = EventPluginUtils;
