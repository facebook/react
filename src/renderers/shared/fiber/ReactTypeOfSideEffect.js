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

export type TypeOfSideEffect = 0 | 1 | 2 | 3 | 4;

module.exports = {
  NoEffect: 0,
  Placement: 1,
  Update: 2,
  PlacementAndUpdate: 3,
  Deletion: 4,
};
