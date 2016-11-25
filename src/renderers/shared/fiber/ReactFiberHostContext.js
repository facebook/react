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

// All host instances.
const parentStack : Array = [];
let parentIndex = -1;

// Just the container instances (e.g. DOM uses this for SVG).
const containerStack : Array = [];
let containerIndex = -1;

// TODO: this is all likely broken with portals.

exports.getHostParentOnStack = function() : mixed | null {
  if (parentIndex === -1) {
    return null;
  }
  return parentStack[parentIndex];
};

exports.pushHostParent = function(instance : mixed) : void {
  parentIndex++;
  parentStack[parentIndex] = instance;
};

exports.popHostParent = function() {
  parentStack[parentIndex] = null;
  parentIndex--;
};

exports.getHostContainerOnStack = function() : mixed | null {
  if (containerIndex === -1) {
    return null;
  }
  return containerStack[containerIndex];
};

exports.getRootHostContainerOnStack = function() : Fiber | null {
  if (containerIndex === -1) {
    return null;
  }
  return containerStack[0];
};

exports.pushHostContainer = function(instance : mixed) : void {
  containerIndex++;
  containerStack[containerIndex] = instance;
};

exports.popHostContainer = function() {
  containerStack[containerIndex] = null;
  containerIndex--;
};

exports.resetHostStacks = function() {
  currentRootFiber = null;
  parentIndex = -1;
  containerIndex = -1;
};
