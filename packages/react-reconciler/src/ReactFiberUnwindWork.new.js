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
import type {Lanes} from './ReactFiberLane.new';
import type {SuspenseState} from './ReactFiberSuspenseComponent.new';
import type {Cache} from './ReactFiberCacheComponent.new';
import type {TracingMarkerInstance} from './ReactFiberTracingMarkerComponent.new';

import {resetWorkInProgressVersions as resetMutableSourceWorkInProgressVersions} from './ReactMutableSource.new';
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
  TracingMarkerComponent,
} from './ReactWorkTags';
import {DidCapture, NoFlags, ShouldCapture} from './ReactFiberFlags';
import {NoMode, ProfileMode} from './ReactTypeOfMode';
import {
  enableProfilerTimer,
  enableCache,
  enableTransitionTracing,
} from 'shared/ReactFeatureFlags';

import {popHostContainer, popHostContext} from './ReactFiberHostContext.new';
import {
  popSuspenseListContext,
  popSuspenseHandler,
} from './ReactFiberSuspenseContext.new';
import {popHiddenContext} from './ReactFiberHiddenContext.new';
import {resetHydrationState} from './ReactFiberHydrationContext.new';
import {
  isContextProvider as isLegacyContextProvider,
  popContext as popLegacyContext,
  popTopLevelContextObject as popTopLevelLegacyContextObject,
} from './ReactFiberContext.new';
import {popProvider} from './ReactFiberNewContext.new';
import {popCacheProvider} from './ReactFiberCacheComponent.new';
import {transferActualDuration} from './ReactProfilerTimer.new';
import {popTreeContext} from './ReactFiberTreeContext.new';
import {popRootTransition, popTransition} from './ReactFiberTransition.new';
import {
  popMarkerInstance,
  popRootMarkerInstance,
} from './ReactFiberTracingMarkerComponent.new';

function unwindWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
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
      const root: FiberRoot = workInProgress.stateNode;
      if (enableCache) {
        const cache: Cache = workInProgress.memoizedState.cache;
        popCacheProvider(workInProgress, cache);
      }

      if (enableTransitionTracing) {
        popRootMarkerInstance(workInProgress);
      }

      popRootTransition(workInProgress, root, renderLanes);
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
      popSuspenseHandler(workInProgress);
      const suspenseState: null | SuspenseState = workInProgress.memoizedState;
      if (suspenseState !== null && suspenseState.dehydrated !== null) {
        if (workInProgress.alternate === null) {
          throw new Error(
            'Threw in newly mounted dehydrated component. This is likely a bug in ' +
              'React. Please file an issue.',
          );
        }

        resetHydrationState();
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
      popSuspenseListContext(workInProgress);
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
    case LegacyHiddenComponent: {
      popSuspenseHandler(workInProgress);
      popHiddenContext(workInProgress);
      popTransition(workInProgress, current);
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
    case CacheComponent:
      if (enableCache) {
        const cache: Cache = workInProgress.memoizedState.cache;
        popCacheProvider(workInProgress, cache);
      }
      return null;
    case TracingMarkerComponent:
      if (enableTransitionTracing) {
        if (workInProgress.stateNode !== null) {
          popMarkerInstance(workInProgress);
        }
      }
      return null;
    default:
      return null;
  }
}

function unwindInterruptedWork(
  current: Fiber | null,
  interruptedWork: Fiber,
  renderLanes: Lanes,
) {
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
      const root: FiberRoot = interruptedWork.stateNode;
      if (enableCache) {
        const cache: Cache = interruptedWork.memoizedState.cache;
        popCacheProvider(interruptedWork, cache);
      }

      if (enableTransitionTracing) {
        popRootMarkerInstance(interruptedWork);
      }

      popRootTransition(interruptedWork, root, renderLanes);
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
      popSuspenseHandler(interruptedWork);
      break;
    case SuspenseListComponent:
      popSuspenseListContext(interruptedWork);
      break;
    case ContextProvider:
      const context: ReactContext<any> = interruptedWork.type._context;
      popProvider(context, interruptedWork);
      break;
    case OffscreenComponent:
    case LegacyHiddenComponent:
      popSuspenseHandler(interruptedWork);
      popHiddenContext(interruptedWork);
      popTransition(interruptedWork, current);
      break;
    case CacheComponent:
      if (enableCache) {
        const cache: Cache = interruptedWork.memoizedState.cache;
        popCacheProvider(interruptedWork, cache);
      }
      break;
    case TracingMarkerComponent:
      if (enableTransitionTracing) {
        const instance: TracingMarkerInstance | null =
          interruptedWork.stateNode;
        if (instance !== null) {
          popMarkerInstance(interruptedWork);
        }
      }
      break;
    default:
      break;
  }
}

export {unwindWork, unwindInterruptedWork};
