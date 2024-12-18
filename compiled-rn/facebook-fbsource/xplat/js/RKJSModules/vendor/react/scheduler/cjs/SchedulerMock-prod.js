/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @generated SignedSource<<d681571ee71792780f4a8081bcc29abd>>
 */

"use strict";
function push(heap, node) {
  var index = heap.length;
  heap.push(node);
  a: for (; 0 < index; ) {
    var parentIndex = (index - 1) >>> 1,
      parent = heap[parentIndex];
    if (0 < compare(parent, node))
      (heap[parentIndex] = node), (heap[index] = parent), (index = parentIndex);
    else break a;
  }
}
function peek(heap) {
  return 0 === heap.length ? null : heap[0];
}
function pop(heap) {
  if (0 === heap.length) return null;
  var first = heap[0],
    last = heap.pop();
  if (last !== first) {
    heap[0] = last;
    a: for (
      var index = 0, length = heap.length, halfLength = length >>> 1;
      index < halfLength;

    ) {
      var leftIndex = 2 * (index + 1) - 1,
        left = heap[leftIndex],
        rightIndex = leftIndex + 1,
        right = heap[rightIndex];
      if (0 > compare(left, last))
        rightIndex < length && 0 > compare(right, left)
          ? ((heap[index] = right),
            (heap[rightIndex] = last),
            (index = rightIndex))
          : ((heap[index] = left),
            (heap[leftIndex] = last),
            (index = leftIndex));
      else if (rightIndex < length && 0 > compare(right, last))
        (heap[index] = right), (heap[rightIndex] = last), (index = rightIndex);
      else break a;
    }
  }
  return first;
}
function compare(a, b) {
  var diff = a.sortIndex - b.sortIndex;
  return 0 !== diff ? diff : a.id - b.id;
}
var taskQueue = [],
  timerQueue = [],
  taskIdCounter = 1,
  currentTask = null,
  currentPriorityLevel = 3,
  isPerformingWork = !1,
  isHostCallbackScheduled = !1,
  isHostTimeoutScheduled = !1,
  currentMockTime = 0,
  scheduledCallback = null,
  scheduledTimeout = null,
  timeoutTime = -1,
  yieldedValues = null,
  expectedNumberOfYields = -1,
  didStop = !1,
  isFlushing = !1,
  needsPaint = !1,
  shouldYieldForPaint = !1,
  disableYieldValue = !1;
