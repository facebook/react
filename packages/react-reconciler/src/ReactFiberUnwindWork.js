/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {FiberRoot} from './ReactFiberRoot';
import type {ExpirationTime} from './ReactFiberExpirationTime';
import type {CapturedValue} from './ReactCapturedValue';
import type {Update} from './ReactUpdateQueue';
import type {Thenable} from './ReactFiberScheduler';
import type {SuspenseContext} from './ReactFiberSuspenseContext';

import {unstable_wrap as Schedule_tracing_wrap} from 'scheduler/tracing';
import getComponentName from 'shared/getComponentName';
import warningWithoutStack from 'shared/warningWithoutStack';
import {
  ClassComponent,
  HostRoot,
  HostComponent,
  HostPortal,
  ContextProvider,
  SuspenseComponent,
  DehydratedSuspenseComponent,
  IncompleteClassComponent,
  EventComponent,
  EventTarget,
} from 'shared/ReactWorkTags';
import {
  DidCapture,
  Incomplete,
  NoEffect,
  ShouldCapture,
  LifecycleEffectMask,
} from 'shared/ReactSideEffectTags';
import {
  enableSchedulerTracing,
  enableSuspenseServerRenderer,
  enableEventAPI,
} from 'shared/ReactFeatureFlags';
import {NoMode, BatchedMode} from './ReactTypeOfMode';
import {shouldCaptureSuspense} from './ReactFiberSuspenseComponent';

import {createCapturedValue} from './ReactCapturedValue';
import {
  enqueueCapturedUpdate,
  createUpdate,
  CaptureUpdate,
  ForceUpdate,
  enqueueUpdate,
} from './ReactUpdateQueue';
import {logError} from './ReactFiberCommitWork';
import {getStackByFiberInDevAndProd} from './ReactCurrentFiber';
import {popHostContainer, popHostContext} from './ReactFiberHostContext';
import {
  suspenseStackCursor,
  InvisibleParentSuspenseContext,
  hasSuspenseContext,
  popSuspenseContext,
} from './ReactFiberSuspenseContext';
import {
  isContextProvider as isLegacyContextProvider,
  popContext as popLegacyContext,
  popTopLevelContextObject as popTopLevelLegacyContextObject,
} from './ReactFiberContext';
import {popProvider} from './ReactFiberNewContext';
import {
  renderDidError,
  onUncaughtError,
  markLegacyErrorBoundaryAsFailed,
  isAlreadyFailedLegacyErrorBoundary,
  pingSuspendedRoot,
  resolveRetryThenable,
  checkForWrongSuspensePriorityInDEV,
} from './ReactFiberScheduler';

import invariant from 'shared/invariant';

import {Sync} from './ReactFiberExpirationTime';

const PossiblyWeakSet = typeof WeakSet === 'function' ? WeakSet : Set;
const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;

function createRootErrorUpdate(
  fiber: Fiber,
  errorInfo: CapturedValue<mixed>,
  expirationTime: ExpirationTime,
): Update<mixed> {
  const update = createUpdate(expirationTime, null);
  // Unmount the root by rendering null.
  update.tag = CaptureUpdate;
  // Caution: React DevTools currently depends on this property
  // being called "element".
  update.payload = {element: null};
  const error = errorInfo.value;
  update.callback = () => {
    onUncaughtError(error);
    logError(fiber, errorInfo);
  };
  return update;
}

