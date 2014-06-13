/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @providesModule EnterLeaveEventPlugin
 * @typechecks static-only
 */

"use strict";

var EventConstants = require('EventConstants');
var EventPropagators = require('EventPropagators');
var SyntheticMouseEvent = require('SyntheticMouseEvent');
var SyntheticPointerEvent = require('SyntheticPointerEvent');

var ReactMount = require('ReactMount');
var keyOf = require('keyOf');

var topLevelTypes = EventConstants.topLevelTypes;
var getFirstReactDOM = ReactMount.getFirstReactDOM;

var eventTypes = {
  mouseEnter: {
    registrationName: keyOf({onMouseEnter: null}),
    dependencies: [
      topLevelTypes.topMouseOut,
      topLevelTypes.topMouseOver
    ]
  },
  mouseLeave: {
    registrationName: keyOf({onMouseLeave: null}),
    dependencies: [
      topLevelTypes.topMouseOut,
      topLevelTypes.topMouseOver
    ]
  },
  pointerEnter: {
    registrationName: keyOf({onPointerEnter: null}),
    dependencies: [
      topLevelTypes.topPointerOut,
      topLevelTypes.topPointerOver
    ]
  },
  pointerLeave: {
    registrationName: keyOf({onPointerLeave: null}),
    dependencies: [
      topLevelTypes.topPointerOut,
      topLevelTypes.topPointerOver
    ]
  }
};

var extractedEvents = [null, null];

var EnterLeaveEventPlugin = {

  eventTypes: eventTypes,

  /**
   * For almost every interaction we care about, there will be both a top-level
   * `mouseover` and `mouseout` event that occurs. Only use `mouseout` so that
   * we do not extract duplicate events. However, moving the mouse into the
   * browser from outside will not fire a `mouseout` event. In this case, we use
   * the `mouseover` top-level event.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    var isOverEvent = (
      topLevelType === topLevelTypes.topMouseOver ||
      topLevelType === topLevelTypes.topPointerOver
    );
    var isOutEvent = (
      topLevelType === topLevelTypes.topMouseOut ||
      topLevelType === topLevelTypes.topPointerOut
    );

    if (!isOverEvent && !isOutEvent) {
      // Must not be a mouse/pointer in or out - ignoring.
      return null;
    }
    if (isOverEvent && (nativeEvent.relatedTarget || nativeEvent.fromElement)) {
      return null;
    }

    var win;
    if (topLevelTarget.window === topLevelTarget) {
      // `topLevelTarget` is probably a window object.
      win = topLevelTarget;
    } else {
      // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
      var doc = topLevelTarget.ownerDocument;
      win = doc ? doc.defaultView || doc.parentWindow : window;
    }

    var from, to;
    if (isOutEvent) {
      from = topLevelTarget;
      to = (
        getFirstReactDOM(nativeEvent.relatedTarget || nativeEvent.toElement) ||
        win
      );
    } else {
      from = win;
      to = topLevelTarget;
    }

    if (from === to) {
      // Nothing pertains to our managed components.
      return null;
    }

    var eventInterface, leaveEventType, enterEventType, eventTypePrefix;

    if (topLevelType === topLevelTypes.topMouseOut ||
        topLevelType === topLevelTypes.topMouseOver) {
      eventInterface = SyntheticMouseEvent;
      leaveEventType = eventTypes.mouseLeave;
      enterEventType = eventTypes.mouseEnter;
      eventTypePrefix = 'mouse';
    } else if (topLevelType === topLevelTypes.topPointerOut ||
               topLevelType === topLevelTypes.topPointerOver) {
      eventInterface = SyntheticPointerEvent;
      leaveEventType = eventTypes.pointerLeave;
      enterEventType = eventTypes.pointerEnter;
      eventTypePrefix = 'pointer';
    }

    var fromID = from ? ReactMount.getID(from) : '';
    var toID = to ? ReactMount.getID(to) : '';

    var leave = eventInterface.getPooled(leaveEventType, fromID, nativeEvent);
    leave.type = eventTypePrefix + 'leave';
    leave.target = from;
    leave.relatedTarget = to;

    var enter = eventInterface.getPooled(enterEventType, fromID, nativeEvent);
    enter.type = eventTypePrefix + 'enter';
    enter.target = to;
    enter.relatedTarget = from;

    EventPropagators.accumulateEnterLeaveDispatches(leave, enter, fromID, toID);

    extractedEvents[0] = leave;
    extractedEvents[1] = enter;

    return extractedEvents;
  }

};

module.exports = EnterLeaveEventPlugin;
