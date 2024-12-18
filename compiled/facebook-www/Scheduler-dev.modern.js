/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @preserve-invariant-messages
 */

"use strict";
__DEV__ &&
  (function () {
    function performWorkUntilDeadline() {
      enableRequestPaint && (needsPaint = !1);
      if (isMessageLoopRunning) {
        var currentTime = exports.unstable_now();
        startTime = currentTime;
        var hasMoreWork = !0;
        try {
          a: {
            null !== eventLog &&
              logEvent([8, 1e3 * currentTime, mainThreadIdCounter]);
            isHostCallbackScheduled = !1;
            isHostTimeoutScheduled &&
              ((isHostTimeoutScheduled = !1),
              localClearTimeout(taskTimeoutID),
              (taskTimeoutID = -1));
            isPerformingWork = !0;
            var previousPriorityLevel = currentPriorityLevel;
            try {
              try {
                b: {
                  advanceTimers(currentTime);
                  for (
                    currentTask = peek(taskQueue);
                    null !== currentTask &&
                    !(
                      currentTask.expirationTime > currentTime &&
                      shouldYieldToHost()
                    );

                  ) {
                    var callback = currentTask.callback;
                    if ("function" === typeof callback) {
                      currentTask.callback = null;
                      currentPriorityLevel = currentTask.priorityLevel;
                      var didUserCallbackTimeout =
                          currentTask.expirationTime <= currentTime,
                        task = currentTask,
                        ms = currentTime;
                      runIdCounter++;
                      null !== eventLog &&
                        logEvent([5, 1e3 * ms, task.id, runIdCounter]);
                      var continuationCallback = callback(
                        didUserCallbackTimeout
                      );
                      currentTime = exports.unstable_now();
                      if ("function" === typeof continuationCallback) {
                        currentTask.callback = continuationCallback;
                        null !== eventLog &&
                          logEvent([
                            6,
                            1e3 * currentTime,
                            currentTask.id,
                            runIdCounter
                          ]);
                        advanceTimers(currentTime);
                        hasMoreWork = !0;
                        break b;
                      }
                      null !== eventLog &&
                        logEvent([2, 1e3 * currentTime, currentTask.id]);
                      currentTask.isQueued = !1;
                      currentTask === peek(taskQueue) && pop(taskQueue);
                      advanceTimers(currentTime);
                    } else pop(taskQueue);
                    currentTask = peek(taskQueue);
                  }
                  if (null !== currentTask) hasMoreWork = !0;
                  else {
                    var firstTimer = peek(timerQueue);
                    null !== firstTimer &&
                      requestHostTimeout(
                        handleTimeout,
                        firstTimer.startTime - currentTime
                      );
                    hasMoreWork = !1;
                  }
                }
                break a;
              } catch (error) {
                if (null !== currentTask) {
                  var currentTime$jscomp$0 = exports.unstable_now();
                  null !== eventLog &&
                    logEvent([3, 1e3 * currentTime$jscomp$0, currentTask.id]);
                  currentTask.isQueued = !1;
                }
                throw error;
              }
            } finally {
              currentTask = null;
              currentPriorityLevel = previousPriorityLevel;
              isPerformingWork = !1;
              var ms$jscomp$0 = exports.unstable_now();
              mainThreadIdCounter++;
              null !== eventLog &&
                logEvent([7, 1e3 * ms$jscomp$0, mainThreadIdCounter]);
            }
            hasMoreWork = void 0;
          }
        } finally {
          hasMoreWork
            ? schedulePerformWorkUntilDeadline()
            : (isMessageLoopRunning = !1);
        }
      }
    }
    function push(heap, node) {
      var index = heap.length;
      heap.push(node);
      a: for (; 0 < index; ) {
        var parentIndex = (index - 1) >>> 1,
          parent = heap[parentIndex];
        if (0 < compare(parent, node))
          (heap[parentIndex] = node),
            (heap[index] = parent),
            (index = parentIndex);
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
            (heap[index] = right),
              (heap[rightIndex] = last),
              (index = rightIndex);
          else break a;
        }
      }
      return first;
    }
    function compare(a, b) {
      var diff = a.sortIndex - b.sortIndex;
      return 0 !== diff ? diff : a.id - b.id;
    }
    function logEvent(entries) {
      if (null !== eventLog) {
        var offset = eventLogIndex;
        eventLogIndex += entries.length;
        if (eventLogIndex + 1 > eventLogSize) {
          eventLogSize *= 2;
          if (524288 < eventLogSize) {
            console.error(
              "Scheduler Profiling: Event log exceeded maximum size. Don't forget to call `stopLoggingProfilingEvents()`."
            );
            stopLoggingProfilingEvents();
            return;
          }
          var newEventLog = new Int32Array(4 * eventLogSize);
          newEventLog.set(eventLog);
          eventLogBuffer = newEventLog.buffer;
          eventLog = newEventLog;
        }
        eventLog.set(entries, offset);
      }
    }
    function stopLoggingProfilingEvents() {
      var buffer = eventLogBuffer;
      eventLogSize = 0;
      eventLog = eventLogBuffer = null;
      eventLogIndex = 0;
      return buffer;
    }
    function advanceTimers(currentTime) {
      for (var timer = peek(timerQueue); null !== timer; ) {
        if (null === timer.callback) pop(timerQueue);
        else if (timer.startTime <= currentTime)
          pop(timerQueue),
            (timer.sortIndex = timer.expirationTime),
            push(taskQueue, timer),
            null !== eventLog &&
              logEvent([1, 1e3 * currentTime, timer.id, timer.priorityLevel]),
            (timer.isQueued = !0);
        else break;
        timer = peek(timerQueue);
      }
    }
    function handleTimeout(currentTime) {
      isHostTimeoutScheduled = !1;
      advanceTimers(currentTime);
      if (!isHostCallbackScheduled)
        if (null !== peek(taskQueue))
          (isHostCallbackScheduled = !0),
            isMessageLoopRunning ||
              ((isMessageLoopRunning = !0), schedulePerformWorkUntilDeadline());
        else {
          var firstTimer = peek(timerQueue);
          null !== firstTimer &&
            requestHostTimeout(
              handleTimeout,
              firstTimer.startTime - currentTime
            );
        }
    }
    function shouldYieldToHost() {
      return enableRequestPaint && needsPaint
        ? !0
        : exports.unstable_now() - startTime < frameInterval
          ? !1
          : !0;
    }
    function requestHostTimeout(callback, ms) {
      taskTimeoutID = localSetTimeout(function () {
        callback(exports.unstable_now());
      }, ms);
    }
    "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ &&
      "function" ===
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart &&
      __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
    var enableRequestPaint =
        require("SchedulerFeatureFlags").enableRequestPaint,
      runIdCounter = 0,
      mainThreadIdCounter = 0,
      eventLogSize = 0,
      eventLogBuffer = null,
      eventLog = null,
      eventLogIndex = 0;
    exports.unstable_now = void 0;
    if (
      "object" === typeof performance &&
      "function" === typeof performance.now
    ) {
      var localPerformance = performance;
      exports.unstable_now = function () {
        return localPerformance.now();
      };
    } else {
      var localDate = Date,
        initialTime = localDate.now();
      exports.unstable_now = function () {
        return localDate.now() - initialTime;
      };
    }
    var taskQueue = [],
      timerQueue = [],
      taskIdCounter = 1,
      currentTask = null,
      currentPriorityLevel = 3,
      isPerformingWork = !1,
      isHostCallbackScheduled = !1,
      isHostTimeoutScheduled = !1,
      needsPaint = !1,
      localSetTimeout = "function" === typeof setTimeout ? setTimeout : null,
      localClearTimeout =
        "function" === typeof clearTimeout ? clearTimeout : null,
      localSetImmediate =
        "undefined" !== typeof setImmediate ? setImmediate : null,
      isMessageLoopRunning = !1,
      taskTimeoutID = -1,
      frameInterval = 10,
      startTime = -1;
    if ("function" === typeof localSetImmediate)
      var schedulePerformWorkUntilDeadline = function () {
        localSetImmediate(performWorkUntilDeadline);
      };
    else if ("undefined" !== typeof MessageChannel) {
      var channel = new MessageChannel(),
        port = channel.port2;
      channel.port1.onmessage = performWorkUntilDeadline;
      schedulePerformWorkUntilDeadline = function () {
        port.postMessage(null);
      };
    } else
      schedulePerformWorkUntilDeadline = function () {
        localSetTimeout(performWorkUntilDeadline, 0);
      };
    channel = {
      startLoggingProfilingEvents: function () {
        eventLogSize = 131072;
        eventLogBuffer = new ArrayBuffer(4 * eventLogSize);
        eventLog = new Int32Array(eventLogBuffer);
        eventLogIndex = 0;
      },
      stopLoggingProfilingEvents: stopLoggingProfilingEvents
    };
    exports.unstable_IdlePriority = 5;
    exports.unstable_ImmediatePriority = 1;
    exports.unstable_LowPriority = 4;
    exports.unstable_NormalPriority = 3;
    exports.unstable_Profiling = channel;
    exports.unstable_UserBlockingPriority = 2;
    exports.unstable_cancelCallback = function (task) {
      if (task.isQueued) {
        var currentTime = exports.unstable_now();
        null !== eventLog && logEvent([4, 1e3 * currentTime, task.id]);
        task.isQueued = !1;
      }
      task.callback = null;
    };
    exports.unstable_forceFrameRate = function (fps) {
      0 > fps || 125 < fps
        ? console.error(
            "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
          )
        : (frameInterval = 0 < fps ? Math.floor(1e3 / fps) : 10);
    };
    exports.unstable_getCurrentPriorityLevel = function () {
      return currentPriorityLevel;
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
    exports.unstable_requestPaint = function () {
      enableRequestPaint && (needsPaint = !0);
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
      var currentTime = exports.unstable_now();
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
        sortIndex: -1,
        isQueued: !1
      };
      options > currentTime
        ? ((priorityLevel.sortIndex = options),
          push(timerQueue, priorityLevel),
          null === peek(taskQueue) &&
            priorityLevel === peek(timerQueue) &&
            (isHostTimeoutScheduled
              ? (localClearTimeout(taskTimeoutID), (taskTimeoutID = -1))
              : (isHostTimeoutScheduled = !0),
            requestHostTimeout(handleTimeout, options - currentTime)))
        : ((priorityLevel.sortIndex = timeout),
          push(taskQueue, priorityLevel),
          null !== eventLog &&
            logEvent([
              1,
              1e3 * currentTime,
              priorityLevel.id,
              priorityLevel.priorityLevel
            ]),
          (priorityLevel.isQueued = !0),
          isHostCallbackScheduled ||
            isPerformingWork ||
            ((isHostCallbackScheduled = !0),
            isMessageLoopRunning ||
              ((isMessageLoopRunning = !0),
              schedulePerformWorkUntilDeadline())));
      return priorityLevel;
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
    "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ &&
      "function" ===
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop &&
      __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
  })();
