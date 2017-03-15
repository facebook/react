/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNative
 */
'use strict';

var ReactNativeStack = require('ReactNativeStack');

// TODO (bvaughn) Enable Fiber experiement via ReactNativeFeatureFlags
var ReactNative = ReactNativeStack;

ReactNative.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  ReactNativePropRegistry: require('ReactNativePropRegistry'),
};

module.exports = ReactNative;
