/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule IOSNativeBridgeEventPlugin
 * @flow
 */
'use strict';

var EventPropagators = require('EventPropagators');
var SyntheticEvent = require('SyntheticEvent');
var UIManager = require('UIManager');

var merge = require('merge');
var warning = require('fbjs/lib/warning');

var customBubblingEventTypes = UIManager.customBubblingEventTypes;
var customDirectEventTypes = UIManager.customDirectEventTypes;

var allTypesByEventName = {};

for (var bubblingTypeName in customBubblingEventTypes) {
  allTypesByEventName[bubblingTypeName] = customBubblingEventTypes[bubblingTypeName];
}

for (var directTypeName in customDirectEventTypes) {
  warning(
    !customBubblingEventTypes[directTypeName],
    'Event cannot be both direct and bubbling: %s',
    directTypeName
  );
  allTypesByEventName[directTypeName] = customDirectEventTypes[directTypeName];
}

var IOSNativeBridgeEventPlugin = {

  eventTypes: merge(customBubblingEventTypes, customDirectEventTypes),

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
    topLevelType: string,
    topLevelTarget: EventTarget,
    topLevelTargetID: string,
    nativeEvent: Event
  ): ?Object {
    var bubbleDispatchConfig = customBubblingEventTypes[topLevelType];
    var directDispatchConfig = customDirectEventTypes[topLevelType];
    var event = SyntheticEvent.getPooled(
      bubbleDispatchConfig || directDispatchConfig,
      topLevelTargetID,
      nativeEvent
    );
    if (bubbleDispatchConfig) {
      EventPropagators.accumulateTwoPhaseDispatches(event);
    } else if (directDispatchConfig) {
      EventPropagators.accumulateDirectDispatches(event);
    } else {
      return null;
    }
    return event;
  }
};

module.exports = IOSNativeBridgeEventPlugin;
