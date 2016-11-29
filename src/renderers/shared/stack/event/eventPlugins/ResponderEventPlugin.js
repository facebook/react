/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ResponderEventPlugin
 */

'use strict';

var EventConstants = require('EventConstants');
var EventPluginUtils = require('EventPluginUtils');
var EventPropagators = require('EventPropagators');
var GestureCache = require('GestureCache');
var ResponderCache = require('ResponderCache');
var ResponderSyntheticEvent = require('ResponderSyntheticEvent');

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
 * Count of current touches. A textInput should become responder iff the
 * selection changes while there is a touch on the screen.
 */
var trackedTouchCount = 0;

/**
 * Last reported number of active touches.
 */
var previousActiveTouches = 0;

var eventTypes = {
  /**
   * On a `touchStart`/`mouseDown`, is it desired that this element become the
   * responder?
   */
  startShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: keyOf({onStartShouldSetResponder: null}),
      captured: keyOf({onStartShouldSetResponderCapture: null}),
    },
  },

  /**
   * On a `scroll`, is it desired that this element become the responder? This
   * is usually not needed, but should be used to retroactively infer that a
   * `touchStart` had occurred during momentum scroll. During a momentum scroll,
   * a touch start will be immediately followed by a scroll event if the view is
   * currently scrolling.
   *
   * TODO: This shouldn't bubble.
   */
  scrollShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: keyOf({onScrollShouldSetResponder: null}),
      captured: keyOf({onScrollShouldSetResponderCapture: null}),
    },
  },

  /**
   * On text selection change, should this element become the responder? This
   * is needed for text inputs or other views with native selection, so the
   * JS view can claim the responder.
   *
   * TODO: This shouldn't bubble.
   */
  selectionChangeShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: keyOf({onSelectionChangeShouldSetResponder: null}),
      captured: keyOf({onSelectionChangeShouldSetResponderCapture: null}),
    },
  },

  /**
   * On a `touchMove`/`mouseMove`, is it desired that this element become the
   * responder?
   */
  moveShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMoveShouldSetResponder: null}),
      captured: keyOf({onMoveShouldSetResponderCapture: null}),
    },
  },

  /**
   * Direct responder events dispatched directly to responder. Do not bubble.
   */
  responderStart: {registrationName: keyOf({onResponderStart: null})},
  responderMove: {registrationName: keyOf({onResponderMove: null})},
  responderEnd: {registrationName: keyOf({onResponderEnd: null})},
  responderRelease: {registrationName: keyOf({onResponderRelease: null})},
  responderTerminationRequest: {
    registrationName: keyOf({onResponderTerminationRequest: null}),
  },
  responderGrant: {registrationName: keyOf({onResponderGrant: null})},
  responderReject: {registrationName: keyOf({onResponderReject: null})},
  responderTerminate: {registrationName: keyOf({onResponderTerminate: null})},
};

/**
 *
 * Responder System:
 * ----------------
 *
 * - A global, solitary "interaction lock" on a view.
 * - If a node becomes the responder, it should convey visual feedback
 *   immediately to indicate so, either by highlighting or moving accordingly.
 * - To be the responder means, that touches are exclusively important to that
 *   responder view, and no other view.
 * - While touches are still occurring, the responder lock can be transferred to
 *   a new view, but only to increasingly "higher" views (meaning ancestors of
 *   the current responder).
 *
 * Responder being granted:
 * ------------------------
 *
 * - Touch starts, moves, and scrolls can cause an ID to become the responder.
 * - We capture/bubble `startShouldSetResponder`/`moveShouldSetResponder` to
 *   the "appropriate place".
 * - If nothing is currently the responder, the "appropriate place" is the
 *   initiating event's `targetID`.
 * - If something *is* already the responder, the "appropriate place" is the
 *   first common ancestor of the event target and the current `responderInst`.
 * - Some negotiation happens: See the timing diagram below.
 * - Scrolled views automatically become responder. The reasoning is that a
 *   platform scroll view that isn't built on top of the responder system has
 *   began scrolling, and the active responder must now be notified that the
 *   interaction is no longer locked to it - the system has taken over.
 *
 * - Responder being released:
 *   As soon as no more touches that *started* inside of descendants of the
 *   *current* responderInst, an `onResponderRelease` event is dispatched to the
 *   current responder, and the responder lock is released.
 *
 * TODO:
 * - on "end", a callback hook for `onResponderEndShouldRemainResponder` that
 *   determines if the responder lock should remain.
 * - If a view shouldn't "remain" the responder, any active touches should by
 *   default be considered "dead" and do not influence future negotiations or
 *   bubble paths. It should be as if those touches do not exist.
 * -- For multitouch: Usually a translate-z will choose to "remain" responder
 *  after one out of many touches ended. For translate-y, usually the view
 *  doesn't wish to "remain" responder after one of many touches end.
 * - Consider building this on top of a `stopPropagation` model similar to
 *   `W3C` events.
 * - Ensure that `onResponderTerminate` is called on touch cancels, whether or
 *   not `onResponderTerminationRequest` returns `true` or `false`.
 *
 */

