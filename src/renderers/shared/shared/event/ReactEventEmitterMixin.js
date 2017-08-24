/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactEventEmitterMixin
 */

'use strict';

import {enqueueEvents, extractEvents, processEventQueue} from 'EventPluginHub';

function runEventQueueInBatch(events) {
  enqueueEvents(events);
  processEventQueue(false);
}

/**
   * Streams a fired top-level event to `EventPluginHub` where plugins have the
   * opportunity to create `ReactEvent`s to be dispatched.
   */
export function handleTopLevel(
  topLevelType,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  var events = extractEvents(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
  );
  runEventQueueInBatch(events);
}
