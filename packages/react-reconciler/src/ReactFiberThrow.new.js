/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';
import type {FiberRoot} from './ReactInternalTypes';
import type {Lane, Lanes} from './ReactFiberLane.new';
import type {CapturedValue} from './ReactCapturedValue';
import type {Update} from './ReactFiberClassUpdateQueue.new';
import type {Wakeable} from 'shared/ReactTypes';
import type {OffscreenQueue} from './ReactFiberOffscreenComponent';

import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
import {
  ClassComponent,
  HostRoot,
  IncompleteClassComponent,
  FunctionComponent,
  ForwardRef,
  SimpleMemoComponent,
  SuspenseComponent,
  OffscreenComponent,
} from './ReactWorkTags';
import {
  DidCapture,
  Incomplete,
  NoFlags,
  ShouldCapture,
  LifecycleEffectMask,
  ForceUpdateForLegacySuspense,
  ForceClientRender,
} from './ReactFiberFlags';
import {NoMode, ConcurrentMode, DebugTracingMode} from './ReactTypeOfMode';
import {
  enableDebugTracing,
  enableLazyContextPropagation,
  enableUpdaterTracking,
} from 'shared/ReactFeatureFlags';
import {createCapturedValueAtFiber} from './ReactCapturedValue';
import {
  enqueueCapturedUpdate,
  createUpdate,
  CaptureUpdate,
  ForceUpdate,
  enqueueUpdate,
} from './ReactFiberClassUpdateQueue.new';
import {markFailedErrorBoundaryForHotReloading} from './ReactFiberHotReloading.new';
import {getSuspenseHandler} from './ReactFiberSuspenseContext.new';
import {
  renderDidError,
  renderDidSuspendDelayIfPossible,
  onUncaughtError,
  markLegacyErrorBoundaryAsFailed,
  isAlreadyFailedLegacyErrorBoundary,
  attachPingListener,
  restorePendingUpdaters,
} from './ReactFiberWorkLoop.new';
import {propagateParentContextChangesToDeferredTree} from './ReactFiberNewContext.new';
import {logCapturedError} from './ReactFiberErrorLogger';
import {logComponentSuspended} from './DebugTracing';
import {isDevToolsPresent} from './ReactFiberDevToolsHook.new';
import {
  SyncLane,
  NoTimestamp,
  includesSomeLane,
  mergeLanes,
  pickArbitraryLane,
  includesSyncLane,
} from './ReactFiberLane.new';
import {
  getIsHydrating,
  markDidThrowWhileHydratingDEV,
  queueHydrationError,
} from './ReactFiberHydrationContext.new';

function createRootErrorUpdate(
  fiber: Fiber,
  errorInfo: CapturedValue<mixed>,
  lane: Lane,
): Update<mixed> {
  const update = createUpdate(NoTimestamp, lane);
  // Unmount the root by rendering null.
  update.tag = CaptureUpdate;
  // Caution: React DevTools currently depends on this property
  // being called "element".
  update.payload = {element: null};
  const error = errorInfo.value;
  update.callback = () => {
    onUncaughtError(error);
    logCapturedError(fiber, errorInfo);
  };
  return update;
}

function createClassErrorUpdate(
  fiber: Fiber,
  errorInfo: CapturedValue<mixed>,
  lane: Lane,
): Update<mixed> {
  const update = createUpdate(NoTimestamp, lane);
  update.tag = CaptureUpdate;
  const getDerivedStateFromError = fiber.type.getDerivedStateFromError;
  if (typeof getDerivedStateFromError === 'function') {
    const error = errorInfo.value;
    update.payload = () => {
      return getDerivedStateFromError(error);
    };
    update.callback = () => {
      if (__DEV__) {
        markFailedErrorBoundaryForHotReloading(fiber);
      }
      logCapturedError(fiber, errorInfo);
    };
  }

  const inst = fiber.stateNode;
  if (inst !== null && typeof inst.componentDidCatch === 'function') {
    update.callback = function callback() {
      if (__DEV__) {
        markFailedErrorBoundaryForHotReloading(fiber);
      }
      logCapturedError(fiber, errorInfo);
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
      this.componentDidCatch(error, {
        componentStack: stack !== null ? stack : '',
      });
      if (__DEV__) {
        if (typeof getDerivedStateFromError !== 'function') {
          // If componentDidCatch is the only error boundary method defined,
          // then it needs to call setState to recover from errors.
          // If no state update is scheduled then the boundary will swallow the error.
          if (!includesSomeLane(fiber.lanes, (SyncLane: Lane))) {
            console.error(
              '%s: Error boundaries should implement getDerivedStateFromError(). ' +
                'In that method, return a state update to display an error message or fallback UI.',
              getComponentNameFromFiber(fiber) || 'Unknown',
            );
          }
        }
      }
    };
  }
  return update;
}

