/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNativeBridgeEventPlugin
 * @flow
 */
'use strict';

var EventPropagators = require('EventPropagators');
var SyntheticEvent = require('SyntheticEvent');
var UIManager = require('UIManager');

var warning = require('warning');

var customBubblingEventTypes = UIManager.customBubblingEventTypes;
var customDirectEventTypes = UIManager.customDirectEventTypes;

var allTypesByEventName = {};

for (var bubblingTypeName in customBubblingEventTypes) {
  allTypesByEventName[bubblingTypeName] =
    customBubblingEventTypes[bubblingTypeName];
}

for (var directTypeName in customDirectEventTypes) {
  warning(
    !customBubblingEventTypes[directTypeName],
    'Event cannot be both direct and bubbling: %s',
    directTypeName,
  );
  allTypesByEventName[directTypeName] = customDirectEventTypes[directTypeName];
}

var ReactNativeBridgeEventPlugin = {
  eventTypes: {...customBubblingEventTypes, ...customDirectEventTypes},

  /**
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
    topLevelType: string,
    targetInst: Object,
    nativeEvent: Event,
    nativeEventTarget: Object,
  ): ?Object {
    var bubbleDispatchConfig = customBubblingEventTypes[topLevelType];
    var directDispatchConfig = customDirectEventTypes[topLevelType];
    var event = SyntheticEvent.getPooled(
      bubbleDispatchConfig || directDispatchConfig,
      targetInst,
      nativeEvent,
      nativeEventTarget,
    );
    if (bubbleDispatchConfig) {
      EventPropagators.accumulateTwoPhaseDispatches(event);
    } else if (directDispatchConfig) {
      EventPropagators.accumulateDirectDispatches(event);
    } else {
      return null;
    }
    return event;
  },
};

module.exports = ReactNativeBridgeEventPlugin;