/*                                             Negotiation Performed
                                             +-----------------------+
                                            /                         \
Process low level events to    +     Current Responder      +   wantsResponderID
determine who to perform negot-|   (if any exists at all)   |
iation/transition              | Otherwise just pass through|
-------------------------------+----------------------------+------------------+
Bubble to find first ID        |                            |
to return true:wantsResponderID|                            |
                               |                            |
     +-------------+           |                            |
     | onTouchStart|           |                            |
     +------+------+     none  |                            |
            |            return|                            |
+-----------v-------------+true| +------------------------+ |
|onStartShouldSetResponder|----->|onResponderStart (cur)  |<-----------+
+-----------+-------------+    | +------------------------+ |          |
            |                  |                            | +--------+-------+
            | returned true for|       false:REJECT +-------->|onResponderReject
            | wantsResponderID |                    |       | +----------------+
            | (now attempt     | +------------------+-----+ |
            |  handoff)        | |   onResponder          | |
            +------------------->|      TerminationRequest| |
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |         true:GRANT +-------->|onResponderGrant|
                               |                            | +--------+-------+
                               | +------------------------+ |          |
                               | |   onResponderTerminate |<-----------+
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |                    +-------->|onResponderStart|
                               |                            | +----------------+
Bubble to find first ID        |                            |
to return true:wantsResponderID|                            |
                               |                            |
     +-------------+           |                            |
     | onTouchMove |           |                            |
     +------+------+     none  |                            |
            |            return|                            |
+-----------v-------------+true| +------------------------+ |
|onMoveShouldSetResponder |----->|onResponderMove (cur)   |<-----------+
+-----------+-------------+    | +------------------------+ |          |
            |                  |                            | +--------+-------+
            | returned true for|       false:REJECT +-------->|onResponderRejec|
            | wantsResponderID |                    |       | +----------------+
            | (now attempt     | +------------------+-----+ |
            |  handoff)        | |   onResponder          | |
            +------------------->|      TerminationRequest| |
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |         true:GRANT +-------->|onResponderGrant|
                               |                            | +--------+-------+
                               | +------------------------+ |          |
                               | |   onResponderTerminate |<-----------+
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |                    +-------->|onResponderMove |
                               |                            | +----------------+
                               |                            |
                               |                            |
      Some active touch started|                            |
      inside current responder | +------------------------+ |
      +------------------------->|      onResponderEnd    | |
      |                        | +------------------------+ |
  +---+---------+              |                            |
  | onTouchEnd  |              |                            |
  +---+---------+              |                            |
      |                        | +------------------------+ |
      +------------------------->|     onResponderEnd     | |
      No active touches started| +-----------+------------+ |
      inside current responder |             |              |
                               |             v              |
                               | +------------------------+ |
                               | |    onResponderRelease  | |
                               | +------------------------+ |
                               |                            |
                               +                            + */



