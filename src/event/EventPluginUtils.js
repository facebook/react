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

var invariant = require('invariant');

var nullContext = EventConstants.nullContext;
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

var validateEventDispatches;
if (__DEV__) {
  validateEventDispatches = function(event) {
    var dispatchListeners = event._dispatchListeners;
    var dispatchIDs = event._dispatchIDs;
    var dispatchContexts = event._dispatchContexts;

    var listenersIsArr = Array.isArray(dispatchListeners);
    var IDsIsArr = Array.isArray(dispatchIDs);
    var contextsIsArr = Array.isArray(dispatchContexts);
    var IDsLen = IDsIsArr ? dispatchIDs.length : dispatchIDs ? 1 : 0;
    var listenersLen = listenersIsArr ?
      dispatchListeners.length :
      dispatchListeners ? 1 : 0;
    var contextsLen = contextsIsArr ?
      dispatchContexts.length :
      dispatchContexts ? 1 : 0;

    invariant(
      IDsIsArr === listenersIsArr && IDsLen === listenersLen &&
      contextsIsArr === listenersIsArr && contextsLen === listenersLen,
      'EventPluginUtils: Invalid `event`.'
    );
  };
}

/**
 * Invokes `cb(event, listener, id, context)`. The `(listener, id, context)`
 * tuple effectively forms the "dispatch" but are kept separate to conserve
 * memory.
 */
function forEachEventDispatch(event, cb) {
  var dispatchListeners = event._dispatchListeners;
  var dispatchIDs = event._dispatchIDs;
  var dispatchContexts = event._dispatchContexts;
  var context;
  if (__DEV__) {
    validateEventDispatches(event);
  }
  if (Array.isArray(dispatchListeners)) {
    for (var i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners, IDs, contexts are parallel arrays that are always in sync.
      context = dispatchContexts[i];
      if (context === nullContext) {
        context = null;
      }
      cb(event, dispatchListeners[i], dispatchIDs[i], context);
    }
  } else if (dispatchListeners) {
    context = dispatchContexts;
    if (context === nullContext) {
      context = null;
    }
    cb(event, dispatchListeners, dispatchIDs, context);
  }
}

/**
 * Default implementation of PluginModule.executeDispatch().
 * @param {SyntheticEvent} SyntheticEvent to handle
 * @param {function} Application-level callback
 * @param {string} domID DOM id to pass to the callback
 * @param {?object} context Context under which to execute the listener
 */
function executeDispatch(event, listener, domID, context) {
  listener.call(context, event, domID);
}

/**
 * Standard/simple iteration through an event's collected dispatches.
 */
function executeDispatchesInOrder(event, executeDispatch) {
  forEachEventDispatch(event, executeDispatch);
  event._dispatchListeners = null;
  event._dispatchIDs = null;
  event._dispatchContexts = null;
}

/**
 * Standard/simple iteration through an event's collected dispatches, but stops
 * at the first dispatch execution returning true, and returns that id.
 *
 * @return id of the first dispatch execution who's listener returns true, or
 * null if no listener returned true.
 */
function executeDispatchesInOrderStopAtTrue(event) {
  var dispatchListeners = event._dispatchListeners;
  var dispatchIDs = event._dispatchIDs;
  var dispatchContexts = event._dispatchContexts;
  var context;
  if (__DEV__) {
    validateEventDispatches(event);
  }
  if (Array.isArray(dispatchListeners)) {
    for (var i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners, IDs, contexts are parallel arrays that are always in sync.
      context = dispatchContexts[i];
      if (context === nullContext) {
        context = null;
      }
      if (dispatchListeners[i].call(
            dispatchContexts[i],
            event,
            dispatchIDs[i]
          )) {
        return dispatchIDs[i];
      }
    }
  } else if (dispatchListeners) {
    context = dispatchContexts;
    if (context === nullContext) {
      context = null;
    }
    if (dispatchListeners.call(context, event, dispatchIDs)) {
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
 * @return The return value of executing the single dispatch.
 */
function executeDirectDispatch(event) {
  if (__DEV__) {
    validateEventDispatches(event);
  }
  var dispatchListener = event._dispatchListeners;
  var dispatchID = event._dispatchIDs;
  var dispatchContext = event._dispatchContext;
  if (dispatchContext === nullContext) {
    dispatchContext = null;
  }
  invariant(
    !Array.isArray(dispatchListener),
    'executeDirectDispatch(...): Invalid `event`.'
  );
  var res = dispatchListener ?
    dispatchListener.call(dispatchContext, event, dispatchID) :
    null;
  event._dispatchListeners = null;
  event._dispatchIDs = null;
  event._dispatchContext = null;
  return res;
}

/**
 * @param {SyntheticEvent} event
 * @return {bool} True iff number of dispatches accumulated is greater than 0.
 */
function hasDispatches(event) {
  return !!event._dispatchListeners;
}

/**
 * General utilities that are useful in creating custom Event Plugins.
 */
var EventPluginUtils = {
  isEndish: isEndish,
  isMoveish: isMoveish,
  isStartish: isStartish,
  executeDispatchesInOrder: executeDispatchesInOrder,
  executeDispatchesInOrderStopAtTrue: executeDispatchesInOrderStopAtTrue,
  executeDirectDispatch: executeDirectDispatch,
  hasDispatches: hasDispatches,
  executeDispatch: executeDispatch
};

module.exports = EventPluginUtils;
