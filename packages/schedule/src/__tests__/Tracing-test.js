/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */
'use strict';

describe('Tracing', () => {
  let SchedulerTracing;

  beforeEach(() => {
    jest.resetModules();

    SchedulerTracing = require('schedule/tracing');
  });

  it('should return the value of a traced function', () => {
    expect(SchedulerTracing.unstable_trace('arbitrary', 0, () => 123)).toBe(
      123,
    );
  });

  it('should return the value of a wrapped function', () => {
    let wrapped;
    SchedulerTracing.unstable_trace('arbitrary', 0, () => {
      wrapped = SchedulerTracing.unstable_wrap(() => 123);
    });
    expect(wrapped()).toBe(123);
  });

  it('should execute traced callbacks', done => {
    SchedulerTracing.unstable_trace('some event', 0, () => {
      done();
    });
  });

  it('should return the value of a clear function', () => {
    expect(SchedulerTracing.unstable_clear(() => 123)).toBe(123);
  });

  it('should execute wrapped callbacks', done => {
    const wrappedCallback = SchedulerTracing.unstable_wrap(() => {
      done();
    });

    wrappedCallback();
  });
});
