/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNative
 * @flow
 */
'use strict';

import type {ReactNativeType} from 'ReactNativeTypes';

let ReactNative;

if (__DEV__) {
  ReactNative = require('ReactNativeFiber-dev');
} else {
  ReactNative = require('ReactNativeFiber-prod');
}

module.exports = (ReactNative: ReactNativeType);
