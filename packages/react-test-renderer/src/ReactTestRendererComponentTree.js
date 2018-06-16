/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const randomKey = Math.random()
  .toString(36)
  .slice(2);
const internalInstanceKey = '__reactInternalInstance$' + randomKey;

export function findFiberByHostInstance(node) {
  return node[internalInstanceKey];
}

export function precacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst;
}
