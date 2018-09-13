/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

describe('ReactTracking', () => {
  it('should error if profiling renderer and non-profiling schedule/tracking bundles are combined', () => {
    jest.resetModules();

    const ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableSchedulerTracking = false;

    require('schedule/tracking');

    ReactFeatureFlags.enableSchedulerTracking = true;

    expect(() => require('react-dom')).toThrow(
      'Learn more at http://fb.me/react-profiling',
    );
  });
});
