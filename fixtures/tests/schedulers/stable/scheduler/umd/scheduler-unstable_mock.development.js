/** @license React v0.20.1
 * scheduler-unstable_mock.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.SchedulerMock = {}));
}(this, (function (exports) { 'use strict';

  var enableSchedulerDebugging = false;
  var enableProfiling = true;

  var currentTime = 0;
  var scheduledCallback = null;
  var scheduledTimeout = null;
  var timeoutTime = -1;
  var yieldedValues = null;
  var expectedNumberOfYields = -1;
  var didStop = false;
  var isFlushing = false;
  var needsPaint = false;
  var shouldYieldForPaint = false;
  function requestHostCallback(callback) {
    scheduledCallback = callback;
  }
  function requestHostTimeout(callback, ms) {
    scheduledTimeout = callback;
    timeoutTime = currentTime + ms;
  }
  function cancelHostTimeout() {
    scheduledTimeout = null;
    timeoutTime = -1;
  }
  function shouldYieldToHost() {
    if (expectedNumberOfYields !== -1 && yieldedValues !== null && yieldedValues.length >= expectedNumberOfYields || shouldYieldForPaint && needsPaint) {
      // We yielded at least as many values as expected. Stop flushing.
      didStop = true;
      return true;
    }

    return false;
  }
  function getCurrentTime() {
    return currentTime;
  }
  function forceFrameRate() {// No-op
  }

  function unstable_flushNumberOfYields(count) {
    if (isFlushing) {
      throw new Error('Already flushing work.');
    }

    if (scheduledCallback !== null) {
      var cb = scheduledCallback;
      expectedNumberOfYields = count;
      isFlushing = true;

      try {
        var hasMoreWork = true;

        do {
          hasMoreWork = cb(true, currentTime);
        } while (hasMoreWork && !didStop);

        if (!hasMoreWork) {
          scheduledCallback = null;
        }
      } finally {
        expectedNumberOfYields = -1;
        didStop = false;
        isFlushing = false;
      }
    }
  }
  function unstable_flushUntilNextPaint() {
    if (isFlushing) {
      throw new Error('Already flushing work.');
    }

    if (scheduledCallback !== null) {
      var cb = scheduledCallback;
      shouldYieldForPaint = true;
      needsPaint = false;
      isFlushing = true;

      try {
        var hasMoreWork = true;

        do {
          hasMoreWork = cb(true, currentTime);
        } while (hasMoreWork && !didStop);

        if (!hasMoreWork) {
          scheduledCallback = null;
        }
      } finally {
        shouldYieldForPaint = false;
        didStop = false;
        isFlushing = false;
      }
    }
  }
  function unstable_flushExpired() {
    if (isFlushing) {
      throw new Error('Already flushing work.');
    }

    if (scheduledCallback !== null) {
      isFlushing = true;

      try {
        var hasMoreWork = scheduledCallback(false, currentTime);

        if (!hasMoreWork) {
          scheduledCallback = null;
        }
      } finally {
        isFlushing = false;
      }
    }
  }
  function unstable_flushAllWithoutAsserting() {
    // Returns false if no work was flushed.
    if (isFlushing) {
      throw new Error('Already flushing work.');
    }

    if (scheduledCallback !== null) {
      var cb = scheduledCallback;
      isFlushing = true;

      try {
        var hasMoreWork = true;

        do {
          hasMoreWork = cb(true, currentTime);
        } while (hasMoreWork);

        if (!hasMoreWork) {
          scheduledCallback = null;
        }

        return true;
      } finally {
        isFlushing = false;
      }
    } else {
      return false;
    }
  }
  function unstable_clearYields() {
    if (yieldedValues === null) {
      return [];
    }

    var values = yieldedValues;
    yieldedValues = null;
    return values;
  }
  function unstable_flushAll() {
    if (yieldedValues !== null) {
      throw new Error('Log is not empty. Assert on the log of yielded values before ' + 'flushing additional work.');
    }

    unstable_flushAllWithoutAsserting();

    if (yieldedValues !== null) {
      throw new Error('While flushing work, something yielded a value. Use an ' + 'assertion helper to assert on the log of yielded values, e.g. ' + 'expect(Scheduler).toFlushAndYield([...])');
    }
  }
  function unstable_yieldValue(value) {
    // eslint-disable-next-line react-internal/no-production-logging
    if (console.log.name === 'disabledLog') {
      // If console.log has been patched, we assume we're in render
      // replaying and we ignore any values yielding in the second pass.
      return;
    }

    if (yieldedValues === null) {
      yieldedValues = [value];
    } else {
      yieldedValues.push(value);
    }
  }
  function unstable_advanceTime(ms) {
    // eslint-disable-next-line react-internal/no-production-logging
    if (console.log.name === 'disabledLog') {
      // If console.log has been patched, we assume we're in render
      // replaying and we ignore any time advancing in the second pass.
      return;
    }

    currentTime += ms;

    if (scheduledTimeout !== null && timeoutTime <= currentTime) {
      scheduledTimeout(currentTime);
      timeoutTime = -1;
      scheduledTimeout = null;
    }
  }
  function requestPaint() {
    needsPaint = true;
  }

  function push(heap, node) {
    var index = heap.length;
    heap.push(node);
    siftUp(heap, node, index);
  }
  function peek(heap) {
    var first = heap[0];
    return first === undefined ? null : first;
  }
  function pop(heap) {
    var first = heap[0];

    if (first !== undefined) {
      var last = heap.pop();

      if (last !== first) {
        heap[0] = last;
        siftDown(heap, last, 0);
      }

      return first;
    } else {
      return null;
    }
  }

  function siftUp(heap, node, i) {
    var index = i;

    while (true) {
      var parentIndex = index - 1 >>> 1;
      var parent = heap[parentIndex];

      if (parent !== undefined && compare(parent, node) > 0) {
        // The parent is larger. Swap positions.
        heap[parentIndex] = node;
        heap[index] = parent;
        index = parentIndex;
      } else {
        // The parent is smaller. Exit.
        return;
      }
    }
  }

  function siftDown(heap, node, i) {
    var index = i;
    var length = heap.length;

    while (index < length) {
      var leftIndex = (index + 1) * 2 - 1;
      var left = heap[leftIndex];
      var rightIndex = leftIndex + 1;
      var right = heap[rightIndex]; // If the left or right node is smaller, swap with the smaller of those.

      if (left !== undefined && compare(left, node) < 0) {
        if (right !== undefined && compare(right, left) < 0) {
          heap[index] = right;
          heap[rightIndex] = node;
          index = rightIndex;
        } else {
          heap[index] = left;
          heap[leftIndex] = node;
          index = leftIndex;
        }
      } else if (right !== undefined && compare(right, node) < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        // Neither child is smaller. Exit.
        return;
      }
    }
  }

  function compare(a, b) {
    // Compare sort index first, then task id.
    var diff = a.sortIndex - b.sortIndex;
    return diff !== 0 ? diff : a.id - b.id;
  }

  // TODO: Use symbols?
  var NoPriority = 0;
  var ImmediatePriority = 1;
  var UserBlockingPriority = 2;
  var NormalPriority = 3;
  var LowPriority = 4;
  var IdlePriority = 5;

  var runIdCounter = 0;
  var mainThreadIdCounter = 0;
  var profilingStateSize = 4;
  var sharedProfilingBuffer =  // $FlowFixMe Flow doesn't know about SharedArrayBuffer
  typeof SharedArrayBuffer === 'function' ? new SharedArrayBuffer(profilingStateSize * Int32Array.BYTES_PER_ELEMENT) : // $FlowFixMe Flow doesn't know about ArrayBuffer
  typeof ArrayBuffer === 'function' ? new ArrayBuffer(profilingStateSize * Int32Array.BYTES_PER_ELEMENT) : null // Don't crash the init path on IE9
  ;
  var profilingState =  sharedProfilingBuffer !== null ? new Int32Array(sharedProfilingBuffer) : []; // We can't read this but it helps save bytes for null checks

  var PRIORITY = 0;
  var CURRENT_TASK_ID = 1;
  var CURRENT_RUN_ID = 2;
  var QUEUE_SIZE = 3;

  {
    profilingState[PRIORITY] = NoPriority; // This is maintained with a counter, because the size of the priority queue
    // array might include canceled tasks.

    profilingState[QUEUE_SIZE] = 0;
    profilingState[CURRENT_TASK_ID] = 0;
  } // Bytes per element is 4


  var INITIAL_EVENT_LOG_SIZE = 131072;
  var MAX_EVENT_LOG_SIZE = 524288; // Equivalent to 2 megabytes

  var eventLogSize = 0;
  var eventLogBuffer = null;
  var eventLog = null;
  var eventLogIndex = 0;
  var TaskStartEvent = 1;
  var TaskCompleteEvent = 2;
  var TaskErrorEvent = 3;
  var TaskCancelEvent = 4;
  var TaskRunEvent = 5;
  var TaskYieldEvent = 6;
  var SchedulerSuspendEvent = 7;
  var SchedulerResumeEvent = 8;

  function logEvent(entries) {
    if (eventLog !== null) {
      var offset = eventLogIndex;
      eventLogIndex += entries.length;

      if (eventLogIndex + 1 > eventLogSize) {
        eventLogSize *= 2;

        if (eventLogSize > MAX_EVENT_LOG_SIZE) {
          // Using console['error'] to evade Babel and ESLint
          console['error']("Scheduler Profiling: Event log exceeded maximum size. Don't " + 'forget to call `stopLoggingProfilingEvents()`.');
          stopLoggingProfilingEvents();
          return;
        }

        var newEventLog = new Int32Array(eventLogSize * 4);
        newEventLog.set(eventLog);
        eventLogBuffer = newEventLog.buffer;
        eventLog = newEventLog;
      }

      eventLog.set(entries, offset);
    }
  }

  function startLoggingProfilingEvents() {
    eventLogSize = INITIAL_EVENT_LOG_SIZE;
    eventLogBuffer = new ArrayBuffer(eventLogSize * 4);
    eventLog = new Int32Array(eventLogBuffer);
    eventLogIndex = 0;
  }
  function stopLoggingProfilingEvents() {
    var buffer = eventLogBuffer;
    eventLogSize = 0;
    eventLogBuffer = null;
    eventLog = null;
    eventLogIndex = 0;
    return buffer;
  }
  function markTaskStart(task, ms) {
    {
      profilingState[QUEUE_SIZE]++;

      if (eventLog !== null) {
        // performance.now returns a float, representing milliseconds. When the
        // event is logged, it's coerced to an int. Convert to microseconds to
        // maintain extra degrees of precision.
        logEvent([TaskStartEvent, ms * 1000, task.id, task.priorityLevel]);
      }
    }
  }
  function markTaskCompleted(task, ms) {
    {
      profilingState[PRIORITY] = NoPriority;
      profilingState[CURRENT_TASK_ID] = 0;
      profilingState[QUEUE_SIZE]--;

      if (eventLog !== null) {
        logEvent([TaskCompleteEvent, ms * 1000, task.id]);
      }
    }
  }
  function markTaskCanceled(task, ms) {
    {
      profilingState[QUEUE_SIZE]--;

      if (eventLog !== null) {
        logEvent([TaskCancelEvent, ms * 1000, task.id]);
      }
    }
  }
  function markTaskErrored(task, ms) {
    {
      profilingState[PRIORITY] = NoPriority;
      profilingState[CURRENT_TASK_ID] = 0;
      profilingState[QUEUE_SIZE]--;

      if (eventLog !== null) {
        logEvent([TaskErrorEvent, ms * 1000, task.id]);
      }
    }
  }
  function markTaskRun(task, ms) {
    {
      runIdCounter++;
      profilingState[PRIORITY] = task.priorityLevel;
      profilingState[CURRENT_TASK_ID] = task.id;
      profilingState[CURRENT_RUN_ID] = runIdCounter;

      if (eventLog !== null) {
        logEvent([TaskRunEvent, ms * 1000, task.id, runIdCounter]);
      }
    }
  }
  function markTaskYield(task, ms) {
    {
      profilingState[PRIORITY] = NoPriority;
      profilingState[CURRENT_TASK_ID] = 0;
      profilingState[CURRENT_RUN_ID] = 0;

      if (eventLog !== null) {
        logEvent([TaskYieldEvent, ms * 1000, task.id, runIdCounter]);
      }
    }
  }
  function markSchedulerSuspended(ms) {
    {
      mainThreadIdCounter++;

      if (eventLog !== null) {
        logEvent([SchedulerSuspendEvent, ms * 1000, mainThreadIdCounter]);
      }
    }
  }
  function markSchedulerUnsuspended(ms) {
    {
      if (eventLog !== null) {
        logEvent([SchedulerResumeEvent, ms * 1000, mainThreadIdCounter]);
      }
    }
  }

  /* eslint-disable no-var */
  // Math.pow(2, 30) - 1
  // 0b111111111111111111111111111111

  var maxSigned31BitInt = 1073741823; // Times out immediately

  var IMMEDIATE_PRIORITY_TIMEOUT = -1; // Eventually times out

  var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
  var NORMAL_PRIORITY_TIMEOUT = 5000;
  var LOW_PRIORITY_TIMEOUT = 10000; // Never times out

  var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt; // Tasks are stored on a min heap

  var taskQueue = [];
  var timerQueue = []; // Incrementing id counter. Used to maintain insertion order.

  var taskIdCounter = 1; // Pausing the scheduler is useful for debugging.
  var currentTask = null;
  var currentPriorityLevel = NormalPriority; // This is set while performing work, to prevent re-entrancy.

  var isPerformingWork = false;
  var isHostCallbackScheduled = false;
  var isHostTimeoutScheduled = false;

  function advanceTimers(currentTime) {
    // Check for tasks that are no longer delayed and add them to the queue.
    var timer = peek(timerQueue);

    while (timer !== null) {
      if (timer.callback === null) {
        // Timer was cancelled.
        pop(timerQueue);
      } else if (timer.startTime <= currentTime) {
        // Timer fired. Transfer to the task queue.
        pop(timerQueue);
        timer.sortIndex = timer.expirationTime;
        push(taskQueue, timer);

        {
          markTaskStart(timer, currentTime);
          timer.isQueued = true;
        }
      } else {
        // Remaining timers are pending.
        return;
      }

      timer = peek(timerQueue);
    }
  }

  function handleTimeout(currentTime) {
    isHostTimeoutScheduled = false;
    advanceTimers(currentTime);

    if (!isHostCallbackScheduled) {
      if (peek(taskQueue) !== null) {
        isHostCallbackScheduled = true;
        requestHostCallback(flushWork);
      } else {
        var firstTimer = peek(timerQueue);

        if (firstTimer !== null) {
          requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
        }
      }
    }
  }

  function flushWork(hasTimeRemaining, initialTime) {
    {
      markSchedulerUnsuspended(initialTime);
    } // We'll need a host callback the next time work is scheduled.


    isHostCallbackScheduled = false;

    if (isHostTimeoutScheduled) {
      // We scheduled a timeout but it's no longer needed. Cancel it.
      isHostTimeoutScheduled = false;
      cancelHostTimeout();
    }

    isPerformingWork = true;
    var previousPriorityLevel = currentPriorityLevel;

    try {
      if (enableProfiling) {
        try {
          return workLoop(hasTimeRemaining, initialTime);
        } catch (error) {
          if (currentTask !== null) {
            var currentTime = getCurrentTime();
            markTaskErrored(currentTask, currentTime);
            currentTask.isQueued = false;
          }

          throw error;
        }
      } else {
        // No catch in prod code path.
        return workLoop(hasTimeRemaining, initialTime);
      }
    } finally {
      currentTask = null;
      currentPriorityLevel = previousPriorityLevel;
      isPerformingWork = false;

      {
        var _currentTime = getCurrentTime();

        markSchedulerSuspended(_currentTime);
      }
    }
  }

  function workLoop(hasTimeRemaining, initialTime) {
    var currentTime = initialTime;
    advanceTimers(currentTime);
    currentTask = peek(taskQueue);

    while (currentTask !== null && !(enableSchedulerDebugging )) {
      if (currentTask.expirationTime > currentTime && (!hasTimeRemaining || shouldYieldToHost())) {
        // This currentTask hasn't expired, and we've reached the deadline.
        break;
      }

      var callback = currentTask.callback;

      if (typeof callback === 'function') {
        currentTask.callback = null;
        currentPriorityLevel = currentTask.priorityLevel;
        var didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
        markTaskRun(currentTask, currentTime);
        var continuationCallback = callback(didUserCallbackTimeout);
        currentTime = getCurrentTime();

        if (typeof continuationCallback === 'function') {
          currentTask.callback = continuationCallback;
          markTaskYield(currentTask, currentTime);
        } else {
          {
            markTaskCompleted(currentTask, currentTime);
            currentTask.isQueued = false;
          }

          if (currentTask === peek(taskQueue)) {
            pop(taskQueue);
          }
        }

        advanceTimers(currentTime);
      } else {
        pop(taskQueue);
      }

      currentTask = peek(taskQueue);
    } // Return whether there's additional work


    if (currentTask !== null) {
      return true;
    } else {
      var firstTimer = peek(timerQueue);

      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }

      return false;
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
    currentPriorityLevel = priorityLevel;

    try {
      return eventHandler();
    } finally {
      currentPriorityLevel = previousPriorityLevel;
    }
  }

  function unstable_next(eventHandler) {
    var priorityLevel;

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
    currentPriorityLevel = priorityLevel;

    try {
      return eventHandler();
    } finally {
      currentPriorityLevel = previousPriorityLevel;
    }
  }

  function unstable_wrapCallback(callback) {
    var parentPriorityLevel = currentPriorityLevel;
    return function () {
      // This is a fork of runWithPriority, inlined for performance.
      var previousPriorityLevel = currentPriorityLevel;
      currentPriorityLevel = parentPriorityLevel;

      try {
        return callback.apply(this, arguments);
      } finally {
        currentPriorityLevel = previousPriorityLevel;
      }
    };
  }

  function unstable_scheduleCallback(priorityLevel, callback, options) {
    var currentTime = getCurrentTime();
    var startTime;

    if (typeof options === 'object' && options !== null) {
      var delay = options.delay;

      if (typeof delay === 'number' && delay > 0) {
        startTime = currentTime + delay;
      } else {
        startTime = currentTime;
      }
    } else {
      startTime = currentTime;
    }

    var timeout;

    switch (priorityLevel) {
      case ImmediatePriority:
        timeout = IMMEDIATE_PRIORITY_TIMEOUT;
        break;

      case UserBlockingPriority:
        timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
        break;

      case IdlePriority:
        timeout = IDLE_PRIORITY_TIMEOUT;
        break;

      case LowPriority:
        timeout = LOW_PRIORITY_TIMEOUT;
        break;

      case NormalPriority:
      default:
        timeout = NORMAL_PRIORITY_TIMEOUT;
        break;
    }

    var expirationTime = startTime + timeout;
    var newTask = {
      id: taskIdCounter++,
      callback: callback,
      priorityLevel: priorityLevel,
      startTime: startTime,
      expirationTime: expirationTime,
      sortIndex: -1
    };

    {
      newTask.isQueued = false;
    }

    if (startTime > currentTime) {
      // This is a delayed task.
      newTask.sortIndex = startTime;
      push(timerQueue, newTask);

      if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
        // All tasks are delayed, and this is the task with the earliest delay.
        if (isHostTimeoutScheduled) {
          // Cancel an existing timeout.
          cancelHostTimeout();
        } else {
          isHostTimeoutScheduled = true;
        } // Schedule a timeout.


        requestHostTimeout(handleTimeout, startTime - currentTime);
      }
    } else {
      newTask.sortIndex = expirationTime;
      push(taskQueue, newTask);

      {
        markTaskStart(newTask, currentTime);
        newTask.isQueued = true;
      } // Schedule a host callback, if needed. If we're already performing work,
      // wait until the next time we yield.


      if (!isHostCallbackScheduled && !isPerformingWork) {
        isHostCallbackScheduled = true;
        requestHostCallback(flushWork);
      }
    }

    return newTask;
  }

  function unstable_pauseExecution() {
  }

  function unstable_continueExecution() {

    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }
  }

  function unstable_getFirstCallbackNode() {
    return peek(taskQueue);
  }

  function unstable_cancelCallback(task) {
    {
      if (task.isQueued) {
        var currentTime = getCurrentTime();
        markTaskCanceled(task, currentTime);
        task.isQueued = false;
      }
    } // Null out the callback to indicate the task has been canceled. (Can't
    // remove from the queue because you can't remove arbitrary nodes from an
    // array based heap, only the first one.)


    task.callback = null;
  }

  function unstable_getCurrentPriorityLevel() {
    return currentPriorityLevel;
  }

  var unstable_requestPaint = requestPaint;
  var unstable_Profiling =  {
    startLoggingProfilingEvents: startLoggingProfilingEvents,
    stopLoggingProfilingEvents: stopLoggingProfilingEvents,
    sharedProfilingBuffer: sharedProfilingBuffer
  } ;

  exports.unstable_IdlePriority = IdlePriority;
  exports.unstable_ImmediatePriority = ImmediatePriority;
  exports.unstable_LowPriority = LowPriority;
  exports.unstable_NormalPriority = NormalPriority;
  exports.unstable_Profiling = unstable_Profiling;
  exports.unstable_UserBlockingPriority = UserBlockingPriority;
  exports.unstable_advanceTime = unstable_advanceTime;
  exports.unstable_cancelCallback = unstable_cancelCallback;
  exports.unstable_clearYields = unstable_clearYields;
  exports.unstable_continueExecution = unstable_continueExecution;
  exports.unstable_flushAll = unstable_flushAll;
  exports.unstable_flushAllWithoutAsserting = unstable_flushAllWithoutAsserting;
  exports.unstable_flushExpired = unstable_flushExpired;
  exports.unstable_flushNumberOfYields = unstable_flushNumberOfYields;
  exports.unstable_flushUntilNextPaint = unstable_flushUntilNextPaint;
  exports.unstable_forceFrameRate = forceFrameRate;
  exports.unstable_getCurrentPriorityLevel = unstable_getCurrentPriorityLevel;
  exports.unstable_getFirstCallbackNode = unstable_getFirstCallbackNode;
  exports.unstable_next = unstable_next;
  exports.unstable_now = getCurrentTime;
  exports.unstable_pauseExecution = unstable_pauseExecution;
  exports.unstable_requestPaint = unstable_requestPaint;
  exports.unstable_runWithPriority = unstable_runWithPriority;
  exports.unstable_scheduleCallback = unstable_scheduleCallback;
  exports.unstable_shouldYield = shouldYieldToHost;
  exports.unstable_wrapCallback = unstable_wrapCallback;
  exports.unstable_yieldValue = unstable_yieldValue;

})));
