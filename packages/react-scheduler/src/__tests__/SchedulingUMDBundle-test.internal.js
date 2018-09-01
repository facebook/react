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

  function compareAPIS(apis) {
    apis = apis.map(api => Object.keys(api).sort());
    for (let i = 1; i < apis.length; i++) {
      expect(apis[0]).toEqual(apis[i]);
    }
  }

  it('should define the same scheduling API', () => {
    const umdAPIDev = require('../../npm/umd/react-scheduler.development');
    const umdAPIProd = require('../../npm/umd/react-scheduler.production.min');
    const cjsAPI = require('../../index');
    const secretAPI = require('react/src/ReactSharedInternals').default;
    compareAPIS([umdAPIDev, umdAPIProd, cjsAPI, secretAPI.Scheduler]);
  });

  it('should define the same tracking API', () => {
    const umdAPIDev = require('../../npm/umd/react-scheduler-tracking.development');
    const umdAPIProd = require('../../npm/umd/react-scheduler-tracking.production.min');
    const cjsAPI = require('../../tracking');
    const secretAPI = require('react/src/ReactSharedInternals').default;
    compareAPIS([umdAPIDev, umdAPIProd, cjsAPI, secretAPI.SchedulerTracking]);
  });
});
