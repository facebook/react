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

var EventPropagators = require('EventPropagators');
var EventPluginHub = require('EventPluginHub');
var ReactTreeTraversal = require('ReactTreeTraversal');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var SyntheticMouseEvent = require('SyntheticMouseEvent');
var isEventSupported = require('isEventSupported');
var containsNode = require('fbjs/lib/containsNode');

var isEnterLeaveSupported = isEventSupported('mouseenter', true);

var eventTypes = {
  mouseEnter: {
    registrationName: 'onMouseEnter',
    dependencies: ['topMouseOut', 'topMouseOver', 'topMouseEnter'],
  },
  mouseLeave: {
    registrationName: 'onMouseLeave',
    dependencies: ['topMouseOut', 'topMouseOver', 'topMouseLeave'],
  },
};

function getNativeEnterLeave(
  topLevelType,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  if (topLevelType === 'topMouseEnter' || topLevelType === 'topMouseLeave') {
    if (targetInst) {
      var eventType;

      if (topLevelType === 'topMouseEnter') {
        eventType = 'mouseEnter';
      } else {
        eventType = 'mouseLeave';
      }

      var event = SyntheticMouseEvent.getPooled(
        eventTypes[eventType],
        targetInst,
        nativeEvent,
        nativeEventTarget,
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

  return ReactTreeTraversal.traverseUntil(
    targetInst,
    nextInst => !!EventPluginHub.getListener(nextInst, registrationName),
  );
}

function getEnterLeavePolyfill(
  topLevelType,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  if (
    (topLevelType !== 'topMouseOut' && topLevelType !== 'topMouseOver') ||
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

  var eventType = topLevelType === 'topMouseOut' ? 'mouseLeave' : 'mouseEnter';

  // Get the closest instance listening for this event
  var delegateTargetInst = getEventDelegateTargetInst(
    targetInst,
    eventTypes[eventType],
  );

  // if this or a parent isn't listening for enter|leave
  // there is nothing else to do.
  if (!delegateTargetInst) {
    return null;
  }

  var target = ReactDOMComponentTree.getNodeFromInstance(delegateTargetInst);
  var related = nativeEvent.relatedTarget || nativeEvent.toElement;

  // Trigger _only_ when focus moves into or out of the listening node; not
  // when focus shifts between children on the listening node
  if (!related || (related !== target && !containsNode(target, related))) {
    related = related || win;

    var event = SyntheticMouseEvent.getPooled(
      eventTypes[eventType],
      delegateTargetInst,
      nativeEvent,
      target,
    );

    event.type = eventType.toLowerCase();
    event.relatedTarget = related;

    EventPropagators.accumulateDirectDispatches(event);

    return event;
  }
}

var EnterLeaveEventPlugin = {
  eventTypes: eventTypes,

  /**
   * Exposed for testing
   */
  isEnterLeaveSupported: isEnterLeaveSupported,

  /**
   * For almost every interaction we care about, there will be both a top-level
   * `mouseover` and `mouseout` event that occurs. Only use `mouseout` so that
   * we do not extract duplicate events. However, moving the mouse into the
   * browser from outside will not fire a `mouseout` event. In this case, we use
   * the `mouseover` top-level event.
   */
  extractEvents: function(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
  ) {
    var getEvent = EnterLeaveEventPlugin.isEnterLeaveSupported
      ? getNativeEnterLeave
      : getEnterLeavePolyfill;

    return getEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget);
  },
};

module.exports = EnterLeaveEventPlugin;
