/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

/**
 * A scheduling library to allow scheduling work with more granular priority and
 * control than requestAnimationFrame and requestIdleCallback.
 * Current TODO items:
 * X- Pull out the scheduleWork polyfill built into React
 * X- Initial test coverage
 * X- Support for multiple callbacks
 * - Support for two priorities; serial and deferred
 * - Better test coverage
 * - Better docblock
 * - Polish documentation, API
 */

// This is a built-in polyfill for requestIdleCallback. It works by scheduling
// a requestAnimationFrame, storing the time for the start of the frame, then
// scheduling a postMessage which gets scheduled after paint. Within the
// postMessage handler do as much work as possible until time + frame rate.
// By separating the idle call into a separate event tick we ensure that
// layout, paint and other browser work is counted against the available time.
// The frame rate is dynamically adjusted.

import type {Deadline} from 'react-reconciler';
type FrameCallbackType = Deadline => void;
type CallbackConfigType = {|
  scheduledCallback: FrameCallbackType,
  timeoutTime: number,
  callbackId: number, // used for cancelling
|};

import ExecutionEnvironment from 'fbjs/lib/ExecutionEnvironment';
import warning from 'fbjs/lib/warning';

if (__DEV__) {
  if (
    ExecutionEnvironment.canUseDOM &&
    typeof requestAnimationFrame !== 'function'
  ) {
    warning(
      false,
      'React depends on requestAnimationFrame. Make sure that you load a ' +
        'polyfill in older browsers. https://fb.me/react-polyfills',
    );
  }
}

const hasNativePerformanceNow =
  typeof performance === 'object' && typeof performance.now === 'function';

let now;
if (hasNativePerformanceNow) {
  now = function() {
    return performance.now();
  };
} else {
  now = function() {
    return Date.now();
  };
}

// TODO: There's no way to cancel, because Fiber doesn't atm.
let scheduleWork: (
  callback: FrameCallbackType,
  options?: {timeout: number},
) => number;
let cancelScheduledWork: (callbackID: number) => void;

