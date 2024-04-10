/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import {ReactNativeViewConfigRegistry} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';
import {type ViewConfig} from './ReactNativeTypes';

const {register} = ReactNativeViewConfigRegistry;

/**
 * Creates a renderable ReactNative host component.
 * Use this method for view configs that are loaded from UIManager.
 * Use createReactNativeComponentClass() for view configs defined within JavaScript.
 *
 * @param {string} config iOS View configuration.
 * @private
 */
const createReactNativeComponentClass = function (
  name: string,
  callback: () => ViewConfig,
): string {
  return register(name, callback);
};

module.exports = createReactNativeComponentClass;
