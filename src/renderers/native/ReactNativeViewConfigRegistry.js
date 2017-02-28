/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeViewConfigRegistry
 * @flow
 */

'use strict';

const invariant = require('invariant');

export type ReactNativeBaseComponentViewConfig = {
  validAttributes: Object,
  uiViewClassName: string,
  propTypes?: Object,
};

const viewConfigs = new Map();

const ReactNativeViewConfigRegistry = {
  register(viewConfig : ReactNativeBaseComponentViewConfig) {
    const uiViewClassName = viewConfig.uiViewClassName;
    invariant(
      !viewConfigs.has(uiViewClassName),
      'Tried to register two views with the same name %s',
      uiViewClassName
    );
    viewConfigs.set(uiViewClassName, viewConfig);
    return uiViewClassName;
  },
  get(uiViewClassName: string) {
    const config = viewConfigs.get(uiViewClassName);
    invariant(
      config,
      'View config not found for name %s',
      uiViewClassName
    );
    return config;
  },
};

module.exports = ReactNativeViewConfigRegistry;
