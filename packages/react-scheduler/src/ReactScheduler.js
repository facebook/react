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

import type {Deadline} from 'react-reconciler/src/ReactFiberScheduler';
type FrameCallbackType = Deadline => void;
type CallbackConfigType = {|
  scheduledCallback: FrameCallbackType,
  timeoutTime: number,
  nextCallbackConfig: CallbackConfigType | null, // creating a linked list
  previousCallbackConfig: CallbackConfigType | null, // creating a linked list
|};

export type CallbackIdType = any;

import ExecutionEnvironment from 'fbjs/lib/ExecutionEnvironment';
import requestAnimationFrameForReact from 'shared/requestAnimationFrameForReact';

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

let scheduleWork: (
  callback: FrameCallbackType,
  options?: {timeout: number},
) => CallbackIdType;
let cancelScheduledWork: (callbackId: CallbackIdType) => void;

if (!ExecutionEnvironment.canUseDOM) {
  let callbackIdCounter = 0;
  // Timeouts are objects in Node.
  // For consistency, we'll use numbers in the public API anyway.
  const timeoutIds: {[number]: TimeoutID} = {};

  scheduleWork = function(
    callback: FrameCallbackType,
    options?: {timeout: number},
  ): CallbackIdType {
    const callbackId = callbackIdCounter++;
    const timeoutId = setTimeout(() => {
      callback({
        timeRemaining() {
          return Infinity;
        },
        didTimeout: false,
      });
    });
    timeoutIds[callbackId] = timeoutId;
    return callbackId;
  };
  cancelScheduledWork = function(callbackId: CallbackIdType) {
    const timeoutId = timeoutIds[callbackId];
    delete timeoutIds[callbackId];
    clearTimeout(timeoutId);
  };
} else {
  let headOfPendingCallbacksLinkedList: CallbackConfigType | null = null;
  let tailOfPendingCallbacksLinkedList: CallbackConfigType | null = null;

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

  /**
   * Checks for timed out callbacks, runs them, and then checks again to see if
   * any more have timed out.
   * Keeps doing this until there are none which have currently timed out.
   */
  const callTimedOutCallbacks = function() {
    if (headOfPendingCallbacksLinkedList === null) {
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
    let currentCallbackConfig = headOfPendingCallbacksLinkedList;
    while (currentCallbackConfig !== null) {
      const timeoutTime = currentCallbackConfig.timeoutTime;
      if (timeoutTime !== -1 && timeoutTime <= currentTime) {
        // it has timed out!
        // call it
        const callback = currentCallbackConfig.scheduledCallback;
        // TODO: error handling
        callback(frameDeadlineObject);
        // remove it from linked list
        cancelScheduledWork(currentCallbackConfig);
      } else {
        if (
          timeoutTime !== -1 &&
          (nextSoonestTimeoutTime === -1 ||
            timeoutTime < nextSoonestTimeoutTime)
        ) {
          nextSoonestTimeoutTime = timeoutTime;
        }
      }
      currentCallbackConfig = currentCallbackConfig.nextCallbackConfig;
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

    if (headOfPendingCallbacksLinkedList === null) {
      return;
    }

    // First call anything which has timed out, until we have caught up.
    callTimedOutCallbacks();

    let currentTime = now();
    // Next, as long as we have idle time, try calling more callbacks.
    while (
      frameDeadline - currentTime > 0 &&
      headOfPendingCallbacksLinkedList !== null
    ) {
      const latestCallbackConfig = headOfPendingCallbacksLinkedList;
      // move head of list to next callback
      headOfPendingCallbacksLinkedList =
        latestCallbackConfig.nextCallbackConfig;
      if (headOfPendingCallbacksLinkedList) {
        headOfPendingCallbacksLinkedList.previousCallbackConfig = null;
      }
      if (tailOfPendingCallbacksLinkedList === latestCallbackConfig) {
        tailOfPendingCallbacksLinkedList = null;
      }
      frameDeadlineObject.didTimeout = false;
      const latestCallback = latestCallbackConfig.scheduledCallback;
      // TODO: before using this outside of React we need to add error handling
      latestCallback(frameDeadlineObject);
      currentTime = now();
    }
    if (headOfPendingCallbacksLinkedList !== null) {
      if (!isAnimationFrameScheduled) {
        // Schedule another animation callback so we retry later.
        isAnimationFrameScheduled = true;
        requestAnimationFrameForReact(animationTick);
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
  ): CallbackIdType /* CallbackConfigType */ {
    let timeoutTime = -1;
    if (options != null && typeof options.timeout === 'number') {
      timeoutTime = now() + options.timeout;
    }
    if (
      nextSoonestTimeoutTime === -1 ||
      (timeoutTime !== -1 && timeoutTime < nextSoonestTimeoutTime)
    ) {
      nextSoonestTimeoutTime = timeoutTime;
    }

    const scheduledCallbackConfig: CallbackConfigType = {
      scheduledCallback: callback,
      timeoutTime,
      previousCallbackConfig: null,
      nextCallbackConfig: null,
    };
    if (headOfPendingCallbacksLinkedList === null) {
      // Make this callback the head and tail of our list
      headOfPendingCallbacksLinkedList = scheduledCallbackConfig;
      tailOfPendingCallbacksLinkedList = scheduledCallbackConfig;
    } else {
      // Add latest callback as the new tail of the list
      scheduledCallbackConfig.previousCallbackConfig = tailOfPendingCallbacksLinkedList;
      // renaming for clarity
      const oldTailOfPendingCallbacksLinkedList = tailOfPendingCallbacksLinkedList;
      if (oldTailOfPendingCallbacksLinkedList !== null) {
        oldTailOfPendingCallbacksLinkedList.nextCallbackConfig = scheduledCallbackConfig;
      }
      tailOfPendingCallbacksLinkedList = scheduledCallbackConfig;
    }

    if (!isAnimationFrameScheduled) {
      // If rAF didn't already schedule one, we need to schedule a frame.
      // TODO: If this rAF doesn't materialize because the browser throttles, we
      // might want to still have setTimeout trigger scheduleWork as a backup to ensure
      // that we keep performing work.
      isAnimationFrameScheduled = true;
      requestAnimationFrameForReact(animationTick);
    }
    return scheduledCallbackConfig;
  };

  cancelScheduledWork = function(
    callbackConfig: CallbackIdType /* CallbackConfigType */,
  ) {
    /**
     * There are four possible cases:
     * - Head -> nodeToRemove -> Tail
     *   In this case we point the Head.next to the Tail and the Tail.prev to
     *   the Head.
     * - Head -> middle -> Tail/nodeToRemove
     *   In this case we point the middle.next to null and put middle as the new
     *   Tail.
     * - Head/nodeToRemove -> middle -> Tail
     *   In this case we point the middle.prev at null and move the Head to
     *   middle.
     * - Head/nodeToRemove/Tail -> null
     *   In this case we set Head and Tail to null.
     */
    const previousCallbackConfig = callbackConfig.previousCallbackConfig;
    const nextCallbackConfig = callbackConfig.nextCallbackConfig;
    if (previousCallbackConfig) {
      previousCallbackConfig.nextCallbackConfig = nextCallbackConfig;
    }
    if (nextCallbackConfig) {
      nextCallbackConfig.previousCallbackConfig = previousCallbackConfig;
    }
    if (headOfPendingCallbacksLinkedList === callbackConfig) {
      headOfPendingCallbacksLinkedList = nextCallbackConfig;
    }
    if (tailOfPendingCallbacksLinkedList === callbackConfig) {
      tailOfPendingCallbacksLinkedList = previousCallbackConfig;
    }
  };
}

export {now, scheduleWork, cancelScheduledWork};
