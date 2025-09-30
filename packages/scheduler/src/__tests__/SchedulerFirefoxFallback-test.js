/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let Scheduler;
let scheduleCallback;
let NormalPriority;

describe('SchedulerFirefoxFallback', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();

    // Simulate Firefox user agent before importing scheduler
    global.navigator = {userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/120.0'};

    // Provide a MessageChannel implementation that would be used in other browsers
    // and record if it gets instantiated.
    let instantiated = false;
    function MockPort() {}
    MockPort.prototype.postMessage = function () {};
    function MockMessageChannel() {
      instantiated = true;
      this.port1 = {};
      this.port2 = new MockPort();
    }
    Object.defineProperty(MockMessageChannel.prototype, 'instantiated', {
      get() {
        return instantiated;
      },
    });

    global.MessageChannel = MockMessageChannel;

    jest.unmock('scheduler');
    Scheduler = require('scheduler');
    scheduleCallback = Scheduler.unstable_scheduleCallback;
    NormalPriority = Scheduler.unstable_NormalPriority;

    // Expose the flag for assertions
    global.__messageChannelInstantiated = instantiated;
  });

  afterEach(() => {
    delete global.navigator;
    delete global.MessageChannel;
    delete global.__messageChannelInstantiated;
  });

  it('falls back to setTimeout in Firefox even when MessageChannel is available', () => {
    const log = [];

    scheduleCallback(NormalPriority, () => {
      log.push('ran');
    });

    // Should not run synchronously; requires timers to advance
    expect(log).toEqual([]);

    // If MessageChannel had been used, callback would have been scheduled
    // without advancing Jest fake timers. Ensure we need to advance timers.
    jest.runOnlyPendingTimers();
    expect(log).toEqual(['ran']);
  });
});


