/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactTypeOfWork
 * @flow
 */

'use strict';

export type TypeOfWork = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

module.exports = {
  FunctionalComponent: 0,
  ClassComponent: 1,
  HostContainer: 2, // Root of a host tree. Could be nested inside another node.
  HostComponent: 3,
  HostText: 4,
  CoroutineComponent: 5,
  CoroutineHandlerPhase: 6,
  YieldComponent: 7,
  Fragment: 8,
};
