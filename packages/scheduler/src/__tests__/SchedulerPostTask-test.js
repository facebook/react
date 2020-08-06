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
let NormalPriority;

// The Scheduler postTask implementation uses a new postTask browser API to
// schedule work on the main thread. Most of our tests treat this as an
// implementation detail; however, the sequence and timing of browser
// APIs are not precisely specified, and can vary across browsers.
//
// To prevent regressions, we need the ability to simulate specific edge cases
// that we may encounter in various browsers.
//
// This test suite mocks all browser methods used in our implementation. It
// assumes as little as possible about the order and timing of events.s
describe('SchedulerPostTask', () => {
  beforeEach(() => {
    jest.resetModules();

    // Un-mock scheduler
    jest.mock('scheduler', () =>
      require.requireActual('scheduler/unstable_post_task'),
    );
    jest.mock('scheduler/src/SchedulerHostConfig', () =>
      require.requireActual(
        'scheduler/src/forks/SchedulerHostConfig.post-task.js',
      ),
    );

    runtime = installMockBrowserRuntime();
    performance = window.performance;
    Scheduler = require('scheduler');
    cancelCallback = Scheduler.unstable_cancelCallback;
    scheduleCallback = Scheduler.unstable_scheduleCallback;
    NormalPriority = Scheduler.unstable_NormalPriority;
  });

  afterEach(() => {
    if (!runtime.isLogEmpty()) {
      throw Error('Test exited without clearing log.');
    }
  });

  function installMockBrowserRuntime() {
    let hasPendingTask = false;
    let timerIDCounter = 0;
    let eventLog = [];

    // Mock window functions
    const window = {};
    global.window = window;

    let currentTime = 0;
    window.performance = {
      now() {
        return currentTime;
      },
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

    // Mock browser scheduler.
    const scheduler = {};
    global.scheduler = scheduler;

    let nextTask;
    scheduler.postTask = function(callback) {
      if (hasPendingTask) {
        throw Error('Task already scheduled');
      }
      log('Post Task');
      hasPendingTask = true;
      nextTask = callback;
    };

    function ensureLogIsEmpty() {
      if (eventLog.length !== 0) {
        throw Error('Log is not empty. Call assertLog before continuing.');
      }
    }
    function advanceTime(ms) {
      currentTime += ms;
    }
    function fireNextTask() {
      ensureLogIsEmpty();
      if (!hasPendingTask) {
        throw Error('No task was scheduled');
      }
      hasPendingTask = false;

      log('Task Event');

      // If there's a continuation, it will call postTask again
      // which will set nextTask. That means we need to clear
      // nextTask before the invocation, otherwise we would
      // delete the continuation task.
      const task = nextTask;
      nextTask = null;
      task();
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
      fireNextTask,
      log,
      isLogEmpty,
      assertLog,
    };
  }

  it('task that finishes before deadline', () => {
    scheduleCallback(NormalPriority, () => {
      runtime.log('Task');
    });
    runtime.assertLog(['Post Task']);
    runtime.fireNextTask();
    runtime.assertLog(['Task Event', 'Task']);
  });

  it('task with continuation', () => {
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
    runtime.assertLog(['Post Task']);

    runtime.fireNextTask();
    runtime.assertLog(['Task Event', 'Task', 'Yield at 5ms', 'Post Task']);

    runtime.fireNextTask();
    runtime.assertLog(['Task Event', 'Continuation']);
  });

  it('multiple tasks', () => {
    scheduleCallback(NormalPriority, () => {
      runtime.log('A');
    });
    scheduleCallback(NormalPriority, () => {
      runtime.log('B');
    });
    runtime.assertLog(['Post Task']);
    runtime.fireNextTask();
    runtime.assertLog(['Task Event', 'A', 'B']);
  });

  it('multiple tasks with a yield in between', () => {
    scheduleCallback(NormalPriority, () => {
      runtime.log('A');
      runtime.advanceTime(4999);
    });
    scheduleCallback(NormalPriority, () => {
      runtime.log('B');
    });
    runtime.assertLog(['Post Task']);
    runtime.fireNextTask();
    runtime.assertLog([
      'Task Event',
      'A',
      // Ran out of time. Post a continuation event.
      'Post Task',
    ]);
    runtime.fireNextTask();
    runtime.assertLog(['Task Event', 'B']);
  });

  it('cancels tasks', () => {
    const task = scheduleCallback(NormalPriority, () => {
      runtime.log('Task');
    });
    runtime.assertLog(['Post Task']);
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
    runtime.assertLog(['Post Task']);

    expect(() => runtime.fireNextTask()).toThrow('Oops!');
    runtime.assertLog(['Task Event', 'Oops!', 'Post Task']);

    runtime.fireNextTask();
    runtime.assertLog(['Task Event', 'Yay']);
  });

  it('schedule new task after queue has emptied', () => {
    scheduleCallback(NormalPriority, () => {
      runtime.log('A');
    });

    runtime.assertLog(['Post Task']);
    runtime.fireNextTask();
    runtime.assertLog(['Task Event', 'A']);

    scheduleCallback(NormalPriority, () => {
      runtime.log('B');
    });
    runtime.assertLog(['Post Task']);
    runtime.fireNextTask();
    runtime.assertLog(['Task Event', 'B']);
  });

  it('schedule new task after a cancellation', () => {
    const handle = scheduleCallback(NormalPriority, () => {
      runtime.log('A');
    });

    runtime.assertLog(['Post Task']);
    cancelCallback(handle);

    runtime.fireNextTask();
    runtime.assertLog(['Task Event']);

    scheduleCallback(NormalPriority, () => {
      runtime.log('B');
    });
    runtime.assertLog(['Post Task']);
    runtime.fireNextTask();
    runtime.assertLog(['Task Event', 'B']);
  });
});
