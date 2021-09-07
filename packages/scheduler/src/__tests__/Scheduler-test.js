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
let cancelCallback;
let scheduleCallback;
let requestPaint;
let NormalPriority;

// The Scheduler implementation uses browser APIs like `MessageChannel` and
// `setTimeout` to schedule work on the main thread. Most of our tests treat
// these as implementation details; however, the sequence and timing of these
// APIs are not precisely specified, and can vary across browsers.
//
// To prevent regressions, we need the ability to simulate specific edge cases
// that we may encounter in various browsers.
//
// This test suite mocks all browser methods used in our implementation. It
// assumes as little as possible about the order and timing of events.
describe('SchedulerBrowser', () => {
  beforeEach(() => {
    jest.resetModules();
    runtime = installMockBrowserRuntime();
    jest.unmock('scheduler');

    performance = global.performance;
    Scheduler = require('scheduler');
    cancelCallback = Scheduler.unstable_cancelCallback;
    scheduleCallback = Scheduler.unstable_scheduleCallback;
    NormalPriority = Scheduler.unstable_NormalPriority;
    requestPaint = Scheduler.unstable_requestPaint;
  });

  afterEach(() => {
    delete global.performance;

    if (!runtime.isLogEmpty()) {
      throw Error('Test exited without clearing log.');
    }
  });

  function installMockBrowserRuntime() {
    let hasPendingMessageEvent = false;
    let isFiringMessageEvent = false;
    let hasPendingDiscreteEvent = false;
    let hasPendingContinuousEvent = false;

    let timerIDCounter = 0;
    // let timerIDs = new Map();

    let eventLog = [];

    let currentTime = 0;

    global.performance = {
      now() {
        return currentTime;
      },
    };

    // Delete node provide setImmediate so we fall through to MessageChannel.
    delete global.setImmediate;

    global.setTimeout = (cb, delay) => {
      const id = timerIDCounter++;
      log(`Set Timer`);
      // TODO
      return id;
    };
    global.clearTimeout = id => {
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

    const scheduling = {
      isInputPending(options) {
        if (this !== scheduling) {
          throw new Error(
            'isInputPending called with incorrect `this` context',
          );
        }

        return (
          hasPendingDiscreteEvent ||
          (options && options.includeContinuous && hasPendingContinuousEvent)
        );
      },
    };

    global.navigator = {scheduling};

    function ensureLogIsEmpty() {
      if (eventLog.length !== 0) {
        throw Error('Log is not empty. Call assertLog before continuing.');
      }
    }
    function advanceTime(ms) {
      currentTime += ms;
    }
    function resetTime() {
      currentTime = 0;
    }
    function fireMessageEvent() {
      ensureLogIsEmpty();
      if (!hasPendingMessageEvent) {
        throw Error('No message event was scheduled');
      }
      hasPendingMessageEvent = false;
      const onMessage = port1.onmessage;
      log('Message Event');

      isFiringMessageEvent = true;
      try {
        onMessage();
      } finally {
        isFiringMessageEvent = false;
        if (hasPendingDiscreteEvent) {
          log('Discrete Event');
          hasPendingDiscreteEvent = false;
        }
        if (hasPendingContinuousEvent) {
          log('Continuous Event');
          hasPendingContinuousEvent = false;
        }
      }
    }
    function scheduleDiscreteEvent() {
      if (isFiringMessageEvent) {
        hasPendingDiscreteEvent = true;
      } else {
        log('Discrete Event');
      }
    }
    function scheduleContinuousEvent() {
      if (isFiringMessageEvent) {
        hasPendingContinuousEvent = true;
      } else {
        log('Continuous Event');
      }
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
      advanceTime,
      resetTime,
      fireMessageEvent,
      log,
      isLogEmpty,
      assertLog,
      scheduleDiscreteEvent,
      scheduleContinuousEvent,
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

  it('task with continuation', () => {
    scheduleCallback(NormalPriority, () => {
      runtime.log('Task');
      // Request paint so that we yield at the end of the frame interval
      requestPaint();
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
      runtime.advanceTime(4999);
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

  it('schedule new task after a cancellation', () => {
    const handle = scheduleCallback(NormalPriority, () => {
      runtime.log('A');
    });

    runtime.assertLog(['Post Message']);
    cancelCallback(handle);

    runtime.fireMessageEvent();
    runtime.assertLog(['Message Event']);

    scheduleCallback(NormalPriority, () => {
      runtime.log('B');
    });
    runtime.assertLog(['Post Message']);
    runtime.fireMessageEvent();
    runtime.assertLog(['Message Event', 'B']);
  });

  it('when isInputPending is available, we can wait longer before yielding', () => {
    function blockUntilSchedulerAsksToYield() {
      while (!Scheduler.unstable_shouldYield()) {
        runtime.advanceTime(1);
      }
      runtime.log(`Yield at ${performance.now()}ms`);
    }

    // First show what happens when we don't request a paint
    scheduleCallback(NormalPriority, () => {
      runtime.log('Task with no pending input');
      blockUntilSchedulerAsksToYield();
    });
    runtime.assertLog(['Post Message']);

    runtime.fireMessageEvent();
    runtime.assertLog([
      'Message Event',
      'Task with no pending input',
      // Even though there's no input, eventually Scheduler will yield
      // regardless in case there's a pending main thread task we don't know
      // about, like a network event.
      gate(flags =>
        flags.enableIsInputPending
          ? 'Yield at 300ms'
          : // When isInputPending is disabled, we always yield quickly
            'Yield at 5ms',
      ),
    ]);

    runtime.resetTime();

    // Now do the same thing, but while the task is running, simulate an
    // input event.
    scheduleCallback(NormalPriority, () => {
      runtime.log('Task with pending input');
      runtime.scheduleDiscreteEvent();
      blockUntilSchedulerAsksToYield();
    });
    runtime.assertLog(['Post Message']);

    runtime.fireMessageEvent();
    runtime.assertLog([
      'Message Event',
      'Task with pending input',
      // This time we yielded quickly to unblock the discrete event.
      'Yield at 5ms',
      'Discrete Event',
    ]);
  });

  it(
    'isInputPending will also check for continuous inputs, but after a ' +
      'slightly larger threshold',
    () => {
      function blockUntilSchedulerAsksToYield() {
        while (!Scheduler.unstable_shouldYield()) {
          runtime.advanceTime(1);
        }
        runtime.log(`Yield at ${performance.now()}ms`);
      }

      // First show what happens when we don't request a paint
      scheduleCallback(NormalPriority, () => {
        runtime.log('Task with no pending input');
        blockUntilSchedulerAsksToYield();
      });
      runtime.assertLog(['Post Message']);

      runtime.fireMessageEvent();
      runtime.assertLog([
        'Message Event',
        'Task with no pending input',
        // Even though there's no input, eventually Scheduler will yield
        // regardless in case there's a pending main thread task we don't know
        // about, like a network event.
        gate(flags =>
          flags.enableIsInputPending
            ? 'Yield at 300ms'
            : // When isInputPending is disabled, we always yield quickly
              'Yield at 5ms',
        ),
      ]);

      runtime.resetTime();

      // Now do the same thing, but while the task is running, simulate a
      // continuous input event.
      scheduleCallback(NormalPriority, () => {
        runtime.log('Task with continuous input');
        runtime.scheduleContinuousEvent();
        blockUntilSchedulerAsksToYield();
      });
      runtime.assertLog(['Post Message']);

      runtime.fireMessageEvent();
      runtime.assertLog([
        'Message Event',
        'Task with continuous input',
        // This time we yielded quickly to unblock the continuous event. But not
        // as quickly as for a discrete event.
        gate(flags =>
          flags.enableIsInputPending
            ? 'Yield at 50ms'
            : // When isInputPending is disabled, we always yield quickly
              'Yield at 5ms',
        ),
        'Continuous Event',
      ]);
    },
  );

  it('requestPaint forces a yield at the end of the next frame interval', () => {
    function blockUntilSchedulerAsksToYield() {
      while (!Scheduler.unstable_shouldYield()) {
        runtime.advanceTime(1);
      }
      runtime.log(`Yield at ${performance.now()}ms`);
    }

    // First show what happens when we don't request a paint
    scheduleCallback(NormalPriority, () => {
      runtime.log('Task with no paint');
      blockUntilSchedulerAsksToYield();
    });
    runtime.assertLog(['Post Message']);

    runtime.fireMessageEvent();
    runtime.assertLog([
      'Message Event',
      'Task with no paint',
      gate(flags =>
        flags.enableIsInputPending
          ? 'Yield at 300ms'
          : // When isInputPending is disabled, we always yield quickly
            'Yield at 5ms',
      ),
    ]);

    runtime.resetTime();

    // Now do the same thing, but call requestPaint inside the task
    scheduleCallback(NormalPriority, () => {
      runtime.log('Task with paint');
      requestPaint();
      blockUntilSchedulerAsksToYield();
    });
    runtime.assertLog(['Post Message']);

    runtime.fireMessageEvent();
    runtime.assertLog([
      'Message Event',
      'Task with paint',
      // This time we yielded quickly (5ms) because we requested a paint.
      'Yield at 5ms',
    ]);
  });
});
