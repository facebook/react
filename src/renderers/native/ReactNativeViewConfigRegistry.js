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

const invariant = require('fbjs/lib/invariant');

export type ReactNativeBaseComponentViewConfig = {
  validAttributes: Object,
  uiViewClassName: string,
  propTypes?: Object,
};

const lazyViewConfigs = new Map();
const views = new Map();
const viewConfigs = new Map();

const ReactNativeViewConfigRegistry = {
  register(viewConfig: ReactNativeBaseComponentViewConfig) {
    const name = viewConfig.uiViewClassName;
    invariant(
      !views.has(name),
      'Tried to register two views with the same name %s',
      name,
    );
    viewConfigs.set(name, viewConfig);
    views.set(name);
    return name;
  },
  registerLazy(name: string, callback: () => ReactNativeBaseComponentViewConfig) {
    invariant(
      !views.has(name),
      'Tried to register two views with the same name %s',
      name,
    );
    lazyViewConfigs.set(name, callback);
    views.set(name);
    return name;
  },
  get(name: string) {
    let viewConfig;
    if (!viewConfigs.has(name)) {
      const callback = lazyViewConfigs.get(name);
      viewConfig = callback();
      viewConfigs.set(name, viewConfig);
    } else {
      viewConfig = viewConfigs.get(name);
    }
    invariant(viewConfig, 'View config not found for name %s', name);
    return viewConfig;
  },
};

module.exports = ReactNativeViewConfigRegistry;