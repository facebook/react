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

describe('ReactTracing', () => {
  it('should error if profiling renderer and non-profiling schedule/tracing bundles are combined', () => {
    jest.resetModules();

    const ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableSchedulerTracing = false;

    require('scheduler/tracing');

    ReactFeatureFlags.enableSchedulerTracing = true;

    expect(() => require('react-dom')).toThrow(
      'Learn more at http://fb.me/react-profiling',
    );
  });
});
