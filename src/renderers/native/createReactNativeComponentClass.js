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

const ReactNativeViewConfigRegistry = require('ReactNativeViewConfigRegistry');

// See also ReactNativeBaseComponent
export type ReactNativeBaseComponentViewConfig = {
  validAttributes: Object,
  uiViewClassName: string,
  propTypes?: Object,
};

/**
 * @param {string} config iOS View configuration.
 * @private
 */
const createReactNativeComponentClass = function(
  viewConfig: ReactNativeBaseComponentViewConfig,
): string {
  return ReactNativeViewConfigRegistry.register(viewConfig);
};

module.exports = createReactNativeComponentClass;
