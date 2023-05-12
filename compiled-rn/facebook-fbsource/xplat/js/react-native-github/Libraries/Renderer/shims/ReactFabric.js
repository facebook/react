/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noformat
 * @flow
 * @nolint
 * @generated SignedSource<<c1cc197c110e3a49a5e8f6bd5d32b23f>>
 */

'use strict';

import {BatchedBridge} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

import type {ReactFabricType} from './ReactNativeTypes';

let ReactFabric;

if (__DEV__) {
  ReactFabric = require('../implementations/ReactFabric-dev');
} else {
  ReactFabric = require('../implementations/ReactFabric-prod');
}

global.RN$stopSurface = ReactFabric.stopSurface;

if (global.RN$Bridgeless !== true) {
  BatchedBridge.registerCallableModule('ReactFabric', ReactFabric);
}

module.exports = (ReactFabric: ReactFabricType);
