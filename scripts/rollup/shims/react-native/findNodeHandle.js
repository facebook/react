/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule findNodeHandle
 * @flow
 */

'use strict';

// While ReactNative renderer bundle is initializing, some
// code (e.g. UIManager) imports from ReactNative.

// We use an indirection to avoid a circular dependency.

let realFindNodeHandle = null;

function findNodeHandle(componentOrHandle: any): ?number {
  if (realFindNodeHandle === null) {
    realFindNodeHandle = require('ReactNative').__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.findNodeHandle;
  }
  return realFindNodeHandle(componentOrHandle);
}

module.exports = findNodeHandle;