/**
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
 * - When returned from `extractEvents`, deferred-dispatched events contain an
 *   "accumulation" of deferred dispatches.
 * - These deferred dispatches are accumulated/collected before they are
 *   returned, but processed at a later time by the `EventPluginHub` (hence the
 *   name deferred).
 *
 * In the process of returning their deferred-dispatched events, event plugins
 * themselves can dispatch events on-demand without returning them from
 * `extractEvents`. Plugins might want to do this, so that they can use event
 * dispatching as a tool that helps them decide which events should be extracted
 * in the first place.
 *
 * "On-Demand-Dispatched Events":
 *
 * - On-demand-dispatched events are not returned from `extractEvents`.
 * - On-demand-dispatched events are dispatched during the process of returning
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
 */

function setResponderAndExtractTransfer(
  topLevelType,
  targetInst,
  nativeEvent,
  nativeEventTarget
) {
  var shouldSetEventType =
    isStartish(topLevelType) ? eventTypes.startShouldSetResponder :
    isMoveish(topLevelType) ? eventTypes.moveShouldSetResponder :
    topLevelType === EventConstants.topLevelTypes.topSelectionChange ?
      eventTypes.selectionChangeShouldSetResponder :
    eventTypes.scrollShouldSetResponder;

  // Active responders automatically capture touches inside descendants.
  var responderInst = ResponderCache.findAncestor(targetInst);
  if (responderInst && responderInst !== targetInst) {
    GestureCache.targetChanged(
      topLevelType,
      targetInst,
      responderInst
    );
  }

  // TODO: stop one short of the current responder.
  var bubbleShouldSetFrom = !responderInst ?
    targetInst :
    EventPluginUtils.getLowestCommonAncestor(responderInst, targetInst);

  // When capturing/bubbling the "shouldSet" event, we want to skip the target
  // (deepest ID) if it happens to be the current responder. The reasoning:
  // It's strange to get an `onMoveShouldSetResponder` when you're *already*
  // the responder.
  var skipOverBubbleShouldSetFrom = bubbleShouldSetFrom === responderInst;
  var shouldSetEvent = ResponderSyntheticEvent.getPooled(
    shouldSetEventType,
    bubbleShouldSetFrom,
    nativeEvent,
    nativeEventTarget
  );
  shouldSetEvent.touchHistory = nativeEvent.touchHistory;
  if (skipOverBubbleShouldSetFrom) {
    EventPropagators.accumulateTwoPhaseDispatchesSkipTarget(shouldSetEvent);
  } else {
    EventPropagators.accumulateTwoPhaseDispatches(shouldSetEvent);
  }
  var wantsResponderInst = executeDispatchesInOrderStopAtTrue(shouldSetEvent);
  if (!shouldSetEvent.isPersistent()) {
    shouldSetEvent.constructor.release(shouldSetEvent);
  }

  if (!wantsResponderInst || wantsResponderInst === responderInst) {
    return null;
  }
  var extracted;

  if (responderInst) {
    var terminationRequestEvent = ResponderSyntheticEvent.getPooled(
      eventTypes.responderTerminationRequest,
      responderInst,
      nativeEvent,
      nativeEventTarget
    );
    terminationRequestEvent.touchHistory = nativeEvent.touchHistory;
    EventPropagators.accumulateDirectDispatches(terminationRequestEvent);
    var shouldSwitch = !hasDispatches(terminationRequestEvent) ||
      executeDirectDispatch(terminationRequestEvent);
    if (!terminationRequestEvent.isPersistent()) {
      terminationRequestEvent.constructor.release(terminationRequestEvent);
    }

    if (!shouldSwitch) {
      var rejectEvent = ResponderSyntheticEvent.getPooled(
        eventTypes.responderReject,
        wantsResponderInst,
        nativeEvent,
        nativeEventTarget
      );
      rejectEvent.touchHistory = nativeEvent.touchHistory;
      EventPropagators.accumulateDirectDispatches(rejectEvent);
      return accumulate(extracted, rejectEvent);
    }

    var terminateEvent = ResponderSyntheticEvent.getPooled(
      eventTypes.responderTerminate,
      responderInst,
      nativeEvent,
      nativeEventTarget
    );
    terminateEvent.touchHistory = nativeEvent.touchHistory;
    EventPropagators.accumulateDirectDispatches(terminateEvent);
    extracted = accumulate(extracted, terminateEvent);

    // Always dispatch 'terminateEvent' before 'grantEvent'.
    if (hasDispatches(terminateEvent)) {
      executeDirectDispatch(terminateEvent);
    }
  }

  // Transfer gesture to next responder.
  if (responderInst || targetInst !== wantsResponderInst) {
    GestureCache.targetChanged(
      topLevelType,
      responderInst || targetInst,
      wantsResponderInst
    );
  }

  var grantEvent = ResponderSyntheticEvent.getPooled(
    eventTypes.responderGrant,
    wantsResponderInst,
    nativeEvent,
    nativeEventTarget
  );
  grantEvent.touchHistory = nativeEvent.touchHistory;
  EventPropagators.accumulateDirectDispatches(grantEvent);
  extracted = accumulate(extracted, grantEvent);

  var blockHostResponder = executeDirectDispatch(grantEvent) === true;
  responderInst && ResponderCache.onResponderEnd(responderInst);
  ResponderCache.onResponderGrant(wantsResponderInst, blockHostResponder);
  return extracted;
}

