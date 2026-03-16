/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noformat
 * @nolint
 * @flow
 */
'use strict';

import type {ReactNativeType} from './ReactNativeTypes';

let ReactNative: ReactNativeType;

// TODO: Delete the legacy renderer. Only ReactFabric is used now.
if (__DEV__) {
  ReactNative = require('../implementations/ReactNativeRenderer-dev');
} else {
  ReactNative = require('../implementations/ReactNativeRenderer-prod');
}

export default ReactNative;
