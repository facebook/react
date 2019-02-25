/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let scheduleCallback;
let runWithPriority;
let ImmediatePriority;
let UserBlockingPriority;

describe('SchedulerNoDOM', () => {
  // If Scheduler runs in a non-DOM environment, it falls back to a naive
  // implementation using setTimeout. This only meant to be used for testing
  // purposes, like with jest's fake timer API.
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    // Delete addEventListener to force us into the fallback mode.
    window.addEventListener = undefined;
    const Scheduler = require('scheduler');
    scheduleCallback = Scheduler.unstable_scheduleCallback;
    runWithPriority = Scheduler.unstable_runWithPriority;
    ImmediatePriority = Scheduler.unstable_ImmediatePriority;
    UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
  });

  it('runAllTimers flushes all scheduled callbacks', () => {
    let log = [];
    scheduleCallback(() => {
      log.push('A');
    });
    scheduleCallback(() => {
      log.push('B');
    });
    scheduleCallback(() => {
      log.push('C');
    });
    expect(log).toEqual([]);
    jest.runAllTimers();
    expect(log).toEqual(['A', 'B', 'C']);
  });

  it('executes callbacks in order of priority', () => {
    let log = [];

    scheduleCallback(() => {
      log.push('A');
    });
    scheduleCallback(() => {
      log.push('B');
    });
    runWithPriority(UserBlockingPriority, () => {
      scheduleCallback(() => {
        log.push('C');
      });
      scheduleCallback(() => {
        log.push('D');
      });
    });

    expect(log).toEqual([]);
    jest.runAllTimers();
    expect(log).toEqual(['C', 'D', 'A', 'B']);
  });

  it('advanceTimersByTime expires callbacks incrementally', () => {
    let log = [];

    scheduleCallback(() => {
      log.push('A');
    });
    scheduleCallback(() => {
      log.push('B');
    });
    runWithPriority(UserBlockingPriority, () => {
      scheduleCallback(() => {
        log.push('C');
      });
      scheduleCallback(() => {
        log.push('D');
      });
    });

    expect(log).toEqual([]);
    jest.advanceTimersByTime(249);
    expect(log).toEqual([]);
    jest.advanceTimersByTime(1);
    expect(log).toEqual(['C', 'D']);

    log = [];

    jest.runAllTimers();
    expect(log).toEqual(['A', 'B']);
  });

  it('calls immediate callbacks immediately', () => {
    let log = [];

    runWithPriority(ImmediatePriority, () => {
      scheduleCallback(() => {
        log.push('A');
        scheduleCallback(() => {
          log.push('B');
        });
      });
    });

    expect(log).toEqual(['A', 'B']);
  });

  it('handles errors', () => {
    let log = [];

    expect(() => {
      runWithPriority(ImmediatePriority, () => {
        scheduleCallback(() => {
          log.push('A');
          throw new Error('Oops A');
        });
        scheduleCallback(() => {
          log.push('B');
        });
        scheduleCallback(() => {
          log.push('C');
          throw new Error('Oops C');
        });
      });
    }).toThrow('Oops A');

    expect(log).toEqual(['A']);

    log = [];

    // B and C flush in a subsequent event. That way, the second error is not
    // swallowed.
    expect(() => jest.runAllTimers()).toThrow('Oops C');
    expect(log).toEqual(['B', 'C']);
  });
});
