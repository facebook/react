/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO: Currently there's only a single priority level, Deferred. Need to add
// additional priorities (serial, offscreen).
const Deferred = 0;
const DEFERRED_TIMEOUT = 5000;

// Callbacks are stored as a circular, doubly linked list.
let firstCallbackNode = null;

let priorityContext = Deferred;
let currentlyFlushingTime = -1;

let isHostCallbackScheduled = false;

const hasNativePerformanceNow =
  typeof performance === 'object' && typeof performance.now === 'function';

let timeRemaining;
if (hasNativePerformanceNow) {
  timeRemaining = () => {
    if (
      firstCallbackNode !== null &&
      firstCallbackNode.timesOutAt < currentlyFlushingTime
    ) {
      // A higher priority callback was scheduled. Yield so we can switch to
      // working on that.
      return 0;
    }
    // We assume that if we have a performance timer that the rAF callback
    // gets a performance timer value. Not sure if this is always true.
    const remaining = getFrameDeadline() - performance.now();
    return remaining > 0 ? remaining : 0;
  };
} else {
  // Same thing, but with Date.now()
  timeRemaining = () => {
    if (
      firstCallbackNode !== null &&
      firstCallbackNode.timesOutAt < currentlyFlushingTime
    ) {
      return 0;
    }
    const remaining = getFrameDeadline() - Date.now();
    return remaining > 0 ? remaining : 0;
  };
}

const deadlineObject = {
  timeRemaining,
  didTimeout: false,
};

function ensureHostCallbackIsScheduled(highestPriorityNode) {
  if (currentlyFlushingTime !== -1) {
    // Don't schedule work yet; wait until the next time we yield.
    return;
  }
  const timesOutAt = highestPriorityNode.timesOutAt;
  if (!isHostCallbackScheduled) {
    isHostCallbackScheduled = true;
  } else {
    // Cancel the existing work.
    cancelCallback();
  }
  // Schedule work using the highest priority callback's timeout.
  requestCallback(flushWork, timesOutAt);
}

function computeAbsoluteTimeoutForPriority(currentTime, priority) {
  if (priority === Deferred) {
    return currentTime + DEFERRED_TIMEOUT;
  }
  throw new Error('Not yet implemented.');
}

function flushFirstCallback() {
  const flushedNode = firstCallbackNode;

  // Remove the node from the list before calling the callback. That way the
  // list is in a consistent state even if the callback throws.
  let next = firstCallbackNode.next;
  if (firstCallbackNode === next) {
    // This is the last callback in the list.
    firstCallbackNode = null;
    next = null;
  } else {
    const previous = firstCallbackNode.previous;
    firstCallbackNode = previous.next = next;
    next.previous = previous;
  }

  flushedNode.next = flushedNode.previous = null;

  // Now it's safe to call the callback.
  currentlyFlushingTime = flushedNode.timesOutAt;
  const callback = flushedNode.callback;
  const continuationCallback = callback(deadlineObject);

  if (typeof continuationCallback === 'function') {
    const timesOutAt = flushedNode.timesOutAt;
    const continuationNode: CallbackNode = {
      callback: continuationCallback,
      timesOutAt,
      next: null,
      previous: null,
    };

    // Insert the new callback into the list, sorted by its timeout.
    if (firstCallbackNode === null) {
      // This is the first callback in the list.
      firstCallbackNode = continuationNode.next = continuationNode.previous = continuationNode;
    } else {
      let nextAfterContinuation = null;
      let node = firstCallbackNode;
      do {
        if (node.timesOutAt >= timesOutAt) {
          // This callback is equal or lower priority than the new one.
          nextAfterContinuation = node;
          break;
        }
        node = node.next;
      } while (node !== firstCallbackNode);

      if (nextAfterContinuation === null) {
        // No equal or lower priority callback was found, which means the new
        // callback is the lowest priority callback in the list.
        nextAfterContinuation = firstCallbackNode;
      } else if (nextAfterContinuation === firstCallbackNode) {
        // The new callback is the highest priority callback in the list.
        firstCallbackNode = continuationNode;
        ensureHostCallbackIsScheduled(firstCallbackNode);
      }

      const previous = nextAfterContinuation.previous;
      previous.next = nextAfterContinuation.previous = continuationNode;
      continuationNode.next = nextAfterContinuation;
      continuationNode.previous = previous;
    }
  }
}

