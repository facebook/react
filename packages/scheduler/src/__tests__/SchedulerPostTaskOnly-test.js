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

describe('SchedulerPostTaskOnly', () => {
  beforeEach(() => {
    if (!process.env.IS_BUILD) {
      jest.resetModules();

      // Un-mock scheduler
      jest.mock('scheduler', () =>
        require.requireActual('scheduler/unstable_post_task_only'),
      );

      runtime = installMockBrowserRuntime();
      performance = window.performance;
      Scheduler = require('scheduler');
      cancelCallback = Scheduler.unstable_cancelCallback;
      scheduleCallback = Scheduler.unstable_scheduleCallback;
      NormalPriority = Scheduler.unstable_NormalPriority;
    }
  });

  afterEach(() => {
    if (!process.env.IS_BUILD) {
      if (!runtime.isLogEmpty()) {
        throw Error('Test exited without clearing log.');
      }
    }
  });

  function installMockBrowserRuntime() {
    let hasPendingTask = false;
    let timerIDCounter = 0;
    let eventLog = [];

    // Mock window functions
    const window = {};
    global.window = window;

    // TODO: Scheduler no longer requires these methods to be polyfilled. But
    // maybe we want to continue warning if they don't exist, to preserve the
    // option to rely on it in the future?
    window.requestAnimationFrame = window.cancelAnimationFrame = () => {};

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

  // @gate source
  it('task that finishes before deadline', () => {
    scheduleCallback(NormalPriority, () => {
      runtime.log('Task');
    });
    runtime.assertLog(['Post Task']);
    runtime.fireNextTask();
    runtime.assertLog(['Task Event', 'Task']);
  });

  // @gate source
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

  // @gate source
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

  // @gate source
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

  // @gate source
  it('cancels tasks', () => {
    const task = scheduleCallback(NormalPriority, () => {
      runtime.log('Task');
    });
    runtime.assertLog(['Post Task']);
    cancelCallback(task);
    runtime.assertLog([]);
  });

  // @gate source
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

  // @gate source
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

  // @gate source
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
