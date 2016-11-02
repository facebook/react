/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactTypeOfSideEffect
 * @flow
 */

'use strict';

export type TypeOfSideEffect = 0 | 1 | 2 | 3 | 4 | 8 | 9 | 10 | 11 | 12;

module.exports = {
  NoEffect: 0,                          // 0b0000
  Placement: 1,                         // 0b0001
  Update: 2,                            // 0b0010
  PlacementAndUpdate: 3,                // 0b0011
  Deletion: 4,                          // 0b0100
  Callback: 8,                          // 0b1000
  PlacementAndCallback: 9,              // 0b1001
  UpdateAndCallback: 10,                // 0b1010
  PlacementAndUpdateAndCallback: 11,    // 0b1011
  DeletionAndCallback: 12,              // 0b1100
};
