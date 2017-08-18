/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactFiberRoot
 * @flow
 */

'use strict';

import type {Fiber} from 'ReactFiber';
import type {ExpirationTime} from 'ReactFiberExpirationTime';

const {createHostRootFiber} = require('ReactFiber');
const {Done} = require('ReactFiberExpirationTime');

export type FiberRoot = {
  // Any additional information from the host associated with this root.
  containerInfo: any,
  // The currently active root fiber. This is the mutable root of the tree.
  current: Fiber,
  // Determines if this root has already been added to the schedule for work.
  isScheduled: boolean,
  // The time at which this root completed.
  completedAt: ExpirationTime,
  // The work schedule is a linked list.
  nextScheduledRoot: FiberRoot | null,
  // Top context object, used by renderSubtreeIntoContainer
  context: Object | null,
  pendingContext: Object | null,
};

// Indicates whether the root is blocked from committing at a particular
// expiration time.
exports.isRootBlocked = function(
  root: FiberRoot,
  time: ExpirationTime,
): boolean {
  // TODO: Implementation
  return false;
};

exports.createFiberRoot = function(containerInfo: any): FiberRoot {
  // Cyclic construction. This cheats the type system right now because
  // stateNode is any.
  const uninitializedFiber = createHostRootFiber();
  const root = {
    current: uninitializedFiber,
    containerInfo: containerInfo,
    isScheduled: false,
    completedAt: Done,
    nextScheduledRoot: null,
    context: null,
    pendingContext: null,
  };
  uninitializedFiber.stateNode = root;
  return root;
};
