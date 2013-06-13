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
 * @providesModule ResponderEventPlugin
 */

"use strict";

var AbstractEvent = require('AbstractEvent');
var EventConstants = require('EventConstants');
var EventPluginUtils = require('EventPluginUtils');
var EventPropagators = require('EventPropagators');

var accumulate = require('accumulate');
var keyOf = require('keyOf');

var isStartish = EventPluginUtils.isStartish;
var isMoveish = EventPluginUtils.isMoveish;
var isEndish = EventPluginUtils.isEndish;
var executeDirectDispatch = EventPluginUtils.executeDirectDispatch;
var hasDispatches = EventPluginUtils.hasDispatches;
var executeDispatchesInOrderStopAtTrue =
  EventPluginUtils.executeDispatchesInOrderStopAtTrue;

/**
 * ID of element that should respond to touch/move types of interactions, as
 * indicated explicitly by relevant callbacks.
 */
var responderID = null;
var isPressing = false;

var getResponderID = function() {
  return responderID;
};

var abstractEventTypes = {
  /**
   * On a `touchStart`/`mouseDown`, is it desired that this element become the
   * responder?
   */
  startShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: keyOf({onStartShouldSetResponder: null}),
      captured: keyOf({onStartShouldSetResponderCapture: null})
    }
  },

  /**
   * On a `scroll`, is it desired that this element become the responder? This
   * is usually not needed, but should be used to retroactively infer that a
   * `touchStart` had occured during momentum scroll. During a momentum scroll,
   * a touch start will be immediately followed by a scroll event if the view is
   * currently scrolling.
   */
  scrollShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: keyOf({onScrollShouldSetResponder: null}),
      captured: keyOf({onScrollShouldSetResponderCapture: null})
    }
  },

  /**
   * On a `touchMove`/`mouseMove`, is it desired that this element become the
   * responder?
   */
  moveShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMoveShouldSetResponder: null}),
      captured: keyOf({onMoveShouldSetResponderCapture: null})
    }
  },

  /**
   * Direct responder events dispatched directly to responder. Do not bubble.
   */
  responderMove: {registrationName: keyOf({onResponderMove: null})},
  responderRelease: {registrationName: keyOf({onResponderRelease: null})},
  responderTerminationRequest: {
    registrationName: keyOf({onResponderTerminationRequest: null})
  },
  responderGrant: {registrationName: keyOf({onResponderGrant: null})},
  responderReject: {registrationName: keyOf({onResponderReject: null})},
  responderTerminate: {registrationName: keyOf({onResponderTerminate: null})}
};

/**
 * Performs negotiation between any existing/current responder, checks to see if
 * any new entity is interested in becoming responder, performs that handshake
 * and returns any events that must be emitted to notify the relevant parties.
 *
 * A note about event ordering in the `EventPluginHub`.
 *
 * Suppose plugins are injected in the following order:
 *
 * `[R, S, C]`
 *
 * To help illustrate the example, assume `S` is `SimpleEventPlugin` (for
 * `onClick` etc) and `R` is `ResponderEventPlugin`.
 *
 * "Deferred-Dispatched Events":
 *
 * - The current event plugin system will traverse the list of injected plugins,
 *   in order, and extract events by collecting the plugin's return value of
 *   `extractEvents()`.
 * - These events that are returned from `extractEvents` are "deferred
 *   dispatched events".
 * - When returned from `extractEvents`, deferred dispatched events
 *   contain an "accumulation" of deferred dispatches.
 * -- These deferred dispatches are accumulated/collected before they are
 *  returned, but processed at a later time by the `EventPluginHub` (hence the
 *  name deferred).
 *
 * In the process of returning their deferred dispatched events, event plugins
 * themselves can dispatch events on-demand without returning them from
 * `extractEvents`. Plugins might want to do this, so that they can use
 * event dispatching as a tool that helps them decide which events should be
 * extracted in the first place.
 *
 * "On-Demand-Dispatched Events":
 *
 * - On-demand dispatched are not returned from `extractEvents`.
 * - On-demand dispatched events are dispatched during the process of returning
 *   the deferred-dispatched events.
 * - They should not have side effects.
 * - They should be avoided, and/or eventually be replaced with another
 *   abstraction that allows event plugins to perform multiple "rounds" of event
 *   extraction.
 *
 * Therefore, the sequence of event dispatches becomes:
 *
 * - `R`s on-demand events (if any)   (dispatched by `R` on-demand)
 * - `S`s on-demand events (if any)   (dispatched by `S` on-demand)
 * - `C`s on-demand events (if any)   (dispatched by `C` on-demand)
 * - `R`s extracted events (if any)   (dispatched by `EventPluginHub`)
 * - `S`s extracted events (if any)   (dispatched by `EventPluginHub`)
 * - `C`s extracted events (if any)   (dispatched by `EventPluginHub`)
 *
 * In the case of `ResponderEventPlugin`: If the `startShouldSetResponder`
 * on-demand dispatch returns `true` (and some other details are satisfied) the
 * `onResponderGrant` deferred dispatched event is returned from
 * `extractEvents`. The sequence of dispatch executions in this case
 * will appear as follows:
 *
 * - `startShouldSetResponder` (`ResponderEventPlugin` dispatches on-demand)
 * - `touchStartCapture`       (`EventPluginHub` dispatches as usual)
 * - `touchStart`              (`EventPluginHub` dispatches as usual)
 * - `responderGrant/Reject`   (`EventPluginHub` dispatches as usual)
 *
 * @returns {Accumulation<AbstractEvent>}
 */

