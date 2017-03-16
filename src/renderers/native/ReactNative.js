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
var NativeMethodsMixin = require('NativeMethodsMixin');

// TODO (bvaughn) Enable Fiber experiement via ReactNativeFeatureFlags
var ReactNative = ReactNativeStack;

// TODO: unroll the circular dependency
NativeMethodsMixin.__injectReactNative(ReactNative);

ReactNative.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  createReactNativeComponentClass: require('createReactNativeComponentClass'),
  findNodeHandle: require('findNodeHandle'),
  NativeMethodsMixin: require('NativeMethodsMixin'),
  ReactDebugTool: require('ReactDebugTool'),
  ReactErrorUtils: require('ReactErrorUtils'),
  ReactNativeComponentTree: require('ReactNativeComponentTree'),
  ReactNativePropRegistry: require('ReactNativePropRegistry'),
  ReactPerf: require('ReactPerf'),
  TouchHistoryMath: require('TouchHistoryMath'),
};

module.exports = ReactNative;
