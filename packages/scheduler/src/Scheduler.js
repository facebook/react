/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-var */

import {enableSchedulerDebugging} from './SchedulerFeatureFlags';
import {
  requestHostCallback,
  cancelHostCallback,
  shouldYieldToHost,
  getCurrentTime,
  forceFrameRate,
} from './SchedulerHostConfig';

// TODO: Use symbols?
var ImmediatePriority = 1;
var UserBlockingPriority = 2;
var NormalPriority = 3;
var LowPriority = 4;
var IdlePriority = 5;

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
var maxSigned31BitInt = 1073741823;

// Times out immediately
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
var USER_BLOCKING_PRIORITY = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
var IDLE_PRIORITY = maxSigned31BitInt;

// Tasks are stored as a circular, doubly linked list.
var firstTask = null;

var currentHostCallbackDidTimeout = false;
// Pausing the scheduler is useful for debugging.
var isSchedulerPaused = false;

var currentPriorityLevel = NormalPriority;
var currentEventStartTime = -1;
var currentExpirationTime = -1;

// This is set while performing work, to prevent re-entrancy.
var isPerformingWork = false;

var isHostCallbackScheduled = false;

function scheduleHostCallbackIfNeeded() {
  if (isPerformingWork) {
    // Don't schedule work yet; wait until the next time we yield.
    return;
  }
  if (firstTask !== null) {
    // Schedule the host callback using the earliest expiration in the list.
    var expirationTime = firstTask.expirationTime;
    if (isHostCallbackScheduled) {
      // Cancel the existing host callback.
      cancelHostCallback();
    } else {
      isHostCallbackScheduled = true;
    }
    requestHostCallback(flushWork, expirationTime);
  }
}

function flushFirstTask() {
  const currentlyFlushingTask = firstTask;

  // Remove the task from the list before calling the callback. That way the
  // list is in a consistent state even if the callback throws.
  var next = firstTask.next;
  if (firstTask === next) {
    // This is the last task in the list.
    firstTask = null;
    next = null;
  } else {
    var lastTask = firstTask.previous;
    firstTask = lastTask.next = next;
    next.previous = lastTask;
  }

  currentlyFlushingTask.next = currentlyFlushingTask.previous = null;

  // Now it's safe to execute the task.
  var callback = currentlyFlushingTask.callback;
  var expirationTime = currentlyFlushingTask.expirationTime;
  var priorityLevel = currentlyFlushingTask.priorityLevel;
  var previousPriorityLevel = currentPriorityLevel;
  var previousExpirationTime = currentExpirationTime;
  currentPriorityLevel = priorityLevel;
  currentExpirationTime = expirationTime;
  var continuationCallback;
  try {
    const didUserCallbackTimeout =
      currentHostCallbackDidTimeout ||
      // Immediate priority callbacks are always called as if they timed out
      priorityLevel === ImmediatePriority;
    continuationCallback = callback(didUserCallbackTimeout);
  } catch (error) {
    throw error;
  } finally {
    currentPriorityLevel = previousPriorityLevel;
    currentExpirationTime = previousExpirationTime;
  }

  // A callback may return a continuation. The continuation should be scheduled
  // with the same priority and expiration as the just-finished callback.
  if (typeof continuationCallback === 'function') {
    var continuationTask = {
      callback: continuationCallback,
      priorityLevel,
      expirationTime,
      next: null,
      previous: null,
    };

    // Insert the new callback into the list, sorted by its expiration. This is
    // almost the same as the code in `scheduleCallback`, except the callback
    // is inserted into the list *before* callbacks of equal expiration instead
    // of after.
    if (firstTask === null) {
      // This is the first callback in the list.
      firstTask = continuationTask.next = continuationTask.previous = continuationTask;
    } else {
      var nextAfterContinuation = null;
      var task = firstTask;
      do {
        if (task.expirationTime >= expirationTime) {
          // This task expires at or after the continuation. We will insert the
          // continuation *before* this task.
          nextAfterContinuation = task;
          break;
        }
        task = task.next;
      } while (task !== firstTask);

      if (nextAfterContinuation === null) {
        // No equal or lower priority task was found, which means the new task
        // is the lowest priority task in the list.
        nextAfterContinuation = firstTask;
      } else if (nextAfterContinuation === firstTask) {
        // The new task is the highest priority task in the list.
        firstTask = continuationTask;
        scheduleHostCallbackIfNeeded();
      }

      var previous = nextAfterContinuation.previous;
      previous.next = nextAfterContinuation.previous = continuationTask;
      continuationTask.next = nextAfterContinuation;
      continuationTask.previous = previous;
    }
  }
}

