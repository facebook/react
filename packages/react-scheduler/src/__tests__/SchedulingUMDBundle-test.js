/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */
'use strict';

describe('Scheduling UMD bundle', () => {
  beforeEach(() => {
    // Fool SECRET_INTERNALS object into including UMD forwarding methods.
    global.__UMD__ = true;

    jest.resetModules();
  });

  it('should define the same scheduling API', () => {
    const umdAPI = require('../../npm/umd/react-scheduler');
    const cjsAPI = require('../../index');
    const secretInternalsAPI = require('react/src/ReactSharedInternals')
      .default;
    expect(Object.keys(umdAPI).sort()).toEqual(Object.keys(cjsAPI).sort());
    expect(Object.keys(umdAPI).sort()).toEqual(
      Object.keys(secretInternalsAPI.Scheduler).sort(),
    );
  });

  it('should define the same tracking API', () => {
    const umdAPI = require('../../npm/umd/react-scheduler-tracking');
    const cjsAPI = require('../../tracking');
    const secretInternalsAPI = require('react/src/ReactSharedInternals')
      .default;
    expect(Object.keys(umdAPI).sort()).toEqual(Object.keys(cjsAPI).sort());
    expect(Object.keys(umdAPI).sort()).toEqual(
      Object.keys(secretInternalsAPI.SchedulerTracking).sort(),
    );
  });
});
