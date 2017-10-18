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

const {createHostRootFiber} = require('ReactFiber');

export type FiberRoot = {
  // Any additional information from the host associated with this root.
  containerInfo: any,
  // Used only by persistent updates.
  pendingChildren: any,
  // The currently active root fiber. This is the mutable root of the tree.
  current: Fiber,
  // Determines if this root has already been added to the schedule for work.
  isScheduled: boolean,
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
    pendingChildren: null,
    isScheduled: false,
    nextScheduledRoot: null,
    context: null,
    pendingContext: null,
    hydrate,
  };
  uninitializedFiber.stateNode = root;
  return root;
};
