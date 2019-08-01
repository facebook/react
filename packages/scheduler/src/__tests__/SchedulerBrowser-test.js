/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

/* eslint-disable no-for-of-loops/no-for-of-loops */

'use strict';

let Scheduler;
let runtime;
let performance;
let scheduleCallback;
let cancelCallback;
let NormalPriority;

// The Scheduler implementation uses browser APIs like `MessageChannel`,
// `requestAnimationFrame`, and `setTimeout` to schedule work on the main
// thread. Most of our tests treat these as implementation details; however, the
// sequence and timing of these APIs are not precisely specified, and can vary
// wildly across browsers.
//
// To prevent regressions, we need the ability to simulate specific edge cases
// that we may encounter in various browsers.
//
// This test suite mocks all browser methods used in our implementation. It
// assumes as little as possible about the order and timing of events. The only
// thing it assumes is that requestAnimationFrame is passed a frame time that is
// equal to or less than the time returned by performance.now. Everything else
// can be controlled at will.
//
// It also includes Scheduler-specific invariants, e.g. only one rAF callback
// can be scheduled at a time.
describe('SchedulerBrowser', () => {
  beforeEach(() => {
    jest.resetModules();

    // Un-mock scheduler
    jest.mock('scheduler', () => require.requireActual('scheduler'));
    jest.mock('scheduler/src/SchedulerHostConfig', () =>
      require.requireActual(
        'scheduler/src/forks/SchedulerHostConfig.default.js',
      ),
    );

    runtime = installMockBrowserRuntime();
    performance = window.performance;
    Scheduler = require('scheduler');
    scheduleCallback = Scheduler.unstable_scheduleCallback;
    cancelCallback = Scheduler.unstable_cancelCallback;
    NormalPriority = Scheduler.unstable_NormalPriority;
  });

  afterEach(() => {
    if (!runtime.isLogEmpty()) {
      throw Error('Test exited without clearing log.');
    }
  });

  function installMockBrowserRuntime() {
    let VSYNC_INTERVAL = 33.33;

    let hasPendingMessageEvent = false;

    let rAFCallbackIDCounter = 0;
    let rAFCallback = null;
    let isRunningRAFCallback = false;

    let rICCallbackIDCounter = 0;
    let rICCallback = null;

    let timerIDCounter = 0;
    let timeoutCallback = null;
    let timeoutTime = -1;

    let eventLog = [];

    const window = {};
    global.window = window;

    let currentTime = 0;

    window.performance = {
      now() {
        return currentTime;
      },
    };
    // Note: Scheduler doesn't actually use these APIs anymore but I'll leave
    // them here in case we want to use them in the future.
    window.requestAnimationFrame = cb => {
      if (rAFCallback !== null) {
        throw Error('rAF already scheduled');
      }
      if (isRunningRAFCallback) {
        log('Request Animation Frame [Reposted]');
      } else {
        log('Request Animation Frame');
      }
      rAFCallback = cb;
      return rAFCallbackIDCounter++;
    };
    window.cancelAnimationFrame = id => {
      rAFCallback = null;
    };

    window.requestIdleCallback = cb => {
      if (rICCallback !== null) {
        throw Error('rAF already scheduled');
      }
      log('Request Idle Callback');
      rICCallback = cb;
      return rICCallbackIDCounter++;
    };
    window.cancelIdleCallback = id => {
      rICCallback = null;
    };

    window.setTimeout = (cb, delay) => {
      const id = timerIDCounter++;
      log(`Set Timer [${delay}ms]`);
      timeoutCallback = cb;
      timeoutTime = currentTime + delay;
      return id;
    };
    window.clearTimeout = id => {
      if (id !== timerIDCounter) {
        throw Error('Wrong timer ID passed to clearTimeout');
      }
      log('Clear Timer');
      timeoutCallback = null;
      timeoutTime = -1;
    };

    const port1 = {};
    const port2 = {
      postMessage() {
        if (hasPendingMessageEvent) {
          throw Error('Message event already scheduled');
        }
        log('Post Message');
        hasPendingMessageEvent = true;
      },
    };
    global.MessageChannel = function MessageChannel() {
      this.port1 = port1;
      this.port2 = port2;
    };

    function ensureLogIsEmpty() {
      if (eventLog.length !== 0) {
        throw Error('Log is not empty. Call assertLog before continuing.');
      }
    }
    function setHardwareFrameRate(fps) {
      VSYNC_INTERVAL = 1000 / fps;
    }
    function advanceTime(ms) {
      currentTime += ms;
      if (timeoutTime !== -1 && timeoutTime <= currentTime) {
        const cb = timeoutCallback;
        timeoutCallback = null;
        timeoutTime = -1;
        log('Run Timer');
        cb();
      }
    }
    function advanceTimeToNextFrame() {
      const targetTime =
        Math.ceil(currentTime / VSYNC_INTERVAL) * VSYNC_INTERVAL;
      if (targetTime === currentTime) {
        currentTime += VSYNC_INTERVAL;
      } else {
        currentTime = targetTime;
      }
    }
    function getMostRecentFrameNumber() {
      return Math.floor(currentTime / VSYNC_INTERVAL);
    }
    function fireMessageEvent() {
      ensureLogIsEmpty();
      if (!hasPendingMessageEvent) {
        throw Error('No message event was scheduled');
      }
      hasPendingMessageEvent = false;
      const onMessage = port1.onmessage;
      log('Message Event');
      onMessage();
    }
    function fireAnimationFrame() {
      ensureLogIsEmpty();
      if (isRunningRAFCallback) {
        throw Error('Cannot fire animation frame from inside another event.');
      }
      if (rAFCallback === null) {
        throw Error('No rAF scheduled.');
      }
      const mostRecentFrameNumber = getMostRecentFrameNumber();
      const rAFTime = mostRecentFrameNumber * VSYNC_INTERVAL;
      const cb = rAFCallback;
      rAFCallback = null;
      log(`Animation Frame [${mostRecentFrameNumber}]`);
      isRunningRAFCallback = true;
      try {
        cb(rAFTime);
      } finally {
        isRunningRAFCallback = false;
      }
    }
    function fireRIC() {
      ensureLogIsEmpty();
      if (rICCallback === null) {
        throw Error('No rIC scheduled.');
      }
      const cb = rICCallback;
      rICCallback = null;
      log('Idle Callback');
      cb();
    }
    function log(val) {
      eventLog.push(val);
    }
    function isLogEmpty() {
      return eventLog.length === 0;
    }
    function assertLog(expected) {
      const actual = eventLog;
      eventLog = [];
      expect(actual).toEqual(expected);
    }
    return {
      setHardwareFrameRate,
      advanceTime,
      advanceTimeToNextFrame,
      getMostRecentFrameNumber,
      fireMessageEvent,
      fireAnimationFrame,
      fireRIC,
      log,
      isLogEmpty,
      assertLog,
    };
  }

  it('task that finishes before deadline', () => {
    scheduleCallback(NormalPriority, () => {
      runtime.log('Task');
    });
    runtime.assertLog(['Post Message']);
    runtime.fireMessageEvent();
    runtime.assertLog(['Message Event', 'Task']);
  });

  it('task with continutation', () => {
    scheduleCallback(NormalPriority, () => {
      runtime.log('Task');
      while (!Scheduler.unstable_shouldYield()) {
        runtime.advanceTime(1);
      }
      runtime.log(`Yield at ${performance.now()}ms`);
      return () => {
        runtime.log('Continuation');
      };
    });
    runtime.assertLog(['Post Message']);

    runtime.fireMessageEvent();
    runtime.assertLog([
      'Message Event',
      'Task',
      'Yield at 5ms',
      'Post Message',
    ]);

    runtime.fireMessageEvent();
    runtime.assertLog(['Message Event', 'Continuation']);
  });

  it('multiple tasks', () => {
    scheduleCallback(NormalPriority, () => {
      runtime.log('A');
    });
    scheduleCallback(NormalPriority, () => {
      runtime.log('B');
    });
    runtime.assertLog(['Post Message']);
    runtime.fireMessageEvent();
    runtime.assertLog(['Message Event', 'A', 'B']);
  });

  it('multiple tasks with a yield in between', () => {
    scheduleCallback(NormalPriority, () => {
      runtime.log('A');
      runtime.advanceTime(5000);
    });
    scheduleCallback(NormalPriority, () => {
      runtime.log('B');
    });
    runtime.assertLog(['Post Message']);
    runtime.fireMessageEvent();
    runtime.assertLog([
      'Message Event',
      'A',
      // Ran out of time. Post a continuation event.
      'Post Message',
    ]);
    runtime.fireMessageEvent();
    runtime.assertLog(['Message Event', 'B']);
  });

  it('cancels tasks', () => {
    const task = scheduleCallback(NormalPriority, () => {
      runtime.log('Task');
    });
    runtime.assertLog(['Post Message']);
    cancelCallback(task);
    runtime.assertLog([]);
  });

  it('throws when a task errors then continues in a new event', () => {
    scheduleCallback(NormalPriority, () => {
      runtime.log('Oops!');
      throw Error('Oops!');
    });
    scheduleCallback(NormalPriority, () => {
      runtime.log('Yay');
    });
    runtime.assertLog(['Post Message']);

    expect(() => runtime.fireMessageEvent()).toThrow('Oops!');
    runtime.assertLog(['Message Event', 'Oops!', 'Post Message']);

    runtime.fireMessageEvent();
    runtime.assertLog(['Message Event', 'Yay']);
  });

  it('schedule new task after queue has emptied', () => {
    scheduleCallback(NormalPriority, () => {
      runtime.log('A');
    });

    runtime.assertLog(['Post Message']);
    runtime.fireMessageEvent();
    runtime.assertLog(['Message Event', 'A']);

    scheduleCallback(NormalPriority, () => {
      runtime.log('B');
    });
    runtime.assertLog(['Post Message']);
    runtime.fireMessageEvent();
    runtime.assertLog(['Message Event', 'B']);
  });

  it('delayed task', () => {
    scheduleCallback(
      NormalPriority,
      () => {
        runtime.log('Delayed Task');
      },
      {delay: 1000},
    );
    runtime.assertLog(['Set Timer [1000ms]']);

    runtime.advanceTime(999);
    runtime.assertLog([]);

    runtime.advanceTime(1);
    runtime.assertLog(['Run Timer', 'Post Message']);

    runtime.fireMessageEvent();
    runtime.assertLog(['Message Event', 'Delayed Task']);
  });
});
