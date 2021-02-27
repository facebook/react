/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var _require = require('./ReactFiber'),
    createHostContainerFiber = _require.createHostContainerFiber;

exports.createFiberRoot = function (containerInfo) {
  // Cyclic construction. This cheats the type system right now because
  // stateNode is any.
  var uninitializedFiber = createHostContainerFiber();
  var root = {
    current: uninitializedFiber,
    containerInfo: containerInfo,
    isScheduled: false,
    nextScheduledRoot: null
  };
  uninitializedFiber.stateNode = root;
  return root;
};