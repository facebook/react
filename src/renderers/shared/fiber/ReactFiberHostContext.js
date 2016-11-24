/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberHostContext
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';

// Root we're working on.
let currentRootFiber = null;

// All host fibers.
const hostStack : Array<Fiber | null> = [];
let hostIndex = -1;

// Just the container host fibers (e.g. DOM uses this for SVG).
const hostContainerStack : Array<Fiber | null> = [];
let hostContainerIndex = -1;

exports.getCurrentRoot = function() : Fiber | null {
  return currentRootFiber;
};

exports.setCurrentRoot = function(rootFiber : Fiber) {
  currentRootFiber = rootFiber;
};

exports.resetCurrentRoot = function() {
  currentRootFiber = null;
};

exports.getHostFiberOnStack = function() : Fiber | null {
  if (hostIndex === -1) {
    return null;
  }
  return hostStack[hostIndex];
};

exports.pushHostFiber = function(fiber : Fiber) : void {
  hostIndex++;
  hostStack[hostIndex] = fiber;
};

exports.popHostFiber = function() {
  hostStack[hostIndex] = null;
  hostIndex--;
};

exports.getHostContainerOnStack = function() : Fiber | null {
  if (hostContainerIndex === -1) {
    return null;
  }
  return hostContainerStack[hostContainerIndex];
};

exports.pushHostContainer = function(fiber : Fiber) : void {
  hostContainerIndex++;
  hostContainerStack[hostContainerIndex] = fiber;
};

exports.popHostContainer = function() {
  hostContainerStack[hostContainerIndex] = null;
  hostContainerIndex--;
};

exports.resetHostFiberStacks = function() {
  currentRootFiber = null;
  hostIndex = -1;
  hostContainerIndex = -1;
};
