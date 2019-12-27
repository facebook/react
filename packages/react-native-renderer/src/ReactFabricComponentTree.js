/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'shared/invariant';

import {enableNativeTargetAsInstance} from 'shared/ReactFeatureFlags';

function getInstanceFromInstance(instanceHandle) {
  return instanceHandle;
}

function getTagFromInstance(inst) {
  if (enableNativeTargetAsInstance) {
    let nativeInstance = inst.stateNode.canonical;
    invariant(
      nativeInstance._nativeTag,
      'All native instances should have a tag.',
    );
    return nativeInstance;
  } else {
    let tag = inst.stateNode.canonical._nativeTag;
    invariant(tag, 'All native instances should have a tag.');
    return tag;
  }
}

export {
  getInstanceFromInstance as getClosestInstanceFromNode,
  getInstanceFromInstance as getInstanceFromNode,
  getTagFromInstance as getNodeFromInstance,
};

export function getFiberCurrentPropsFromNode(inst) {
  return inst.canonical.currentProps;
}