/**
 * A transfer is a negotiation between a currently set responder and the next
 * element to claim responder status. Any start event could trigger a transfer
 * of responderInst. Any move event could trigger a transfer.
 *
 * @param {string} topLevelType Record from `EventConstants`.
 * @return {boolean} True if a transfer of responder could possibly occur.
 */
function canTriggerTransfer(topLevelType, topLevelInst, nativeEvent) {
  return topLevelInst && (
    // responderIgnoreScroll: We are trying to migrate away from specifically
    // tracking native scroll events here and responderIgnoreScroll indicates we
    // will send topTouchCancel to handle canceling touch events instead
    (topLevelType === EventConstants.topLevelTypes.topScroll &&
      !nativeEvent.responderIgnoreScroll) ||
    (trackedTouchCount > 0 &&
      topLevelType === EventConstants.topLevelTypes.topSelectionChange) ||
    isStartish(topLevelType) ||
    isMoveish(topLevelType)
  );
}

function extractTouchEvents(
  topLevelType,
  targetInst,
  nativeEvent,
  nativeEventTarget
) {
  var extracted;

  if (canTriggerTransfer(topLevelType, targetInst, nativeEvent)) {
    extracted = setResponderAndExtractTransfer(
      topLevelType,
      targetInst,
      nativeEvent,
      nativeEventTarget
    );
  }

  // Find the first ancestor that is currently responding.
  var responderInst = ResponderCache.findAncestor(targetInst);
  if (responderInst) {
    nativeEventTarget =
      EventPluginUtils.getNodeFromInstance(responderInst);
  }

  /**
   * Responder may or may not have transferred on a new touch start/move.
   * Regardless, whoever is the responder after any potential transfer, we
   * direct all touch start/move/ends to them in the form of
   * `onResponderMove/Start/End`. These will be called for *every* additional
   * finger that move/start/end, dispatched directly to whoever is the
   * current responder at that moment, until the responder is "released".
   *
   * These multiple individual change touch events are are always bookended
   * by `onResponderGrant`, and one of
   * (`onResponderRelease/onResponderTerminate`).
   */
  var isResponderTouchStart = responderInst && isStartish(topLevelType);
  var isResponderTouchMove = responderInst && isMoveish(topLevelType);
  var isResponderTouchEnd = responderInst && isEndish(topLevelType);
  var incrementalTouch =
    isResponderTouchStart ? eventTypes.responderStart :
    isResponderTouchMove ? eventTypes.responderMove :
    isResponderTouchEnd ? eventTypes.responderEnd :
    null;

  var touchHandler = ResponderEventPlugin.GlobalTouchHandler;
  if (touchHandler && isEndish(topLevelType)) {
    var endishEvent =
      ResponderSyntheticEvent.getPooled(
        eventTypes.responderEnd,
        responderInst || targetInst,
        nativeEvent,
        nativeEventTarget
      );
    endishEvent.touchHistory = nativeEvent.touchHistory;
    touchHandler.onTouchEnd(endishEvent);
  }

  if (incrementalTouch) {
    var touchEvent =
      ResponderSyntheticEvent.getPooled(
        incrementalTouch,
        responderInst,
        nativeEvent,
        nativeEventTarget
      );
    touchEvent.touchHistory = nativeEvent.touchHistory;
    EventPropagators.accumulateDirectDispatches(touchEvent);
    extracted = accumulate(extracted, touchEvent);
  }

  var isResponderTerminate =
    responderInst &&
    topLevelType === EventConstants.topLevelTypes.topTouchCancel;
  var isResponderRelease =
    responderInst &&
    !isResponderTerminate &&
    isEndish(topLevelType) &&
    nativeEvent.touchHistory.numberActiveTouches === 0;
  var finalTouch =
    isResponderTerminate ? eventTypes.responderTerminate :
    isResponderRelease ? eventTypes.responderRelease :
    null;
  if (finalTouch) {
    ResponderCache.onResponderEnd(responderInst);
    var finalEvent =
      ResponderSyntheticEvent.getPooled(
        finalTouch,
        responderInst,
        nativeEvent,
        nativeEventTarget
      );
    finalEvent.touchHistory = nativeEvent.touchHistory;
    EventPropagators.accumulateDirectDispatches(finalEvent);
    extracted = accumulate(extracted, finalEvent);
  }

  return extracted;
}

