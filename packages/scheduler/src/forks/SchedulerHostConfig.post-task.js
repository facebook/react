/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Capture local references to native APIs, in case a polyfill overrides them.
const perf = window.performance;
const setTimeout = window.setTimeout;
const clearTimeout = window.clearTimeout;

function postTask(callback) {
  // Use experimental Chrome Scheduler postTask API.
  global.scheduler.postTask(callback);
}

function getNow() {
  return perf.now();
}

let isTaskLoopRunning = false;
let scheduledHostCallback = null;
let taskTimeoutID = -1;

// Scheduler periodically yields in case there is other work on the main
// thread, like user events. By default, it yields multiple times per frame.
// It does not attempt to align with frame boundaries, since most tasks don't
// need to be frame aligned; for those that do, use requestAnimationFrame.
const yieldInterval = 5;
let deadline = 0;

// `isInputPending` is not available. Since we have no way of knowing if
// there's pending input, always yield at the end of the frame.
export function shouldYieldToHost() {
  return getNow() >= deadline;
}

export function requestPaint() {
  // Since we yield every frame regardless, `requestPaint` has no effect.
}

export function forceFrameRate(fps) {
  // No-op
}

function performWorkUntilDeadline() {
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
        isTaskLoopRunning = false;
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
    isTaskLoopRunning = false;
  }
}

export function requestHostCallback(callback) {
  scheduledHostCallback = callback;
  if (!isTaskLoopRunning) {
    isTaskLoopRunning = true;
    postTask(performWorkUntilDeadline);
  }
}

export function cancelHostCallback() {
  scheduledHostCallback = null;
}

export function requestHostTimeout(callback, ms) {
  taskTimeoutID = setTimeout(() => {
    callback(getNow());
  }, ms);
}

export function cancelHostTimeout() {
  clearTimeout(taskTimeoutID);
  taskTimeoutID = -1;
}

export const getCurrentTime = getNow;