function resetSuspendedComponent(sourceFiber: Fiber, rootRenderLanes: Lanes) {
  if (enableLazyContextPropagation) {
    const currentSourceFiber = sourceFiber.alternate;
    if (currentSourceFiber !== null) {
      // Since we never visited the children of the suspended component, we
      // need to propagate the context change now, to ensure that we visit
      // them during the retry.
      //
      // We don't have to do this for errors because we retry errors without
      // committing in between. So this is specific to Suspense.
      propagateParentContextChangesToDeferredTree(
        currentSourceFiber,
        sourceFiber,
        rootRenderLanes,
      );
    }
  }

  // Reset the memoizedState to what it was before we attempted to render it.
  // A legacy mode Suspense quirk, only relevant to hook components.
  const tag = sourceFiber.tag;
  if (
    (sourceFiber.mode & ConcurrentMode) === NoMode &&
    (tag === FunctionComponent ||
      tag === ForwardRef ||
      tag === SimpleMemoComponent)
  ) {
    const currentSource = sourceFiber.alternate;
    if (currentSource) {
      sourceFiber.updateQueue = currentSource.updateQueue;
      sourceFiber.memoizedState = currentSource.memoizedState;
      sourceFiber.lanes = currentSource.lanes;
    } else {
      sourceFiber.updateQueue = null;
      sourceFiber.memoizedState = null;
    }
  }
}

function markSuspenseBoundaryShouldCapture(
  suspenseBoundary: Fiber,
  returnFiber: Fiber,
  sourceFiber: Fiber,
  root: FiberRoot,
  rootRenderLanes: Lanes,
): Fiber | null {
  // This marks a Suspense boundary so that when we're unwinding the stack,
  // it captures the suspended "exception" and does a second (fallback) pass.
  if ((suspenseBoundary.mode & ConcurrentMode) === NoMode) {
    // Legacy Mode Suspense
    //
    // If the boundary is in legacy mode, we should *not*
    // suspend the commit. Pretend as if the suspended component rendered
    // null and keep rendering. When the Suspense boundary completes,
    // we'll do a second pass to render the fallback.
    if (suspenseBoundary === returnFiber) {
      // Special case where we suspended while reconciling the children of
      // a Suspense boundary's inner Offscreen wrapper fiber. This happens
      // when a React.lazy component is a direct child of a
      // Suspense boundary.
      //
      // Suspense boundaries are implemented as multiple fibers, but they
      // are a single conceptual unit. The legacy mode behavior where we
      // pretend the suspended fiber committed as `null` won't work,
      // because in this case the "suspended" fiber is the inner
      // Offscreen wrapper.
      //
      // Because the contents of the boundary haven't started rendering
      // yet (i.e. nothing in the tree has partially rendered) we can
      // switch to the regular, concurrent mode behavior: mark the
      // boundary with ShouldCapture and enter the unwind phase.
      suspenseBoundary.flags |= ShouldCapture;
    } else {
      suspenseBoundary.flags |= DidCapture;
      sourceFiber.flags |= ForceUpdateForLegacySuspense;

      // We're going to commit this fiber even though it didn't complete.
      // But we shouldn't call any lifecycle methods or callbacks. Remove
      // all lifecycle effect tags.
      sourceFiber.flags &= ~(LifecycleEffectMask | Incomplete);

      if (sourceFiber.tag === ClassComponent) {
        const currentSourceFiber = sourceFiber.alternate;
        if (currentSourceFiber === null) {
          // This is a new mount. Change the tag so it's not mistaken for a
          // completed class component. For example, we should not call
          // componentWillUnmount if it is deleted.
          sourceFiber.tag = IncompleteClassComponent;
        } else {
          // When we try rendering again, we should not reuse the current fiber,
          // since it's known to be in an inconsistent state. Use a force update to
          // prevent a bail out.
          const update = createUpdate(NoTimestamp, SyncLane);
          update.tag = ForceUpdate;
          enqueueUpdate(sourceFiber, update, SyncLane);
        }
      }

      // The source fiber did not complete. Mark it with Sync priority to
      // indicate that it still has pending work.
      sourceFiber.lanes = mergeLanes(sourceFiber.lanes, SyncLane);
    }
    return suspenseBoundary;
  }
  // Confirmed that the boundary is in a concurrent mode tree. Continue
  // with the normal suspend path.
  //
  // After this we'll use a set of heuristics to determine whether this
  // render pass will run to completion or restart or "suspend" the commit.
  // The actual logic for this is spread out in different places.
  //
  // This first principle is that if we're going to suspend when we complete
  // a root, then we should also restart if we get an update or ping that
  // might unsuspend it, and vice versa. The only reason to suspend is
  // because you think you might want to restart before committing. However,
  // it doesn't make sense to restart only while in the period we're suspended.
  //
  // Restarting too aggressively is also not good because it starves out any
  // intermediate loading state. So we use heuristics to determine when.

  // Suspense Heuristics
  //
  // If nothing threw a Promise or all the same fallbacks are already showing,
  // then don't suspend/restart.
  //
  // If this is an initial render of a new tree of Suspense boundaries and
  // those trigger a fallback, then don't suspend/restart. We want to ensure
  // that we can show the initial loading state as quickly as possible.
  //
  // If we hit a "Delayed" case, such as when we'd switch from content back into
  // a fallback, then we should always suspend/restart. Transitions apply
  // to this case. If none is defined, JND is used instead.
  //
  // If we're already showing a fallback and it gets "retried", allowing us to show
  // another level, but there's still an inner boundary that would show a fallback,
  // then we suspend/restart for 500ms since the last time we showed a fallback
  // anywhere in the tree. This effectively throttles progressive loading into a
  // consistent train of commits. This also gives us an opportunity to restart to
  // get to the completed state slightly earlier.
  //
  // If there's ambiguity due to batching it's resolved in preference of:
  // 1) "delayed", 2) "initial render", 3) "retry".
  //
  // We want to ensure that a "busy" state doesn't get force committed. We want to
  // ensure that new initial loading states can commit as soon as possible.
  suspenseBoundary.flags |= ShouldCapture;
  // TODO: I think we can remove this, since we now use `DidCapture` in
  // the begin phase to prevent an early bailout.
  suspenseBoundary.lanes = rootRenderLanes;
  return suspenseBoundary;
}

