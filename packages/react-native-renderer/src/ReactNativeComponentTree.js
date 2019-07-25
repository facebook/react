/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'shared/invariant';

const instanceCache = new Map();
const instanceProps = new Map();

export function precacheFiberNode(hostInst, tag) {
  instanceCache.set(tag, hostInst);
}

export function uncacheFiberNode(tag) {
  instanceCache.delete(tag);
  instanceProps.delete(tag);
}

function getInstanceFromTag(tag) {
  return instanceCache.get(tag) || null;
}

function getTagFromInstance(inst) {
  let tag = inst.stateNode._nativeTag;
  if (tag === undefined) {
    tag = inst.stateNode.canonical._nativeTag;
  }
  invariant(tag, 'All native instances should have a tag.');
  return tag;
}

export {
  getInstanceFromTag as getClosestInstanceFromNode,
  getInstanceFromTag as getInstanceFromNode,
  getTagFromInstance as getNodeFromInstance,
};

export function getFiberCurrentPropsFromNode(stateNode) {
  return instanceProps.get(stateNode._nativeTag) || null;
}

export function updateFiberProps(tag, props) {
  instanceProps.set(tag, props);
}
