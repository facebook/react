/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
