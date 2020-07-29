/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Capture local references to native APIs, in case a polyfill overrides them.
const date = window.Date;
const perf = window.performance;
const setTimeout = window.setTimeout;
const clearTimeout = window.clearTimeout;

// This check should be done upstream but do it again for a clear failure message.
if (global.scheduler === undefined || global.scheduler.postTask === undefined) {
  throw new Error('Cannot use postTask Scheduler without global.scheduler');
}

function postTask(callback) {
  // Use experimental Chrome Scheduler postTask API.
  global.scheduler.postTask(callback);
}

let getNow;
if (typeof perf === 'object' && typeof perf.now === 'function') {
  getNow = () => perf.now();
} else {
  const initialTime = date.now();
  getNow = () => date.now() - initialTime;
}

let isMessageLoopRunning = false;
let scheduledHostCallback = null;
let taskTimeoutID = -1;

// Scheduler periodically yields in case there is other work on the main
// thread, like user events. By default, it yields multiple times per frame.
// It does not attempt to align with frame boundaries, since most tasks don't
// need to be frame aligned; for those that do, use requestAnimationFrame.
let yieldInterval = 5;
let deadline = 0;

// `isInputPending` is not available. Since we have no way of knowing if
// there's pending input, always yield at the end of the frame.
export const shouldYieldToHost = function() {
  return getNow() >= deadline;
};

// Since we yield every frame regardless, `requestPaint` has no effect.
export const requestPaint = function() {};

export const forceFrameRate = function(fps) {
  if (fps < 0 || fps > 125) {
    // Using console['error'] to evade Babel and ESLint
    console['error'](
      'forceFrameRate takes a positive int between 0 and 125, ' +
        'forcing frame rates higher than 125 fps is not unsupported',
    );
    return;
  }
  if (fps > 0) {
    yieldInterval = Math.floor(1000 / fps);
  } else {
    // reset the framerate
    yieldInterval = 5;
  }
};

const performWorkUntilDeadline = () => {
  if (scheduledHostCallback !== null) {
    const currentTime = getNow();
    // Yield after `yieldInterval` ms, regardless of where we are in the vsync
    // cycle. This means there's always time remaining at the beginning of
    // the message event.
    deadline = currentTime + yieldInterval;
    const hasTimeRemaining = true;
    try {
      const hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
      if (!hasMoreWork) {
        isMessageLoopRunning = false;
        scheduledHostCallback = null;
      } else {
        // If there's more work, schedule the next message event at the end
        // of the preceding one.
        postTask(performWorkUntilDeadline);
      }
    } catch (error) {
      // If a scheduler task throws, exit the current browser task so the
      // error can be observed.
      postTask(performWorkUntilDeadline);
      throw error;
    }
  } else {
    isMessageLoopRunning = false;
  }
};

export const requestHostCallback = function(callback) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    postTask(performWorkUntilDeadline);
  }
};

export const cancelHostCallback = function() {
  scheduledHostCallback = null;
};

export const requestHostTimeout = function(callback, ms) {
  taskTimeoutID = setTimeout(() => {
    callback(getNow());
  }, ms);
};

export const cancelHostTimeout = function() {
  clearTimeout(taskTimeoutID);
  taskTimeoutID = -1;
};

export const getCurrentTime = getNow;
