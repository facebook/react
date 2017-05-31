/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeFeatureFlags
 * @flow
 */

'use strict';

// Read from process.env in order to support Rollup flat bundles.
// Jest test script will also write this value for Fiber tests.
var ReactNativeFeatureFlags = {
  useFiber: process.env.REACT_NATIVE_USE_FIBER,
};

module.exports = ReactNativeFeatureFlags;
