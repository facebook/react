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

export type FiberRoot = {
  // Any additional information from the host associated with this root.
  containerInfo: any,
  // Used only by persistent updates.
  pendingChildren: any,
  // The currently active root fiber. This is the mutable root of the tree.
  current: Fiber,
  // Remaining priority on this root.
  remainingWork: ExpirationTime | null,
  // Determines if this root can be committed.
  isReadyForCommit: boolean,
  // Same as isReadyForCommit, but belongs to FiberRoot instead of HostRoot.
  // TODO: The reason this is separate is because the FiberRoot concept will
  // likely be lifted out of the reconciler and into the renderer.
  isComplete: boolean,
  // Top context object, used by renderSubtreeIntoContainer
  context: Object | null,
  pendingContext: Object | null,
  // Determines if we should attempt to hydrate on the initial mount
  +hydrate: boolean,
  // Linked-list of roots
  nextScheduledRoot: FiberRoot | null,
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
    remainingWork: null,
    isReadyForCommit: false,
    isComplete: false,
    context: null,
    pendingContext: null,
    hydrate,
    nextScheduledRoot: null,
  };
  uninitializedFiber.stateNode = root;
  return root;
};
