/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

module.exports = {
  IndeterminateComponent: 0, // Before we know whether it is functional or class
  FunctionalComponent: 1,
  ClassComponent: 2,
  HostContainer: 3, // Root of a host tree. Could be nested inside another node.
  HostComponent: 4,
  CoroutineComponent: 5,
  CoroutineHandlerPhase: 6,
  YieldComponent: 7
};