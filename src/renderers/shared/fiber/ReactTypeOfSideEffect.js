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

export type TypeOfSideEffect = 0 | 1 | 2 | 3 | 4 | 8 | 16 | 32 | 64;

module.exports = {
  NoEffect: 0,                                // 0b0000000
  Placement: 1,                               // 0b0000001
  Update: 2,                                  // 0b0000010
  PlacementAndUpdate: 3,                      // 0b0000011
  Deletion: 4,                                // 0b0000100
  ContentReset: 8,                            // 0b0001000
  Callback: 16,                               // 0b0010000
  Err: 32,                                    // 0b0100000
  Ref: 64,                                    // 0b1000000
};