function throwException(
  root: FiberRoot,
  returnFiber: Fiber,
  sourceFiber: Fiber,
  value: mixed,
  rootRenderLanes: Lanes,
): void {
  // The source fiber did not complete.
  sourceFiber.flags |= Incomplete;

  if (enableUpdaterTracking) {
    if (isDevToolsPresent) {
      // If we have pending work still, restore the original updaters
      restorePendingUpdaters(root, rootRenderLanes);
    }
  }

  if (
    value !== null &&
    typeof value === 'object' &&
    typeof value.then === 'function'
  ) {
    // This is a wakeable. The component suspended.
    const wakeable: Wakeable = (value: any);
    resetSuspendedComponent(sourceFiber, rootRenderLanes);

    if (__DEV__) {
      if (getIsHydrating() && sourceFiber.mode & ConcurrentMode) {
        markDidThrowWhileHydratingDEV();
      }
    }

    if (__DEV__) {
      if (enableDebugTracing) {
        if (sourceFiber.mode & DebugTracingMode) {
          const name = getComponentNameFromFiber(sourceFiber) || 'Unknown';
          logComponentSuspended(name, wakeable);
        }
      }
    }

    // Schedule the nearest Suspense to re-render the timed out view.
    const suspenseBoundary = getSuspenseHandler();
    if (suspenseBoundary !== null) {
      switch (suspenseBoundary.tag) {
        case SuspenseComponent: {
          suspenseBoundary.flags &= ~ForceClientRender;
          markSuspenseBoundaryShouldCapture(
            suspenseBoundary,
            returnFiber,
            sourceFiber,
            root,
            rootRenderLanes,
          );
          // Retry listener
          //
          // If the fallback does commit, we need to attach a different type of
          // listener. This one schedules an update on the Suspense boundary to
          // turn the fallback state off.
          //
          // Stash the wakeable on the boundary fiber so we can access it in the
          // commit phase.
          //
          // When the wakeable resolves, we'll attempt to render the boundary
          // again ("retry").
          const wakeables: Set<Wakeable> | null = (suspenseBoundary.updateQueue: any);
          if (wakeables === null) {
            suspenseBoundary.updateQueue = new Set([wakeable]);
          } else {
            wakeables.add(wakeable);
          }
          break;
        }
        case OffscreenComponent: {
          if (suspenseBoundary.mode & ConcurrentMode) {
            suspenseBoundary.flags |= ShouldCapture;
            const offscreenQueue: OffscreenQueue | null = (suspenseBoundary.updateQueue: any);
            if (offscreenQueue === null) {
              const newOffscreenQueue: OffscreenQueue = {
                transitions: null,
                markerInstances: null,
                wakeables: new Set([wakeable]),
              };
              suspenseBoundary.updateQueue = newOffscreenQueue;
            } else {
              const wakeables = offscreenQueue.wakeables;
              if (wakeables === null) {
                offscreenQueue.wakeables = new Set([wakeable]);
              } else {
                wakeables.add(wakeable);
              }
            }
            break;
          }
        }
        // eslint-disable-next-line no-fallthrough
        default: {
          throw new Error(
            `Unexpected Suspense handler tag (${suspenseBoundary.tag}). This ` +
              'is a bug in React.',
          );
        }
      }
      // We only attach ping listeners in concurrent mode. Legacy Suspense always
      // commits fallbacks synchronously, so there are no pings.
      if (suspenseBoundary.mode & ConcurrentMode) {
        attachPingListener(root, wakeable, rootRenderLanes);
      }
      return;
    } else {
      // No boundary was found. Unless this is a sync update, this is OK.
      // We can suspend and wait for more data to arrive.

      if (!includesSyncLane(rootRenderLanes)) {
        // This is not a sync update. Suspend. Since we're not activating a
        // Suspense boundary, this will unwind all the way to the root without
        // performing a second pass to render a fallback. (This is arguably how
        // refresh transitions should work, too, since we're not going to commit
        // the fallbacks anyway.)
        //
        // This case also applies to initial hydration.
        attachPingListener(root, wakeable, rootRenderLanes);
        renderDidSuspendDelayIfPossible();
        return;
      }

      // This is a sync/discrete update. We treat this case like an error
      // because discrete renders are expected to produce a complete tree
      // synchronously to maintain consistency with external state.
      const uncaughtSuspenseError = new Error(
        'A component suspended while responding to synchronous input. This ' +
          'will cause the UI to be replaced with a loading indicator. To ' +
          'fix, updates that suspend should be wrapped ' +
          'with startTransition.',
      );

      // If we're outside a transition, fall through to the regular error path.
      // The error will be caught by the nearest suspense boundary.
      value = uncaughtSuspenseError;
    }
  } else {
    // This is a regular error, not a Suspense wakeable.
    if (getIsHydrating() && sourceFiber.mode & ConcurrentMode) {
      markDidThrowWhileHydratingDEV();
      const suspenseBoundary = getSuspenseHandler();
      // If the error was thrown during hydration, we may be able to recover by
      // discarding the dehydrated content and switching to a client render.
      // Instead of surfacing the error, find the nearest Suspense boundary
      // and render it again without hydration.
      if (suspenseBoundary !== null) {
        if ((suspenseBoundary.flags & ShouldCapture) === NoFlags) {
          // Set a flag to indicate that we should try rendering the normal
          // children again, not the fallback.
          suspenseBoundary.flags |= ForceClientRender;
        }
        markSuspenseBoundaryShouldCapture(
          suspenseBoundary,
          returnFiber,
          sourceFiber,
          root,
          rootRenderLanes,
        );

        // Even though the user may not be affected by this error, we should
        // still log it so it can be fixed.
        queueHydrationError(createCapturedValueAtFiber(value, sourceFiber));
        return;
      }
    } else {
      // Otherwise, fall through to the error path.
    }
  }

  value = createCapturedValueAtFiber(value, sourceFiber);
  renderDidError(value);

  // We didn't find a boundary that could handle this type of exception. Start
  // over and traverse parent path again, this time treating the exception
  // as an error.
  let workInProgress = returnFiber;
  do {
    switch (workInProgress.tag) {
      case HostRoot: {
        const errorInfo = value;
        workInProgress.flags |= ShouldCapture;
        const lane = pickArbitraryLane(rootRenderLanes);
        workInProgress.lanes = mergeLanes(workInProgress.lanes, lane);
        const update = createRootErrorUpdate(workInProgress, errorInfo, lane);
        enqueueCapturedUpdate(workInProgress, update);
        return;
      }
      case ClassComponent:
        // Capture and retry
        const errorInfo = value;
        const ctor = workInProgress.type;
        const instance = workInProgress.stateNode;
        if (
          (workInProgress.flags & DidCapture) === NoFlags &&
          (typeof ctor.getDerivedStateFromError === 'function' ||
            (instance !== null &&
              typeof instance.componentDidCatch === 'function' &&
              !isAlreadyFailedLegacyErrorBoundary(instance)))
        ) {
          workInProgress.flags |= ShouldCapture;
          const lane = pickArbitraryLane(rootRenderLanes);
          workInProgress.lanes = mergeLanes(workInProgress.lanes, lane);
          // Schedule the error boundary to re-render using updated state
          const update = createClassErrorUpdate(
            workInProgress,
            errorInfo,
            lane,
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

export {throwException, createRootErrorUpdate, createClassErrorUpdate};