function advanceTimers(currentTime) {
  for (var timer = peek(timerQueue); null !== timer; ) {
    if (null === timer.callback) pop(timerQueue);
    else if (timer.startTime <= currentTime)
      pop(timerQueue),
        (timer.sortIndex = timer.expirationTime),
        push(taskQueue, timer);
    else break;
    timer = peek(timerQueue);
  }
}
function handleTimeout(currentTime) {
  isHostTimeoutScheduled = !1;
  advanceTimers(currentTime);
  if (!isHostCallbackScheduled)
    if (null !== peek(taskQueue))
      (isHostCallbackScheduled = !0), (scheduledCallback = flushWork);
    else {
      var firstTimer = peek(timerQueue);
      null !== firstTimer &&
        ((currentTime = firstTimer.startTime - currentTime),
        (scheduledTimeout = handleTimeout),
        (timeoutTime = currentMockTime + currentTime));
    }
}
function flushWork(hasTimeRemaining, initialTime) {
  isHostCallbackScheduled = !1;
  isHostTimeoutScheduled &&
    ((isHostTimeoutScheduled = !1),
    (scheduledTimeout = null),
    (timeoutTime = -1));
  isPerformingWork = !0;
  var previousPriorityLevel = currentPriorityLevel;
  try {
    a: {
      advanceTimers(initialTime);
      for (
        currentTask = peek(taskQueue);
        null !== currentTask &&
        (!(currentTask.expirationTime > initialTime) ||
          (hasTimeRemaining && !shouldYieldToHost()));

      ) {
        var callback = currentTask.callback;
        if ("function" === typeof callback) {
          currentTask.callback = null;
          currentPriorityLevel = currentTask.priorityLevel;
          var continuationCallback = callback(
            currentTask.expirationTime <= initialTime
          );
          initialTime = currentMockTime;
          if ("function" === typeof continuationCallback) {
            if (
              ((currentTask.callback = continuationCallback),
              advanceTimers(initialTime),
              shouldYieldForPaint)
            ) {
              var JSCompiler_inline_result = (needsPaint = !0);
              break a;
            }
          } else
            currentTask === peek(taskQueue) && pop(taskQueue),
              advanceTimers(initialTime);
        } else pop(taskQueue);
        currentTask = peek(taskQueue);
      }
      if (null !== currentTask) JSCompiler_inline_result = !0;
      else {
        var firstTimer = peek(timerQueue);
        if (null !== firstTimer) {
          var ms = firstTimer.startTime - initialTime;
          scheduledTimeout = handleTimeout;
          timeoutTime = currentMockTime + ms;
        }
        JSCompiler_inline_result = !1;
      }
    }
    return JSCompiler_inline_result;
  } finally {
    (currentTask = null),
      (currentPriorityLevel = previousPriorityLevel),
      (isPerformingWork = !1);
  }
}
function shouldYieldToHost() {
  return (0 === expectedNumberOfYields && null === yieldedValues) ||
    (-1 !== expectedNumberOfYields &&
      null !== yieldedValues &&
      yieldedValues.length >= expectedNumberOfYields) ||
    (shouldYieldForPaint && needsPaint)
    ? (didStop = !0)
    : !1;
}
function unstable_flushAllWithoutAsserting() {
  if (isFlushing) throw Error("Already flushing work.");
  if (null !== scheduledCallback) {
    var cb = scheduledCallback;
    isFlushing = !0;
    try {
      var hasMoreWork = !0;
      do hasMoreWork = cb(!0, currentMockTime);
      while (hasMoreWork);
      hasMoreWork || (scheduledCallback = null);
      return !0;
    } finally {
      isFlushing = !1;
    }
  } else return !1;
}
exports.log = function (value) {
  "disabledLog" === console.log.name ||
    disableYieldValue ||
    (null === yieldedValues
      ? (yieldedValues = [value])
      : yieldedValues.push(value));
};
exports.reset = function () {
  if (isFlushing) throw Error("Cannot reset while already flushing work.");
  currentMockTime = 0;
  scheduledTimeout = scheduledCallback = null;
  timeoutTime = -1;
  yieldedValues = null;
  expectedNumberOfYields = -1;
  needsPaint = isFlushing = didStop = !1;
};
exports.unstable_IdlePriority = 5;
exports.unstable_ImmediatePriority = 1;
exports.unstable_LowPriority = 4;
exports.unstable_NormalPriority = 3;
exports.unstable_Profiling = null;
exports.unstable_UserBlockingPriority = 2;
exports.unstable_advanceTime = function (ms) {
  "disabledLog" === console.log.name ||
    disableYieldValue ||
    ((currentMockTime += ms),
    null !== scheduledTimeout &&
      timeoutTime <= currentMockTime &&
      (scheduledTimeout(currentMockTime),
      (timeoutTime = -1),
      (scheduledTimeout = null)));
};
exports.unstable_cancelCallback = function (task) {
  task.callback = null;
};
exports.unstable_clearLog = function () {
  if (null === yieldedValues) return [];
  var values = yieldedValues;
  yieldedValues = null;
  return values;
};
exports.unstable_flushAll = function () {
  if (null !== yieldedValues)
    throw Error(
      "Log is not empty. Assert on the log of yielded values before flushing additional work."
    );
  unstable_flushAllWithoutAsserting();
  if (null !== yieldedValues)
    throw Error(
      "While flushing work, something yielded a value. Use an assertion helper to assert on the log of yielded values, e.g. expect(Scheduler).toFlushAndYield([...])"
    );
};
exports.unstable_flushAllWithoutAsserting = unstable_flushAllWithoutAsserting;
exports.unstable_flushExpired = function () {
  if (isFlushing) throw Error("Already flushing work.");
  if (null !== scheduledCallback) {
    isFlushing = !0;
    try {
      scheduledCallback(!1, currentMockTime) || (scheduledCallback = null);
    } finally {
      isFlushing = !1;
    }
  }
};
exports.unstable_flushNumberOfYields = function (count) {
  if (isFlushing) throw Error("Already flushing work.");
  if (null !== scheduledCallback) {
    var cb = scheduledCallback;
    expectedNumberOfYields = count;
    isFlushing = !0;
    try {
      count = !0;
      do count = cb(!0, currentMockTime);
      while (count && !didStop);
      count || (scheduledCallback = null);
    } finally {
      (expectedNumberOfYields = -1), (isFlushing = didStop = !1);
    }
  }
};
exports.unstable_flushUntilNextPaint = function () {
  if (isFlushing) throw Error("Already flushing work.");
  if (null !== scheduledCallback) {
    var cb = scheduledCallback;
    shouldYieldForPaint = !0;
    needsPaint = !1;
    isFlushing = !0;
    try {
      var hasMoreWork = !0;
      do hasMoreWork = cb(!0, currentMockTime);
      while (hasMoreWork && !didStop);
      hasMoreWork || (scheduledCallback = null);
    } finally {
      isFlushing = didStop = shouldYieldForPaint = !1;
    }
  }
  return !1;
};
exports.unstable_forceFrameRate = function () {};
exports.unstable_getCurrentPriorityLevel = function () {
  return currentPriorityLevel;
};
exports.unstable_hasPendingWork = function () {
  return null !== scheduledCallback;
};
exports.unstable_next = function (eventHandler) {
  switch (currentPriorityLevel) {
    case 1:
    case 2:
    case 3:
      var priorityLevel = 3;
      break;
    default:
      priorityLevel = currentPriorityLevel;
  }
  var previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;
  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
};
exports.unstable_now = function () {
  return currentMockTime;
};
exports.unstable_requestPaint = function () {
  needsPaint = !0;
};
exports.unstable_runWithPriority = function (priorityLevel, eventHandler) {
  switch (priorityLevel) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
      break;
    default:
      priorityLevel = 3;
  }
  var previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;
  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
};
exports.unstable_scheduleCallback = function (
  priorityLevel,
  callback,
  options
) {
  var currentTime = currentMockTime;
  "object" === typeof options && null !== options
    ? ((options = options.delay),
      (options =
        "number" === typeof options && 0 < options
          ? currentTime + options
          : currentTime))
    : (options = currentTime);
  switch (priorityLevel) {
    case 1:
      var timeout = -1;
      break;
    case 2:
      timeout = 250;
      break;
    case 5:
      timeout = 1073741823;
      break;
    case 4:
      timeout = 1e4;
      break;
    default:
      timeout = 5e3;
  }
  timeout = options + timeout;
  priorityLevel = {
    id: taskIdCounter++,
    callback: callback,
    priorityLevel: priorityLevel,
    startTime: options,
    expirationTime: timeout,
    sortIndex: -1
  };
  options > currentTime
    ? ((priorityLevel.sortIndex = options),
      push(timerQueue, priorityLevel),
      null === peek(taskQueue) &&
        priorityLevel === peek(timerQueue) &&
        (isHostTimeoutScheduled
          ? ((scheduledTimeout = null), (timeoutTime = -1))
          : (isHostTimeoutScheduled = !0),
        (scheduledTimeout = handleTimeout),
        (timeoutTime = currentMockTime + (options - currentTime))))
    : ((priorityLevel.sortIndex = timeout),
      push(taskQueue, priorityLevel),
      isHostCallbackScheduled ||
        isPerformingWork ||
        ((isHostCallbackScheduled = !0), (scheduledCallback = flushWork)));
  return priorityLevel;
};
exports.unstable_setDisableYieldValue = function (newValue) {
  disableYieldValue = newValue;
};
exports.unstable_shouldYield = shouldYieldToHost;
exports.unstable_wrapCallback = function (callback) {
  var parentPriorityLevel = currentPriorityLevel;
  return function () {
    var previousPriorityLevel = currentPriorityLevel;
    currentPriorityLevel = parentPriorityLevel;
    try {
      return callback.apply(this, arguments);
    } finally {
      currentPriorityLevel = previousPriorityLevel;
    }
  };
};