function flushWork(didTimeout) {
  deadlineObject.didTimeout = didTimeout;
  try {
    if (didTimeout) {
      // Flush all the timed out callbacks without yielding.
      while (
        firstCallbackNode !== null &&
        firstCallbackNode.timesOutAt <= getCurrentTime()
      ) {
        flushFirstCallback();
      }
    } else {
      // Keep flushing callbacks until we run out of time in the frame.
      if (firstCallbackNode !== null) {
        do {
          flushFirstCallback();
        } while (
          firstCallbackNode !== null &&
          getFrameDeadline() - getCurrentTime() > 0
        );
      }
    }
  } finally {
    currentlyFlushingTime = -1;
    if (firstCallbackNode !== null) {
      // There's still work remaining. Request another callback.
      ensureHostCallbackIsScheduled(firstCallbackNode);
    } else {
      isHostCallbackScheduled = false;
    }
  }
}

function unstable_scheduleWork(callback, options) {
  const currentTime = getCurrentTime();

  let timesOutAt;
  if (
    options !== undefined &&
    options !== null &&
    options.timeout !== null &&
    options.timeout !== undefined
  ) {
    // Check for an explicit timeout.
    timesOutAt = currentTime + options.timeout;
  } else if (currentlyFlushingTime !== -1) {
    timesOutAt = currentlyFlushingTime;
  } else {
    timesOutAt = computeAbsoluteTimeoutForPriority(
      currentTime,
      priorityContext,
    );
  }

  const newNode = {
    callback,
    timesOutAt,
    next: null,
    previous: null,
  };

  // Insert the new callback into the list, sorted by its timeout.
  if (firstCallbackNode === null) {
    // This is the first callback in the list.
    firstCallbackNode = newNode.next = newNode.previous = newNode;
    ensureHostCallbackIsScheduled(firstCallbackNode);
  } else {
    let next = null;
    let node = firstCallbackNode;
    do {
      if (node.timesOutAt > timesOutAt) {
        // This callback is lower priority than the new one.
        next = node;
        break;
      }
      node = node.next;
    } while (node !== firstCallbackNode);

    if (next === null) {
      // No lower priority callback was found, which means the new callback is
      // the lowest priority callback in the list.
      next = firstCallbackNode;
    } else if (next === firstCallbackNode) {
      // The new callback is the highest priority callback in the list.
      firstCallbackNode = newNode;
      ensureHostCallbackIsScheduled(firstCallbackNode);
    }

    const previous = next.previous;
    previous.next = next.previous = newNode;
    newNode.next = next;
    newNode.previous = previous;
  }

  return newNode;
}

function unstable_cancelScheduledWork(callbackNode: CallbackNode): void {
  const next = callbackNode.next;
  if (next === null) {
    // Already cancelled.
    return;
  }

  if (next === callbackNode) {
    // This is the only scheduled callback. Clear the list.
    firstCallbackNode = null;
  } else {
    // Remove the callback from its position in the list.
    if (callbackNode === firstCallbackNode) {
      firstCallbackNode = next;
    }
    const previous = callbackNode.previous;
    previous.next = next;
    next.previous = previous;
  }

  callbackNode.next = callbackNode.previous = null;
}

// The remaining code is essentially a polyfill for requestIdleCallback. It
// works by scheduling a requestAnimationFrame, storing the time for the start
// of the frame, then scheduling a postMessage which gets scheduled after paint.
// Within the postMessage handler do as much work as possible until time + frame
// rate. By separating the idle call into a separate event tick we ensure that
// layout, paint and other browser work is counted against the available time.
// The frame rate is dynamically adjusted.

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

