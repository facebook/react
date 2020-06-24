/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FiberRoot, SuspenseHydrationCallbacks} from './ReactInternalTypes';
import type {RootTag} from './ReactRootTags';

import {noTimeout, supportsHydration} from './ReactFiberHostConfig';
import {createHostRootFiber} from './ReactFiber.old';
import {
  NoLanes,
  NoLanePriority,
  NoTimestamp,
  createLaneMap,
} from './ReactFiberLane';
import {
  enableSchedulerTracing,
  enableSuspenseCallback,
} from 'shared/ReactFeatureFlags';
import {unstable_getThreadID} from 'scheduler/tracing';
import {initializeUpdateQueue} from './ReactUpdateQueue.old';
import {LegacyRoot, BlockingRoot, ConcurrentRoot} from './ReactRootTags';

function FiberRootNode(containerInfo, tag, hydrate) {
  this.tag = tag;
  this.containerInfo = containerInfo;
  this.pendingChildren = null;
  this.current = null;
  this.pingCache = null;
  //this.finishedWork = null;
  this.timeoutHandle = noTimeout;
  this.context = null;
  this.pendingContext = null;
  this.hydrate = hydrate;
  this.callbackNode = null;
  this.callbackId = NoLanes;
  this.callbackPriority = NoLanePriority;
  this.expirationTimes = createLaneMap(NoTimestamp);

  this.pendingLanes = NoLanes;
  this.suspendedLanes = NoLanes;
  this.pingedLanes = NoLanes;
  this.expiredLanes = NoLanes;
  this.mutableReadLanes = NoLanes;
  //this.finishedLanes = NoLanes;

  this.entangledLanes = NoLanes;
  this.entanglements = createLaneMap(NoLanes);

  if (supportsHydration) {
    this.mutableSourceEagerHydrationData = null;
  }

  if (enableSchedulerTracing) {
    this.interactionThreadID = unstable_getThreadID();
    this.memoizedInteractions = new Set();
    this.pendingInteractionMap = new Map();
  }
  if (enableSuspenseCallback) {
    this.hydrationCallbacks = null;
  }

  if (__DEV__) {
    switch (tag) {
      case BlockingRoot:
        this._debugRootType = 'createBlockingRoot()';
        break;
      case ConcurrentRoot:
        this._debugRootType = 'createRoot()';
        break;
      case LegacyRoot:
        this._debugRootType = 'createLegacyRoot()';
        break;
    }
  }

  this.DEBUG_FINISHED_LANES = false;
  this.DEBUG_COMMIT_COUNT = 0;

  let finishedWork = null;
  // $FlowFixMe Why does Flow thing I need to specify a "value" field?
  Object.defineProperty(this, 'finishedWork', {
    get() {
      return finishedWork;
    },
    set(value) {
      if (this.DEBUG_FINISHED_LANES) {
        if (value !== finishedWork) {
          // eslint-disable-next-line react-internal/no-production-logging
          console.log(
            `🔥🔥🔥 finishedWork unexpectedly changed in commit ${this.DEBUG_COMMIT_COUNT}`,
          );
        }
      }
      finishedWork = value;
    },
  });

  let finishedLanes = NoLanes;
  // $FlowFixMe Why does Flow thing I need to specify a "value" field?
  Object.defineProperty(this, 'finishedLanes', {
    get() {
      return finishedLanes;
    },
    set(value) {
      if (this.DEBUG_FINISHED_LANES) {
        if (value !== finishedLanes) {
          // eslint-disable-next-line react-internal/no-production-logging
          console.log(
            `🔥🔥🔥 finishedLanes (${(finishedLanes: any)
              .toString(2)
              .padStart(31, '0')} => ${(value: any)
              .toString(2)
              .padStart(31, '0')}) in commit ${this.DEBUG_COMMIT_COUNT}`,
          );
        }
      }
      finishedLanes = value;
    },
  });
}

export function createFiberRoot(
  containerInfo: any,
  tag: RootTag,
  hydrate: boolean,
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
): FiberRoot {
  const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any);
  if (enableSuspenseCallback) {
    root.hydrationCallbacks = hydrationCallbacks;
  }

  // Cyclic construction. This cheats the type system right now because
  // stateNode is any.
  const uninitializedFiber = createHostRootFiber(tag);
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  initializeUpdateQueue(uninitializedFiber);

  return root;
}
