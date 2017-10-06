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
import type {UpdateQueue} from 'ReactFiberUpdateQueue';
import type {ExpirationTime} from 'ReactFiberExpirationTime';

const {createHostRootFiber} = require('ReactFiber');
const {getUpdateQueueExpirationTime} = require('ReactFiberUpdateQueue');

const {Done} = require('ReactFiberExpirationTime');

export type FiberRoot = {
  // Any additional information from the host associated with this root.
  containerInfo: any,
  // The currently active root fiber. This is the mutable root of the tree.
  current: Fiber,
  // Determines if this root has already been added to the schedule for work.
  isScheduled: boolean,
  // A queue that represents times at which the root is blocked by a
  // top-level update.
  topLevelBlockers: UpdateQueue<null> | null,
  // The time at which this root completed.
  completedAt: ExpirationTime,
  // If this root completed, isBlocked indicates whether it's blocked
  // from committing.
  isBlocked: boolean,
  // A queue of callbacks that fire once their corresponding expiration time
  // has completed. Only fired once.
  completionCallbacks: UpdateQueue<null> | null,
  // When set, indicates that all work in this tree with this time or earlier
  // should be flushed by the end of the batch, as if it has task priority.
  forceExpire: null | ExpirationTime,
  // The work schedule is a linked list.
  nextScheduledRoot: FiberRoot | null,
  // Top context object, used by renderSubtreeIntoContainer
  context: Object | null,
  pendingContext: Object | null,
  // Determines if we should attempt to hydrate on the initial mount
  hydrate: boolean,
};

exports.topLevelBlockedAt = function(root: FiberRoot) {
  const topLevelBlockers = root.topLevelBlockers;
  if (topLevelBlockers === null) {
    return Done;
  }
  return getUpdateQueueExpirationTime(topLevelBlockers);
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
    isBlocked: false,
    completionCallbacks: null,
    topLevelBlockers: null,
    forceExpire: null,
    nextScheduledRoot: null,
    context: null,
    pendingContext: null,
    hydrate: true,
  };
  uninitializedFiber.stateNode = root;
  return root;
};
