/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactFabric
 * @flow
 */
'use strict';

// TODO @sema: Adjust types
import type {ReactNativeType} from 'ReactNativeTypes';

let ReactFabric;

if (__DEV__) {
  ReactFabric = require('ReactFabric-dev');
} else {
  ReactFabric = require('ReactFabric-prod');
}

module.exports = (ReactFabric: ReactNativeType);
