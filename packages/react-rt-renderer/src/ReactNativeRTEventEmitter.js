/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {batchedUpdates} from 'events/ReactGenericBatching';
// Module provided by RN:
import BatchedBridge from 'BatchedBridge';

import {getFiberCurrentPropsFromTag} from './ReactNativeRTComponentTree';

var ReactNativeRTEventEmitter = {
  /**
   * Publicly exposed method on module for native objc to invoke when a top
   * level event is extracted.
   * @param {rootNodeID} rootNodeID React root node ID that event occurred on.
   * @param {TopLevelType} topLevelType Top level type of event.
   * @param {object} nativeEventParam Object passed from native.
   */
  receiveEvent: function(
    tag: number,
    topLevelType: string,
    nativeEventParam: Object,
  ) {
    var nativeEvent = nativeEventParam;
    var props = getFiberCurrentPropsFromTag(tag);
    if (props == null) {
      return;
    }
    var eventHandler = props[topLevelType];
    if (typeof eventHandler !== 'function') {
      return;
    }
    batchedUpdates(function() {
      eventHandler(nativeEvent);
    });
  },
};

BatchedBridge.registerCallableModule(
  'RTEventEmitter',
  ReactNativeRTEventEmitter,
);
