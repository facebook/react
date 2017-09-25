/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule getNextDebugID
 * @flow
 */

'use strict';

var nextDebugID = 1;

function getNextDebugID(): number {
  return nextDebugID++;
}

module.exports = getNextDebugID;
