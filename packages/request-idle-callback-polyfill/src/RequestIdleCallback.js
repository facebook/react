/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This is a built-in polyfill for requestIdleCallback. It works by scheduling
// a requestAnimationFrame, storing the time for the start of the frame, then
// scheduling a postMessage which gets scheduled after paint. Within the
// postMessage handler do as much work as possible until time + frame rate.
// By separating the idle call into a separate event tick we ensure that
// layout, paint and other browser work is counted against the available time.
// The frame rate is dynamically adjusted.

export type IdleDeadline = {
  timeRemaining: () => number,
  didTimeout: boolean,
};

type IdleRequestOptions = {
  timeout: number,
};

export type IdleRequestCallback = IdleDeadline => void;

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

function IdleDeadlineImpl(deadline: number, didTimeout: boolean) {
  this._deadline = deadline;
  this.didTimeout = didTimeout;
}

IdleDeadlineImpl.prototype.timeRemaining = function() {
  // If the callback timed out there's definitely no time remaining
  if (this.didTimeout) {
    return 0;
  }
  // We assume that if we have a performance timer that the rAF callback
  // gets a performance timer value. Not sure if this is always true.
  const remaining = this._deadline - now();
  return remaining > 0 ? remaining : 0;
};

const idleCallbacks: Array<null | IdleRequestCallback> = [];
const idleCallbackTimeouts: Array<null | number> = [];
let idleCallbackIdentifier = 0;
let currentIdleCallbackHandle = 0;
let lastIdlePeriodDeadline = 0;

let isIdleScheduled = false;

let isAnimationFrameScheduled = false;
// We start out assuming that we run at 30fps but then the heuristic tracking
// will adjust this value to a faster fps if we get more frequent animation
// frames.
let previousFrameTime = 33;
let activeFrameTime = 33;
// Tracks whether the 'message' event listener has been registered, which is done
// lazily the first time requestIdleCallback is called
let registeredMessageListener = false;

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
  // While there are still callbacks in the queue...
  while (currentIdleCallbackHandle < idleCallbacks.length) {
    // Get the callback and the timeout, if it exists
    const timeoutTime = idleCallbackTimeouts[currentIdleCallbackHandle];
    const callback = idleCallbacks[currentIdleCallbackHandle];
    // This callback might have been cancelled, continue to check the rest of the queue
    if (!callback) {
      currentIdleCallbackHandle++;
      continue;
    }
    const currentTime = now();
    let didTimeout = false;
    if (lastIdlePeriodDeadline - currentTime <= 0) {
      // There's no time left in this idle period. Check if the callback has
      // a timeout and whether it's been exceeded.
      if (timeoutTime != null && timeoutTime <= currentTime) {
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
    currentIdleCallbackHandle++;
    callback(new IdleDeadlineImpl(lastIdlePeriodDeadline, didTimeout));
  }
};

function animationTick(rafTime: number) {
  isAnimationFrameScheduled = false;
  let nextFrameTime = rafTime - lastIdlePeriodDeadline + activeFrameTime;
  if (nextFrameTime < activeFrameTime && previousFrameTime < activeFrameTime) {
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
  lastIdlePeriodDeadline = rafTime + activeFrameTime;
  if (!isIdleScheduled) {
    isIdleScheduled = true;
    window.postMessage(messageKey, '*');
  }
}

function invokerIdleCallbackTimeout(handle: number) {
  const callback = idleCallbacks[handle];
  if (callback !== null) {
    cancelIdleCallback(handle);
    callback(new IdleDeadlineImpl(now(), true));
  }
}

export function requestIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions,
): number {
  const handle = idleCallbackIdentifier++;
  idleCallbacks[handle] = callback;

  if (options != null && typeof options.timeout === 'number') {
    idleCallbackTimeouts[handle] = now() + options.timeout;
    window.setTimeout(
      () => invokerIdleCallbackTimeout(handle),
      options.timeout,
    );
  }

  // Lazily register the listener when rIC is first called
  if (!registeredMessageListener) {
    // Assumes that we have addEventListener in this environment. Might need
    // something better for old IE.
    window.addEventListener('message', idleTick, false);
    registeredMessageListener = true;
  }
  if (!isAnimationFrameScheduled) {
    // If rAF didn't already schedule one, we need to schedule a frame.
    // TODO: If this rAF doesn't materialize because the browser throttles, we
    // might want to still have setTimeout trigger rIC as a backup to ensure
    // that we keep performing work.
    isAnimationFrameScheduled = true;
    requestAnimationFrame(animationTick);
  }
  return 0;
}

export function cancelIdleCallback(handle: number) {
  idleCallbacks[handle] = null;
  idleCallbackTimeouts[handle] = null;
  // @TODO this isn't true if there are still scheduled callbacks in the queue
  isIdleScheduled = false;
}
