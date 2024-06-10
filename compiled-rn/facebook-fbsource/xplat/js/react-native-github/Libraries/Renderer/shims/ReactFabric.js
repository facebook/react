/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noformat
 * @nolint
 * @flow
 * @generated SignedSource<<bb39e39880fecbf572b5f8e7c2a95c5d>>
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