function flushWork(didUserCallbackTimeout) {
  // Exit right away if we're currently paused
  if (enableSchedulerDebugging && isSchedulerPaused) {
    return;
  }

  // We'll need a new host callback the next time work is scheduled.
  isHostCallbackScheduled = false;

  isPerformingWork = true;
  const previousDidTimeout = currentHostCallbackDidTimeout;
  currentHostCallbackDidTimeout = didUserCallbackTimeout;
  try {
    if (didUserCallbackTimeout) {
      // Flush all the expired callbacks without yielding.
      while (
        firstTask !== null &&
        !(enableSchedulerDebugging && isSchedulerPaused)
      ) {
        // TODO Wrap in feature flag
        // Read the current time. Flush all the callbacks that expire at or
        // earlier than that time. Then read the current time again and repeat.
        // This optimizes for as few performance.now calls as possible.
        var currentTime = getCurrentTime();
        if (firstTask.expirationTime <= currentTime) {
          do {
            flushFirstTask();
          } while (
            firstTask !== null &&
            firstTask.expirationTime <= currentTime &&
            !(enableSchedulerDebugging && isSchedulerPaused)
          );
          continue;
        }
        break;
      }
    } else {
      // Keep flushing callbacks until we run out of time in the frame.
      if (firstTask !== null) {
        do {
          if (enableSchedulerDebugging && isSchedulerPaused) {
            break;
          }
          flushFirstTask();
        } while (firstTask !== null && !shouldYieldToHost());
      }
    }
  } finally {
    isPerformingWork = false;
    currentHostCallbackDidTimeout = previousDidTimeout;
    // There's still work remaining. Request another callback.
    scheduleHostCallbackIfNeeded();
  }
}

function unstable_runWithPriority(priorityLevel, eventHandler) {
  switch (priorityLevel) {
    case ImmediatePriority:
    case UserBlockingPriority:
    case NormalPriority:
    case LowPriority:
    case IdlePriority:
      break;
    default:
      priorityLevel = NormalPriority;
  }

  var previousPriorityLevel = currentPriorityLevel;
  var previousEventStartTime = currentEventStartTime;
  currentPriorityLevel = priorityLevel;
  currentEventStartTime = getCurrentTime();

  try {
    return eventHandler();
  } catch (error) {
    // There's still work remaining. Request another callback.
    scheduleHostCallbackIfNeeded();
    throw error;
  } finally {
    currentPriorityLevel = previousPriorityLevel;
    currentEventStartTime = previousEventStartTime;
  }
}

function unstable_next(eventHandler) {
  let priorityLevel;
  switch (currentPriorityLevel) {
    case ImmediatePriority:
    case UserBlockingPriority:
    case NormalPriority:
      // Shift down to normal priority
      priorityLevel = NormalPriority;
      break;
    default:
      // Anything lower than normal priority should remain at the current level.
      priorityLevel = currentPriorityLevel;
      break;
  }

  var previousPriorityLevel = currentPriorityLevel;
  var previousEventStartTime = currentEventStartTime;
  currentPriorityLevel = priorityLevel;
  currentEventStartTime = getCurrentTime();

  try {
    return eventHandler();
  } catch (error) {
    // There's still work remaining. Request another callback.
    scheduleHostCallbackIfNeeded();
    throw error;
  } finally {
    currentPriorityLevel = previousPriorityLevel;
    currentEventStartTime = previousEventStartTime;
  }
}

function unstable_wrapCallback(callback) {
  var parentPriorityLevel = currentPriorityLevel;
  return function() {
    // This is a fork of runWithPriority, inlined for performance.
    var previousPriorityLevel = currentPriorityLevel;
    var previousEventStartTime = currentEventStartTime;
    currentPriorityLevel = parentPriorityLevel;
    currentEventStartTime = getCurrentTime();

    try {
      return callback.apply(this, arguments);
    } catch (error) {
      // There's still work remaining. Request another callback.
      scheduleHostCallbackIfNeeded();
      throw error;
    } finally {
      currentPriorityLevel = previousPriorityLevel;
      currentEventStartTime = previousEventStartTime;
    }
  };
}

