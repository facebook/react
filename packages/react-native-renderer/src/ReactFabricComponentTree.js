/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function getInstanceFromInstance(instanceHandle) {
  return instanceHandle;
}

function getTagFromInstance(inst) {
  const nativeInstance = inst.stateNode.canonical;

  if (!nativeInstance._nativeTag) {
    throw new Error('All native instances should have a tag.');
  }

  return nativeInstance;
}

export {
  getInstanceFromInstance as getClosestInstanceFromNode,
  getInstanceFromInstance as getInstanceFromNode,
  getTagFromInstance as getNodeFromInstance,
};

export function getFiberCurrentPropsFromNode(inst) {
  return inst.canonical.currentProps;
}
