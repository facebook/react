/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactTypeOfSideEffect
 * @flow
 */

'use strict';

export type TypeOfSideEffect = number;

module.exports = {
  NoEffect: 0, //            0b0000000000

  // Read by the React DevTools. Don't change!
  PerformedWork: 1, //       0b0000000001
  // Indicates the work completed and needs to be garbage collected. This needs
  // to be its own field so we can tell when work is completed multiple times.
  PreparedWork: 2, //        0b0000000010
  // Indicates the subtree contains work that needs to be garbage collected.
  NeedsCleanUp: 4, //        0b0000000100

  // The preceding fields should be disregarded when adding work to the effect
  // list. Only add to effect list if effectTag > InsigificantBits
  InsigificantBits: 7, //    0b0000000111

  Placement: 8, //           0b0000001000
  Update: 16, //             0b0000010000
  PlacementAndUpdate: 24, // 0b0000011000
  Deletion: 32, //           0b0000100000
  ContentReset: 64, //       0b0001000000
  Callback: 128, //          0b0010000000
  Err: 256, //               0b0100000000
  Ref: 512, //               0b1000000000
};