function unstable_scheduleCallback(
  priorityLevel,
  callback,
  deprecated_options,
) {
  var startTime =
    currentEventStartTime !== -1 ? currentEventStartTime : getCurrentTime();

  var expirationTime;
  if (
    typeof deprecated_options === 'object' &&
    deprecated_options !== null &&
    typeof deprecated_options.timeout === 'number'
  ) {
    // FIXME: Remove this branch once we lift expiration times out of React.
    expirationTime = startTime + deprecated_options.timeout;
  } else {
    switch (priorityLevel) {
      case ImmediatePriority:
        expirationTime = startTime + IMMEDIATE_PRIORITY_TIMEOUT;
        break;
      case UserBlockingPriority:
        expirationTime = startTime + USER_BLOCKING_PRIORITY;
        break;
      case IdlePriority:
        expirationTime = startTime + IDLE_PRIORITY;
        break;
      case LowPriority:
        expirationTime = startTime + LOW_PRIORITY_TIMEOUT;
        break;
      case NormalPriority:
      default:
        expirationTime = startTime + NORMAL_PRIORITY_TIMEOUT;
    }
  }

  var newTask = {
    callback,
    priorityLevel: priorityLevel,
    expirationTime,
    next: null,
    previous: null,
  };

  // Insert the new task into the list, ordered first by expiration, then by
  // insertion. So the new task is inserted after any other task with
  // equal expiration.
  if (firstTask === null) {
    // This is the first task in the list.
    firstTask = newTask.next = newTask.previous = newTask;
    scheduleHostCallbackIfNeeded();
  } else {
    var next = null;
    var task = firstTask;
    do {
      if (task.expirationTime > expirationTime) {
        // The new task expires before this one.
        next = task;
        break;
      }
      task = task.next;
    } while (task !== firstTask);

    if (next === null) {
      // No task with a later expiration was found, which means the new task has
      // the latest expiration in the list.
      next = firstTask;
    } else if (next === firstTask) {
      // The new task has the earliest expiration in the entire list.
      firstTask = newTask;
      scheduleHostCallbackIfNeeded();
    }

    var previous = next.previous;
    previous.next = next.previous = newTask;
    newTask.next = next;
    newTask.previous = previous;
  }

  return newTask;
}

function unstable_pauseExecution() {
  isSchedulerPaused = true;
}

function unstable_continueExecution() {
  isSchedulerPaused = false;
  if (firstTask !== null) {
    scheduleHostCallbackIfNeeded();
  }
}

function unstable_getFirstCallbackNode() {
  return firstTask;
}

function unstable_cancelCallback(task) {
  var next = task.next;
  if (next === null) {
    // Already cancelled.
    return;
  }

  if (next === task) {
    // This is the only scheduled task. Clear the list.
    firstTask = null;
  } else {
    // Remove the task from its position in the list.
    if (task === firstTask) {
      firstTask = next;
    }
    var previous = task.previous;
    previous.next = next;
    next.previous = previous;
  }

  task.next = task.previous = null;
}

function unstable_getCurrentPriorityLevel() {
  return currentPriorityLevel;
}

function unstable_shouldYield() {
  return (
    !currentHostCallbackDidTimeout &&
    ((firstTask !== null && firstTask.expirationTime < currentExpirationTime) ||
      shouldYieldToHost())
  );
}

export {
  ImmediatePriority as unstable_ImmediatePriority,
  UserBlockingPriority as unstable_UserBlockingPriority,
  NormalPriority as unstable_NormalPriority,
  IdlePriority as unstable_IdlePriority,
  LowPriority as unstable_LowPriority,
  unstable_runWithPriority,
  unstable_next,
  unstable_scheduleCallback,
  unstable_cancelCallback,
  unstable_wrapCallback,
  unstable_getCurrentPriorityLevel,
  unstable_shouldYield,
  unstable_continueExecution,
  unstable_pauseExecution,
  unstable_getFirstCallbackNode,
  getCurrentTime as unstable_now,
  forceFrameRate as unstable_forceFrameRate,
};
