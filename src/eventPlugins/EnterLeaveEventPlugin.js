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
 * @providesModule EnterLeaveEventPlugin
 * @typechecks
 */

"use strict";

var EventPropagators = require('EventPropagators');
var ExecutionEnvironment = require('ExecutionEnvironment');
var AbstractEvent = require('AbstractEvent');
var EventConstants = require('EventConstants');
var ReactInstanceHandles = require('ReactInstanceHandles');

var getDOMNodeID = require('getDOMNodeID');
var keyOf = require('keyOf');

var topLevelTypes = EventConstants.topLevelTypes;
var getFirstReactDOM = ReactInstanceHandles.getFirstReactDOM;

var abstractEventTypes = {
  mouseEnter: {registrationName: keyOf({onMouseEnter: null})},
  mouseLeave: {registrationName: keyOf({onMouseLeave: null})}
};

/**
 * For almost every interaction we care about, there will be a top-level
 * `mouseover` and `mouseout` event that occurs so only pay attention to one of
 * the two (to avoid duplicate events). We use the `mouseout` event.
 *
 * However, there's one interaction where there will be no `mouseout` event to
 * rely on - mousing from outside the browser *into* the chrome. We detect this
 * scenario and only in that case, we use the `mouseover` event.
 *
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {DOMEventTarget} topLevelTarget The listening component root node.
 * @param {string} topLevelTargetID ID of `topLevelTarget`.
 * @param {object} nativeEvent Native browser event.
 * @return {*} An accumulation of `AbstractEvent`s.
 * @see {EventPluginHub.extractAbstractEvents}
 */
var extractAbstractEvents = function(
    topLevelType,
    topLevelTarget,
    topLevelTargetID,
    nativeEvent) {
  if (topLevelType === topLevelTypes.topMouseOver &&
      (nativeEvent.relatedTarget || nativeEvent.fromElement)) {
    return null;
  }
  if (topLevelType !== topLevelTypes.topMouseOut &&
      topLevelType !== topLevelTypes.topMouseOver) {
    return null;  // Must not be a mouse in or mouse out - ignoring.
  }

  var to, from;
  if (topLevelType === topLevelTypes.topMouseOut) {
    to = getFirstReactDOM(nativeEvent.relatedTarget || nativeEvent.toElement) ||
      ExecutionEnvironment.global;
    from = topLevelTarget;
  } else {
    to = topLevelTarget;
    from = ExecutionEnvironment.global;
  }

  // Nothing pertains to our managed components.
  if (from === to) {
    return null;
  }

  var fromID = from ? getDOMNodeID(from) : '';
  var toID = to ? getDOMNodeID(to) : '';

  var leave = AbstractEvent.getPooled(
    abstractEventTypes.mouseLeave,
    fromID,
    nativeEvent
  );
  var enter = AbstractEvent.getPooled(
    abstractEventTypes.mouseEnter,
    toID,
    nativeEvent
  );

  EventPropagators.accumulateEnterLeaveDispatches(leave, enter, fromID, toID);

  return [leave, enter];
};

var EnterLeaveEventPlugin = {
  abstractEventTypes: abstractEventTypes,
  extractAbstractEvents: extractAbstractEvents
};

module.exports = EnterLeaveEventPlugin;
