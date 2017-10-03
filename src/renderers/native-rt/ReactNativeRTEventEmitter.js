/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNativeRTEventEmitter
 * @flow
 */
'use strict';

var ReactNativeRTComponentTree = require('ReactNativeRTComponentTree');
var ReactGenericBatching = require('ReactGenericBatching');

var ReactNativeRTEventEmitter = {
  /**
   * Publicly exposed method on module for native objc to invoke when a top
   * level event is extracted.
   * @param {rootNodeID} rootNodeID React root node ID that event occurred on.
   * @param {TopLevelType} topLevelType Top level type of event.
   * @param {object} nativeEventParam Object passed from native.
   */
  receiveEvent: function(
    rootNodeID: number,
    topLevelType: string,
    nativeEventParam: Object,
  ) {
    var nativeEvent = nativeEventParam;
    var props = ReactNativeRTComponentTree.getFiberCurrentPropsFromTag(
      rootNodeID,
    );
    if (props == null) {
      return;
    }
    var eventHandler = props[topLevelType];
    if (typeof eventHandler !== 'function') {
      return;
    }
    ReactGenericBatching.batchedUpdates(function() {
      eventHandler(nativeEvent);
    });
  },
};

module.exports = ReactNativeRTEventEmitter;
