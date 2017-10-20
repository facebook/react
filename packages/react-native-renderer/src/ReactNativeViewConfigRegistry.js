/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const invariant = require('fbjs/lib/invariant');

import type {
  ReactNativeBaseComponentViewConfig,
  ViewConfigGetter,
} from './ReactNativeTypes';

const viewConfigCallbacks = new Map();
const viewConfigs = new Map();

const ReactNativeViewConfigRegistry = {
  /**
   * Registers a native view/component by name.
   * A callback is provided to load the view config from UIManager.
   * The callback is deferred until the view is actually rendered.
   * This is done to avoid causing Prepack deopts.
   */
  register(name: string, callback: ViewConfigGetter): string {
    invariant(
      !viewConfigCallbacks.has(name),
      'Tried to register two views with the same name %s',
      name,
    );
    viewConfigCallbacks.set(name, callback);
    return name;
  },

  /**
   * Retrieves a config for the specified view.
   * If this is the first time the view has been used,
   * This configuration will be lazy-loaded from UIManager.
   */
  get(name: string): ReactNativeBaseComponentViewConfig {
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
