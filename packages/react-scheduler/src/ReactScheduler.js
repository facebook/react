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
 * X- Pull out the rIC polyfill built into React
 * X- Initial test coverage
 * X- Support for multiple callbacks
 * X- Support for two priorities; serial and deferred
 * - Better test coverage
 *   - Mock out the react-scheduler module, not the browser APIs, in renderer
 *   tests
 *   - Add fixture test of react-scheduler
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
let scheduleSerialCallback: (
  callback: (deadline: Deadline, options?: {timeout: number}) => void,
) => number;
let scheduleDeferredCallback: (
  callback: (deadline: Deadline, options?: {timeout: number}) => void,
) => number;
let cancelSerialCallback: (callbackID: number) => void;
let cancelDeferredCallback: (callback: Function) => void;

if (!ExecutionEnvironment.canUseDOM) {
  scheduleSerialCallback = function(
    frameCallback: (deadline: Deadline, options?: {timeout: number}) => void,
  ): number {
    return setTimeout(() => {
      frameCallback({
        timeRemaining() {
          return Infinity;
        },
        didTimeout: false,
      });
    });
  };
  cancelSerialCallback = function(timeoutID: number) {
    clearTimeout(timeoutID);
  };
} else {
  // Always polyfill requestIdleCallback and cancelIdleCallback

  let scheduledSerialCallback = null;
  let isIdleScheduled = false;
  let timeoutTime = -1;
  let isCurrentlyRunningCallback = false;
  // We may need to keep queues of pending callbacks
  let pendingSerialCallbacks = [];
  let pendingDeferredCallbacks = [];

  let isAnimationFrameScheduled = false;

  let frameDeadline = 0;
  // We start out assuming that we run at 30fps but then the heuristic tracking
  // will adjust this value to a faster fps if we get more frequent animation
  // frames.
  let previousFrameTime = 33;
  let activeFrameTime = 33;

  const frameDeadlineObject = {
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
    // TODO: this would be more efficient if deferred callbacks are stored in
    // min heap.
    let foundTimedOutCallback = false;

    // keep checking until we don't find any more timed out callbacks
    do {
      const currentTime = now();
      foundTimedOutCallback = false;
      // run serial callback if it has timed out
      if (scheduledSerialCallback !== null) {
        if (timeoutTime !== -1 && timeoutTime <= currentTime) {
          foundTimedOutCallback = true;
          const currentCallback = scheduledSerialCallback;
          timeoutTime = -1;
          scheduledSerialCallback = null;
          frameDeadlineObject.didTimeout = true;
          isCurrentlyRunningCallback = true;
          currentCallback(frameDeadlineObject);
          isCurrentlyRunningCallback = false;
        }
      }
      if (pendingDeferredCallbacks.length > 0) {
        // check if any have timed out, and if so
        // run them and remove from pendingDeferredCallbacks
        for (let i = 0, len = pendingDeferredCallbacks.length; i < len; i++) {
          const {
            deferredCallback,
            deferredCallbackTimeoutTime,
          } = pendingDeferredCallbacks[i];
          if (
            deferredCallbackTimeoutTime !== -1 &&
            deferredCallbackTimeoutTime <= currentTime
          ) {
            foundTimedOutCallback = true;
            pendingDeferredCallbacks.splice(i, 1); // remove this callback
            i--;
            len--; // compensate for mutating array we are traversing
            frameDeadlineObject.didTimeout = true;
            isCurrentlyRunningCallback = true;
            deferredCallback(frameDeadlineObject);
            isCurrentlyRunningCallback = false;
          }
        }
      }
    } while (foundTimedOutCallback);
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

    let keepRunningCallbacks = true;

    while (keepRunningCallbacks) {
      // call any timed out callbacks, until none left have timed out.
      callTimedOutCallbacks();

      // check if we have any idle time, and if so call some callbacks
      const currentTime = now();
      const idleTimeLeft = frameDeadline - currentTime > 0;
      if (idleTimeLeft) {
        // call the serial callback first if there is one
        let nextCallback = scheduledSerialCallback;
        timeoutTime = -1;
        scheduledSerialCallback = null;
        if (nextCallback === null) {
          // if no serial callback was scheduled, run a deferred callback
          nextCallback = pendingDeferredCallbacks.pop();
        }
        if (nextCallback) {
          frameDeadlineObject.didTimeout = false;
          isCurrentlyRunningCallback = true;
          nextCallback(frameDeadlineObject);
          isCurrentlyRunningCallback = false;
        } else {
          // There are no more scheduled callbacks.
          // Our work here is done.
          keepRunningCallbacks = false;
        }
      } else {
        // No idle time left in this frame.
        // Schedule another animation callback so we retry later.
        isAnimationFrameScheduled = true;
        requestAnimationFrame(animationTick);

        keepRunningCallbacks = false;
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

  /**
   * This method is similar to requestIdleCallback. 'Deferred' callbacks will
   * be called after the 'serial' priority callbacks have been cleared, with
   * additional priority given to callbacks which are past their timeout.
   */
  scheduleDeferredCallback = function(
    callback: (deadline: Deadline) => void,
    options?: {timeout: number},
  ): number {
    const deferredCallbackTimeoutTime =
      options && typeof options.timeout === 'number' ? options.timeout : -1;
    pendingDeferredCallbacks.push({
      deferredCallback: callback,
      deferredCallbackTimeoutTime,
    });
  };

  /**
   * 'Serial' callbacks are distinct from regular callbacks because they rely on
   * all previous 'serial' callbacks having been evaluated.
   * For example: If I click 'submit' and then quickly click 'submit' again. The
   * first click should disable the 'submit' button, and we can't process the
   * second click until that first click has been processed.
   */
  scheduleSerialCallback = function(
    callback: (deadline: Deadline) => void,
    options?: {timeout: number},
  ): number {
    let previousCallback;
    let timeoutTimeFromPreviousCallback;
    if (scheduledSerialCallback !== null) {
      // If we have previous callback, save it and handle it below
      timeoutTimeFromPreviousCallback = timeoutTime;
      previousCallback = scheduledSerialCallback;
    }
    // Then set up the next callback, and update timeoutTime
    scheduledSerialCallback = callback;
    if (options != null && typeof options.timeout === 'number') {
      timeoutTime = now() + options.timeout;
    } else {
      timeoutTime = -1;
    }
    // If we have previousCallback, call it. This may trigger recursion.
    if (
      previousCallback &&
      typeof timeoutTimeFromPreviousCallback === 'number'
    ) {
      const prevCallbackTimeout: number = timeoutTimeFromPreviousCallback;
      if (isCurrentlyRunningCallback) {
        // we are inside a recursive call to scheduleSerialCallback
        // add this callback to a pending queue and run after we exit
        pendingSerialCallbacks.push({
          pendingCallback: previousCallback,
          pendingCallbackTimeout: prevCallbackTimeout,
        });
      } else {
        frameDeadlineObject.didTimeout =
          timeoutTimeFromPreviousCallback !== -1 &&
          timeoutTimeFromPreviousCallback <= now();
        isCurrentlyRunningCallback = true;
        previousCallback(frameDeadlineObject);
        isCurrentlyRunningCallback = false;
        while (pendingSerialCallbacks.length) {
          // the callback recursively called scheduleSerialCallback
          // and new callbacks are pending
          const {
            pendingCallback,
            pendingCallbackTimeout,
          } = pendingSerialCallbacks.shift();
          // TODO: pull this into helper method
          frameDeadlineObject.didTimeout =
            pendingCallbackTimeout !== -1 && pendingCallbackTimeout <= now();
          isCurrentlyRunningCallback = true;
          pendingCallback(frameDeadlineObject);
          isCurrentlyRunningCallback = false;
        }
      }
    }

    // finally, after clearing previous callbacks, schedule the latest one
    if (!isAnimationFrameScheduled) {
      // If rAF didn't already schedule one, we need to schedule a frame.
      // TODO: If this rAF doesn't materialize because the browser throttles, we
      // might want to still have setTimeout trigger scheduleSerialCallback as a
      // backup to ensure that we keep performing work.
      isAnimationFrameScheduled = true;
      return requestAnimationFrame(animationTick);
    }
    return 0;
  };

  cancelSerialCallback = function() {
    isIdleScheduled = false;
    scheduledSerialCallback = null;
    timeoutTime = -1;
  };

  cancelDeferredCallback = function(callback) {
    const index = pendingDeferredCallbacks.indexOf(callback);
    pendingDeferredCallbacks.splice(index, 1);
  };
}

export {
  now,
  scheduleSerialCallback,
  cancelSerialCallback,
  scheduleDeferredCallback,
  cancelDeferredCallback,
};