function createClassErrorUpdate(
  fiber: Fiber,
  errorInfo: CapturedValue<mixed>,
  expirationTime: ExpirationTime,
): Update<mixed> {
  const update = createUpdate(expirationTime, null);
  update.tag = CaptureUpdate;
  const getDerivedStateFromError = fiber.type.getDerivedStateFromError;
  if (typeof getDerivedStateFromError === 'function') {
    const error = errorInfo.value;
    update.payload = () => {
      return getDerivedStateFromError(error);
    };
  }

  const inst = fiber.stateNode;
  if (inst !== null && typeof inst.componentDidCatch === 'function') {
    update.callback = function callback() {
      if (typeof getDerivedStateFromError !== 'function') {
        // To preserve the preexisting retry behavior of error boundaries,
        // we keep track of which ones already failed during this batch.
        // This gets reset before we yield back to the browser.
        // TODO: Warn in strict mode if getDerivedStateFromError is
        // not defined.
        markLegacyErrorBoundaryAsFailed(this);
      }
      const error = errorInfo.value;
      const stack = errorInfo.stack;
      logError(fiber, errorInfo);
      this.componentDidCatch(error, {
        componentStack: stack !== null ? stack : '',
      });
      if (__DEV__) {
        if (typeof getDerivedStateFromError !== 'function') {
          // If componentDidCatch is the only error boundary method defined,
          // then it needs to call setState to recover from errors.
          // If no state update is scheduled then the boundary will swallow the error.
          warningWithoutStack(
            fiber.expirationTime === Sync,
            '%s: Error boundaries should implement getDerivedStateFromError(). ' +
              'In that method, return a state update to display an error message or fallback UI.',
            getComponentName(fiber.type) || 'Unknown',
          );
        }
      }
    };
  }
  return update;
}

function attachPingListener(
  root: FiberRoot,
  renderExpirationTime: ExpirationTime,
  thenable: Thenable,
) {
  // Attach a listener to the promise to "ping" the root and retry. But
  // only if one does not already exist for the current render expiration
  // time (which acts like a "thread ID" here).
  let pingCache = root.pingCache;
  let threadIDs;
  if (pingCache === null) {
    pingCache = root.pingCache = new PossiblyWeakMap();
    threadIDs = new Set();
    pingCache.set(thenable, threadIDs);
  } else {
    threadIDs = pingCache.get(thenable);
    if (threadIDs === undefined) {
      threadIDs = new Set();
      pingCache.set(thenable, threadIDs);
    }
  }
  if (!threadIDs.has(renderExpirationTime)) {
    // Memoize using the thread ID to prevent redundant listeners.
    threadIDs.add(renderExpirationTime);
    let ping = pingSuspendedRoot.bind(
      null,
      root,
      thenable,
      renderExpirationTime,
    );
    if (enableSchedulerTracing) {
      ping = Schedule_tracing_wrap(ping);
    }
    thenable.then(ping, ping);
  }
}

