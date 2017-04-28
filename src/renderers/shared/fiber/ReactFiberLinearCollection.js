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

export type FiberMap<T> = Map<Fiber, T>;

export type FiberSet = Set<Fiber>;

function createFiberMap() {
  return new Map();
}
exports.createFiberMap = createFiberMap;

function fiberMapHas<T>(map: FiberMap<T>, fiber: Fiber): boolean {
  return map.has(fiber) || (fiber.alternate !== null && map.has(fiber.alternate));
}
exports.fiberMapHas = fiberMapHas;

function fiberMapSet<T>(map: FiberMap<T>, fiber: Fiber, value: T) {
  if (fiberMapHas(map, fiber)) {
    return;
  }
  map.set(fiber, value);
}
exports.fiberMapSet = fiberMapSet;

function fiberMapGet<T>(map: FiberMap<T>, fiber: Fiber): T | void {
  if (map.has(fiber)) {
    return map.get(fiber);
  } else if (fiber.alternate !== null) {
    return map.get(fiber.alternate);
  }
}
exports.fiberMapGet = fiberMapGet;

function fiberMapSize<T>(map: FiberMap<T>): number {
  return map.size;
}
exports.fiberMapSize = fiberMapSize;

function fiberMapDelete<T>(map: FiberMap<T>, fiber: Fiber) {
  if (map.has(fiber)) {
    map.delete(fiber);
  } else if (fiber.alternate !== null) {
    map.delete(fiber.alternate);
  }
}
exports.fiberMapDelete = fiberMapDelete;

function createFiberSet() : FiberSet {
  return new Set();
}
exports.createFiberSet = createFiberSet;

function fiberSetHas(set: FiberSet, fiber: Fiber) : boolean {
  return set.has(fiber) || (fiber.alternate !== null && set.has(fiber.alternate));
}
exports.fiberSetHas = fiberSetHas;

function fiberSetAdd(set: FiberSet, fiber: Fiber) {
  if (!fiberSetHas(set, fiber)) {
    set.add(fiber);
  }
}
exports.fiberSetAdd = fiberSetAdd;
