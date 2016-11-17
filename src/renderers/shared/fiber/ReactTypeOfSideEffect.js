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

export type TypeOfSideEffect = 0 | 1 | 2 | 3 | 4 | 8 | 16;

module.exports = {
  NoEffect: 0,                                // 0b00000
  Placement: 1,                               // 0b00001
  Update: 2,                                  // 0b00010
  PlacementAndUpdate: 3,                      // 0b00011
  Deletion: 4,                                // 0b00100
  Callback: 8,                                // 0b01000
  Err: 16,                                    // 0b10000
};
