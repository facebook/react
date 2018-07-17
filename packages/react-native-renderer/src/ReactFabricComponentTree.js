/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'shared/invariant';

function getInstanceFromInstance(instanceHandle) {
  return instanceHandle;
}

function getTagFromInstance(inst) {
  let tag = inst.stateNode.canonical._nativeTag;
  invariant(tag, 'All native instances should have a tag.');
  return tag;
}

export {
  getInstanceFromInstance as getClosestInstanceFromNode,
  getInstanceFromInstance as getInstanceFromNode,
  getTagFromInstance as getNodeFromInstance,
};

export function getFiberCurrentPropsFromNode(inst) {
  return inst.canonical.currentProps;
}