/**
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {string} renderedTargetID ID of deepest React rendered element.
 * @param {object} nativeEvent Native browser event.
 * @return {*} An accumulation of extracted `AbstractEvent`s.
 */
var setResponderAndExtractTransfer =
  function(topLevelType, renderedTargetID, nativeEvent) {
    var type;
    var shouldSetEventType =
      isStartish(topLevelType) ? abstractEventTypes.startShouldSetResponder :
      isMoveish(topLevelType) ? abstractEventTypes.moveShouldSetResponder :
      abstractEventTypes.scrollShouldSetResponder;

    var bubbleShouldSetFrom = responderID || renderedTargetID;
    var shouldSetEvent = AbstractEvent.getPooled(
      shouldSetEventType,
      bubbleShouldSetFrom,
      topLevelType,
      nativeEvent,
      AbstractEvent.normalizePointerData(nativeEvent)
    );
    EventPropagators.accumulateTwoPhaseDispatches(shouldSetEvent);
    var wantsResponderID = executeDispatchesInOrderStopAtTrue(shouldSetEvent);
    AbstractEvent.release(shouldSetEvent);

    if (!wantsResponderID || wantsResponderID === responderID) {
      return null;
    }
    var extracted;
    var grantEvent = AbstractEvent.getPooled(
      abstractEventTypes.responderGrant,
      wantsResponderID,
      topLevelType,
      nativeEvent
    );

    EventPropagators.accumulateDirectDispatches(grantEvent);
    if (responderID) {
      type = abstractEventTypes.responderTerminationRequest;
      var terminationRequestEvent = AbstractEvent.getPooled(type, responderID);
      EventPropagators.accumulateDirectDispatches(terminationRequestEvent);
      var shouldSwitch = !hasDispatches(terminationRequestEvent) ||
        executeDirectDispatch(terminationRequestEvent);
      AbstractEvent.release(terminationRequestEvent);
      if (shouldSwitch) {
        var terminateType = abstractEventTypes.responderTerminate;
        var terminateEvent = AbstractEvent.getPooled(
          terminateType,
          responderID,
          topLevelType,
          nativeEvent
        );
        EventPropagators.accumulateDirectDispatches(terminateEvent);
        extracted = accumulate(extracted, [grantEvent, terminateEvent]);
        responderID = wantsResponderID;
      } else {
        var rejectEvent = AbstractEvent.getPooled(
          abstractEventTypes.responderReject,
          wantsResponderID,
          topLevelType,
          nativeEvent
        );
        EventPropagators.accumulateDirectDispatches(rejectEvent);
        extracted = accumulate(extracted, rejectEvent);
      }
    } else {
      extracted = accumulate(extracted, grantEvent);
      responderID = wantsResponderID;
    }
    return extracted;
  };

/**
 * A transfer is a negotiation between a currently set responder and the next
 * element to claim responder status. Any start event could trigger a transfer
 * of responderID. Any move event could trigger a transfer, so long as there is
 * currently a responder set (in other words as long as the user is pressing
 * down).
 *
 * @param {EventConstants.topLevelTypes} topLevelType
 * @return {boolean} Whether or not a transfer of responder could possibly
 * occur.
 */
function canTriggerTransfer(topLevelType) {
  return topLevelType === EventConstants.topLevelTypes.topScroll ||
         isStartish(topLevelType) ||
         (isPressing && isMoveish(topLevelType));
}

/**
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {DOMEventTarget} topLevelTarget The listening component root node.
 * @param {string} topLevelTargetID ID of `topLevelTarget`.
 * @param {object} nativeEvent Native browser event.
 * @return {*} An accumulation of `AbstractEvent`s.
 * @see {EventPluginHub.extractEvents}
 */
var extractEvents = function(
    topLevelType,
    topLevelTarget,
    topLevelTargetID,
    nativeEvent) {
  var extracted;
  // Must have missed an end event - reset the state here.
  if (responderID && isStartish(topLevelType)) {
    responderID = null;
  }
  if (isStartish(topLevelType)) {
    isPressing = true;
  } else if (isEndish(topLevelType)) {
    isPressing = false;
  }
  if (canTriggerTransfer(topLevelType)) {
    var transfer = setResponderAndExtractTransfer(
      topLevelType,
      topLevelTargetID,
      nativeEvent
    );
    if (transfer) {
      extracted = accumulate(extracted, transfer);
    }
  }
  // Now that we know the responder is set correctly, we can dispatch
  // responder type events (directly to the responder).
  var type = isMoveish(topLevelType) ? abstractEventTypes.responderMove :
    isEndish(topLevelType) ? abstractEventTypes.responderRelease :
    isStartish(topLevelType) ? abstractEventTypes.responderStart : null;
  if (type) {
    var data = AbstractEvent.normalizePointerData(nativeEvent);
    var gesture = AbstractEvent.getPooled(
      type,
      responderID,
      nativeEvent,
      data
    );
    EventPropagators.accumulateDirectDispatches(gesture);
    extracted = accumulate(extracted, gesture);
  }
  if (type === abstractEventTypes.responderRelease) {
    responderID = null;
  }
  return extracted;
};

/**
 * Event plugin for formalizing the negotiation between claiming locks on
 * receiving touches.
 */
var ResponderEventPlugin = {
  abstractEventTypes: abstractEventTypes,
  extractEvents: extractEvents,
  getResponderID: getResponderID
};

module.exports = ResponderEventPlugin;
