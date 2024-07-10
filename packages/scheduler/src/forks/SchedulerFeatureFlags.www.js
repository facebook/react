/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// $FlowFixMe[cannot-resolve-module]
const dynamicFeatureFlags = require('SchedulerFeatureFlags');

export const {
  userBlockingPriorityTimeout,
  normalPriorityTimeout,
  lowPriorityTimeout,
} = dynamicFeatureFlags;

export const frameYieldMs = 10;
export const enableSchedulerDebugging = true;
export const enableProfiling = __DEV__;
