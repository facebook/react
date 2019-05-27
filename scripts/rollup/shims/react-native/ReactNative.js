/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {ReactNativeType} from 'ReactNativeTypes';

let ReactNative;

if (__DEV__) {
  ReactNative = require('ReactNativeRenderer-dev');
} else {
  ReactNative = require('ReactNativeRenderer-prod');
}

module.exports = (ReactNative: ReactNativeType);
