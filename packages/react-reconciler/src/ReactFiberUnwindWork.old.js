/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';
import type {Fiber, FiberRoot} from './ReactInternalTypes';
import type {Lanes} from './ReactFiberLane.old';
import type {SuspenseState} from './ReactFiberSuspenseComponent.old';
import type {Cache, SpawnedCachePool} from './ReactFiberCacheComponent.old';

import {resetWorkInProgressVersions as resetMutableSourceWorkInProgressVersions} from './ReactMutableSource.old';
import {
  ClassComponent,
  HostRoot,
  HostComponent,
  HostPortal,
  ContextProvider,
  SuspenseComponent,
  SuspenseListComponent,
  OffscreenComponent,
  LegacyHiddenComponent,
  CacheComponent,
} from './ReactWorkTags';
import {DidCapture, NoFlags, ShouldCapture} from './ReactFiberFlags';
import {NoMode, ProfileMode} from './ReactTypeOfMode';
import {
  enableSuspenseServerRenderer,
  enableProfilerTimer,
  enableCache,
} from 'shared/ReactFeatureFlags';

import {popHostContainer, popHostContext} from './ReactFiberHostContext.old';
import {popSuspenseContext} from './ReactFiberSuspenseContext.old';
import {resetHydrationState} from './ReactFiberHydrationContext.old';
import {
  isContextProvider as isLegacyContextProvider,
  popContext as popLegacyContext,
  popTopLevelContextObject as popTopLevelLegacyContextObject,
} from './ReactFiberContext.old';
import {popProvider} from './ReactFiberNewContext.old';
import {popRenderLanes} from './ReactFiberWorkLoop.old';
import {
  popCacheProvider,
  popRootCachePool,
  popCachePool,
} from './ReactFiberCacheComponent.old';
import {transferActualDuration} from './ReactProfilerTimer.old';
import {popTreeContext} from './ReactFiberTreeContext.old';

function unwindWork(workInProgress: Fiber, renderLanes: Lanes) {
  // Note: This intentionally doesn't check if we're hydrating because comparing
  // to the current tree provider fiber is just as fast and less error-prone.
  // Ideally we would have a special version of the work loop only
  // for hydration.
  popTreeContext(workInProgress);
  switch (workInProgress.tag) {
    case ClassComponent: {
      const Component = workInProgress.type;
      if (isLegacyContextProvider(Component)) {
        popLegacyContext(workInProgress);
      }
      const flags = workInProgress.flags;
      if (flags & ShouldCapture) {
        workInProgress.flags = (flags & ~ShouldCapture) | DidCapture;
        if (
          enableProfilerTimer &&
          (workInProgress.mode & ProfileMode) !== NoMode
        ) {
          transferActualDuration(workInProgress);
        }
        return workInProgress;
      }
      return null;
    }
    case HostRoot: {
      if (enableCache) {
        const root: FiberRoot = workInProgress.stateNode;
        popRootCachePool(root, renderLanes);

        const cache: Cache = workInProgress.memoizedState.cache;
        popCacheProvider(workInProgress, cache);
      }
      popHostContainer(workInProgress);
      popTopLevelLegacyContextObject(workInProgress);
      resetMutableSourceWorkInProgressVersions();
      const flags = workInProgress.flags;
      if (
        (flags & ShouldCapture) !== NoFlags &&
        (flags & DidCapture) === NoFlags
      ) {
        // There was an error during render that wasn't captured by a suspense
        // boundary. Do a second pass on the root to unmount the children.
        workInProgress.flags = (flags & ~ShouldCapture) | DidCapture;
        return workInProgress;
      }
      // We unwound to the root without completing it. Exit.
      return null;
    }
    case HostComponent: {
      // TODO: popHydrationState
      popHostContext(workInProgress);
      return null;
    }
    case SuspenseComponent: {
      popSuspenseContext(workInProgress);
      if (enableSuspenseServerRenderer) {
        const suspenseState: null | SuspenseState =
          workInProgress.memoizedState;
        if (suspenseState !== null && suspenseState.dehydrated !== null) {
          if (workInProgress.alternate === null) {
            throw new Error(
              'Threw in newly mounted dehydrated component. This is likely a bug in ' +
                'React. Please file an issue.',
            );
          }

          resetHydrationState();
        }
      }
      const flags = workInProgress.flags;
      if (flags & ShouldCapture) {
        workInProgress.flags = (flags & ~ShouldCapture) | DidCapture;
        // Captured a suspense effect. Re-render the boundary.
        if (
          enableProfilerTimer &&
          (workInProgress.mode & ProfileMode) !== NoMode
        ) {
          transferActualDuration(workInProgress);
        }
        return workInProgress;
      }
      return null;
    }
    case SuspenseListComponent: {
      popSuspenseContext(workInProgress);
      // SuspenseList doesn't actually catch anything. It should've been
      // caught by a nested boundary. If not, it should bubble through.
      return null;
    }
    case HostPortal:
      popHostContainer(workInProgress);
      return null;
    case ContextProvider:
      const context: ReactContext<any> = workInProgress.type._context;
      popProvider(context, workInProgress);
      return null;
    case OffscreenComponent:
    case LegacyHiddenComponent:
      popRenderLanes(workInProgress);
      if (enableCache) {
        const spawnedCachePool: SpawnedCachePool | null = (workInProgress.updateQueue: any);
        if (spawnedCachePool !== null) {
          popCachePool(workInProgress);
        }
      }
      return null;
    case CacheComponent:
      if (enableCache) {
        const cache: Cache = workInProgress.memoizedState.cache;
        popCacheProvider(workInProgress, cache);
      }
      return null;
    default:
      return null;
  }
}

