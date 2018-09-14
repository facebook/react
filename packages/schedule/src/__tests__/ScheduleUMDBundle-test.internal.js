/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

  function filterPrivateKeys(name) {
    return !name.startsWith('_');
  }

  function validateForwardedAPIs(api, forwardedAPIs) {
    const apiKeys = Object.keys(api)
      .filter(filterPrivateKeys)
      .sort();
    forwardedAPIs.forEach(forwardedAPI => {
      expect(
        Object.keys(forwardedAPI)
          .filter(filterPrivateKeys)
          .sort(),
      ).toEqual(apiKeys);
    });
  }

  it('should define the same scheduling API', () => {
    const api = require('../../index');
    const umdAPIDev = require('../../npm/umd/schedule.development');
    const umdAPIProd = require('../../npm/umd/schedule.production.min');
    const umdAPIProfiling = require('../../npm/umd/schedule.profiling.min');
    const secretAPI = require('react/src/ReactSharedInternals').default;
    validateForwardedAPIs(api, [
      umdAPIDev,
      umdAPIProd,
      umdAPIProfiling,
      secretAPI.Schedule,
    ]);
  });

  it('should define the same tracing API', () => {
    const api = require('../../tracing');
    const umdAPIDev = require('../../npm/umd/schedule-tracing.development');
    const umdAPIProd = require('../../npm/umd/schedule-tracing.production.min');
    const umdAPIProfiling = require('../../npm/umd/schedule-tracing.profiling.min');
    const secretAPI = require('react/src/ReactSharedInternals').default;
    validateForwardedAPIs(api, [
      umdAPIDev,
      umdAPIProd,
      umdAPIProfiling,
      secretAPI.ScheduleTracing,
    ]);
  });
});
