/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */
'use strict';

describe('Tracking', () => {
  let SchedulerTracking;

  beforeEach(() => {
    jest.resetModules();

    SchedulerTracking = require('react-scheduler/tracking');
  });

  it('should return the value of a tracked function', () => {
    expect(SchedulerTracking.unstable_track('arbitrary', 0, () => 123)).toBe(
      123,
    );
  });

  it('should return the value of a wrapped function', () => {
    let wrapped;
    SchedulerTracking.unstable_track('arbitrary', 0, () => {
      wrapped = SchedulerTracking.unstable_wrap(() => 123);
    });
    expect(wrapped()).toBe(123);
  });

  it('should execute tracked callbacks', done => {
    SchedulerTracking.unstable_track('some event', 0, () => {
      done();
    });
  });

  it('should return the value of a clear function', () => {
    expect(SchedulerTracking.unstable_clear(() => 123)).toBe(123);
  });

  it('should execute wrapped callbacks', done => {
    const wrappedCallback = SchedulerTracking.unstable_wrap(() => {
      done();
    });

    wrappedCallback();
  });
});
