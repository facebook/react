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

  function validateForwardedAPIs(api, forwardedAPIs) {
    const apiKeys = Object.keys(api).sort();
    forwardedAPIs.forEach(forwardedAPI => {
      expect(Object.keys(forwardedAPI).sort()).toEqual(apiKeys);
    });
  }

  it('should define the same scheduling API', () => {
    const api = require('../../index');
    const umdAPIDev = require('../../npm/umd/schedule.development');
    const umdAPIProd = require('../../npm/umd/schedule.production.min');
    const secretAPI = require('react/src/ReactSharedInternals').default;
    validateForwardedAPIs(api, [umdAPIDev, umdAPIProd, secretAPI.Scheduler]);
  });

  it('should define the same tracking API', () => {
    const api = require('../../tracking');
    const umdAPIDev = require('../../npm/umd/schedule-tracking.development');
    const umdAPIProd = require('../../npm/umd/schedule-tracking.production.min');
    const secretAPI = require('react/src/ReactSharedInternals').default;
    validateForwardedAPIs(api, [
      umdAPIDev,
      umdAPIProd,
      secretAPI.SchedulerTracking,
    ]);
  });
});
