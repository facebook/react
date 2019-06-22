/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {enableIsInputPending} from '../SchedulerFeatureFlags';

// The DOM Scheduler implementation is similar to requestIdleCallback. It
// works by scheduling a requestAnimationFrame, storing the time for the start
// of the frame, then scheduling a postMessage which gets scheduled after paint.
// Within the postMessage handler do as much work as possible until time + frame
// rate. By separating the idle call into a separate event tick we ensure that
// layout, paint and other browser work is counted against the available time.
// The frame rate is dynamically adjusted.

export let requestHostCallback;
export let cancelHostCallback;
export let requestHostTimeout;
export let cancelHostTimeout;
export let shouldYieldToHost;
export let requestPaint;
export let getCurrentTime;
export let forceFrameRate;

const hasNativePerformanceNow =
  typeof performance === 'object' && typeof performance.now === 'function';

// We capture a local reference to any global, in case it gets polyfilled after
// this module is initially evaluated. We want to be using a
// consistent implementation.
const localDate = Date;

// This initialization code may run even on server environments if a component
// just imports ReactDOM (e.g. for findDOMNode). Some environments might not
// have setTimeout or clearTimeout. However, we always expect them to be defined
// on the client. https://github.com/facebook/react/pull/13088
const localSetTimeout =
  typeof setTimeout === 'function' ? setTimeout : undefined;
const localClearTimeout =
  typeof clearTimeout === 'function' ? clearTimeout : undefined;

// We don't expect either of these to necessarily be defined, but we will error
// later if they are missing on the client.
const localRequestAnimationFrame =
  typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : undefined;
const localCancelAnimationFrame =
  typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : undefined;

// requestAnimationFrame does not run when the tab is in the background. If
// we're backgrounded we prefer for that work to happen so that the page
// continues to load in the background. So we also schedule a 'setTimeout' as
// a fallback.
// TODO: Need a better heuristic for backgrounded work.
const ANIMATION_FRAME_TIMEOUT = 100;
let rAFID;
let rAFTimeoutID;
const requestAnimationFrameWithTimeout = function(callback) {
  // schedule rAF and also a setTimeout
  rAFID = localRequestAnimationFrame(function(timestamp) {
    // cancel the setTimeout
    localClearTimeout(rAFTimeoutID);
    callback(timestamp);
  });
  rAFTimeoutID = localSetTimeout(function() {
    // cancel the requestAnimationFrame
    localCancelAnimationFrame(rAFID);
    callback(getCurrentTime());
  }, ANIMATION_FRAME_TIMEOUT);
};

if (hasNativePerformanceNow) {
  const Performance = performance;
  getCurrentTime = function() {
    return Performance.now();
  };
} else {
  getCurrentTime = function() {
    return localDate.now();
  };
}

