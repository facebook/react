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

const viewConfigs = new Map();

const prefix = 'topsecret-';

const ReactNativeViewConfigRegistry = {
  register(viewConfig : ReactNativeBaseComponentViewConfig) {
    const name = viewConfig.uiViewClassName;
    invariant(
      !viewConfigs.has(name),
      'Tried to register two views with the same name %s',
      name
    );
    const secretName = prefix + name;
    viewConfigs.set(secretName, viewConfig);
    return secretName;
  },
  get(secretName: string) {
    const config = viewConfigs.get(secretName);
    invariant(
      config,
      'View config not found for name %s',
      secretName
    );
    return config;
  },
};

module.exports = ReactNativeViewConfigRegistry;
