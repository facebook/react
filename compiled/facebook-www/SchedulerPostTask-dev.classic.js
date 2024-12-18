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
    function runTask(priorityLevel, postTaskPriority, node, callback) {
      deadline = getCurrentTime() + 5;
      try {
        currentPriorityLevel_DEPRECATED = priorityLevel;
        var result = callback(!1);
        if ("function" === typeof result) {
          var continuationOptions = { signal: node._controller.signal },
            nextTask = runTask.bind(
              null,
              priorityLevel,
              postTaskPriority,
              node,
              result
            );
          void 0 !== scheduler.yield
            ? scheduler
                .yield(continuationOptions)
                .then(nextTask)
                .catch(handleAbortError)
            : scheduler
                .postTask(nextTask, continuationOptions)
                .catch(handleAbortError);
        }
      } catch (error) {
        setTimeout(function () {
          throw error;
        });
      } finally {
        currentPriorityLevel_DEPRECATED = 3;
      }
    }
    function handleAbortError() {}
    var perf = window.performance,
      setTimeout = window.setTimeout,
      scheduler = global.scheduler,
      getCurrentTime = perf.now.bind(perf),
      deadline = 0,
      currentPriorityLevel_DEPRECATED = 3;
    exports.unstable_IdlePriority = 5;
    exports.unstable_ImmediatePriority = 1;
    exports.unstable_LowPriority = 4;
    exports.unstable_NormalPriority = 3;
    exports.unstable_Profiling = null;
    exports.unstable_UserBlockingPriority = 2;
    exports.unstable_cancelCallback = function (node) {
      node._controller.abort();
    };
    exports.unstable_forceFrameRate = function () {};
    exports.unstable_getCurrentPriorityLevel = function () {
      return currentPriorityLevel_DEPRECATED;
    };
    exports.unstable_next = function (callback) {
      switch (currentPriorityLevel_DEPRECATED) {
        case 1:
        case 2:
        case 3:
          var priorityLevel = 3;
          break;
        default:
          priorityLevel = currentPriorityLevel_DEPRECATED;
      }
      var previousPriorityLevel = currentPriorityLevel_DEPRECATED;
      currentPriorityLevel_DEPRECATED = priorityLevel;
      try {
        return callback();
      } finally {
        currentPriorityLevel_DEPRECATED = previousPriorityLevel;
      }
    };
    exports.unstable_now = getCurrentTime;
    exports.unstable_requestPaint = function () {};
    exports.unstable_runWithPriority = function (priorityLevel, callback) {
      var previousPriorityLevel = currentPriorityLevel_DEPRECATED;
      currentPriorityLevel_DEPRECATED = priorityLevel;
      try {
        return callback();
      } finally {
        currentPriorityLevel_DEPRECATED = previousPriorityLevel;
      }
    };
    exports.unstable_scheduleCallback = function (
      priorityLevel,
      callback,
      options
    ) {
      switch (priorityLevel) {
        case 1:
        case 2:
          var postTaskPriority = "user-blocking";
          break;
        case 4:
        case 3:
          postTaskPriority = "user-visible";
          break;
        case 5:
          postTaskPriority = "background";
          break;
        default:
          postTaskPriority = "user-visible";
      }
      var controller = new TaskController({ priority: postTaskPriority });
      options = {
        delay:
          "object" === typeof options && null !== options ? options.delay : 0,
        signal: controller.signal
      };
      controller = { _controller: controller };
      scheduler
        .postTask(
          runTask.bind(
            null,
            priorityLevel,
            postTaskPriority,
            controller,
            callback
          ),
          options
        )
        .catch(handleAbortError);
      return controller;
    };
    exports.unstable_shouldYield = function () {
      return getCurrentTime() >= deadline;
    };
    exports.unstable_wrapCallback = function (callback) {
      var parentPriorityLevel = currentPriorityLevel_DEPRECATED;
      return function () {
        var previousPriorityLevel = currentPriorityLevel_DEPRECATED;
        currentPriorityLevel_DEPRECATED = parentPriorityLevel;
        try {
          return callback();
        } finally {
          currentPriorityLevel_DEPRECATED = previousPriorityLevel;
        }
      };
    };
  })();
