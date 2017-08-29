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

import type {
  ReactNativeBaseComponentViewConfig,
  ViewConfigGetter,
} from 'ReactNativeTypes';

const registeredViewNames = new Map();
const viewConfigCallbacks = new Map();
const viewConfigs = new Map();

const ReactNativeViewConfigRegistry = {
  /**
   * Registers a native view/component.
   * This method is intended for views with JavaScript-defined configs.
   * If the config is loaded from UIManager, use registerLazy() instead.
   */
  register(viewConfig: ReactNativeBaseComponentViewConfig) {
    const name = viewConfig.uiViewClassName;
    invariant(
      !registeredViewNames.has(name),
      'Tried to register two views with the same name %s',
      name,
    );
    viewConfigs.set(name, viewConfig);
    registeredViewNames.set(name);
    return name;
  },

  /**
   * Registers a native view/component by name.
   * A callback is provided to load the view config from UIManager.
   * The callback is deferred until the view is actually rendered.
   * This is done to avoid causing Prepack deopts.
   */
  registerLazy(name: string, callback: ViewConfigGetter) {
    invariant(
      !registeredViewNames.has(name),
      'Tried to register two views with the same name %s',
      name,
    );
    viewConfigCallbacks.set(name, callback);
    registeredViewNames.set(name);
    return name;
  },

  get(name: string) {
    let viewConfig;
    if (!viewConfigs.has(name)) {
      const callback = viewConfigCallbacks.get(name);
      invariant(
        typeof callback === 'function',
        'View config not found for name %s',
        name,
      );
      viewConfigCallbacks.set(name, null);
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
