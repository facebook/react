/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getDebugID
 * @flow
 */

'use strict';

let nextDebugID = 1;
let debugIDs = null;

function getDebugID(instanceOrFiber) {
  if (__DEV__) {
    if (typeof instanceOrFiber.tag !== 'number') {
      return instanceOrFiber._debugID;
    }
    const fiber = instanceOrFiber;
    debugIDs = debugIDs || new WeakMap();
    if (debugIDs.has(fiber)) {
      return debugIDs.get(fiber);
    }
    if (fiber.alternate) {
      if (debugIDs.has(fiber.alternate)) {
        const debugID = debugIDs.get(fiber.alternate);
        debugIDs.set(fiber, debugID);
        return debugID;
      }
    }
    const debugID = nextDebugID++;
    debugIDs.set(fiber, debugID);
    if (fiber.alternate) {
      debugIDs.set(fiber.alternate, debugID);
    }
    return debugID;
  }
  return 0;
}

module.exports = getDebugID;
