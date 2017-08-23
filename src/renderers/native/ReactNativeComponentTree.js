/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeComponentTree
 */

'use strict';

import invariant from 'fbjs/lib/invariant';

var instanceCache = {};
var instanceProps = {};

export function precacheFiberNode(hostInst, tag) {
  instanceCache[tag] = hostInst;
}

export function uncacheFiberNode(tag) {
  delete instanceCache[tag];
  delete instanceProps[tag];
}

export function getInstanceFromNode(tag) {
  return instanceCache[tag] || null;
}

export const getClosestInstanceFromNode = getInstanceFromNode;

export function getNodeFromInstance(inst) {
  var tag = inst.stateNode._nativeTag;
  invariant(tag, 'All native instances should have a tag.');
  return tag;
}

export function getFiberCurrentPropsFromNode(stateNode) {
  return instanceProps[stateNode._nativeTag] || null;
}

export function updateFiberProps(tag, props) {
  instanceProps[tag] = props;
}
