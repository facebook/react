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
 * - Support for two priorities; serial and deferred
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
let rIC: (
  callback: (deadline: Deadline, options?: {timeout: number}) => void,
) => number;
let cIC: (callbackID: number) => void;

if (!ExecutionEnvironment.canUseDOM) {
  rIC = function(
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
  cIC = function(timeoutID: number) {
    clearTimeout(timeoutID);
  };
} else {
  // Always polyfill requestIdleCallback and cancelIdleCallback

  let scheduledCallback = null;
  let isIdleScheduled = false;
  let timeoutTime = -1;
  let isCurrentlyRunningCallback = false;
  // We keep a queue of pending callbacks
  let pendingCallbacks = [];

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

  const safelyCallScheduledCallback = function(callback) {
    isCurrentlyRunningCallback = true;
    try {
      callback(frameDeadlineObject);
      isCurrentlyRunningCallback = false;
    } catch (e) {
      isCurrentlyRunningCallback = false;
      // Still throw it, but not in this frame.
      setTimeout(() => {throw e;});
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

    const currentTime = now();
    let didTimeout = false;
    if (frameDeadline - currentTime <= 0) {
      // There's no time left in this idle period. Check if the callback has
      // a timeout and whether it's been exceeded.
      if (timeoutTime !== -1 && timeoutTime <= currentTime) {
        // Exceeded the timeout. Invoke the callback even though there's no
        // time left.
        didTimeout = true;
      } else {
        // No timeout.
        if (!isAnimationFrameScheduled) {
          // Schedule another animation callback so we retry later.
          isAnimationFrameScheduled = true;
          requestAnimationFrame(animationTick);
        }
        // Exit without invoking the callback.
        return;
      }
    } else {
      // There's still time left in this idle period.
      didTimeout = false;
    }

    const callback = scheduledCallback;
    timeoutTime = -1;
    scheduledCallback = null;
    if (callback !== null) {
      frameDeadlineObject.didTimeout = didTimeout;
      safelyCallScheduledCallback(callback);
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

  rIC = function(
    callback: (deadline: Deadline) => void,
    options?: {timeout: number},
  ): number {
    // Handling multiple callbacks:
    // For now we implement the behavior expected when the callbacks are
    // serial updates, such that each update relies on the previous ones
    // having been called before it runs.
    // So we call anything in the queue before the latest callback

    let previousCallback;
    let timeoutTimeFromPreviousCallback;
    if (scheduledCallback !== null) {
      // If we have previous callback, save it and handle it below
      timeoutTimeFromPreviousCallback = timeoutTime;
      previousCallback = scheduledCallback;
    }
    // Then set up the next callback, and update timeoutTime
    scheduledCallback = callback;
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
        // we are inside a recursive call to rIC
        // add this callback to a pending queue and run after we exit
        pendingCallbacks.push({
          pendingCallback: previousCallback,
          pendingCallbackTimeout: prevCallbackTimeout,
        });
      } else {
        frameDeadlineObject.didTimeout =
          timeoutTimeFromPreviousCallback !== -1 &&
          timeoutTimeFromPreviousCallback <= now();
        safelyCallScheduledCallback(previousCallback);
        while (pendingCallbacks.length) {
          // the callback recursively called rIC and new callbacks are pending
          const callbackConfig = pendingCallbacks.shift();
          const pendingCallback = callbackConfig.pendingCallback;
          const pendingCallbackTimeout = callbackConfig.pendingCallbackTimeout;
          // TODO: pull this into helper method
          frameDeadlineObject.didTimeout =
            pendingCallbackTimeout !== -1 && pendingCallbackTimeout <= now();
          safelyCallScheduledCallback(pendingCallback);
        }
      }
    }

    // finally, after clearing previous callbacks, schedule the latest one
    if (!isAnimationFrameScheduled) {
      // If rAF didn't already schedule one, we need to schedule a frame.
      // TODO: If this rAF doesn't materialize because the browser throttles, we
      // might want to still have setTimeout trigger rIC as a backup to ensure
      // that we keep performing work.
      isAnimationFrameScheduled = true;
      return requestAnimationFrame(animationTick);
    }
    return 0;
  };

  cIC = function() {
    isIdleScheduled = false;
    scheduledCallback = null;
    timeoutTime = -1;
  };
}

export {now, rIC, cIC};