var ResponderEventPlugin = {

  /* For unit testing only */
  _getResponderID: function() {
    return responderInst ? responderInst._rootNodeID : null;
  },

  eventTypes: eventTypes,

  /**
   * We must be resilient to `targetInst` being `null` on `touchMove` or
   * `touchEnd`. On certain platforms, this means that a native scroll has
   * assumed control and the original touch targets are destroyed.
   */
  extractEvents: function(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    if (!nativeEvent.touches) {
      return null;
    }

    if (isStartish(topLevelType)) {
      trackedTouchCount += nativeEvent.changedTouches.length;
    } else if (isEndish(topLevelType)) {
      trackedTouchCount -= nativeEvent.changedTouches.length;
      if (trackedTouchCount < 0) {
        console.error(
          'Ended a touch event which was not counted in `trackedTouchCount`.'
        );
        return null;
      }
    }

    // Touches are grouped by active target.
    var changedGestures = GestureCache.touchesChanged(topLevelType, nativeEvent);

    var extracted;
    changedGestures.forEach(gesture => {
      gesture.touches = Object.values(gesture.touchMap);
      var targetInst = EventPluginUtils.getInstanceFromNode(gesture.target);
      var touchEvents = extractTouchEvents(
        topLevelType,
        targetInst,
        gesture,
        gesture.target
      );
      if (touchEvents) {
        extracted = accumulate(extracted, touchEvents);
      }
    });

    var interactionHandler = ResponderEventPlugin.GlobalInteractionHandler;
    if (interactionHandler && trackedTouchCount !== previousActiveTouches) {
      interactionHandler.onChange(trackedTouchCount);
    }
    previousActiveTouches = trackedTouchCount;

    return extracted;
  },

  GlobalTouchHandler: null,
  GlobalInteractionHandler: null,

  injection: {
    /**
     * @param {onTouchEnd: (TouchEvent) => void} GlobalTouchHandler
     * Object that handles all touch events.
     */
    injectGlobalTouchHandler:function(GlobalTouchHandler) {
      ResponderEventPlugin.GlobalTouchHandler = GlobalTouchHandler;
    },

    /**
     * @param {{onChange: (ReactID, ReactID) => void} GlobalResponderHandler
     * Object that handles any change in responder. Use this to inject
     * integration with an existing touch handling system etc.
     */
    injectGlobalResponderHandler: function(GlobalResponderHandler) {
      ResponderCache.globalHandler = GlobalResponderHandler;
    },

    /**
     * @param {{onChange: (numberActiveTouches) => void} GlobalInteractionHandler
     * Object that handles any change in the number of active touches.
     */
    injectGlobalInteractionHandler: function(GlobalInteractionHandler) {
      ResponderEventPlugin.GlobalInteractionHandler = GlobalInteractionHandler;
    },
  },
};

module.exports = ResponderEventPlugin;