if (!ExecutionEnvironment.canUseDOM) {
  scheduleWork = function(
    callback: FrameCallbackType,
    options?: {timeout: number},
  ): number {
    return setTimeout(() => {
      callback({
        timeRemaining() {
          return Infinity;
        },
        didTimeout: false,
      });
    });
  };
  cancelScheduledWork = function(timeoutID: number) {
    clearTimeout(timeoutID);
  };
} else {
  // We keep callbacks in a queue.
  // Calling scheduleWork will push in a new callback at the end of the queue.
  // When we get idle time, callbacks are removed from the front of the queue
  // and called.
  const pendingCallbacks: Array<CallbackConfigType> = [];

  let callbackIdCounter = 0;
  const getCallbackId = function(): number {
    callbackIdCounter++;
    return callbackIdCounter;
  };

  // When a callback is scheduled, we register it by adding it's id to this
  // object.
  // If the user calls 'cancelScheduledWork' with the id of that callback, it will be
  // unregistered by removing the id from this object.
  // Then we skip calling any callback which is not registered.
  // This means cancelling is an O(1) time complexity instead of O(n).
  const registeredCallbackIds: {[number]: boolean} = {};

  // We track what the next soonest timeoutTime is, to be able to quickly tell
  // if none of the scheduled callbacks have timed out.
  let nextSoonestTimeoutTime = -1;

  let isIdleScheduled = false;
  let isAnimationFrameScheduled = false;

  let frameDeadline = 0;
  // We start out assuming that we run at 30fps but then the heuristic tracking
  // will adjust this value to a faster fps if we get more frequent animation
  // frames.
  let previousFrameTime = 33;
  let activeFrameTime = 33;

  const frameDeadlineObject: Deadline = {
    didTimeout: false,
    timeRemaining() {
      const remaining = frameDeadline - now();
      return remaining > 0 ? remaining : 0;
    },
  };

  const safelyCallScheduledCallback = function(
    callback: FrameCallbackType,
    callbackId: number,
  ) {
    if (!registeredCallbackIds[callbackId]) {
      // ignore cancelled callbacks
      return;
    }
    try {
      callback(frameDeadlineObject);
      // Avoid using 'catch' to keep errors easy to debug
    } finally {
      // always clean up the callbackId, even if the callback throws
      delete registeredCallbackIds[callbackId];
    }
  };

  /**
   * Checks for timed out callbacks, runs them, and then checks again to see if
   * any more have timed out.
   * Keeps doing this until there are none which have currently timed out.
   */
  const callTimedOutCallbacks = function() {
    if (pendingCallbacks.length === 0) {
      return;
    }

    const currentTime = now();
    // TODO: this would be more efficient if deferred callbacks are stored in
    // min heap.
    // Or in a linked list with links for both timeoutTime order and insertion
    // order.
    // For now an easy compromise is the current approach:
    // Keep a pointer to the soonest timeoutTime, and check that first.
    // If it has not expired, we can skip traversing the whole list.
    // If it has expired, then we step through all the callbacks.
    if (nextSoonestTimeoutTime === -1 || nextSoonestTimeoutTime > currentTime) {
      // We know that none of them have timed out yet.
      return;
    }
    nextSoonestTimeoutTime = -1; // we will reset it below

    // keep checking until we don't find any more timed out callbacks
    frameDeadlineObject.didTimeout = true;
    for (let i = 0, len = pendingCallbacks.length; i < len; i++) {
      const currentCallbackConfig = pendingCallbacks[i];
      const timeoutTime = currentCallbackConfig.timeoutTime;
      if (timeoutTime !== -1 && timeoutTime <= currentTime) {
        // it has timed out!
        // call it
        const callback = currentCallbackConfig.scheduledCallback;
        safelyCallScheduledCallback(callback, timeoutTime);
      } else {
        if (
          timeoutTime !== -1 &&
          (nextSoonestTimeoutTime === -1 ||
            timeoutTime < nextSoonestTimeoutTime)
        ) {
          nextSoonestTimeoutTime = timeoutTime;
        }
      }
    }
  };

  // We use the postMessage trick to defer idle work until after the repaint.
  const messageKey =
    '__reactIdleCallback$' +
    Math.random()
      .toString(36)
      .slice(2);
  const idleTick = function(event) {
    if (event.source !== window || event.data !== messageKey) {
      return;
    }
    isIdleScheduled = false;

    if (pendingCallbacks.length === 0) {
      return;
    }

    // First call anything which has timed out, until we have caught up.
    callTimedOutCallbacks();

    let currentTime = now();
    // Next, as long as we have idle time, try calling more callbacks.
    while (frameDeadline - currentTime > 0 && pendingCallbacks.length > 0) {
      const latestCallbackConfig = pendingCallbacks.shift();
      frameDeadlineObject.didTimeout = false;
      const latestCallback = latestCallbackConfig.scheduledCallback;
      const newCallbackId = latestCallbackConfig.callbackId;
      safelyCallScheduledCallback(latestCallback, newCallbackId);
      currentTime = now();
    }
    if (pendingCallbacks.length > 0) {
      if (!isAnimationFrameScheduled) {
        // Schedule another animation callback so we retry later.
        isAnimationFrameScheduled = true;
        requestAnimationFrame(animationTick);
      }
    }
  };
  // Assumes that we have addEventListener in this environment. Might need
  // something better for old IE.
  window.addEventListener('message', idleTick, false);

  const animationTick = function(rafTime) {
    isAnimationFrameScheduled = false;
    let nextFrameTime = rafTime - frameDeadline + activeFrameTime;
    if (
      nextFrameTime < activeFrameTime &&
      previousFrameTime < activeFrameTime
    ) {
      if (nextFrameTime < 8) {
        // Defensive coding. We don't support higher frame rates than 120hz.
        // If we get lower than that, it is probably a bug.
        nextFrameTime = 8;
      }
      // If one frame goes long, then the next one can be short to catch up.
      // If two frames are short in a row, then that's an indication that we
      // actually have a higher frame rate than what we're currently optimizing.
      // We adjust our heuristic dynamically accordingly. For example, if we're
      // running on 120hz display or 90hz VR display.
      // Take the max of the two in case one of them was an anomaly due to
      // missed frame deadlines.
      activeFrameTime =
        nextFrameTime < previousFrameTime ? previousFrameTime : nextFrameTime;
    } else {
      previousFrameTime = nextFrameTime;
    }
    frameDeadline = rafTime + activeFrameTime;
    if (!isIdleScheduled) {
      isIdleScheduled = true;
      window.postMessage(messageKey, '*');
    }
  };

  scheduleWork = function(
    callback: FrameCallbackType,
    options?: {timeout: number},
  ): number {
    let timeoutTime = -1;
    if (options != null && typeof options.timeout === 'number') {
      timeoutTime = now() + options.timeout;
    }
    if (timeoutTime > nextSoonestTimeoutTime) {
      nextSoonestTimeoutTime = timeoutTime;
    }

    const newCallbackId = getCallbackId();
    const scheduledCallbackConfig = {
      scheduledCallback: callback,
      callbackId: newCallbackId,
      timeoutTime,
    };
    pendingCallbacks.push(scheduledCallbackConfig);

    registeredCallbackIds[newCallbackId] = true;
    if (!isAnimationFrameScheduled) {
      // If rAF didn't already schedule one, we need to schedule a frame.
      // TODO: If this rAF doesn't materialize because the browser throttles, we
      // might want to still have setTimeout trigger scheduleWork as a backup to ensure
      // that we keep performing work.
      isAnimationFrameScheduled = true;
      requestAnimationFrame(animationTick);
    }
    return newCallbackId;
  };

  cancelScheduledWork = function(callbackId: number) {
    delete registeredCallbackIds[callbackId];
  };
}

export {now, scheduleWork, cancelScheduledWork};