function throwException(
  root: FiberRoot,
  returnFiber: Fiber,
  sourceFiber: Fiber,
  value: mixed,
  renderExpirationTime: ExpirationTime,
) {
  // The source fiber did not complete.
  sourceFiber.effectTag |= Incomplete;
  // Its effect list is no longer valid.
  sourceFiber.firstEffect = sourceFiber.lastEffect = null;

  if (
    value !== null &&
    typeof value === 'object' &&
    typeof value.then === 'function'
  ) {
    // This is a thenable.
    const thenable: Thenable = (value: any);

    checkForWrongSuspensePriorityInDEV(sourceFiber);

    let hasInvisibleParentBoundary = hasSuspenseContext(
      suspenseStackCursor.current,
      (InvisibleParentSuspenseContext: SuspenseContext),
    );

    // Schedule the nearest Suspense to re-render the timed out view.
    let workInProgress = returnFiber;
    do {
      if (
        workInProgress.tag === SuspenseComponent &&
        shouldCaptureSuspense(workInProgress, hasInvisibleParentBoundary)
      ) {
        // Found the nearest boundary.

        // Stash the promise on the boundary fiber. If the boundary times out, we'll
        // attach another listener to flip the boundary back to its normal state.
        const thenables: Set<Thenable> = (workInProgress.updateQueue: any);
        if (thenables === null) {
          const updateQueue = (new Set(): any);
          updateQueue.add(thenable);
          workInProgress.updateQueue = updateQueue;
        } else {
          thenables.add(thenable);
        }

        // If the boundary is outside of batched mode, we should *not*
        // suspend the commit. Pretend as if the suspended component rendered
        // null and keep rendering. In the commit phase, we'll schedule a
        // subsequent synchronous update to re-render the Suspense.
        //
        // Note: It doesn't matter whether the component that suspended was
        // inside a batched mode tree. If the Suspense is outside of it, we
        // should *not* suspend the commit.
        if ((workInProgress.mode & BatchedMode) === NoMode) {
          workInProgress.effectTag |= DidCapture;

          // We're going to commit this fiber even though it didn't complete.
          // But we shouldn't call any lifecycle methods or callbacks. Remove
          // all lifecycle effect tags.
          sourceFiber.effectTag &= ~(LifecycleEffectMask | Incomplete);

          if (sourceFiber.tag === ClassComponent) {
            const currentSourceFiber = sourceFiber.alternate;
            if (currentSourceFiber === null) {
              // This is a new mount. Change the tag so it's not mistaken for a
              // completed class component. For example, we should not call
              // componentWillUnmount if it is deleted.
              sourceFiber.tag = IncompleteClassComponent;
            } else {
              // When we try rendering again, we should not reuse the current fiber,
              // since it's known to be in an inconsistent state. Use a force updte to
              // prevent a bail out.
              const update = createUpdate(Sync, null);
              update.tag = ForceUpdate;
              enqueueUpdate(sourceFiber, update);
            }
          }

          // The source fiber did not complete. Mark it with Sync priority to
          // indicate that it still has pending work.
          sourceFiber.expirationTime = Sync;

          // Exit without suspending.
          return;
        }

        // Confirmed that the boundary is in a concurrent mode tree. Continue
        // with the normal suspend path.

        attachPingListener(root, renderExpirationTime, thenable);

        workInProgress.effectTag |= ShouldCapture;
        workInProgress.expirationTime = renderExpirationTime;

        return;
      } else if (
        enableSuspenseServerRenderer &&
        workInProgress.tag === DehydratedSuspenseComponent
      ) {
        attachPingListener(root, renderExpirationTime, thenable);

        // Since we already have a current fiber, we can eagerly add a retry listener.
        let retryCache = workInProgress.memoizedState;
        if (retryCache === null) {
          retryCache = workInProgress.memoizedState = new PossiblyWeakSet();
          const current = workInProgress.alternate;
          invariant(
            current,
            'A dehydrated suspense boundary must commit before trying to render. ' +
              'This is probably a bug in React.',
          );
          current.memoizedState = retryCache;
        }
        // Memoize using the boundary fiber to prevent redundant listeners.
        if (!retryCache.has(thenable)) {
          retryCache.add(thenable);
          let retry = resolveRetryThenable.bind(null, workInProgress, thenable);
          if (enableSchedulerTracing) {
            retry = Schedule_tracing_wrap(retry);
          }
          thenable.then(retry, retry);
        }
        workInProgress.effectTag |= ShouldCapture;
        workInProgress.expirationTime = renderExpirationTime;
        return;
      }
      // This boundary already captured during this render. Continue to the next
      // boundary.
      workInProgress = workInProgress.return;
    } while (workInProgress !== null);
    // No boundary was found. Fallthrough to error mode.
    // TODO: Use invariant so the message is stripped in prod?
    value = new Error(
      (getComponentName(sourceFiber.type) || 'A React component') +
        ' suspended while rendering, but no fallback UI was specified.\n' +
        '\n' +
        'Add a <Suspense fallback=...> component higher in the tree to ' +
        'provide a loading indicator or placeholder to display.' +
        getStackByFiberInDevAndProd(sourceFiber),
    );
  }

  // We didn't find a boundary that could handle this type of exception. Start
  // over and traverse parent path again, this time treating the exception
  // as an error.
  renderDidError();
  value = createCapturedValue(value, sourceFiber);
  let workInProgress = returnFiber;
  do {
    switch (workInProgress.tag) {
      case HostRoot: {
        const errorInfo = value;
        workInProgress.effectTag |= ShouldCapture;
        workInProgress.expirationTime = renderExpirationTime;
        const update = createRootErrorUpdate(
          workInProgress,
          errorInfo,
          renderExpirationTime,
        );
        enqueueCapturedUpdate(workInProgress, update);
        return;
      }
      case ClassComponent:
        // Capture and retry
        const errorInfo = value;
        const ctor = workInProgress.type;
        const instance = workInProgress.stateNode;
        if (
          (workInProgress.effectTag & DidCapture) === NoEffect &&
          (typeof ctor.getDerivedStateFromError === 'function' ||
            (instance !== null &&
              typeof instance.componentDidCatch === 'function' &&
              !isAlreadyFailedLegacyErrorBoundary(instance)))
        ) {
          workInProgress.effectTag |= ShouldCapture;
          workInProgress.expirationTime = renderExpirationTime;
          // Schedule the error boundary to re-render using updated state
          const update = createClassErrorUpdate(
            workInProgress,
            errorInfo,
            renderExpirationTime,
          );
          enqueueCapturedUpdate(workInProgress, update);
          return;
        }
        break;
      default:
        break;
    }
    workInProgress = workInProgress.return;
  } while (workInProgress !== null);
}