function unwindInterruptedWork(interruptedWork: Fiber, renderLanes: Lanes) {
  // Note: This intentionally doesn't check if we're hydrating because comparing
  // to the current tree provider fiber is just as fast and less error-prone.
  // Ideally we would have a special version of the work loop only
  // for hydration.
  popTreeContext(interruptedWork);
  switch (interruptedWork.tag) {
    case ClassComponent: {
      const childContextTypes = interruptedWork.type.childContextTypes;
      if (childContextTypes !== null && childContextTypes !== undefined) {
        popLegacyContext(interruptedWork);
      }
      break;
    }
    case HostRoot: {
      if (enableCache) {
        const root: FiberRoot = interruptedWork.stateNode;
        popRootCachePool(root, renderLanes);

        const cache: Cache = interruptedWork.memoizedState.cache;
        popCacheProvider(interruptedWork, cache);
      }
      popHostContainer(interruptedWork);
      popTopLevelLegacyContextObject(interruptedWork);
      resetMutableSourceWorkInProgressVersions();
      break;
    }
    case HostComponent: {
      popHostContext(interruptedWork);
      break;
    }
    case HostPortal:
      popHostContainer(interruptedWork);
      break;
    case SuspenseComponent:
      popSuspenseContext(interruptedWork);
      break;
    case SuspenseListComponent:
      popSuspenseContext(interruptedWork);
      break;
    case ContextProvider:
      const context: ReactContext<any> = interruptedWork.type._context;
      popProvider(context, interruptedWork);
      break;
    case OffscreenComponent:
    case LegacyHiddenComponent:
      popRenderLanes(interruptedWork);
      if (enableCache) {
        const spawnedCachePool: SpawnedCachePool | null = (interruptedWork.updateQueue: any);
        if (spawnedCachePool !== null) {
          popCachePool(interruptedWork);
        }
      }

      break;
    case CacheComponent:
      if (enableCache) {
        const cache: Cache = interruptedWork.memoizedState.cache;
        popCacheProvider(interruptedWork, cache);
      }
      break;
    default:
      break;
  }
}

export {unwindWork, unwindInterruptedWork};