if (
  // If Scheduler runs in a non-DOM environment, it falls back to a naive
  // implementation using setTimeout.
  typeof window === 'undefined' ||
  // Check if MessageChannel is supported, too.
  typeof MessageChannel !== 'function'
) {
  // If this accidentally gets imported in a non-browser environment, e.g. JavaScriptCore,
  // fallback to a naive implementation.
  let _callback = null;
  let _timeoutID = null;
  const _flushCallback = function() {
    if (_callback !== null) {
      try {
        const currentTime = getCurrentTime();
        const hasRemainingTime = true;
        _callback(hasRemainingTime, currentTime);
        _callback = null;
      } catch (e) {
        setTimeout(_flushCallback, 0);
        throw e;
      }
    }
  };
  requestHostCallback = function(cb) {
    if (_callback !== null) {
      // Protect against re-entrancy.
      setTimeout(requestHostCallback, 0, cb);
    } else {
      _callback = cb;
      setTimeout(_flushCallback, 0);
    }
  };
  cancelHostCallback = function() {
    _callback = null;
  };
  requestHostTimeout = function(cb, ms) {
    _timeoutID = setTimeout(cb, ms);
  };
  cancelHostTimeout = function() {
    clearTimeout(_timeoutID);
  };
  shouldYieldToHost = function() {
    return false;
  };
  requestPaint = forceFrameRate = function() {};
} else {
  if (typeof console !== 'undefined') {
    // TODO: Remove fb.me link
    if (typeof localRequestAnimationFrame !== 'function') {
      console.error(
        "This browser doesn't support requestAnimationFrame. " +
          'Make sure that you load a ' +
          'polyfill in older browsers. https://fb.me/react-polyfills',
      );
    }
    if (typeof localCancelAnimationFrame !== 'function') {
      console.error(
        "This browser doesn't support cancelAnimationFrame. " +
          'Make sure that you load a ' +
          'polyfill in older browsers. https://fb.me/react-polyfills',
      );
    }
  }

  let scheduledHostCallback = null;
  let isMessageEventScheduled = false;

  let isAnimationFrameScheduled = false;

  let timeoutID = -1;

  let frameDeadline = 0;
  // We start out assuming that we run at 30fps but then the heuristic tracking
  // will adjust this value to a faster fps if we get more frequent animation
  // frames.
  let previousFrameTime = 33;
  let activeFrameTime = 33;
  let fpsLocked = false;

  // TODO: Make this configurable
  // TODO: Adjust this based on priority?
  let maxFrameLength = 150;
  let needsPaint = false;

  if (
    enableIsInputPending &&
    navigator !== undefined &&
    navigator.scheduling !== undefined &&
    navigator.scheduling.isInputPending !== undefined
  ) {
    const isInputPending = navigator.scheduling.isInputPending;
    shouldYieldToHost = function() {
      const currentTime = getCurrentTime();
      if (currentTime >= frameDeadline) {
        // There's no time left in the frame. We may want to yield control of
        // the main thread, so the browser can perform high priority tasks. The
        // main ones are painting and user input. If there's a pending paint or
        // a pending input, then we should yield. But if there's neither, then
        // we can yield less often while remaining responsive. We'll eventually
        // yield regardless, since there could be a pending paint that wasn't
        // accompanied by a call to `requestPaint`, or other main thread tasks
        // like network events.
        if (needsPaint || isInputPending()) {
          // There is either a pending paint or a pending input.
          return true;
        }
        // There's no pending input. Only yield if we've reached the max
        // frame length.
        return currentTime >= frameDeadline + maxFrameLength;
      } else {
        // There's still time left in the frame.
        return false;
      }
    };

    requestPaint = function() {
      needsPaint = true;
    };
  } else {
    // `isInputPending` is not available. Since we have no way of knowing if
    // there's pending input, always yield at the end of the frame.
    shouldYieldToHost = function() {
      return getCurrentTime() >= frameDeadline;
    };

    // Since we yield every frame regardless, `requestPaint` has no effect.
    requestPaint = function() {};
  }

  forceFrameRate = function(fps) {
    if (fps < 0 || fps > 125) {
      console.error(
        'forceFrameRate takes a positive int between 0 and 125, ' +
          'forcing framerates higher than 125 fps is not unsupported',
      );
      return;
    }
    if (fps > 0) {
      activeFrameTime = Math.floor(1000 / fps);
      fpsLocked = true;
    } else {
      // reset the framerate
      activeFrameTime = 33;
      fpsLocked = false;
    }
  };

  // We use the postMessage trick to defer idle work until after the repaint.
  const channel = new MessageChannel();
  const port = channel.port2;
  channel.port1.onmessage = function(event) {
    isMessageEventScheduled = false;
    if (scheduledHostCallback !== null) {
      const currentTime = getCurrentTime();
      const hasTimeRemaining = frameDeadline - currentTime > 0;
      try {
        const hasMoreWork = scheduledHostCallback(
          hasTimeRemaining,
          currentTime,
        );
        if (hasMoreWork) {
          // Ensure the next frame is scheduled.
          if (!isAnimationFrameScheduled) {
            isAnimationFrameScheduled = true;
            requestAnimationFrameWithTimeout(animationTick);
          }
        } else {
          scheduledHostCallback = null;
        }
      } catch (error) {
        // If a scheduler task throws, exit the current browser task so the
        // error can be observed, and post a new task as soon as possible
        // so we can continue where we left off.
        isMessageEventScheduled = true;
        port.postMessage(undefined);
        throw error;
      }
      // Yielding to the browser will give it a chance to paint, so we can
      // reset this.
      needsPaint = false;
    }
  };

  const animationTick = function(rafTime) {
    if (scheduledHostCallback !== null) {
      // Eagerly schedule the next animation callback at the beginning of the
      // frame. If the scheduler queue is not empty at the end of the frame, it
      // will continue flushing inside that callback. If the queue *is* empty,
      // then it will exit immediately. Posting the callback at the start of the
      // frame ensures it's fired within the earliest possible frame. If we
      // waited until the end of the frame to post the callback, we risk the
      // browser skipping a frame and not firing the callback until the frame
      // after that.
      requestAnimationFrameWithTimeout(animationTick);
    } else {
      // No pending work. Exit.
      isAnimationFrameScheduled = false;
      return;
    }

    let nextFrameTime = rafTime - frameDeadline + activeFrameTime;
    if (
      nextFrameTime < activeFrameTime &&
      previousFrameTime < activeFrameTime &&
      !fpsLocked
    ) {
      if (nextFrameTime < 8) {
        // Defensive coding. We don't support higher frame rates than 120hz.
        // If the calculated frame time gets lower than 8, it is probably a bug.
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
    if (!isMessageEventScheduled) {
      isMessageEventScheduled = true;
      port.postMessage(undefined);
    }
  };

  requestHostCallback = function(callback) {
    if (scheduledHostCallback === null) {
      scheduledHostCallback = callback;
      if (!isAnimationFrameScheduled) {
        // If rAF didn't already schedule one, we need to schedule a frame.
        // TODO: If this rAF doesn't materialize because the browser throttles,
        // we might want to still have setTimeout trigger rIC as a backup to
        // ensure that we keep performing work.
        isAnimationFrameScheduled = true;
        requestAnimationFrameWithTimeout(animationTick);
      }
    }
  };

  cancelHostCallback = function() {
    scheduledHostCallback = null;
    isMessageEventScheduled = false;
  };

  requestHostTimeout = function(callback, ms) {
    timeoutID = localSetTimeout(() => {
      callback(getCurrentTime());
    }, ms);
  };

  cancelHostTimeout = function() {
    localClearTimeout(timeoutID);
    timeoutID = -1;
  };
}
