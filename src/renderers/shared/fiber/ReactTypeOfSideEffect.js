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

export type TypeOfSideEffect =
  0 | 1 | 2 | 3 | 4 | 8 | 9 | 10 | 11 | 12 | 16 | 17 | 18 | 19 | 20 | 24 | 25 |
  26 | 27 | 28;

module.exports = {
  NoEffect: 0,                                // 0b00000
  Placement: 1,                               // 0b00001
  Update: 2,                                  // 0b00010
  PlacementAndUpdate: 3,                      // 0b00011
  Deletion: 4,                                // 0b00100
  Callback: 8,                                // 0b01000
  PlacementAndCallback: 9,                    // 0b01001
  UpdateAndCallback: 10,                      // 0b01010
  PlacementAndUpdateAndCallback: 11,          // 0b01011
  DeletionAndCallback: 12,                    // 0b01100
  Err: 16,                                    // 0b10000
  PlacementAndErr: 17,                        // 0b10001
  UpdateAndErr: 18,                           // 0b10010
  PlacementAndUpdateAndErr: 19,               // 0b10011
  DeletionAndErr: 20,                         // 0b10100
  CallbackAndErr: 24,                         // 0b11000
  PlacementAndCallbackAndErr: 25,             // 0b11001
  UpdateAndCallbackAndErr: 26,                // 0b11010
  PlacementAndUpdateAndCallbackAndErr: 27,    // 0b11011
  DeletionAndCallbackAndErr: 28,              // 0b11100
};
