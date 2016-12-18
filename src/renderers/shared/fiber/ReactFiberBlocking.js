/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberBlocking
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';
import type { PriorityLevel } from 'ReactPriorityLevel';

type Blocker = Promise<any>;

export type BlockInfo = {
  blockers: Map<Blocker, PriorityLevel> | null,
  blockingPriority: PriorityLevel,
  blockedChild: ?Fiber
};

const { NoWork } = require('ReactPriorityLevel');

function createBlockInfo() : BlockInfo {
  return {
    blockers: null,
    blockingPriority: NoWork,
    blockedChild: null,
  };
}
exports.createBlockInfo = createBlockInfo;

function isBlockingBoundary(fiber : Fiber) : boolean {
  if (fiber.stateNode && fiber.stateNode.blockInfo) {
    return true;
  }
  return false;
}
exports.isBlockingBoundary = isBlockingBoundary;

function block(fiber : Fiber, blocker : Blocker, priorityLevel : PriorityLevel) : BlockInfo | null {
  let node = fiber;
  let boundary;
  while (node && !boundary) {
    if (isBlockingBoundary(node)) {
      boundary = node;
    }
    node = node.return;
  }
  if (!boundary) {
    return null;
  }

  const info : BlockInfo = boundary.stateNode.blockInfo;
  if (!info.blockers) {
    info.blockers = new Map();
  }
  info.blockers.set(blocker, priorityLevel);
  if (priorityLevel !== NoWork &&
      (info.blockingPriority === NoWork || priorityLevel < info.blockingPriority)) {
    info.blockingPriority = priorityLevel;
  }
  return info;
}
exports.block = block;

function unblock(info : BlockInfo, blocker : Blocker) {
  const blockers = info.blockers;
  if (!blockers) {
    return;
  }

  const deletedPriority = blockers.get(blocker);
  blockers.delete(blocker);
  if (deletedPriority === info.blockingPriority) {
    info.blockingPriority = NoWork;
    blockers.forEach(priorityLevel => {
      if (priorityLevel !== NoWork &&
          (info.blockingPriority === NoWork || priorityLevel < info.blockingPriority)) {
        info.blockingPriority = priorityLevel;
      }
    });
  }
  if (!blockers.size) {
    info.blockers = null;
  }
}
exports.unblock = unblock;

function markTreeAsBlocked(root : Fiber) {
  let node : Fiber = root;
  while (true) {
    node.blockedChild = node.child;
    if (node.alternate) {
      node.alternate.blockedChild = node.child;
    }

    if (node.child) {
      // TODO: Coroutines need to visit the stateNode.
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === root) {
      return;
    }
    while (!node.sibling) {
      if (!node.return || node.return === root) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
exports.markTreeAsBlocked = markTreeAsBlocked;

function markTreeAsUnblocked(root : Fiber) {
  let node : Fiber = root;
  while (true) {
    node.blockedChild = null;
    if (node.alternate) {
      node.alternate.blockedChild = null;
    }

    if (node.child) {
      // TODO: Coroutines need to visit the stateNode.
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === root) {
      return;
    }
    while (!node.sibling) {
      if (!node.return || node.return === root) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
exports.markTreeAsUnblocked = markTreeAsUnblocked;
