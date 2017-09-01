/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeBridgeEventPlugin
 * @flow
 */
'use strict';

var EventPropagators = require('EventPropagators');
var SyntheticEvent = require('SyntheticEvent');
var ReactNativeEventTypes = require('ReactNativeEventTypes');

var customBubblingEventTypes = ReactNativeEventTypes.customBubblingEventTypes;
var customDirectEventTypes = ReactNativeEventTypes.customDirectEventTypes;

if (__DEV__) {
  var warning = require('fbjs/lib/warning');

  for (var directTypeName in customDirectEventTypes) {
    warning(
      !customBubblingEventTypes[directTypeName],
      'Event cannot be both direct and bubbling: %s',
      directTypeName,
    );
  }
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
