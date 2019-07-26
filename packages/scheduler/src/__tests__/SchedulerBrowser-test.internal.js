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
  function beforeAndAfterHooks(enableMessageLoopImplementation) {
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
      require('scheduler/src/SchedulerFeatureFlags').enableMessageLoopImplementation = enableMessageLoopImplementation;
      Scheduler = require('scheduler');
      scheduleCallback = Scheduler.unstable_scheduleCallback;
      NormalPriority = Scheduler.unstable_NormalPriority;
    });

    afterEach(() => {
      if (!runtime.isLogEmpty()) {
        throw Error('Test exited without clearing log.');
      }
    });
  }

  function installMockBrowserRuntime() {
    let VSYNC_INTERVAL = 33.33;

    let hasPendingMessageEvent = false;

    let rAFCallbackIDCounter = 0;
    let rAFCallback = null;
    let isRunningRAFCallback = false;

    let rICCallbackIDCounter = 0;
    let rICCallback = null;

    let timerIDCounter = 0;
    // let timerIDs = new Map();

    let eventLog = [];

    const window = {};
    global.window = window;

    let currentTime = 0;

    window.performance = {
      now() {
        return currentTime;
      },
    };
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
      log(`Set Timer`);
      // TODO
      return id;
    };
    window.clearTimeout = id => {
      // TODO
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

  describe('rAF aligned frame boundaries', () => {
    const enableMessageLoopImplementation = false;
    beforeAndAfterHooks(enableMessageLoopImplementation);

    it('callback with continuation', () => {
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
      runtime.assertLog(['Request Animation Frame']);

      runtime.fireAnimationFrame();
      runtime.assertLog([
        'Animation Frame [0]',
        'Request Animation Frame [Reposted]',
        'Set Timer',
        'Post Message',
      ]);
      runtime.fireMessageEvent();
      runtime.assertLog(['Message Event', 'Task', 'Yield at 34ms']);

      runtime.fireAnimationFrame();
      runtime.assertLog([
        'Animation Frame [1]',
        'Request Animation Frame [Reposted]',
        'Set Timer',
        'Post Message',
      ]);

      runtime.fireMessageEvent();
      runtime.assertLog(['Message Event', 'Continuation']);

      runtime.advanceTimeToNextFrame();
      runtime.fireAnimationFrame();
      runtime.assertLog(['Animation Frame [2]']);
    });

    it('two rAF calls in the same frame', () => {
      scheduleCallback(NormalPriority, () => runtime.log('A'));
      runtime.assertLog(['Request Animation Frame']);
      runtime.fireAnimationFrame();
      runtime.assertLog([
        'Animation Frame [0]',
        'Request Animation Frame [Reposted]',
        'Set Timer',
        'Post Message',
      ]);
      runtime.fireMessageEvent();
      runtime.assertLog(['Message Event', 'A']);

      // The Scheduler queue is now empty. We're still in frame 0.
      expect(runtime.getMostRecentFrameNumber()).toBe(0);

      // Post a task to Scheduler.
      scheduleCallback(NormalPriority, () => runtime.log('B'));

      // Did not request another animation frame, since one was already scheduled
      // during the previous rAF.
      runtime.assertLog([]);

      // Fire the animation frame.
      runtime.fireAnimationFrame();
      runtime.assertLog([
        'Animation Frame [0]',
        'Request Animation Frame [Reposted]',
        'Set Timer',
        'Post Message',
      ]);

      runtime.fireMessageEvent();
      runtime.assertLog(['Message Event', 'B']);
    });

    it('adjusts frame rate by measuring inteval between rAF events', () => {
      runtime.setHardwareFrameRate(60);

      scheduleCallback(NormalPriority, () => runtime.log('Tick'));
      runtime.assertLog(['Request Animation Frame']);

      // Need to measure two consecutive intervals between frames.
      for (let i = 0; i < 2; i++) {
        runtime.fireAnimationFrame();
        runtime.assertLog([
          `Animation Frame [${runtime.getMostRecentFrameNumber()}]`,
          'Request Animation Frame [Reposted]',
          'Set Timer',
          'Post Message',
        ]);
        runtime.fireMessageEvent();
        runtime.assertLog(['Message Event', 'Tick']);
        scheduleCallback(NormalPriority, () => runtime.log('Tick'));
        runtime.advanceTimeToNextFrame();
      }

      // Scheduler should observe that it's receiving rAFs every 16.6 ms and
      // adjust its frame rate accordingly. Test by blocking the thread until
      // Scheduler tells us to yield. Then measure how much time has elapsed.
      const start = performance.now();
      scheduleCallback(NormalPriority, () => {
        while (!Scheduler.unstable_shouldYield()) {
          runtime.advanceTime(1);
        }
      });
      runtime.fireAnimationFrame();
      runtime.assertLog([
        `Animation Frame [${runtime.getMostRecentFrameNumber()}]`,
        'Request Animation Frame [Reposted]',
        'Set Timer',
        'Post Message',
      ]);
      runtime.fireMessageEvent();
      runtime.assertLog(['Message Event', 'Tick']);
      const end = performance.now();

      // Check how much time elapsed in the frame.
      expect(end - start).toEqual(17);
    });
  });

  describe('message event loop', () => {
    const enableMessageLoopImplementation = true;
    beforeAndAfterHooks(enableMessageLoopImplementation);

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

    it('task that throws', () => {
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
  });
});
