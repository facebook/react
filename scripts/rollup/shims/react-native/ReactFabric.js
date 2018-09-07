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

const BatchedBridge = require('BatchedBridge');

// TODO @sema: Adjust types
import type {ReactNativeType} from 'ReactNativeTypes';

let ReactFabric;

if (__DEV__) {
  ReactFabric = require('ReactFabric-dev');
} else {
  ReactFabric = require('ReactFabric-prod');
}

BatchedBridge.registerCallableModule('ReactFabric', ReactFabric);

module.exports = (ReactFabric: ReactNativeType);
