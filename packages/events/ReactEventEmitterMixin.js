/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  enqueueEvents,
  processEventQueue,
  extractEvents,
} from './EventPluginHub';

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
  const events = extractEvents(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
  );
  runEventQueueInBatch(events);
}
