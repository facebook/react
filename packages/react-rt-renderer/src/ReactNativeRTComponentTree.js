/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactFiber';

const instanceCache: {[key: number]: Fiber} = {};
const instanceProps: {[key: number]: Object} = {};

export function precacheFiberNode(fiber: Fiber, tag: number): void {
  instanceCache[tag] = fiber;
}

export function getFiberFromTag(tag: number): null | Fiber {
  return instanceCache[tag] || null;
}

export function uncacheFiberNode(tag: number): void {
  delete instanceCache[tag];
  delete instanceProps[tag];
}

export function getFiberCurrentPropsFromTag(tag: number): null | Object {
  return instanceProps[tag] || null;
}

export function updateFiberProps(tag: number, props: Object): void {
  instanceProps[tag] = props;
}
