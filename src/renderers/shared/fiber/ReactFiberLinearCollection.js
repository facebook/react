/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberLinearCollection
 * @flow
 */

'use strict';

import type {Fiber} from 'ReactFiber';

// A special Map type where the keys are fibers and fiber alternates are treated
// as equal. Example:
//
//   fiberMapSet(fiberMap, fiber, value);
//   assert(value === fiberMapGet(fiberMap, fiber.alternate));
//
// We use arrays instead of native maps because most Map polyfills work by
// adding a private field to the key type, which causes a de-opt.
//
// Right now, we're only using this to keep track of failed error boundaries,
// where it's expected that the size of collection is small.
export type FiberMap<T> = {|
  keys: Array<Fiber>,
  values: Array<T>,
|};

// Set version of FiberMap
export type FiberSet = Array<Fiber>;

// Returns true a and b are equal OR if they are alternates
function fiberEquals(a: Fiber, b: Fiber) {
  return a === b || (a.alternate !== null && a.alternate === b);
}

function createFiberMap() {
  return {
    keys: [],
    values: [],
  };
}
exports.createFiberMap = createFiberMap;

function fiberMapHas<T>(map: FiberMap<T>, fiber: Fiber): boolean {
  for (let i = 0; i < map.keys.length; i++) {
    const key = map.keys[i];
    if (fiberEquals(key, fiber)) {
      return true;
    }
  }
  return false;
}
exports.fiberMapHas = fiberMapHas;

function fiberMapSet<T>(map: FiberMap<T>, fiber: Fiber, value: T) {
  let index = map.keys.length;
  for (let i = 0; i < map.keys.length; i++) {
    const key = map.keys[i];
    if (fiberEquals(key, fiber)) {
      index = i;
      break;
    }
  }
  map.keys[index] = fiber;
  map.values[index] = value;
}
exports.fiberMapSet = fiberMapSet;

function fiberMapGet<T>(map: FiberMap<T>, fiber: Fiber): T | void {
  for (let i = 0; i < map.keys.length; i++) {
    const key = map.keys[i];
    if (fiberEquals(key, fiber)) {
      return map.values[i];
    }
  }
}
exports.fiberMapGet = fiberMapGet;

function fiberMapSize<T>(map: FiberMap<T>): number {
  return map.keys.length;
}
exports.fiberMapSize = fiberMapSize;

function fiberMapDelete<T>(map: FiberMap<T>, fiber: Fiber) {
  let index = null;
  for (let i = 0; i < map.keys.length; i++) {
    const key = map.keys[i];
    if (fiberEquals(key, fiber)) {
      index = i;
    }
  }
  if (index === null) {
    return;
  }
  map.keys.splice(index, 1);
  map.values.splice(index, 1);
}
exports.fiberMapDelete = fiberMapDelete;

function createFiberSet(): FiberSet {
  return [];
}
exports.createFiberSet = createFiberSet;

function fiberSetHas(set: FiberSet, fiber: Fiber): boolean {
  for (let i = 0; i < set.length; i++) {
    const item = set[i];
    if (fiberEquals(item, fiber)) {
      return true;
    }
  }
  return false;
}
exports.fiberSetHas = fiberSetHas;

function fiberSetAdd(set: FiberSet, fiber: Fiber) {
  if (fiberSetHas(set, fiber)) {
    return;
  }
  set.push(fiber);
}
exports.fiberSetAdd = fiberSetAdd;
