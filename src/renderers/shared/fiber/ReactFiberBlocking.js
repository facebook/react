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
  wasBlocked: boolean,
};

const { NoWork } = require('ReactPriorityLevel');

module.exports = function() {
  // Blocking context. Mutated when we begin work on a tree. Children read this
  // to determine if they should reuse the progressed work.
  let wasBlocked = false;

  function setBlockingContext(val : boolean) {
    wasBlocked = val;
  }

  function getBlockingContext() : boolean {
    return wasBlocked;
  }

  function isBlockingBoundary(fiber : Fiber) : boolean {
    if (fiber.stateNode && fiber.stateNode.blockInfo) {
      return true;
    }
    return false;
  }

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

  return {
    setBlockingContext,
    getBlockingContext,
    block,
    unblock,
  };
};
