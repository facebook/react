/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule createReactNativeComponentClass
 * @flow
 */

'use strict';

const ReactNativeFeatureFlags = require('ReactNativeFeatureFlags');

// See also ReactNativeBaseComponent
export type ReactNativeBaseComponentViewConfig = {
  validAttributes: Object,
  uiViewClassName: string,
  propTypes?: Object,
};

module.exports = ReactNativeFeatureFlags.useFiber
  ? require('createReactNativeComponentClassFiber')
  : require('createReactNativeComponentClassStack');
