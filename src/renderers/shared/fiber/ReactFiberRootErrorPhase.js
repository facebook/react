/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberRootErrorPhase
 * @flow
 */

'use strict';

export type FiberRootErrorPhase = 0 | 1 | 2;

module.exports = {
  NoError: 0,
  SoftDeletion: 1,
  HardDeletion: 2,
};
