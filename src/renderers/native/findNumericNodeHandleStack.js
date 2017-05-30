/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule findNumericNodeHandleStack
 * @flow
 */
'use strict';

var findNodeHandle = require('findNodeHandle');

/**
 * External users of findNodeHandle() expect the host tag number return type.
 * The injected findNodeHandle() strategy returns the instance wrapper though.
 * See NativeMethodsMixin#setNativeProps for more info on why this is done.
 */
module.exports = function findNumericNodeHandleStack(
  componentOrHandle: any,
): ?number {
  const nodeHandle = findNodeHandle(componentOrHandle);
  if (nodeHandle == null || typeof nodeHandle === 'number') {
    return nodeHandle;
  }
  return nodeHandle.getHostNode();
};
