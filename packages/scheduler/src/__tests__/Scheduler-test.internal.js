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

describe('Scheduler', () => {
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
        _flushWork();
      } finally {
        endOfFrame = -1;
      }
      const yields = yieldedValues;
      yieldedValues = [];
      return yields;
    };

    advanceTime = ms => {
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
        _flushWork(true);
      }, absoluteTimeout - currentTime);
    }
    function cancelCallback() {
      if (_flushWork === null) {
        throw new Error('No work is scheduled.');
      }
      _flushWork = null;
      clearTimeout(timeoutID);
    }
    function getTimeRemaining() {
      return endOfFrame;
    }

    // Override host implementation
    delete global.performance;
    global.Date.now = () => currentTime;
    window._schedMock = [requestCallback, cancelCallback, getTimeRemaining];

    const Scheduler = require('scheduler');
    scheduleWork = Scheduler.unstable_scheduleWork;
    cancelScheduledWork = Scheduler.unstable_cancelScheduledWork;
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
});
