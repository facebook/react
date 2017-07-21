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

export type TypeOfSideEffect = number;

module.exports = {
  // Don't change these two values:
  NoEffect: 0, //           0b00000000
  PerformedWork: 1, //      0b00000001
  // You can change the rest (and add more).
  Placement: 2, //          0b00000010
  Update: 4, //             0b00000100
  PlacementAndUpdate: 6, // 0b00000110
  Deletion: 8, //           0b00001000
  ContentReset: 16, //      0b00010000
  Callback: 32, //          0b00100000
  Err: 64, //               0b01000000
  Ref: 128, //              0b10000000
};