function unwindWork(
  workInProgress: Fiber,
  renderExpirationTime: ExpirationTime,
) {
  switch (workInProgress.tag) {
    case ClassComponent: {
      const Component = workInProgress.type;
      if (isLegacyContextProvider(Component)) {
        popLegacyContext(workInProgress);
      }
      const effectTag = workInProgress.effectTag;
      if (effectTag & ShouldCapture) {
        workInProgress.effectTag = (effectTag & ~ShouldCapture) | DidCapture;
        return workInProgress;
      }
      return null;
    }
    case HostRoot: {
      popHostContainer(workInProgress);
      popTopLevelLegacyContextObject(workInProgress);
      const effectTag = workInProgress.effectTag;
      invariant(
        (effectTag & DidCapture) === NoEffect,
        'The root failed to unmount after an error. This is likely a bug in ' +
          'React. Please file an issue.',
      );
      workInProgress.effectTag = (effectTag & ~ShouldCapture) | DidCapture;
      return workInProgress;
    }
    case HostComponent: {
      // TODO: popHydrationState
      popHostContext(workInProgress);
      return null;
    }
    case SuspenseComponent: {
      popSuspenseContext(workInProgress);
      const effectTag = workInProgress.effectTag;
      if (effectTag & ShouldCapture) {
        workInProgress.effectTag = (effectTag & ~ShouldCapture) | DidCapture;
        // Captured a suspense effect. Re-render the boundary.
        return workInProgress;
      }
      return null;
    }
    case DehydratedSuspenseComponent: {
      if (enableSuspenseServerRenderer) {
        // TODO: popHydrationState
        popSuspenseContext(workInProgress);
        const effectTag = workInProgress.effectTag;
        if (effectTag & ShouldCapture) {
          workInProgress.effectTag = (effectTag & ~ShouldCapture) | DidCapture;
          // Captured a suspense effect. Re-render the boundary.
          return workInProgress;
        }
      }
      return null;
    }
    case HostPortal:
      popHostContainer(workInProgress);
      return null;
    case ContextProvider:
      popProvider(workInProgress);
      return null;
    case EventComponent:
    case EventTarget:
      if (enableEventAPI) {
        popHostContext(workInProgress);
      }
      return null;
    default:
      return null;
  }
}

function unwindInterruptedWork(interruptedWork: Fiber) {
  switch (interruptedWork.tag) {
    case ClassComponent: {
      const childContextTypes = interruptedWork.type.childContextTypes;
      if (childContextTypes !== null && childContextTypes !== undefined) {
        popLegacyContext(interruptedWork);
      }
      break;
    }
    case HostRoot: {
      popHostContainer(interruptedWork);
      popTopLevelLegacyContextObject(interruptedWork);
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
    case DehydratedSuspenseComponent:
      if (enableSuspenseServerRenderer) {
        // TODO: popHydrationState
        popSuspenseContext(interruptedWork);
      }
      break;
    case ContextProvider:
      popProvider(interruptedWork);
      break;
    case EventComponent:
    case EventTarget:
      if (enableEventAPI) {
        popHostContext(interruptedWork);
      }
      break;
    default:
      break;
  }
}

export {
  throwException,
  unwindWork,
  unwindInterruptedWork,
  createRootErrorUpdate,
  createClassErrorUpdate,
};
