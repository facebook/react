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
const {NoWork} = require('ReactFiberExpirationTime');

export type FiberRoot = {
  // Any additional information from the host associated with this root.
  containerInfo: any,
  // The currently active root fiber. This is the mutable root of the tree.
  current: Fiber,
  // Determines if this root has already been added to the schedule for work.
  isScheduled: boolean,
  // Determines if this root was blocked from committing.
  isBlocked: boolean,
  // The time at which this root completed.
  // TODO: Remove once we add back resuming.
  completedAt: ExpirationTime,
  forceExpire: ExpirationTime,
  // The work schedule is a linked list.
  nextScheduledRoot: FiberRoot | null,
  // Top context object, used by renderSubtreeIntoContainer
  context: Object | null,
  pendingContext: Object | null,
  // Determines if we should attempt to hydrate on the initial mount
  +hydrate: boolean,
};

exports.createFiberRoot = function(
  containerInfo: any,
  hydrate: boolean,
): FiberRoot {
  // Cyclic construction. This cheats the type system right now because
  // stateNode is any.
  const uninitializedFiber = createHostRootFiber();
  const root = {
    current: uninitializedFiber,
    containerInfo: containerInfo,
    isScheduled: false,
    isBlocked: false,
    completedAt: NoWork,
    forceExpire: NoWork,
    nextScheduledRoot: null,
    context: null,
    pendingContext: null,
    hydrate,
  };
  uninitializedFiber.stateNode = root;
  return root;
};
