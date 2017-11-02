/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Deadline} from 'react-reconciler';

const hasNativePerformanceNow =
  typeof performance === 'object' && typeof performance.now === 'function';

const now = hasNativePerformanceNow
  ? () => performance.now()
  : () => Date.now();

type Callback = (deadline: Deadline) => void;

let isCallbackScheduled: boolean = false;
let scheduledCallback: Callback | null = null;
let frameDeadline: number = 0;

const frameDeadlineObject: Deadline = {
  timeRemaining: () => frameDeadline - now(),
};

function setTimeoutCallback() {
  isCallbackScheduled = false;

  // TODO (bvaughn) Hard-coded 5ms unblocks initial async testing.
  // React API probably changing to boolean rather than time remaining.
  // Longer-term plan is to rewrite this using shared memory,
  // And just return the value of the bit as the boolean.
  frameDeadline = now() + 5;

  const callback = scheduledCallback;
  scheduledCallback = null;
  if (callback !== null) {
    callback(frameDeadlineObject);
  }
}

// RN has a poor polyfill for requestIdleCallback so we aren't using it.
// This implementation is only intended for short-term use anyway.
// We also don't implement cancel functionality b'c Fiber doesn't currently need it.
function scheduleDeferredCallback(callback: Callback): number {
  // We assume only one callback is scheduled at a time b'c that's how Fiber works.
  scheduledCallback = callback;

  if (!isCallbackScheduled) {
    isCallbackScheduled = true;
    setTimeout(setTimeoutCallback, 1);
  }

  return 0;
}

export {now, scheduleDeferredCallback};
