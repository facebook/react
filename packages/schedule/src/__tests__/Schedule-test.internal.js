/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let scheduleWork;
let cancelScheduledWork;
let flushWork;
let advanceTime;
let doWork;
let yieldedValues;
let yieldValue;
let clearYieldedValues;

describe('Schedule', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();

    let _flushWork = null;
    let timeoutID = -1;
    let endOfFrame = -1;

    let currentTime = 0;

    flushWork = frameSize => {
      if (frameSize === null || frameSize === undefined) {
        frameSize = Infinity;
      }
      if (_flushWork === null) {
        throw new Error('No work is scheduled.');
      }
      timeoutID = -1;
      endOfFrame = currentTime + frameSize;
      try {
        const cb = _flushWork;
        _flushWork = null;
        cb(false);
      } finally {
        endOfFrame = -1;
      }
      const yields = yieldedValues;
      yieldedValues = [];
      return yields;
    };

    advanceTime = (ms = 0) => {
      currentTime += ms;
      jest.advanceTimersByTime(ms);
    };

    doWork = (label, timeCost) => {
      advanceTime(timeCost);
      yieldValue(label);
    };

    yieldedValues = [];
    yieldValue = value => {
      yieldedValues.push(value);
    };

    clearYieldedValues = () => {
      const yields = yieldedValues;
      yieldedValues = [];
      return yields;
    };

    function requestCallback(fw, absoluteTimeout) {
      if (_flushWork !== null) {
        throw new Error('Work is already scheduled.');
      }
      _flushWork = fw;
      timeoutID = setTimeout(() => {
        const cb = _flushWork;
        if (cb !== null) {
          _flushWork = null;
          cb(true);
        }
      }, absoluteTimeout - currentTime);
    }
    function cancelCallback() {
      _flushWork = null;
      clearTimeout(timeoutID);
    }
    function getFrameDeadline() {
      return endOfFrame;
    }

    // Override host implementation
    delete global.performance;
    global.Date.now = () => currentTime;
    window._sched = [requestCallback, cancelCallback, getFrameDeadline];

    const Schedule = require('schedule');
    scheduleWork = Schedule.unstable_scheduleWork;
    cancelScheduledWork = Schedule.unstable_cancelScheduledWork;
  });

  it('flushes work incrementally', () => {
    scheduleWork(() => doWork('A', 100));
    scheduleWork(() => doWork('B', 200));
    scheduleWork(() => doWork('C', 300));
    scheduleWork(() => doWork('D', 400));

    expect(flushWork(300)).toEqual(['A', 'B']);
    expect(flushWork(300)).toEqual(['C']);
    expect(flushWork(400)).toEqual(['D']);
  });

  it('cancels work', () => {
    scheduleWork(() => doWork('A', 100));
    const callbackHandleB = scheduleWork(() => doWork('B', 200));
    scheduleWork(() => doWork('C', 300));

    cancelScheduledWork(callbackHandleB);

    expect(flushWork()).toEqual([
      'A',
      // B should have been cancelled
      'C',
    ]);
  });

  it('prioritizes callbacks according to their timeouts', () => {
    scheduleWork(() => doWork('A', 10), {timeout: 5000});
    scheduleWork(() => doWork('B', 20), {timeout: 5000});
    scheduleWork(() => doWork('C', 30), {timeout: 1000});
    scheduleWork(() => doWork('D', 40), {timeout: 5000});

    // C should be first because it has the earliest timeout
    expect(flushWork()).toEqual(['C', 'A', 'B', 'D']);
  });

  it('times out work', () => {
    scheduleWork(() => doWork('A', 100), {timeout: 5000});
    scheduleWork(() => doWork('B', 200), {timeout: 5000});
    scheduleWork(() => doWork('C', 300), {timeout: 1000});
    scheduleWork(() => doWork('D', 400), {timeout: 5000});

    // Advance time, but not by enough to flush any work
    advanceTime(999);
    expect(clearYieldedValues()).toEqual([]);

    // Advance by just a bit more to flush C
    advanceTime(1);
    expect(clearYieldedValues()).toEqual(['C']);

    // Flush the rest
    advanceTime(4000);
    expect(clearYieldedValues()).toEqual(['A', 'B', 'D']);
  });

  it('has a default timeout of 5 seconds', () => {
    scheduleWork(() => doWork('A', 100));
    scheduleWork(() => doWork('B', 200));
    scheduleWork(() => doWork('C', 300), {timeout: 1000});
    scheduleWork(() => doWork('D', 400));

    // Flush C
    advanceTime(1000);
    expect(clearYieldedValues()).toEqual(['C']);

    // Advance time until right before the rest of the work expires
    advanceTime(3699);
    expect(clearYieldedValues()).toEqual([]);

    // Now advance by just a bit more
    advanceTime(1);
    expect(clearYieldedValues()).toEqual(['A', 'B', 'D']);
  });

  it('continues working on same task after yielding', () => {
    scheduleWork(() => doWork('A', 100));
    scheduleWork(() => doWork('B', 100));

    const tasks = [['C1', 100], ['C2', 100], ['C3', 100]];
    const C = deadline => {
      while (tasks.length > 0) {
        doWork(...tasks.shift());
        if (
          tasks.length > 0 &&
          !deadline.didTimeout &&
          deadline.timeRemaining() <= 0
        ) {
          yieldValue('Yield!');
          return C;
        }
      }
    };

    scheduleWork(C);

    scheduleWork(() => doWork('D', 100));
    scheduleWork(() => doWork('E', 100));

    expect(flushWork(300)).toEqual(['A', 'B', 'C1', 'Yield!']);

    expect(flushWork()).toEqual(['C2', 'C3', 'D', 'E']);
  });

  it('continuations callbacks inherit the timeout of the yielding callback', () => {
    const tasks = [['A', 100], ['B', 100], ['C', 100], ['D', 100]];
    const work = deadline => {
      while (tasks.length > 0) {
        doWork(...tasks.shift());
        if (
          tasks.length > 0 &&
          !deadline.didTimeout &&
          deadline.timeRemaining() <= 0
        ) {
          yieldValue('Yield!');
          return work;
        }
      }
    };
    scheduleWork(work, {timeout: 201});

    // Flush until just before the expiration time
    expect(flushWork(200)).toEqual(['A', 'B', 'Yield!']);

    // Advance time by just a bit more. This should expire all the remaining work.
    advanceTime(1);
    expect(clearYieldedValues()).toEqual(['C', 'D']);
  });

  it('nested callbacks inherit the timeout of the currently executing callback', () => {
    const tasks = [['A', 100], ['B', 100], ['C', 100], ['D', 100]];
    const work = deadline => {
      while (tasks.length > 0) {
        const task = tasks.shift();
        if (task[0] === 'B') {
          // Schedule a nested callback. This should inherit the timeout of
          // the parent callback (201).
          scheduleWork(() => doWork('E'));
        }
        doWork(...task);
        if (
          tasks.length > 0 &&
          !deadline.didTimeout &&
          deadline.timeRemaining() <= 0
        ) {
          yieldValue('Yield!');
          return work;
        }
      }
    };
    scheduleWork(work, {timeout: 201});
    expect(flushWork(200)).toEqual(['A', 'B', 'Yield!']);
    advanceTime(1);
    expect(clearYieldedValues()).toEqual(['C', 'D', 'E']);
  });

  it('continuations are interrupted by higher priority work', () => {
    const tasks = [['A', 100], ['B', 100], ['C', 100], ['D', 100]];
    const work = deadline => {
      while (tasks.length > 0) {
        doWork(...tasks.shift());
        if (
          tasks.length > 0 &&
          !deadline.didTimeout &&
          deadline.timeRemaining() <= 0
        ) {
          yieldValue('Yield!');
          return work;
        }
      }
    };
    scheduleWork(work);
    expect(flushWork(100)).toEqual(['A', 'Yield!']);

    scheduleWork(() => doWork('High pri'), {timeout: 100});
    expect(flushWork()).toEqual(['High pri', 'B', 'C', 'D']);
  });

  it(
    'continutations are interrupted by higher priority work scheduled ' +
      'inside an executing callback',
    () => {
      const tasks = [['A', 100], ['B', 100], ['C', 100], ['D', 100]];
      const work = deadline => {
        while (tasks.length > 0) {
          const task = tasks.shift();
          if (task[0] === 'B') {
            // Schedule high pri work from inside another callback
            scheduleWork(() => doWork('High pri'), {timeout: 100});
          }
          doWork(...task);
          if (
            tasks.length > 0 &&
            !deadline.didTimeout &&
            deadline.timeRemaining() <= 0
          ) {
            yieldValue('Yield!');
            return work;
          }
        }
      };
      scheduleWork(work);
      expect(flushWork(200)).toEqual(['A', 'B', 'Yield!']);
      expect(flushWork()).toEqual(['High pri', 'C', 'D']);
    },
  );

  it(
    'asks work to yield when a high priority callback is scheduled, ' +
      "even if there's time left in the frame",
    () => {
      const tasks = [['A', 100], ['B', 100], ['C', 100], ['D', 100]];
      const work = deadline => {
        while (tasks.length > 0) {
          const task = tasks.shift();
          if (task[0] === 'B') {
            // Schedule high pri work from inside another callback
            scheduleWork(() => doWork('High pri'), {timeout: 100});
          }
          doWork(...task);
          if (
            tasks.length > 0 &&
            !deadline.didTimeout &&
            deadline.timeRemaining() <= 0
          ) {
            yieldValue('Yield!');
            return work;
          }
        }
      };
      scheduleWork(work);
      expect(flushWork()).toEqual(['A', 'B', 'Yield!', 'High pri', 'C', 'D']);
    },
  );
});