let getCurrentTime: () => number;

// requestAnimationFrame does not run when the tab is in the background. If
// we're backgrounded we prefer for that work to happen so that the page
// continues to load in the background. So we also schedule a 'setTimeout' as
// a fallback.
// TODO: Need a better heuristic for backgrounded work.
const ANIMATION_FRAME_TIMEOUT = 100;
let rAFID;
let rAFTimeoutID;
const requestAnimationFrameWithTimeout = callback => {
  // schedule rAF and also a setTimeout
  rAFID = localRequestAnimationFrame(timestamp => {
    // cancel the setTimeout
    localClearTimeout(rAFTimeoutID);
    callback(timestamp);
  });
  rAFTimeoutID = localSetTimeout(() => {
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

let requestCallback;
let cancelCallback;
let getFrameDeadline;

if (typeof window === 'undefined') {
  // If this accidentally gets imported in a non-browser environment, fallback
  // to a naive implementation.
  let timeoutID = -1;
  requestCallback = (callback, absoluteTimeout) => {
    timeoutID = setTimeout(callback, 0, true);
  };
  cancelCallback = () => {
    clearTimeout(timeoutID);
  };
  getFrameDeadline = () => 0;
} else if (window._sched) {
  // Dynamic injection, only for testing purposes.
  const impl = window._sched;
  requestCallback = impl[0];
  cancelCallback = impl[1];
  getFrameDeadline = impl[2];
} else {
  if (typeof console !== 'undefined') {
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

  let scheduledCallback = null;
  let isIdleScheduled = false;
  let timeoutTime = -1;

  let isAnimationFrameScheduled = false;

  let isPerformingIdleWork = false;

  let frameDeadline = 0;
  // We start out assuming that we run at 30fps but then the heuristic tracking
  // will adjust this value to a faster fps if we get more frequent animation
  // frames.
  let previousFrameTime = 33;
  let activeFrameTime = 33;

  getFrameDeadline = () => frameDeadline;

  // We use the postMessage trick to defer idle work until after the repaint.
  const messageKey =
    '__reactIdleCallback$' +
    Math.random()
      .toString(36)
      .slice(2);
  const idleTick = event => {
    if (event.source !== window || event.data !== messageKey) {
      return;
    }

    isIdleScheduled = false;

    const currentTime = getCurrentTime();

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
          requestAnimationFrameWithTimeout(animationTick);
        }
        // Exit without invoking the callback.
        return;
      }
    }

    timeoutTime = -1;
    const callback = scheduledCallback;
    scheduledCallback = null;
    if (callback !== null) {
      isPerformingIdleWork = true;
      try {
        callback(didTimeout);
      } finally {
        isPerformingIdleWork = false;
      }
    }
  };
  // Assumes that we have addEventListener in this environment. Might need
  // something better for old IE.
  window.addEventListener('message', idleTick, false);

  const animationTick = rafTime => {
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

  requestCallback = (callback, absoluteTimeout) => {
    scheduledCallback = callback;
    timeoutTime = absoluteTimeout;
    if (isPerformingIdleWork) {
      // If we're already performing idle work, an error must have been thrown.
      // Don't wait for the next frame. Continue working ASAP, in a new event.
      window.postMessage(messageKey, '*');
    } else if (!isAnimationFrameScheduled) {
      // If rAF didn't already schedule one, we need to schedule a frame.
      // TODO: If this rAF doesn't materialize because the browser throttles, we
      // might want to still have setTimeout trigger rIC as a backup to ensure
      // that we keep performing work.
      isAnimationFrameScheduled = true;
      requestAnimationFrameWithTimeout(animationTick);
    }
  };

  cancelCallback = function() {
    scheduledCallback = null;
    isIdleScheduled = false;
    timeoutTime = -1;
  };
}

export {
  unstable_scheduleWork,
  unstable_cancelScheduledWork,
  getCurrentTime as unstable_now,
};
