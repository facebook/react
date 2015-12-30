/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule EnterLeaveEventPlugin
 */

'use strict';

var EventConstants = require('EventConstants');
var EventPropagators = require('EventPropagators');
var EventPluginHub = require('EventPluginHub');
var EventPluginUtils = require('EventPluginUtils');

var containsNode = require('containsNode');

var ReactDOMComponentTree = require('ReactDOMComponentTree');
var SyntheticMouseEvent = require('SyntheticMouseEvent');
var isEventSupported = require('isEventSupported');


var keyOf = require('keyOf');

var topLevelTypes = EventConstants.topLevelTypes;
var isEnterLeaveSupported = isEventSupported('mouseenter', true);

var eventTypes = {
  mouseEnter: {

    registrationName: keyOf({onMouseEnter: null}),

    dependencies: [
      topLevelTypes.topMouseOut,
      topLevelTypes.topMouseOver,
      topLevelTypes.topMouseEnter,
    ],
  },
  mouseLeave: {

    registrationName: keyOf({onMouseLeave: null}),

    dependencies: [
      topLevelTypes.topMouseOut,
      topLevelTypes.topMouseOver,
      topLevelTypes.topMouseLeave,
    ],
  },
};

function getNativeEnterLeave(
  topLevelType,
  targetInst,
  nativeEvent,
  nativeEventTarget
) {
  if (
    topLevelType === topLevelTypes.topMouseEnter ||
    topLevelType === topLevelTypes.topMouseLeave
  ) {
    if (targetInst) {
      var eventType;

      if (topLevelType === topLevelTypes.topMouseEnter) {
        eventType = 'mouseEnter';
      } else {
        eventType = 'mouseLeave';
      }

      var event = SyntheticMouseEvent.getPooled(
        eventTypes[eventType],
        targetInst,
        nativeEvent,
        nativeEventTarget
      );

      event.type = eventType.toLowerCase();

      EventPropagators.accumulateDirectDispatches(event);
      return event;
    }
    return null;
  }
}

/**
 * Traverse the current target instance ancestors
 * until it reaches an instance with a listener for the
 * specified eventType
 */
function getEventDelegateTargetInst(targetInst, eventType) {
  var registrationName = eventType.registrationName;

  return EventPluginUtils.traverseUntil(targetInst, function(nextInst) {
    return !!EventPluginHub.getListener(nextInst, registrationName);
  });
}

function getEnterLeavePolyfill(
  topLevelType,
  targetInst,
  nativeEvent,
  nativeEventTarget
) {

  if (
    topLevelType !== topLevelTypes.topMouseOut &&
    topLevelType !== topLevelTypes.topMouseOver ||
    !targetInst
  ) {
    return null;
  }

  var win;
  if (nativeEventTarget.window === nativeEventTarget) {
    // `nativeEventTarget` is probably a window object.
    win = nativeEventTarget;
  } else {
    // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
    var doc = nativeEventTarget.ownerDocument;
    if (doc) {
      win = doc.defaultView || doc.parentWindow;
    } else {
      win = window;
    }
  }

  var eventType;

  if (topLevelType === topLevelTypes.topMouseOut) {
    eventType = 'mouseLeave';
  } else {
    eventType = 'mouseEnter';
  }

  // Get the closest instance listening for this event
  var delegateTargetInst = getEventDelegateTargetInst(targetInst, eventTypes[eventType]);

  // if this or a parent isn't listening for enter|leave
  // there is nothing else to do.
  if (!delegateTargetInst) {
    return null;
  }

  var target = ReactDOMComponentTree.getNodeFromInstance(delegateTargetInst);
  var related = nativeEvent.relatedTarget || nativeEvent.toElement;

  // When the mouse moves from or into a listening node, but not
  // movements between elements inside that node.
  // no relatedTarget means an enter|leave from the document
  if (!related || related !== target && !containsNode(target, related)) {
    related = related || win;


    var event = SyntheticMouseEvent.getPooled(
      eventTypes[eventType],
      delegateTargetInst,
      nativeEvent,
      target
    );

    event.type = eventType.toLowerCase();
    event.relatedTarget = related;

    EventPropagators.accumulateDirectDispatches(event);

    return event;
  }
}

var EnterLeaveEventPlugin = {

  eventTypes: eventTypes,

  isEnterLeaveSupported: isEnterLeaveSupported,

  extractEvents: function(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    var event;

    if (EnterLeaveEventPlugin.isEnterLeaveSupported) {
      event = getNativeEnterLeave(topLevelType, targetInst, nativeEvent, nativeEventTarget);
    } else {
      event = getEnterLeavePolyfill(topLevelType, targetInst, nativeEvent, nativeEventTarget);
    }

    return event;
  },

};

module.exports = EnterLeaveEventPlugin;
