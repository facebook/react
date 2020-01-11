/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let Scheduler;
let scheduleCallback;
let ImmediatePriority;
let UserBlockingPriority;
let NormalPriority;

describe('SchedulerNoDOM', () => {
  // If Scheduler runs in a non-DOM environment, it falls back to a naive
  // implementation using setTimeout. This only meant to be used for testing
  // purposes, like with jest's fake timer API.
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();

    // Un-mock scheduler
    jest.mock('scheduler', () => require.requireActual('scheduler'));
    jest.mock('scheduler/src/SchedulerHostConfig', () =>
      require.requireActual(
        'scheduler/src/forks/SchedulerHostConfig.default.js',
      ),
    );

    Scheduler = require('scheduler');
    scheduleCallback = Scheduler.unstable_scheduleCallback;
    ImmediatePriority = Scheduler.unstable_ImmediatePriority;
    UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
    NormalPriority = Scheduler.unstable_NormalPriority;
  });

  it('runAllTimers flushes all scheduled callbacks', () => {
    let log = [];
    scheduleCallback(NormalPriority, () => {
      log.push('A');
    });
    scheduleCallback(NormalPriority, () => {
      log.push('B');
    });
    scheduleCallback(NormalPriority, () => {
      log.push('C');
    });
    expect(log).toEqual([]);
    jest.runAllTimers();
    expect(log).toEqual(['A', 'B', 'C']);
  });

  it('executes callbacks in order of priority', () => {
    let log = [];

    scheduleCallback(NormalPriority, () => {
      log.push('A');
    });
    scheduleCallback(NormalPriority, () => {
      log.push('B');
    });
    scheduleCallback(UserBlockingPriority, () => {
      log.push('C');
    });
    scheduleCallback(UserBlockingPriority, () => {
      log.push('D');
    });

    expect(log).toEqual([]);
    jest.runAllTimers();
    expect(log).toEqual(['C', 'D', 'A', 'B']);
  });

  it('handles errors', () => {
    let log = [];

    scheduleCallback(ImmediatePriority, () => {
      log.push('A');
      throw new Error('Oops A');
    });
    scheduleCallback(ImmediatePriority, () => {
      log.push('B');
    });
    scheduleCallback(ImmediatePriority, () => {
      log.push('C');
      throw new Error('Oops C');
    });

    expect(() => jest.runAllTimers()).toThrow('Oops A');

    expect(log).toEqual(['A']);

    log = [];

    // B and C flush in a subsequent event. That way, the second error is not
    // swallowed.
    expect(() => jest.runAllTimers()).toThrow('Oops C');
    expect(log).toEqual(['B', 'C']);
  });
});
