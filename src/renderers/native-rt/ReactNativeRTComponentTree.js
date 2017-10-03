/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNativeRTComponentTree
 * @flow
 */

'use strict';

import type {Fiber} from 'ReactFiber';

var instanceCache: {[key: number]: Fiber} = {};
var instanceProps: {[key: number]: Object} = {};

function precacheFiberNode(fiber: Fiber, tag: number): void {
  instanceCache[tag] = fiber;
}

function getFiberFromTag(tag: number): null | Fiber {
  return instanceCache[tag] || null;
}

function uncacheFiberNode(tag: number): void {
  delete instanceCache[tag];
  delete instanceProps[tag];
}

function getFiberCurrentPropsFromTag(tag: number): null | Object {
  return instanceProps[tag] || null;
}

function updateFiberProps(tag: number, props: Object): void {
  instanceProps[tag] = props;
}

var ReactNativeRTComponentTree = {
  precacheFiberNode,
  uncacheFiberNode,
  getFiberFromTag,
  getFiberCurrentPropsFromTag,
  updateFiberProps,
};

module.exports = ReactNativeRTComponentTree;
