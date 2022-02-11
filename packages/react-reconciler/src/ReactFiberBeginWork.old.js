/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactProviderType, ReactContext} from 'shared/ReactTypes';
import type {LazyComponent as LazyComponentType} from 'react/src/ReactLazy';
import type {Fiber, FiberRoot} from './ReactInternalTypes';
import type {TypeOfMode} from './ReactTypeOfMode';
import type {Lanes, Lane} from './ReactFiberLane.old';
import type {MutableSource} from 'shared/ReactTypes';
import type {
  SuspenseState,
  SuspenseListRenderState,
  SuspenseListTailMode,
} from './ReactFiberSuspenseComponent.old';
import type {SuspenseContext} from './ReactFiberSuspenseContext.old';
import type {
  OffscreenProps,
  OffscreenState,
} from './ReactFiberOffscreenComponent';
import type {
  Cache,
  CacheComponentState,
  SpawnedCachePool,
} from './ReactFiberCacheComponent.old';
import type {UpdateQueue} from './ReactUpdateQueue.old';
import {enableSuspenseAvoidThisFallback} from 'shared/ReactFeatureFlags';

import checkPropTypes from 'shared/checkPropTypes';
import {
  markComponentRenderStarted,
  markComponentRenderStopped,
  setIsStrictModeForDevtools,
} from './ReactFiberDevToolsHook.old';
import {
  IndeterminateComponent,
  FunctionComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  ForwardRef,
  Fragment,
  Mode,
  ContextProvider,
  ContextConsumer,
  Profiler,
  SuspenseComponent,
  SuspenseListComponent,
  MemoComponent,
  SimpleMemoComponent,
  LazyComponent,
  IncompleteClassComponent,
  ScopeComponent,
  OffscreenComponent,
  LegacyHiddenComponent,
  CacheComponent,
  TracingMarkerComponent,
} from './ReactWorkTags';
import {
  NoFlags,
  PerformedWork,
  Placement,
  Hydrating,
  ContentReset,
  DidCapture,
  Update,
  Ref,
  RefStatic,
  ChildDeletion,
  ForceUpdateForLegacySuspense,
  StaticMask,
  ShouldCapture,
  ForceClientRender,
} from './ReactFiberFlags';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import {
  debugRenderPhaseSideEffectsForStrictMode,
  disableLegacyContext,
  disableModulePatternComponents,
  enableProfilerCommitHooks,
  enableProfilerTimer,
  enableSuspenseServerRenderer,
  warnAboutDefaultPropsOnFunctionComponents,
  enableScopeAPI,
  enableCache,
  enableLazyContextPropagation,
  enableSuspenseLayoutEffectSemantics,
  enableSchedulingProfiler,
  enablePersistentOffscreenHostContainer,
  enableTransitionTracing,
} from 'shared/ReactFeatureFlags';
import isArray from 'shared/isArray';
import shallowEqual from 'shared/shallowEqual';
import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
import getComponentNameFromType from 'shared/getComponentNameFromType';
import ReactStrictModeWarnings from './ReactStrictModeWarnings.old';
import {REACT_LAZY_TYPE, getIteratorFn} from 'shared/ReactSymbols';
import {
  getCurrentFiberOwnerNameInDevOrNull,
  setIsRendering,
} from './ReactCurrentFiber';
import {
  resolveFunctionForHotReloading,
  resolveForwardRefForHotReloading,
  resolveClassForHotReloading,
} from './ReactFiberHotReloading.old';

import {
  mountChildFibers,
  reconcileChildFibers,
  cloneChildFibers,
} from './ReactChildFiber.old';
import {
  processUpdateQueue,
  cloneUpdateQueue,
  initializeUpdateQueue,
  enqueueCapturedUpdate,
} from './ReactUpdateQueue.old';
import {
  NoLane,
  NoLanes,
  SyncLane,
  OffscreenLane,
  DefaultHydrationLane,
  SomeRetryLane,
  NoTimestamp,
  includesSomeLane,
  laneToLanes,
  removeLanes,
  mergeLanes,
  getBumpedLaneForHydration,
  pickArbitraryLane,
} from './ReactFiberLane.old';
import {
  ConcurrentMode,
  NoMode,
  ProfileMode,
  StrictLegacyMode,
} from './ReactTypeOfMode';
import {
  shouldSetTextContent,
  isSuspenseInstancePending,
  isSuspenseInstanceFallback,
  registerSuspenseInstanceRetry,
  supportsHydration,
  isPrimaryRenderer,
  supportsPersistence,
  getOffscreenContainerProps,
} from './ReactFiberHostConfig';
import type {SuspenseInstance} from './ReactFiberHostConfig';
import {shouldError, shouldSuspend} from './ReactFiberReconciler';
import {pushHostContext, pushHostContainer} from './ReactFiberHostContext.old';
import {
  suspenseStackCursor,
  pushSuspenseContext,
  InvisibleParentSuspenseContext,
  ForceSuspenseFallback,
  hasSuspenseContext,
  setDefaultShallowSuspenseContext,
  addSubtreeSuspenseContext,
  setShallowSuspenseContext,
} from './ReactFiberSuspenseContext.old';
import {findFirstSuspended} from './ReactFiberSuspenseComponent.old';
import {
  pushProvider,
  propagateContextChange,
  lazilyPropagateParentContextChanges,
  propagateParentContextChangesToDeferredTree,
  checkIfContextChanged,
  readContext,
  prepareToReadContext,
  scheduleContextWorkOnParentPath,
} from './ReactFiberNewContext.old';
import {
  renderWithHooks,
  checkDidRenderIdHook,
  bailoutHooks,
} from './ReactFiberHooks.old';
import {stopProfilerTimerIfRunning} from './ReactProfilerTimer.old';
import {
  getMaskedContext,
  getUnmaskedContext,
  hasContextChanged as hasLegacyContextChanged,
  pushContextProvider as pushLegacyContextProvider,
  isContextProvider as isLegacyContextProvider,
  pushTopLevelContextObject,
  invalidateContextProvider,
} from './ReactFiberContext.old';
import {
  getIsHydrating,
  enterHydrationState,
  reenterHydrationStateFromDehydratedSuspenseInstance,
  resetHydrationState,
  tryToClaimNextHydratableInstance,
  warnIfHydrating,
} from './ReactFiberHydrationContext.old';
import {
  adoptClassInstance,
  constructClassInstance,
  mountClassInstance,
  resumeMountClassInstance,
  updateClassInstance,
} from './ReactFiberClassComponent.old';
import {resolveDefaultProps} from './ReactFiberLazyComponent.old';
import {
  resolveLazyComponentTag,
  createFiberFromTypeAndProps,
  createFiberFromFragment,
  createFiberFromOffscreen,
  createWorkInProgress,
  createOffscreenHostContainerFiber,
  isSimpleFunctionComponent,
} from './ReactFiber.old';
import {
  retryDehydratedSuspenseBoundary,
  scheduleUpdateOnFiber,
  renderDidSuspendDelayIfPossible,
  markSkippedUpdateLanes,
  getWorkInProgressRoot,
  pushRenderLanes,
  getExecutionContext,
  RetryAfterError,
  NoContext,
} from './ReactFiberWorkLoop.old';
import {setWorkInProgressVersion} from './ReactMutableSource.old';
import {
  requestCacheFromPool,
  pushCacheProvider,
  pushRootCachePool,
  CacheContext,
  getSuspendedCachePool,
  restoreSpawnedCachePool,
  getOffscreenDeferredCachePool,
} from './ReactFiberCacheComponent.old';
import {createCapturedValue} from './ReactCapturedValue';
import {createClassErrorUpdate} from './ReactFiberThrow.old';
import {completeSuspendedOffscreenHostContainer} from './ReactFiberCompleteWork.old';
import is from 'shared/objectIs';
import {
  getForksAtLevel,
  isForkedChild,
  pushTreeId,
  pushMaterializedTreeId,
} from './ReactFiberTreeContext.old';

const ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;

let didReceiveUpdate: boolean = false;

let didWarnAboutBadClass;
let didWarnAboutModulePatternComponent;
let didWarnAboutContextTypeOnFunctionComponent;
let didWarnAboutGetDerivedStateOnFunctionComponent;
let didWarnAboutFunctionRefs;
export let didWarnAboutReassigningProps;
let didWarnAboutRevealOrder;
let didWarnAboutTailOptions;
let didWarnAboutDefaultPropsOnFunctionComponent;

if (__DEV__) {
  didWarnAboutBadClass = {};
  didWarnAboutModulePatternComponent = {};
  didWarnAboutContextTypeOnFunctionComponent = {};
  didWarnAboutGetDerivedStateOnFunctionComponent = {};
  didWarnAboutFunctionRefs = {};
  didWarnAboutReassigningProps = false;
  didWarnAboutRevealOrder = {};
  didWarnAboutTailOptions = {};
  didWarnAboutDefaultPropsOnFunctionComponent = {};
}

export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderLanes: Lanes,
) {
  if (current === null) {
    // If this is a fresh new component that hasn't been rendered yet, we
    // won't update its child set by applying minimal side-effects. Instead,
    // we will add them all to the child before it gets rendered. That means
    // we can optimize this reconciliation pass by not tracking side-effects.
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes,
    );
  } else {
    // If the current child is the same as the work in progress, it means that
    // we haven't yet started any work on these children. Therefore, we use
    // the clone algorithm to create a copy of all the current children.

    // If we had any progressed work already, that is invalid at this point so
    // let's throw it out.
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes,
    );
  }
}

function forceUnmountCurrentAndReconcile(
  current: Fiber,
  workInProgress: Fiber,
  nextChildren: any,
  renderLanes: Lanes,
) {
  // This function is fork of reconcileChildren. It's used in cases where we
  // want to reconcile without matching against the existing set. This has the
  // effect of all current children being unmounted; even if the type and key
  // are the same, the old child is unmounted and a new child is created.
  //
  // To do this, we're going to go through the reconcile algorithm twice. In
  // the first pass, we schedule a deletion for all the current children by
  // passing null.
  workInProgress.child = reconcileChildFibers(
    workInProgress,
    current.child,
    null,
    renderLanes,
  );
  // In the second pass, we mount the new children. The trick here is that we
  // pass null in place of where we usually pass the current child set. This has
  // the effect of remounting all children regardless of whether their
  // identities match.
  workInProgress.child = reconcileChildFibers(
    workInProgress,
    null,
    nextChildren,
    renderLanes,
  );
}

function updateForwardRef(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes,
) {
  // TODO: current can be non-null here even if the component
  // hasn't yet mounted. This happens after the first render suspends.
  // We'll need to figure out if this is fine or can cause issues.

  if (__DEV__) {
    if (workInProgress.type !== workInProgress.elementType) {
      // Lazy component props can't be validated in createElement
      // because they're only guaranteed to be resolved here.
      const innerPropTypes = Component.propTypes;
      if (innerPropTypes) {
        checkPropTypes(
          innerPropTypes,
          nextProps, // Resolved props
          'prop',
          getComponentNameFromType(Component),
        );
      }
    }
  }

  const render = Component.render;
  const ref = workInProgress.ref;

  // The rest is a fork of updateFunctionComponent
  let nextChildren;
  let hasId;
  prepareToReadContext(workInProgress, renderLanes);
  if (enableSchedulingProfiler) {
    markComponentRenderStarted(workInProgress);
  }
  if (__DEV__) {
    ReactCurrentOwner.current = workInProgress;
    setIsRendering(true);
    nextChildren = renderWithHooks(
      current,
      workInProgress,
      render,
      nextProps,
      ref,
      renderLanes,
    );
    hasId = checkDidRenderIdHook();
    if (
      debugRenderPhaseSideEffectsForStrictMode &&
      workInProgress.mode & StrictLegacyMode
    ) {
      setIsStrictModeForDevtools(true);
      try {
        nextChildren = renderWithHooks(
          current,
          workInProgress,
          render,
          nextProps,
          ref,
          renderLanes,
        );
        hasId = checkDidRenderIdHook();
      } finally {
        setIsStrictModeForDevtools(false);
      }
    }
    setIsRendering(false);
  } else {
    nextChildren = renderWithHooks(
      current,
      workInProgress,
      render,
      nextProps,
      ref,
      renderLanes,
    );
    hasId = checkDidRenderIdHook();
  }
  if (enableSchedulingProfiler) {
    markComponentRenderStopped();
  }

  if (current !== null && !didReceiveUpdate) {
    bailoutHooks(current, workInProgress, renderLanes);
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }

  if (getIsHydrating() && hasId) {
    pushMaterializedTreeId(workInProgress);
  }

  // React DevTools reads this flag.
  workInProgress.flags |= PerformedWork;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}

function updateMemoComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes,
): null | Fiber {
  if (current === null) {
    const type = Component.type;
    if (
      isSimpleFunctionComponent(type) &&
      Component.compare === null &&
      // SimpleMemoComponent codepath doesn't resolve outer props either.
      Component.defaultProps === undefined
    ) {
      let resolvedType = type;
      if (__DEV__) {
        resolvedType = resolveFunctionForHotReloading(type);
      }
      // If this is a plain function component without default props,
      // and with only the default shallow comparison, we upgrade it
      // to a SimpleMemoComponent to allow fast path updates.
      workInProgress.tag = SimpleMemoComponent;
      workInProgress.type = resolvedType;
      if (__DEV__) {
        validateFunctionComponentInDev(workInProgress, type);
      }
      return updateSimpleMemoComponent(
        current,
        workInProgress,
        resolvedType,
        nextProps,
        renderLanes,
      );
    }
    if (__DEV__) {
      const innerPropTypes = type.propTypes;
      if (innerPropTypes) {
        // Inner memo component props aren't currently validated in createElement.
        // We could move it there, but we'd still need this for lazy code path.
        checkPropTypes(
          innerPropTypes,
          nextProps, // Resolved props
          'prop',
          getComponentNameFromType(type),
        );
      }
    }
    const child = createFiberFromTypeAndProps(
      Component.type,
      null,
      nextProps,
      workInProgress,
      workInProgress.mode,
      renderLanes,
    );
    child.ref = workInProgress.ref;
    child.return = workInProgress;
    workInProgress.child = child;
    return child;
  }
  if (__DEV__) {
    const type = Component.type;
    const innerPropTypes = type.propTypes;
    if (innerPropTypes) {
      // Inner memo component props aren't currently validated in createElement.
      // We could move it there, but we'd still need this for lazy code path.
      checkPropTypes(
        innerPropTypes,
        nextProps, // Resolved props
        'prop',
        getComponentNameFromType(type),
      );
    }
  }
  const currentChild = ((current.child: any): Fiber); // This is always exactly one child
  const hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(
    current,
    renderLanes,
  );
  if (!hasScheduledUpdateOrContext) {
    // This will be the props with resolved defaultProps,
    // unlike current.memoizedProps which will be the unresolved ones.
    const prevProps = currentChild.memoizedProps;
    // Default to shallow comparison
    let compare = Component.compare;
    compare = compare !== null ? compare : shallowEqual;
    if (compare(prevProps, nextProps) && current.ref === workInProgress.ref) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }
  }
  // React DevTools reads this flag.
  workInProgress.flags |= PerformedWork;
  const newChild = createWorkInProgress(currentChild, nextProps);
  newChild.ref = workInProgress.ref;
  newChild.return = workInProgress;
  workInProgress.child = newChild;
  return newChild;
}

function updateSimpleMemoComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes,
): null | Fiber {
  // TODO: current can be non-null here even if the component
  // hasn't yet mounted. This happens when the inner render suspends.
  // We'll need to figure out if this is fine or can cause issues.

  if (__DEV__) {
    if (workInProgress.type !== workInProgress.elementType) {
      // Lazy component props can't be validated in createElement
      // because they're only guaranteed to be resolved here.
      let outerMemoType = workInProgress.elementType;
      if (outerMemoType.$$typeof === REACT_LAZY_TYPE) {
        // We warn when you define propTypes on lazy()
        // so let's just skip over it to find memo() outer wrapper.
        // Inner props for memo are validated later.
        const lazyComponent: LazyComponentType<any, any> = outerMemoType;
        const payload = lazyComponent._payload;
        const init = lazyComponent._init;
        try {
          outerMemoType = init(payload);
        } catch (x) {
          outerMemoType = null;
        }
        // Inner propTypes will be validated in the function component path.
        const outerPropTypes = outerMemoType && (outerMemoType: any).propTypes;
        if (outerPropTypes) {
          checkPropTypes(
            outerPropTypes,
            nextProps, // Resolved (SimpleMemoComponent has no defaultProps)
            'prop',
            getComponentNameFromType(outerMemoType),
          );
        }
      }
    }
  }
  if (current !== null) {
    const prevProps = current.memoizedProps;
    if (
      shallowEqual(prevProps, nextProps) &&
      current.ref === workInProgress.ref &&
      // Prevent bailout if the implementation changed due to hot reload.
      (__DEV__ ? workInProgress.type === current.type : true)
    ) {
      didReceiveUpdate = false;
      if (!checkScheduledUpdateOrContext(current, renderLanes)) {
        // The pending lanes were cleared at the beginning of beginWork. We're
        // about to bail out, but there might be other lanes that weren't
        // included in the current render. Usually, the priority level of the
        // remaining updates is accumulated during the evaluation of the
        // component (i.e. when processing the update queue). But since since
        // we're bailing out early *without* evaluating the component, we need
        // to account for it here, too. Reset to the value of the current fiber.
        // NOTE: This only applies to SimpleMemoComponent, not MemoComponent,
        // because a MemoComponent fiber does not have hooks or an update queue;
        // rather, it wraps around an inner component, which may or may not
        // contains hooks.
        // TODO: Move the reset at in beginWork out of the common path so that
        // this is no longer necessary.
        workInProgress.lanes = current.lanes;
        return bailoutOnAlreadyFinishedWork(
          current,
          workInProgress,
          renderLanes,
        );
      } else if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {
        // This is a special case that only exists for legacy mode.
        // See https://github.com/facebook/react/pull/19216.
        didReceiveUpdate = true;
      }
    }
  }
  return updateFunctionComponent(
    current,
    workInProgress,
    Component,
    nextProps,
    renderLanes,
  );
}

function updateOffscreenComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  const nextProps: OffscreenProps = workInProgress.pendingProps;
  const nextChildren = nextProps.children;

  const prevState: OffscreenState | null =
    current !== null ? current.memoizedState : null;

  // If this is not null, this is a cache pool that was carried over from the
  // previous render. We will push this to the cache pool context so that we can
  // resume in-flight requests.
  let spawnedCachePool: SpawnedCachePool | null = null;

  if (
    nextProps.mode === 'hidden' ||
    nextProps.mode === 'unstable-defer-without-hiding'
  ) {
    // Rendering a hidden tree.
    if ((workInProgress.mode & ConcurrentMode) === NoMode) {
      // In legacy sync mode, don't defer the subtree. Render it now.
      const nextState: OffscreenState = {
        baseLanes: NoLanes,
        cachePool: null,
      };
      workInProgress.memoizedState = nextState;
      pushRenderLanes(workInProgress, renderLanes);
    } else if (!includesSomeLane(renderLanes, (OffscreenLane: Lane))) {
      // We're hidden, and we're not rendering at Offscreen. We will bail out
      // and resume this tree later.
      let nextBaseLanes;
      if (prevState !== null) {
        const prevBaseLanes = prevState.baseLanes;
        nextBaseLanes = mergeLanes(prevBaseLanes, renderLanes);
        if (enableCache) {
          // Save the cache pool so we can resume later.
          spawnedCachePool = getOffscreenDeferredCachePool();
          // We don't need to push to the cache pool because we're about to
          // bail out. There won't be a context mismatch because we only pop
          // the cache pool if `updateQueue` is non-null.
        }
      } else {
        nextBaseLanes = renderLanes;
      }

      // Schedule this fiber to re-render at offscreen priority. Then bailout.
      workInProgress.lanes = workInProgress.childLanes = laneToLanes(
        OffscreenLane,
      );
      const nextState: OffscreenState = {
        baseLanes: nextBaseLanes,
        cachePool: spawnedCachePool,
      };
      workInProgress.memoizedState = nextState;
      workInProgress.updateQueue = null;
      // We're about to bail out, but we need to push this to the stack anyway
      // to avoid a push/pop misalignment.
      pushRenderLanes(workInProgress, nextBaseLanes);

      if (enableLazyContextPropagation && current !== null) {
        // Since this tree will resume rendering in a separate render, we need
        // to propagate parent contexts now so we don't lose track of which
        // ones changed.
        propagateParentContextChangesToDeferredTree(
          current,
          workInProgress,
          renderLanes,
        );
      }

      return null;
    } else {
      // This is the second render. The surrounding visible content has already
      // committed. Now we resume rendering the hidden tree.

      if (enableCache && prevState !== null) {
        // If the render that spawned this one accessed the cache pool, resume
        // using the same cache. Unless the parent changed, since that means
        // there was a refresh.
        const prevCachePool = prevState.cachePool;
        if (prevCachePool !== null) {
          spawnedCachePool = restoreSpawnedCachePool(
            workInProgress,
            prevCachePool,
          );
        }
      }

      // Rendering at offscreen, so we can clear the base lanes.
      const nextState: OffscreenState = {
        baseLanes: NoLanes,
        cachePool: null,
      };
      workInProgress.memoizedState = nextState;
      // Push the lanes that were skipped when we bailed out.
      const subtreeRenderLanes =
        prevState !== null ? prevState.baseLanes : renderLanes;
      pushRenderLanes(workInProgress, subtreeRenderLanes);
    }
  } else {
    // Rendering a visible tree.
    let subtreeRenderLanes;
    if (prevState !== null) {
      // We're going from hidden -> visible.

      subtreeRenderLanes = mergeLanes(prevState.baseLanes, renderLanes);

      if (enableCache) {
        // If the render that spawned this one accessed the cache pool, resume
        // using the same cache. Unless the parent changed, since that means
        // there was a refresh.
        const prevCachePool = prevState.cachePool;
        if (prevCachePool !== null) {
          spawnedCachePool = restoreSpawnedCachePool(
            workInProgress,
            prevCachePool,
          );
        }
      }

      // Since we're not hidden anymore, reset the state
      workInProgress.memoizedState = null;
    } else {
      // We weren't previously hidden, and we still aren't, so there's nothing
      // special to do. Need to push to the stack regardless, though, to avoid
      // a push/pop misalignment.
      subtreeRenderLanes = renderLanes;
    }
    pushRenderLanes(workInProgress, subtreeRenderLanes);
  }

  if (enableCache) {
    // If we have a cache pool from a previous render attempt, then this will be
    // non-null. We use this to infer whether to push/pop the cache context.
    workInProgress.updateQueue = spawnedCachePool;
  }

  if (enablePersistentOffscreenHostContainer && supportsPersistence) {
    // In persistent mode, the offscreen children are wrapped in a host node.
    // TODO: Optimize this to use the OffscreenComponent fiber instead of
    // an extra HostComponent fiber. Need to make sure this doesn't break Fabric
    // or some other infra that expects a HostComponent.
    const isHidden =
      nextProps.mode === 'hidden' &&
      workInProgress.tag !== LegacyHiddenComponent;
    const offscreenContainer = reconcileOffscreenHostContainer(
      current,
      workInProgress,
      isHidden,
      nextChildren,
      renderLanes,
    );
    return offscreenContainer;
  } else {
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
  }
}

function reconcileOffscreenHostContainer(
  currentOffscreen: Fiber | null,
  offscreen: Fiber,
  isHidden: boolean,
  children: any,
  renderLanes: Lanes,
) {
  const containerProps = getOffscreenContainerProps(
    isHidden ? 'hidden' : 'visible',
    children,
  );
  let hostContainer;
  if (currentOffscreen === null) {
    hostContainer = createOffscreenHostContainerFiber(
      containerProps,
      offscreen.mode,
      renderLanes,
      null,
    );
  } else {
    const currentHostContainer = currentOffscreen.child;
    if (currentHostContainer === null) {
      hostContainer = createOffscreenHostContainerFiber(
        containerProps,
        offscreen.mode,
        renderLanes,
        null,
      );
      hostContainer.flags |= Placement;
    } else {
      hostContainer = createWorkInProgress(
        currentHostContainer,
        containerProps,
      );
    }
  }
  hostContainer.return = offscreen;
  offscreen.child = hostContainer;
  return hostContainer;
}

// Note: These happen to have identical begin phases, for now. We shouldn't hold
// ourselves to this constraint, though. If the behavior diverges, we should
// fork the function.
const updateLegacyHiddenComponent = updateOffscreenComponent;

function updateCacheComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  if (!enableCache) {
    return null;
  }

  prepareToReadContext(workInProgress, renderLanes);
  const parentCache = readContext(CacheContext);

  if (current === null) {
    // Initial mount. Request a fresh cache from the pool.
    const freshCache = requestCacheFromPool(renderLanes);
    const initialState: CacheComponentState = {
      parent: parentCache,
      cache: freshCache,
    };
    workInProgress.memoizedState = initialState;
    initializeUpdateQueue(workInProgress);
    pushCacheProvider(workInProgress, freshCache);
  } else {
    // Check for updates
    if (includesSomeLane(current.lanes, renderLanes)) {
      cloneUpdateQueue(current, workInProgress);
      processUpdateQueue(workInProgress, null, null, renderLanes);
    }
    const prevState: CacheComponentState = current.memoizedState;
    const nextState: CacheComponentState = workInProgress.memoizedState;

    // Compare the new parent cache to the previous to see detect there was
    // a refresh.
    if (prevState.parent !== parentCache) {
      // Refresh in parent. Update the parent.
      const derivedState: CacheComponentState = {
        parent: parentCache,
        cache: parentCache,
      };

      // Copied from getDerivedStateFromProps implementation. Once the update
      // queue is empty, persist the derived state onto the base state.
      workInProgress.memoizedState = derivedState;
      if (workInProgress.lanes === NoLanes) {
        const updateQueue: UpdateQueue<any> = (workInProgress.updateQueue: any);
        workInProgress.memoizedState = updateQueue.baseState = derivedState;
      }

      pushCacheProvider(workInProgress, parentCache);
      // No need to propagate a context change because the refreshed parent
      // already did.
    } else {
      // The parent didn't refresh. Now check if this cache did.
      const nextCache = nextState.cache;
      pushCacheProvider(workInProgress, nextCache);
      if (nextCache !== prevState.cache) {
        // This cache refreshed. Propagate a context change.
        propagateContextChange(workInProgress, CacheContext, renderLanes);
      }
    }
  }

  const nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}

// This should only be called if the name changes
function updateTracingMarkerComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  if (!enableTransitionTracing) {
    return null;
  }

  const nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}

function updateFragment(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  const nextChildren = workInProgress.pendingProps;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}

function updateMode(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  const nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}

function updateProfiler(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  if (enableProfilerTimer) {
    workInProgress.flags |= Update;

    if (enableProfilerCommitHooks) {
      // Reset effect durations for the next eventual effect phase.
      // These are reset during render to allow the DevTools commit hook a chance to read them,
      const stateNode = workInProgress.stateNode;
      stateNode.effectDuration = 0;
      stateNode.passiveEffectDuration = 0;
    }
  }
  const nextProps = workInProgress.pendingProps;
  const nextChildren = nextProps.children;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}

function markRef(current: Fiber | null, workInProgress: Fiber) {
  const ref = workInProgress.ref;
  if (
    (current === null && ref !== null) ||
    (current !== null && current.ref !== ref)
  ) {
    // Schedule a Ref effect
    workInProgress.flags |= Ref;
    if (enableSuspenseLayoutEffectSemantics) {
      workInProgress.flags |= RefStatic;
    }
  }
}

function updateFunctionComponent(
  current,
  workInProgress,
  Component,
  nextProps: any,
  renderLanes,
) {
  if (__DEV__) {
    if (workInProgress.type !== workInProgress.elementType) {
      // Lazy component props can't be validated in createElement
      // because they're only guaranteed to be resolved here.
      const innerPropTypes = Component.propTypes;
      if (innerPropTypes) {
        checkPropTypes(
          innerPropTypes,
          nextProps, // Resolved props
          'prop',
          getComponentNameFromType(Component),
        );
      }
    }
  }

  let context;
  if (!disableLegacyContext) {
    const unmaskedContext = getUnmaskedContext(workInProgress, Component, true);
    context = getMaskedContext(workInProgress, unmaskedContext);
  }

  let nextChildren;
  let hasId;
  prepareToReadContext(workInProgress, renderLanes);
  if (enableSchedulingProfiler) {
    markComponentRenderStarted(workInProgress);
  }
  if (__DEV__) {
    ReactCurrentOwner.current = workInProgress;
    setIsRendering(true);
    nextChildren = renderWithHooks(
      current,
      workInProgress,
      Component,
      nextProps,
      context,
      renderLanes,
    );
    hasId = checkDidRenderIdHook();
    if (
      debugRenderPhaseSideEffectsForStrictMode &&
      workInProgress.mode & StrictLegacyMode
    ) {
      setIsStrictModeForDevtools(true);
      try {
        nextChildren = renderWithHooks(
          current,
          workInProgress,
          Component,
          nextProps,
          context,
          renderLanes,
        );
        hasId = checkDidRenderIdHook();
      } finally {
        setIsStrictModeForDevtools(false);
      }
    }
    setIsRendering(false);
  } else {
    nextChildren = renderWithHooks(
      current,
      workInProgress,
      Component,
      nextProps,
      context,
      renderLanes,
    );
    hasId = checkDidRenderIdHook();
  }
  if (enableSchedulingProfiler) {
    markComponentRenderStopped();
  }

  if (current !== null && !didReceiveUpdate) {
    bailoutHooks(current, workInProgress, renderLanes);
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }

  if (getIsHydrating() && hasId) {
    pushMaterializedTreeId(workInProgress);
  }

  // React DevTools reads this flag.
  workInProgress.flags |= PerformedWork;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}

function updateClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes,
) {
  if (__DEV__) {
    // This is used by DevTools to force a boundary to error.
    switch (shouldError(workInProgress)) {
      case false: {
        const instance = workInProgress.stateNode;
        const ctor = workInProgress.type;
        // TODO This way of resetting the error boundary state is a hack.
        // Is there a better way to do this?
        const tempInstance = new ctor(
          workInProgress.memoizedProps,
          instance.context,
        );
        const state = tempInstance.state;
        instance.updater.enqueueSetState(instance, state, null);
        break;
      }
      case true: {
        workInProgress.flags |= DidCapture;
        workInProgress.flags |= ShouldCapture;
        // eslint-disable-next-line react-internal/prod-error-codes
        const error = new Error('Simulated error coming from DevTools');
        const lane = pickArbitraryLane(renderLanes);
        workInProgress.lanes = mergeLanes(workInProgress.lanes, lane);
        // Schedule the error boundary to re-render using updated state
        const update = createClassErrorUpdate(
          workInProgress,
          createCapturedValue(error, workInProgress),
          lane,
        );
        enqueueCapturedUpdate(workInProgress, update);
        break;
      }
    }

    if (workInProgress.type !== workInProgress.elementType) {
      // Lazy component props can't be validated in createElement
      // because they're only guaranteed to be resolved here.
      const innerPropTypes = Component.propTypes;
      if (innerPropTypes) {
        checkPropTypes(
          innerPropTypes,
          nextProps, // Resolved props
          'prop',
          getComponentNameFromType(Component),
        );
      }
    }
  }

  // Push context providers early to prevent context stack mismatches.
  // During mounting we don't know the child context yet as the instance doesn't exist.
  // We will invalidate the child context in finishClassComponent() right after rendering.
  let hasContext;
  if (isLegacyContextProvider(Component)) {
    hasContext = true;
    pushLegacyContextProvider(workInProgress);
  } else {
    hasContext = false;
  }
  prepareToReadContext(workInProgress, renderLanes);

  const instance = workInProgress.stateNode;
  let shouldUpdate;
  if (instance === null) {
    if (current !== null) {
      // A class component without an instance only mounts if it suspended
      // inside a non-concurrent tree, in an inconsistent state. We want to
      // treat it like a new mount, even though an empty version of it already
      // committed. Disconnect the alternate pointers.
      current.alternate = null;
      workInProgress.alternate = null;
      // Since this is conceptually a new fiber, schedule a Placement effect
      workInProgress.flags |= Placement;
    }
    // In the initial pass we might need to construct the instance.
    constructClassInstance(workInProgress, Component, nextProps);
    mountClassInstance(workInProgress, Component, nextProps, renderLanes);
    shouldUpdate = true;
  } else if (current === null) {
    // In a resume, we'll already have an instance we can reuse.
    shouldUpdate = resumeMountClassInstance(
      workInProgress,
      Component,
      nextProps,
      renderLanes,
    );
  } else {
    shouldUpdate = updateClassInstance(
      current,
      workInProgress,
      Component,
      nextProps,
      renderLanes,
    );
  }
  const nextUnitOfWork = finishClassComponent(
    current,
    workInProgress,
    Component,
    shouldUpdate,
    hasContext,
    renderLanes,
  );
  if (__DEV__) {
    const inst = workInProgress.stateNode;
    if (shouldUpdate && inst.props !== nextProps) {
      if (!didWarnAboutReassigningProps) {
        console.error(
          'It looks like %s is reassigning its own `this.props` while rendering. ' +
            'This is not supported and can lead to confusing bugs.',
          getComponentNameFromFiber(workInProgress) || 'a component',
        );
      }
      didWarnAboutReassigningProps = true;
    }
  }
  return nextUnitOfWork;
}

function finishClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  shouldUpdate: boolean,
  hasContext: boolean,
  renderLanes: Lanes,
) {
  // Refs should update even if shouldComponentUpdate returns false
  markRef(current, workInProgress);

  const didCaptureError = (workInProgress.flags & DidCapture) !== NoFlags;

  if (!shouldUpdate && !didCaptureError) {
    // Context providers should defer to sCU for rendering
    if (hasContext) {
      invalidateContextProvider(workInProgress, Component, false);
    }

    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }

  const instance = workInProgress.stateNode;

  // Rerender
  ReactCurrentOwner.current = workInProgress;
  let nextChildren;
  if (
    didCaptureError &&
    typeof Component.getDerivedStateFromError !== 'function'
  ) {
    // If we captured an error, but getDerivedStateFromError is not defined,
    // unmount all the children. componentDidCatch will schedule an update to
    // re-render a fallback. This is temporary until we migrate everyone to
    // the new API.
    // TODO: Warn in a future release.
    nextChildren = null;

    if (enableProfilerTimer) {
      stopProfilerTimerIfRunning(workInProgress);
    }
  } else {
    if (enableSchedulingProfiler) {
      markComponentRenderStarted(workInProgress);
    }
    if (__DEV__) {
      setIsRendering(true);
      nextChildren = instance.render();
      if (
        debugRenderPhaseSideEffectsForStrictMode &&
        workInProgress.mode & StrictLegacyMode
      ) {
        setIsStrictModeForDevtools(true);
        try {
          instance.render();
        } finally {
          setIsStrictModeForDevtools(false);
        }
      }
      setIsRendering(false);
    } else {
      nextChildren = instance.render();
    }
    if (enableSchedulingProfiler) {
      markComponentRenderStopped();
    }
  }

  // React DevTools reads this flag.
  workInProgress.flags |= PerformedWork;
  if (current !== null && didCaptureError) {
    // If we're recovering from an error, reconcile without reusing any of
    // the existing children. Conceptually, the normal children and the children
    // that are shown on error are two different sets, so we shouldn't reuse
    // normal children even if their identities match.
    forceUnmountCurrentAndReconcile(
      current,
      workInProgress,
      nextChildren,
      renderLanes,
    );
  } else {
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  }

  // Memoize state using the values we just used to render.
  // TODO: Restructure so we never read values from the instance.
  workInProgress.memoizedState = instance.state;

  // The context might have changed so we need to recalculate it.
  if (hasContext) {
    invalidateContextProvider(workInProgress, Component, true);
  }

  return workInProgress.child;
}

function pushHostRootContext(workInProgress) {
  const root = (workInProgress.stateNode: FiberRoot);
  if (root.pendingContext) {
    pushTopLevelContextObject(
      workInProgress,
      root.pendingContext,
      root.pendingContext !== root.context,
    );
  } else if (root.context) {
    // Should always be set
    pushTopLevelContextObject(workInProgress, root.context, false);
  }
  pushHostContainer(workInProgress, root.containerInfo);
}

function updateHostRoot(current, workInProgress, renderLanes) {
  pushHostRootContext(workInProgress);
  const updateQueue = workInProgress.updateQueue;

  if (current === null || updateQueue === null) {
    throw new Error(
      'If the root does not have an updateQueue, we should have already ' +
        'bailed out. This error is likely caused by a bug in React. Please ' +
        'file an issue.',
    );
  }

  const nextProps = workInProgress.pendingProps;
  const prevState = workInProgress.memoizedState;
  const prevChildren = prevState.element;
  cloneUpdateQueue(current, workInProgress);
  processUpdateQueue(workInProgress, nextProps, null, renderLanes);
  const nextState = workInProgress.memoizedState;

  const root: FiberRoot = workInProgress.stateNode;

  if (enableCache) {
    const nextCache: Cache = nextState.cache;
    pushRootCachePool(root);
    pushCacheProvider(workInProgress, nextCache);
    if (nextCache !== prevState.cache) {
      // The root cache refreshed.
      propagateContextChange(workInProgress, CacheContext, renderLanes);
    }
  }

  // Caution: React DevTools currently depends on this property
  // being called "element".
  const nextChildren = nextState.element;
  if (nextChildren === prevChildren) {
    resetHydrationState();
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }
  if (root.isDehydrated && enterHydrationState(workInProgress)) {
    // If we don't have any current children this might be the first pass.
    // We always try to hydrate. If this isn't a hydration pass there won't
    // be any children to hydrate which is effectively the same thing as
    // not hydrating.

    if (supportsHydration) {
      const mutableSourceEagerHydrationData =
        root.mutableSourceEagerHydrationData;
      if (mutableSourceEagerHydrationData != null) {
        for (let i = 0; i < mutableSourceEagerHydrationData.length; i += 2) {
          const mutableSource = ((mutableSourceEagerHydrationData[
            i
          ]: any): MutableSource<any>);
          const version = mutableSourceEagerHydrationData[i + 1];
          setWorkInProgressVersion(mutableSource, version);
        }
      }
    }

    const child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes,
    );
    workInProgress.child = child;

    let node = child;
    while (node) {
      // Mark each child as hydrating. This is a fast path to know whether this
      // tree is part of a hydrating tree. This is used to determine if a child
      // node has fully mounted yet, and for scheduling event replaying.
      // Conceptually this is similar to Placement in that a new subtree is
      // inserted into the React tree here. It just happens to not need DOM
      // mutations because it already exists.
      node.flags = (node.flags & ~Placement) | Hydrating;
      node = node.sibling;
    }
  } else {
    // Otherwise reset hydration state in case we aborted and resumed another
    // root.
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    resetHydrationState();
  }
  return workInProgress.child;
}

function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  pushHostContext(workInProgress);

  if (current === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  }

  const type = workInProgress.type;
  const nextProps = workInProgress.pendingProps;
  const prevProps = current !== null ? current.memoizedProps : null;

  let nextChildren = nextProps.children;
  const isDirectTextChild = shouldSetTextContent(type, nextProps);

  if (isDirectTextChild) {
    // We special case a direct text child of a host node. This is a common
    // case. We won't handle it as a reified child. We will instead handle
    // this in the host environment that also has access to this prop. That
    // avoids allocating another HostText fiber and traversing it.
    nextChildren = null;
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
    // If we're switching from a direct text child to a normal child, or to
    // empty, we need to schedule the text content to be reset.
    workInProgress.flags |= ContentReset;
  }

  markRef(current, workInProgress);
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}

function updateHostText(current, workInProgress) {
  if (current === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  }
  // Nothing to do here. This is terminal. We'll do the completion step
  // immediately after.
  return null;
}

function mountLazyComponent(
  _current,
  workInProgress,
  elementType,
  renderLanes,
) {
  if (_current !== null) {
    // A lazy component only mounts if it suspended inside a non-
    // concurrent tree, in an inconsistent state. We want to treat it like
    // a new mount, even though an empty version of it already committed.
    // Disconnect the alternate pointers.
    _current.alternate = null;
    workInProgress.alternate = null;
    // Since this is conceptually a new fiber, schedule a Placement effect
    workInProgress.flags |= Placement;
  }

  const props = workInProgress.pendingProps;
  const lazyComponent: LazyComponentType<any, any> = elementType;
  const payload = lazyComponent._payload;
  const init = lazyComponent._init;
  let Component = init(payload);
  // Store the unwrapped component in the type.
  workInProgress.type = Component;
  const resolvedTag = (workInProgress.tag = resolveLazyComponentTag(Component));
  const resolvedProps = resolveDefaultProps(Component, props);
  let child;
  switch (resolvedTag) {
    case FunctionComponent: {
      if (__DEV__) {
        validateFunctionComponentInDev(workInProgress, Component);
        workInProgress.type = Component = resolveFunctionForHotReloading(
          Component,
        );
      }
      child = updateFunctionComponent(
        null,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes,
      );
      return child;
    }
    case ClassComponent: {
      if (__DEV__) {
        workInProgress.type = Component = resolveClassForHotReloading(
          Component,
        );
      }
      child = updateClassComponent(
        null,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes,
      );
      return child;
    }
    case ForwardRef: {
      if (__DEV__) {
        workInProgress.type = Component = resolveForwardRefForHotReloading(
          Component,
        );
      }
      child = updateForwardRef(
        null,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes,
      );
      return child;
    }
    case MemoComponent: {
      if (__DEV__) {
        if (workInProgress.type !== workInProgress.elementType) {
          const outerPropTypes = Component.propTypes;
          if (outerPropTypes) {
            checkPropTypes(
              outerPropTypes,
              resolvedProps, // Resolved for outer only
              'prop',
              getComponentNameFromType(Component),
            );
          }
        }
      }
      child = updateMemoComponent(
        null,
        workInProgress,
        Component,
        resolveDefaultProps(Component.type, resolvedProps), // The inner type can have defaults too
        renderLanes,
      );
      return child;
    }
  }
  let hint = '';
  if (__DEV__) {
    if (
      Component !== null &&
      typeof Component === 'object' &&
      Component.$$typeof === REACT_LAZY_TYPE
    ) {
      hint = ' Did you wrap a component in React.lazy() more than once?';
    }
  }

  // This message intentionally doesn't mention ForwardRef or MemoComponent
  // because the fact that it's a separate type of work is an
  // implementation detail.
  throw new Error(
    `Element type is invalid. Received a promise that resolves to: ${Component}. ` +
      `Lazy element type must resolve to a class or function.${hint}`,
  );
}

function mountIncompleteClassComponent(
  _current,
  workInProgress,
  Component,
  nextProps,
  renderLanes,
) {
  if (_current !== null) {
    // An incomplete component only mounts if it suspended inside a non-
    // concurrent tree, in an inconsistent state. We want to treat it like
    // a new mount, even though an empty version of it already committed.
    // Disconnect the alternate pointers.
    _current.alternate = null;
    workInProgress.alternate = null;
    // Since this is conceptually a new fiber, schedule a Placement effect
    workInProgress.flags |= Placement;
  }

  // Promote the fiber to a class and try rendering again.
  workInProgress.tag = ClassComponent;

  // The rest of this function is a fork of `updateClassComponent`

  // Push context providers early to prevent context stack mismatches.
  // During mounting we don't know the child context yet as the instance doesn't exist.
  // We will invalidate the child context in finishClassComponent() right after rendering.
  let hasContext;
  if (isLegacyContextProvider(Component)) {
    hasContext = true;
    pushLegacyContextProvider(workInProgress);
  } else {
    hasContext = false;
  }
  prepareToReadContext(workInProgress, renderLanes);

  constructClassInstance(workInProgress, Component, nextProps);
  mountClassInstance(workInProgress, Component, nextProps, renderLanes);

  return finishClassComponent(
    null,
    workInProgress,
    Component,
    true,
    hasContext,
    renderLanes,
  );
}

function mountIndeterminateComponent(
  _current,
  workInProgress,
  Component,
  renderLanes,
) {
  if (_current !== null) {
    // An indeterminate component only mounts if it suspended inside a non-
    // concurrent tree, in an inconsistent state. We want to treat it like
    // a new mount, even though an empty version of it already committed.
    // Disconnect the alternate pointers.
    _current.alternate = null;
    workInProgress.alternate = null;
    // Since this is conceptually a new fiber, schedule a Placement effect
    workInProgress.flags |= Placement;
  }

  const props = workInProgress.pendingProps;
  let context;
  if (!disableLegacyContext) {
    const unmaskedContext = getUnmaskedContext(
      workInProgress,
      Component,
      false,
    );
    context = getMaskedContext(workInProgress, unmaskedContext);
  }

  prepareToReadContext(workInProgress, renderLanes);
  let value;
  let hasId;

  if (enableSchedulingProfiler) {
    markComponentRenderStarted(workInProgress);
  }
  if (__DEV__) {
    if (
      Component.prototype &&
      typeof Component.prototype.render === 'function'
    ) {
      const componentName = getComponentNameFromType(Component) || 'Unknown';

      if (!didWarnAboutBadClass[componentName]) {
        console.error(
          "The <%s /> component appears to have a render method, but doesn't extend React.Component. " +
            'This is likely to cause errors. Change %s to extend React.Component instead.',
          componentName,
          componentName,
        );
        didWarnAboutBadClass[componentName] = true;
      }
    }

    if (workInProgress.mode & StrictLegacyMode) {
      ReactStrictModeWarnings.recordLegacyContextWarning(workInProgress, null);
    }

    setIsRendering(true);
    ReactCurrentOwner.current = workInProgress;
    value = renderWithHooks(
      null,
      workInProgress,
      Component,
      props,
      context,
      renderLanes,
    );
    hasId = checkDidRenderIdHook();
    setIsRendering(false);
  } else {
    value = renderWithHooks(
      null,
      workInProgress,
      Component,
      props,
      context,
      renderLanes,
    );
    hasId = checkDidRenderIdHook();
  }
  if (enableSchedulingProfiler) {
    markComponentRenderStopped();
  }

  // React DevTools reads this flag.
  workInProgress.flags |= PerformedWork;

  if (__DEV__) {
    // Support for module components is deprecated and is removed behind a flag.
    // Whether or not it would crash later, we want to show a good message in DEV first.
    if (
      typeof value === 'object' &&
      value !== null &&
      typeof value.render === 'function' &&
      value.$$typeof === undefined
    ) {
      const componentName = getComponentNameFromType(Component) || 'Unknown';
      if (!didWarnAboutModulePatternComponent[componentName]) {
        console.error(
          'The <%s /> component appears to be a function component that returns a class instance. ' +
            'Change %s to a class that extends React.Component instead. ' +
            "If you can't use a class try assigning the prototype on the function as a workaround. " +
            "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " +
            'cannot be called with `new` by React.',
          componentName,
          componentName,
          componentName,
        );
        didWarnAboutModulePatternComponent[componentName] = true;
      }
    }
  }

  if (
    // Run these checks in production only if the flag is off.
    // Eventually we'll delete this branch altogether.
    !disableModulePatternComponents &&
    typeof value === 'object' &&
    value !== null &&
    typeof value.render === 'function' &&
    value.$$typeof === undefined
  ) {
    if (__DEV__) {
      const componentName = getComponentNameFromType(Component) || 'Unknown';
      if (!didWarnAboutModulePatternComponent[componentName]) {
        console.error(
          'The <%s /> component appears to be a function component that returns a class instance. ' +
            'Change %s to a class that extends React.Component instead. ' +
            "If you can't use a class try assigning the prototype on the function as a workaround. " +
            "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " +
            'cannot be called with `new` by React.',
          componentName,
          componentName,
          componentName,
        );
        didWarnAboutModulePatternComponent[componentName] = true;
      }
    }

    // Proceed under the assumption that this is a class instance
    workInProgress.tag = ClassComponent;

    // Throw out any hooks that were used.
    workInProgress.memoizedState = null;
    workInProgress.updateQueue = null;

    // Push context providers early to prevent context stack mismatches.
    // During mounting we don't know the child context yet as the instance doesn't exist.
    // We will invalidate the child context in finishClassComponent() right after rendering.
    let hasContext = false;
    if (isLegacyContextProvider(Component)) {
      hasContext = true;
      pushLegacyContextProvider(workInProgress);
    } else {
      hasContext = false;
    }

    workInProgress.memoizedState =
      value.state !== null && value.state !== undefined ? value.state : null;

    initializeUpdateQueue(workInProgress);

    adoptClassInstance(workInProgress, value);
    mountClassInstance(workInProgress, Component, props, renderLanes);
    return finishClassComponent(
      null,
      workInProgress,
      Component,
      true,
      hasContext,
      renderLanes,
    );
  } else {
    // Proceed under the assumption that this is a function component
    workInProgress.tag = FunctionComponent;
    if (__DEV__) {
      if (disableLegacyContext && Component.contextTypes) {
        console.error(
          '%s uses the legacy contextTypes API which is no longer supported. ' +
            'Use React.createContext() with React.useContext() instead.',
          getComponentNameFromType(Component) || 'Unknown',
        );
      }

      if (
        debugRenderPhaseSideEffectsForStrictMode &&
        workInProgress.mode & StrictLegacyMode
      ) {
        setIsStrictModeForDevtools(true);
        try {
          value = renderWithHooks(
            null,
            workInProgress,
            Component,
            props,
            context,
            renderLanes,
          );
          hasId = checkDidRenderIdHook();
        } finally {
          setIsStrictModeForDevtools(false);
        }
      }
    }

    if (getIsHydrating() && hasId) {
      pushMaterializedTreeId(workInProgress);
    }

    reconcileChildren(null, workInProgress, value, renderLanes);
    if (__DEV__) {
      validateFunctionComponentInDev(workInProgress, Component);
    }
    return workInProgress.child;
  }
}

function validateFunctionComponentInDev(workInProgress: Fiber, Component: any) {
  if (__DEV__) {
    if (Component) {
      if (Component.childContextTypes) {
        console.error(
          '%s(...): childContextTypes cannot be defined on a function component.',
          Component.displayName || Component.name || 'Component',
        );
      }
    }
    if (workInProgress.ref !== null) {
      let info = '';
      const ownerName = getCurrentFiberOwnerNameInDevOrNull();
      if (ownerName) {
        info += '\n\nCheck the render method of `' + ownerName + '`.';
      }

      let warningKey = ownerName || '';
      const debugSource = workInProgress._debugSource;
      if (debugSource) {
        warningKey = debugSource.fileName + ':' + debugSource.lineNumber;
      }
      if (!didWarnAboutFunctionRefs[warningKey]) {
        didWarnAboutFunctionRefs[warningKey] = true;
        console.error(
          'Function components cannot be given refs. ' +
            'Attempts to access this ref will fail. ' +
            'Did you mean to use React.forwardRef()?%s',
          info,
        );
      }
    }

    if (
      warnAboutDefaultPropsOnFunctionComponents &&
      Component.defaultProps !== undefined
    ) {
      const componentName = getComponentNameFromType(Component) || 'Unknown';

      if (!didWarnAboutDefaultPropsOnFunctionComponent[componentName]) {
        console.error(
          '%s: Support for defaultProps will be removed from function components ' +
            'in a future major release. Use JavaScript default parameters instead.',
          componentName,
        );
        didWarnAboutDefaultPropsOnFunctionComponent[componentName] = true;
      }
    }

    if (typeof Component.getDerivedStateFromProps === 'function') {
      const componentName = getComponentNameFromType(Component) || 'Unknown';

      if (!didWarnAboutGetDerivedStateOnFunctionComponent[componentName]) {
        console.error(
          '%s: Function components do not support getDerivedStateFromProps.',
          componentName,
        );
        didWarnAboutGetDerivedStateOnFunctionComponent[componentName] = true;
      }
    }

    if (
      typeof Component.contextType === 'object' &&
      Component.contextType !== null
    ) {
      const componentName = getComponentNameFromType(Component) || 'Unknown';

      if (!didWarnAboutContextTypeOnFunctionComponent[componentName]) {
        console.error(
          '%s: Function components do not support contextType.',
          componentName,
        );
        didWarnAboutContextTypeOnFunctionComponent[componentName] = true;
      }
    }
  }
}

const SUSPENDED_MARKER: SuspenseState = {
  dehydrated: null,
  treeContext: null,
  retryLane: NoLane,
};

function mountSuspenseOffscreenState(renderLanes: Lanes): OffscreenState {
  return {
    baseLanes: renderLanes,
    cachePool: getSuspendedCachePool(),
  };
}

function updateSuspenseOffscreenState(
  prevOffscreenState: OffscreenState,
  renderLanes: Lanes,
): OffscreenState {
  let cachePool: SpawnedCachePool | null = null;
  if (enableCache) {
    const prevCachePool: SpawnedCachePool | null = prevOffscreenState.cachePool;
    if (prevCachePool !== null) {
      const parentCache = isPrimaryRenderer
        ? CacheContext._currentValue
        : CacheContext._currentValue2;
      if (prevCachePool.parent !== parentCache) {
        // Detected a refresh in the parent. This overrides any previously
        // suspended cache.
        cachePool = {
          parent: parentCache,
          pool: parentCache,
        };
      } else {
        // We can reuse the cache from last time. The only thing that would have
        // overridden it is a parent refresh, which we checked for above.
        cachePool = prevCachePool;
      }
    } else {
      // If there's no previous cache pool, grab the current one.
      cachePool = getSuspendedCachePool();
    }
  }
  return {
    baseLanes: mergeLanes(prevOffscreenState.baseLanes, renderLanes),
    cachePool,
  };
}

// TODO: Probably should inline this back
function shouldRemainOnFallback(
  suspenseContext: SuspenseContext,
  current: null | Fiber,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  // If we're already showing a fallback, there are cases where we need to
  // remain on that fallback regardless of whether the content has resolved.
  // For example, SuspenseList coordinates when nested content appears.
  if (current !== null) {
    const suspenseState: SuspenseState = current.memoizedState;
    if (suspenseState === null) {
      // Currently showing content. Don't hide it, even if ForceSuspenseFallback
      // is true. More precise name might be "ForceRemainSuspenseFallback".
      // Note: This is a factoring smell. Can't remain on a fallback if there's
      // no fallback to remain on.
      return false;
    }
  }

  // Not currently showing content. Consult the Suspense context.
  return hasSuspenseContext(
    suspenseContext,
    (ForceSuspenseFallback: SuspenseContext),
  );
}

function getRemainingWorkInPrimaryTree(current: Fiber, renderLanes) {
  // TODO: Should not remove render lanes that were pinged during this render
  return removeLanes(current.childLanes, renderLanes);
}

function updateSuspenseComponent(current, workInProgress, renderLanes) {
  const nextProps = workInProgress.pendingProps;

  // This is used by DevTools to force a boundary to suspend.
  if (__DEV__) {
    if (shouldSuspend(workInProgress)) {
      workInProgress.flags |= DidCapture;
    }
  }

  let suspenseContext: SuspenseContext = suspenseStackCursor.current;

  let showFallback = false;
  const didSuspend = (workInProgress.flags & DidCapture) !== NoFlags;

  if (
    didSuspend ||
    shouldRemainOnFallback(
      suspenseContext,
      current,
      workInProgress,
      renderLanes,
    )
  ) {
    // Something in this boundary's subtree already suspended. Switch to
    // rendering the fallback children.
    showFallback = true;
    workInProgress.flags &= ~DidCapture;
  } else {
    // Attempting the main content
    if (
      current === null ||
      (current.memoizedState: null | SuspenseState) !== null
    ) {
      // This is a new mount or this boundary is already showing a fallback state.
      // Mark this subtree context as having at least one invisible parent that could
      // handle the fallback state.
      // Avoided boundaries are not considered since they cannot handle preferred fallback states.
      if (
        !enableSuspenseAvoidThisFallback ||
        nextProps.unstable_avoidThisFallback !== true
      ) {
        suspenseContext = addSubtreeSuspenseContext(
          suspenseContext,
          InvisibleParentSuspenseContext,
        );
      }
    }
  }

  suspenseContext = setDefaultShallowSuspenseContext(suspenseContext);

  pushSuspenseContext(workInProgress, suspenseContext);

  // OK, the next part is confusing. We're about to reconcile the Suspense
  // boundary's children. This involves some custom reconciliation logic. Two
  // main reasons this is so complicated.
  //
  // First, Legacy Mode has different semantics for backwards compatibility. The
  // primary tree will commit in an inconsistent state, so when we do the
  // second pass to render the fallback, we do some exceedingly, uh, clever
  // hacks to make that not totally break. Like transferring effects and
  // deletions from hidden tree. In Concurrent Mode, it's much simpler,
  // because we bailout on the primary tree completely and leave it in its old
  // state, no effects. Same as what we do for Offscreen (except that
  // Offscreen doesn't have the first render pass).
  //
  // Second is hydration. During hydration, the Suspense fiber has a slightly
  // different layout, where the child points to a dehydrated fragment, which
  // contains the DOM rendered by the server.
  //
  // Third, even if you set all that aside, Suspense is like error boundaries in
  // that we first we try to render one tree, and if that fails, we render again
  // and switch to a different tree. Like a try/catch block. So we have to track
  // which branch we're currently rendering. Ideally we would model this using
  // a stack.
  if (current === null) {
    // Initial mount
    // If we're currently hydrating, try to hydrate this boundary.
    tryToClaimNextHydratableInstance(workInProgress);
    // This could've been a dehydrated suspense component.
    if (enableSuspenseServerRenderer) {
      const suspenseState: null | SuspenseState = workInProgress.memoizedState;
      if (suspenseState !== null) {
        const dehydrated = suspenseState.dehydrated;
        if (dehydrated !== null) {
          return mountDehydratedSuspenseComponent(
            workInProgress,
            dehydrated,
            renderLanes,
          );
        }
      }
    }

    const nextPrimaryChildren = nextProps.children;
    const nextFallbackChildren = nextProps.fallback;
    if (showFallback) {
      const fallbackFragment = mountSuspenseFallbackChildren(
        workInProgress,
        nextPrimaryChildren,
        nextFallbackChildren,
        renderLanes,
      );
      const primaryChildFragment: Fiber = (workInProgress.child: any);
      primaryChildFragment.memoizedState = mountSuspenseOffscreenState(
        renderLanes,
      );
      workInProgress.memoizedState = SUSPENDED_MARKER;
      return fallbackFragment;
    } else if (typeof nextProps.unstable_expectedLoadTime === 'number') {
      // This is a CPU-bound tree. Skip this tree and show a placeholder to
      // unblock the surrounding content. Then immediately retry after the
      // initial commit.
      const fallbackFragment = mountSuspenseFallbackChildren(
        workInProgress,
        nextPrimaryChildren,
        nextFallbackChildren,
        renderLanes,
      );
      const primaryChildFragment: Fiber = (workInProgress.child: any);
      primaryChildFragment.memoizedState = mountSuspenseOffscreenState(
        renderLanes,
      );
      workInProgress.memoizedState = SUSPENDED_MARKER;

      // Since nothing actually suspended, there will nothing to ping this to
      // get it started back up to attempt the next item. While in terms of
      // priority this work has the same priority as this current render, it's
      // not part of the same transition once the transition has committed. If
      // it's sync, we still want to yield so that it can be painted.
      // Conceptually, this is really the same as pinging. We can use any
      // RetryLane even if it's the one currently rendering since we're leaving
      // it behind on this node.
      workInProgress.lanes = SomeRetryLane;
      return fallbackFragment;
    } else {
      return mountSuspensePrimaryChildren(
        workInProgress,
        nextPrimaryChildren,
        renderLanes,
      );
    }
  } else {
    // This is an update.

    // If the current fiber has a SuspenseState, that means it's already showing
    // a fallback.
    const prevState: null | SuspenseState = current.memoizedState;
    if (prevState !== null) {
      // The current tree is already showing a fallback

      // Special path for hydration
      if (enableSuspenseServerRenderer) {
        const dehydrated = prevState.dehydrated;
        if (dehydrated !== null) {
          if (!didSuspend) {
            return updateDehydratedSuspenseComponent(
              current,
              workInProgress,
              dehydrated,
              prevState,
              renderLanes,
            );
          } else if (workInProgress.flags & ForceClientRender) {
            // Something errored during hydration. Try again without hydrating.
            workInProgress.flags &= ~ForceClientRender;
            return retrySuspenseComponentWithoutHydrating(
              current,
              workInProgress,
              renderLanes,
            );
          } else if (
            (workInProgress.memoizedState: null | SuspenseState) !== null
          ) {
            // Something suspended and we should still be in dehydrated mode.
            // Leave the existing child in place.
            workInProgress.child = current.child;
            // The dehydrated completion pass expects this flag to be there
            // but the normal suspense pass doesn't.
            workInProgress.flags |= DidCapture;
            return null;
          } else {
            // Suspended but we should no longer be in dehydrated mode.
            // Therefore we now have to render the fallback.
            const nextPrimaryChildren = nextProps.children;
            const nextFallbackChildren = nextProps.fallback;
            const fallbackChildFragment = mountSuspenseFallbackAfterRetryWithoutHydrating(
              current,
              workInProgress,
              nextPrimaryChildren,
              nextFallbackChildren,
              renderLanes,
            );
            const primaryChildFragment: Fiber = (workInProgress.child: any);
            primaryChildFragment.memoizedState = mountSuspenseOffscreenState(
              renderLanes,
            );
            workInProgress.memoizedState = SUSPENDED_MARKER;
            return fallbackChildFragment;
          }
        }
      }

      if (showFallback) {
        const nextFallbackChildren = nextProps.fallback;
        const nextPrimaryChildren = nextProps.children;
        const fallbackChildFragment = updateSuspenseFallbackChildren(
          current,
          workInProgress,
          nextPrimaryChildren,
          nextFallbackChildren,
          renderLanes,
        );
        const primaryChildFragment: Fiber = (workInProgress.child: any);
        const prevOffscreenState: OffscreenState | null = (current.child: any)
          .memoizedState;
        primaryChildFragment.memoizedState =
          prevOffscreenState === null
            ? mountSuspenseOffscreenState(renderLanes)
            : updateSuspenseOffscreenState(prevOffscreenState, renderLanes);
        primaryChildFragment.childLanes = getRemainingWorkInPrimaryTree(
          current,
          renderLanes,
        );
        workInProgress.memoizedState = SUSPENDED_MARKER;
        return fallbackChildFragment;
      } else {
        const nextPrimaryChildren = nextProps.children;
        const primaryChildFragment = updateSuspensePrimaryChildren(
          current,
          workInProgress,
          nextPrimaryChildren,
          renderLanes,
        );
        workInProgress.memoizedState = null;
        return primaryChildFragment;
      }
    } else {
      // The current tree is not already showing a fallback.
      if (showFallback) {
        // Timed out.
        const nextFallbackChildren = nextProps.fallback;
        const nextPrimaryChildren = nextProps.children;
        const fallbackChildFragment = updateSuspenseFallbackChildren(
          current,
          workInProgress,
          nextPrimaryChildren,
          nextFallbackChildren,
          renderLanes,
        );
        const primaryChildFragment: Fiber = (workInProgress.child: any);
        const prevOffscreenState: OffscreenState | null = (current.child: any)
          .memoizedState;
        primaryChildFragment.memoizedState =
          prevOffscreenState === null
            ? mountSuspenseOffscreenState(renderLanes)
            : updateSuspenseOffscreenState(prevOffscreenState, renderLanes);
        primaryChildFragment.childLanes = getRemainingWorkInPrimaryTree(
          current,
          renderLanes,
        );
        // Skip the primary children, and continue working on the
        // fallback children.
        workInProgress.memoizedState = SUSPENDED_MARKER;
        return fallbackChildFragment;
      } else {
        // Still haven't timed out. Continue rendering the children, like we
        // normally do.
        const nextPrimaryChildren = nextProps.children;
        const primaryChildFragment = updateSuspensePrimaryChildren(
          current,
          workInProgress,
          nextPrimaryChildren,
          renderLanes,
        );
        workInProgress.memoizedState = null;
        return primaryChildFragment;
      }
    }
  }
}

function mountSuspensePrimaryChildren(
  workInProgress,
  primaryChildren,
  renderLanes,
) {
  const mode = workInProgress.mode;
  const primaryChildProps: OffscreenProps = {
    mode: 'visible',
    children: primaryChildren,
  };
  const primaryChildFragment = mountWorkInProgressOffscreenFiber(
    primaryChildProps,
    mode,
    renderLanes,
  );
  primaryChildFragment.return = workInProgress;
  workInProgress.child = primaryChildFragment;
  return primaryChildFragment;
}

function mountSuspenseFallbackChildren(
  workInProgress,
  primaryChildren,
  fallbackChildren,
  renderLanes,
) {
  const mode = workInProgress.mode;
  const progressedPrimaryFragment: Fiber | null = workInProgress.child;

  const primaryChildProps: OffscreenProps = {
    mode: 'hidden',
    children: primaryChildren,
  };

  let primaryChildFragment;
  let fallbackChildFragment;
  if (
    (mode & ConcurrentMode) === NoMode &&
    progressedPrimaryFragment !== null
  ) {
    // In legacy mode, we commit the primary tree as if it successfully
    // completed, even though it's in an inconsistent state.
    primaryChildFragment = progressedPrimaryFragment;
    primaryChildFragment.childLanes = NoLanes;
    primaryChildFragment.pendingProps = primaryChildProps;

    if (enableProfilerTimer && workInProgress.mode & ProfileMode) {
      // Reset the durations from the first pass so they aren't included in the
      // final amounts. This seems counterintuitive, since we're intentionally
      // not measuring part of the render phase, but this makes it match what we
      // do in Concurrent Mode.
      primaryChildFragment.actualDuration = 0;
      primaryChildFragment.actualStartTime = -1;
      primaryChildFragment.selfBaseDuration = 0;
      primaryChildFragment.treeBaseDuration = 0;
    }

    fallbackChildFragment = createFiberFromFragment(
      fallbackChildren,
      mode,
      renderLanes,
      null,
    );
  } else {
    primaryChildFragment = mountWorkInProgressOffscreenFiber(
      primaryChildProps,
      mode,
      NoLanes,
    );
    fallbackChildFragment = createFiberFromFragment(
      fallbackChildren,
      mode,
      renderLanes,
      null,
    );
  }

  primaryChildFragment.return = workInProgress;
  fallbackChildFragment.return = workInProgress;
  primaryChildFragment.sibling = fallbackChildFragment;
  workInProgress.child = primaryChildFragment;
  return fallbackChildFragment;
}

function mountWorkInProgressOffscreenFiber(
  offscreenProps: OffscreenProps,
  mode: TypeOfMode,
  renderLanes: Lanes,
) {
  // The props argument to `createFiberFromOffscreen` is `any` typed, so we use
  // this wrapper function to constrain it.
  return createFiberFromOffscreen(offscreenProps, mode, NoLanes, null);
}

function updateWorkInProgressOffscreenFiber(
  current: Fiber,
  offscreenProps: OffscreenProps,
) {
  // The props argument to `createWorkInProgress` is `any` typed, so we use this
  // wrapper function to constrain it.
  return createWorkInProgress(current, offscreenProps);
}

function updateSuspensePrimaryChildren(
  current,
  workInProgress,
  primaryChildren,
  renderLanes,
) {
  const currentPrimaryChildFragment: Fiber = (current.child: any);
  const currentFallbackChildFragment: Fiber | null =
    currentPrimaryChildFragment.sibling;

  const primaryChildFragment = updateWorkInProgressOffscreenFiber(
    currentPrimaryChildFragment,
    {
      mode: 'visible',
      children: primaryChildren,
    },
  );
  if ((workInProgress.mode & ConcurrentMode) === NoMode) {
    primaryChildFragment.lanes = renderLanes;
  }
  primaryChildFragment.return = workInProgress;
  primaryChildFragment.sibling = null;
  if (currentFallbackChildFragment !== null) {
    // Delete the fallback child fragment
    const deletions = workInProgress.deletions;
    if (deletions === null) {
      workInProgress.deletions = [currentFallbackChildFragment];
      workInProgress.flags |= ChildDeletion;
    } else {
      deletions.push(currentFallbackChildFragment);
    }
  }

  workInProgress.child = primaryChildFragment;
  return primaryChildFragment;
}

function updateSuspenseFallbackChildren(
  current,
  workInProgress,
  primaryChildren,
  fallbackChildren,
  renderLanes,
) {
  const mode = workInProgress.mode;
  const currentPrimaryChildFragment: Fiber = (current.child: any);
  const currentFallbackChildFragment: Fiber | null =
    currentPrimaryChildFragment.sibling;

  const primaryChildProps: OffscreenProps = {
    mode: 'hidden',
    children: primaryChildren,
  };

  let primaryChildFragment;
  if (
    // In legacy mode, we commit the primary tree as if it successfully
    // completed, even though it's in an inconsistent state.
    (mode & ConcurrentMode) === NoMode &&
    // Make sure we're on the second pass, i.e. the primary child fragment was
    // already cloned. In legacy mode, the only case where this isn't true is
    // when DevTools forces us to display a fallback; we skip the first render
    // pass entirely and go straight to rendering the fallback. (In Concurrent
    // Mode, SuspenseList can also trigger this scenario, but this is a legacy-
    // only codepath.)
    workInProgress.child !== currentPrimaryChildFragment
  ) {
    const progressedPrimaryFragment: Fiber = (workInProgress.child: any);
    primaryChildFragment = progressedPrimaryFragment;
    primaryChildFragment.childLanes = NoLanes;
    primaryChildFragment.pendingProps = primaryChildProps;

    if (enableProfilerTimer && workInProgress.mode & ProfileMode) {
      // Reset the durations from the first pass so they aren't included in the
      // final amounts. This seems counterintuitive, since we're intentionally
      // not measuring part of the render phase, but this makes it match what we
      // do in Concurrent Mode.
      primaryChildFragment.actualDuration = 0;
      primaryChildFragment.actualStartTime = -1;
      primaryChildFragment.selfBaseDuration =
        currentPrimaryChildFragment.selfBaseDuration;
      primaryChildFragment.treeBaseDuration =
        currentPrimaryChildFragment.treeBaseDuration;
    }

    if (enablePersistentOffscreenHostContainer && supportsPersistence) {
      // In persistent mode, the offscreen children are wrapped in a host node.
      // We need to complete it now, because we're going to skip over its normal
      // complete phase and go straight to rendering the fallback.
      const currentOffscreenContainer = currentPrimaryChildFragment.child;
      const offscreenContainer: Fiber = (primaryChildFragment.child: any);
      const containerProps = getOffscreenContainerProps(
        'hidden',
        primaryChildren,
      );
      offscreenContainer.pendingProps = containerProps;
      offscreenContainer.memoizedProps = containerProps;
      completeSuspendedOffscreenHostContainer(
        currentOffscreenContainer,
        offscreenContainer,
      );
    }

    // The fallback fiber was added as a deletion during the first pass.
    // However, since we're going to remain on the fallback, we no longer want
    // to delete it.
    workInProgress.deletions = null;
  } else {
    primaryChildFragment = updateWorkInProgressOffscreenFiber(
      currentPrimaryChildFragment,
      primaryChildProps,
    );

    if (enablePersistentOffscreenHostContainer && supportsPersistence) {
      // In persistent mode, the offscreen children are wrapped in a host node.
      // We need to complete it now, because we're going to skip over its normal
      // complete phase and go straight to rendering the fallback.
      const currentOffscreenContainer = currentPrimaryChildFragment.child;
      if (currentOffscreenContainer !== null) {
        const isHidden = true;
        const offscreenContainer = reconcileOffscreenHostContainer(
          currentPrimaryChildFragment,
          primaryChildFragment,
          isHidden,
          primaryChildren,
          renderLanes,
        );
        offscreenContainer.memoizedProps = offscreenContainer.pendingProps;
        completeSuspendedOffscreenHostContainer(
          currentOffscreenContainer,
          offscreenContainer,
        );
      }
    }

    // Since we're reusing a current tree, we need to reuse the flags, too.
    // (We don't do this in legacy mode, because in legacy mode we don't re-use
    // the current tree; see previous branch.)
    primaryChildFragment.subtreeFlags =
      currentPrimaryChildFragment.subtreeFlags & StaticMask;
  }
  let fallbackChildFragment;
  if (currentFallbackChildFragment !== null) {
    fallbackChildFragment = createWorkInProgress(
      currentFallbackChildFragment,
      fallbackChildren,
    );
  } else {
    fallbackChildFragment = createFiberFromFragment(
      fallbackChildren,
      mode,
      renderLanes,
      null,
    );
    // Needs a placement effect because the parent (the Suspense boundary) already
    // mounted but this is a new fiber.
    fallbackChildFragment.flags |= Placement;
  }

  fallbackChildFragment.return = workInProgress;
  primaryChildFragment.return = workInProgress;
  primaryChildFragment.sibling = fallbackChildFragment;
  workInProgress.child = primaryChildFragment;

  return fallbackChildFragment;
}

function retrySuspenseComponentWithoutHydrating(
  current: Fiber,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  // This will add the old fiber to the deletion list
  reconcileChildFibers(workInProgress, current.child, null, renderLanes);

  // We're now not suspended nor dehydrated.
  const nextProps = workInProgress.pendingProps;
  const primaryChildren = nextProps.children;
  const primaryChildFragment = mountSuspensePrimaryChildren(
    workInProgress,
    primaryChildren,
    renderLanes,
  );
  // Needs a placement effect because the parent (the Suspense boundary) already
  // mounted but this is a new fiber.
  primaryChildFragment.flags |= Placement;
  workInProgress.memoizedState = null;

  return primaryChildFragment;
}

function mountSuspenseFallbackAfterRetryWithoutHydrating(
  current,
  workInProgress,
  primaryChildren,
  fallbackChildren,
  renderLanes,
) {
  const fiberMode = workInProgress.mode;
  const primaryChildProps: OffscreenProps = {
    mode: 'visible',
    children: primaryChildren,
  };
  const primaryChildFragment = mountWorkInProgressOffscreenFiber(
    primaryChildProps,
    fiberMode,
    NoLanes,
  );
  const fallbackChildFragment = createFiberFromFragment(
    fallbackChildren,
    fiberMode,
    renderLanes,
    null,
  );
  // Needs a placement effect because the parent (the Suspense
  // boundary) already mounted but this is a new fiber.
  fallbackChildFragment.flags |= Placement;

  primaryChildFragment.return = workInProgress;
  fallbackChildFragment.return = workInProgress;
  primaryChildFragment.sibling = fallbackChildFragment;
  workInProgress.child = primaryChildFragment;

  if ((workInProgress.mode & ConcurrentMode) !== NoMode) {
    // We will have dropped the effect list which contains the
    // deletion. We need to reconcile to delete the current child.
    reconcileChildFibers(workInProgress, current.child, null, renderLanes);
  }

  return fallbackChildFragment;
}

function mountDehydratedSuspenseComponent(
  workInProgress: Fiber,
  suspenseInstance: SuspenseInstance,
  renderLanes: Lanes,
): null | Fiber {
  // During the first pass, we'll bail out and not drill into the children.
  // Instead, we'll leave the content in place and try to hydrate it later.
  if ((workInProgress.mode & ConcurrentMode) === NoMode) {
    if (__DEV__) {
      console.error(
        'Cannot hydrate Suspense in legacy mode. Switch from ' +
          'ReactDOM.hydrate(element, container) to ' +
          'ReactDOM.hydrateRoot(container, <App />)' +
          '.render(element) or remove the Suspense components from ' +
          'the server rendered components.',
      );
    }
    workInProgress.lanes = laneToLanes(SyncLane);
  } else if (isSuspenseInstanceFallback(suspenseInstance)) {
    // This is a client-only boundary. Since we won't get any content from the server
    // for this, we need to schedule that at a higher priority based on when it would
    // have timed out. In theory we could render it in this pass but it would have the
    // wrong priority associated with it and will prevent hydration of parent path.
    // Instead, we'll leave work left on it to render it in a separate commit.

    // TODO This time should be the time at which the server rendered response that is
    // a parent to this boundary was displayed. However, since we currently don't have
    // a protocol to transfer that time, we'll just estimate it by using the current
    // time. This will mean that Suspense timeouts are slightly shifted to later than
    // they should be.
    // Schedule a normal pri update to render this content.
    workInProgress.lanes = laneToLanes(DefaultHydrationLane);
  } else {
    // We'll continue hydrating the rest at offscreen priority since we'll already
    // be showing the right content coming from the server, it is no rush.
    workInProgress.lanes = laneToLanes(OffscreenLane);
  }
  return null;
}

function updateDehydratedSuspenseComponent(
  current: Fiber,
  workInProgress: Fiber,
  suspenseInstance: SuspenseInstance,
  suspenseState: SuspenseState,
  renderLanes: Lanes,
): null | Fiber {
  // We should never be hydrating at this point because it is the first pass,
  // but after we've already committed once.
  warnIfHydrating();

  if ((getExecutionContext() & RetryAfterError) !== NoContext) {
    return retrySuspenseComponentWithoutHydrating(
      current,
      workInProgress,
      renderLanes,
    );
  }

  if ((workInProgress.mode & ConcurrentMode) === NoMode) {
    return retrySuspenseComponentWithoutHydrating(
      current,
      workInProgress,
      renderLanes,
    );
  }

  if (isSuspenseInstanceFallback(suspenseInstance)) {
    // This boundary is in a permanent fallback state. In this case, we'll never
    // get an update and we'll never be able to hydrate the final content. Let's just try the
    // client side render instead.
    return retrySuspenseComponentWithoutHydrating(
      current,
      workInProgress,
      renderLanes,
    );
  }

  if (
    enableLazyContextPropagation &&
    // TODO: Factoring is a little weird, since we check this right below, too.
    // But don't want to re-arrange the if-else chain until/unless this
    // feature lands.
    !didReceiveUpdate
  ) {
    // We need to check if any children have context before we decide to bail
    // out, so propagate the changes now.
    lazilyPropagateParentContextChanges(current, workInProgress, renderLanes);
  }

  // We use lanes to indicate that a child might depend on context, so if
  // any context has changed, we need to treat is as if the input might have changed.
  const hasContextChanged = includesSomeLane(renderLanes, current.childLanes);
  if (didReceiveUpdate || hasContextChanged) {
    // This boundary has changed since the first render. This means that we are now unable to
    // hydrate it. We might still be able to hydrate it using a higher priority lane.
    const root = getWorkInProgressRoot();
    if (root !== null) {
      const attemptHydrationAtLane = getBumpedLaneForHydration(
        root,
        renderLanes,
      );
      if (
        attemptHydrationAtLane !== NoLane &&
        attemptHydrationAtLane !== suspenseState.retryLane
      ) {
        // Intentionally mutating since this render will get interrupted. This
        // is one of the very rare times where we mutate the current tree
        // during the render phase.
        suspenseState.retryLane = attemptHydrationAtLane;
        // TODO: Ideally this would inherit the event time of the current render
        const eventTime = NoTimestamp;
        scheduleUpdateOnFiber(current, attemptHydrationAtLane, eventTime);
      } else {
        // We have already tried to ping at a higher priority than we're rendering with
        // so if we got here, we must have failed to hydrate at those levels. We must
        // now give up. Instead, we're going to delete the whole subtree and instead inject
        // a new real Suspense boundary to take its place, which may render content
        // or fallback. This might suspend for a while and if it does we might still have
        // an opportunity to hydrate before this pass commits.
      }
    }

    // If we have scheduled higher pri work above, this will probably just abort the render
    // since we now have higher priority work, but in case it doesn't, we need to prepare to
    // render something, if we time out. Even if that requires us to delete everything and
    // skip hydration.
    // Delay having to do this as long as the suspense timeout allows us.
    renderDidSuspendDelayIfPossible();
    return retrySuspenseComponentWithoutHydrating(
      current,
      workInProgress,
      renderLanes,
    );
  } else if (isSuspenseInstancePending(suspenseInstance)) {
    // This component is still pending more data from the server, so we can't hydrate its
    // content. We treat it as if this component suspended itself. It might seem as if
    // we could just try to render it client-side instead. However, this will perform a
    // lot of unnecessary work and is unlikely to complete since it often will suspend
    // on missing data anyway. Additionally, the server might be able to render more
    // than we can on the client yet. In that case we'd end up with more fallback states
    // on the client than if we just leave it alone. If the server times out or errors
    // these should update this boundary to the permanent Fallback state instead.
    // Mark it as having captured (i.e. suspended).
    workInProgress.flags |= DidCapture;
    // Leave the child in place. I.e. the dehydrated fragment.
    workInProgress.child = current.child;
    // Register a callback to retry this boundary once the server has sent the result.
    const retry = retryDehydratedSuspenseBoundary.bind(null, current);
    registerSuspenseInstanceRetry(suspenseInstance, retry);
    return null;
  } else {
    // This is the first attempt.
    reenterHydrationStateFromDehydratedSuspenseInstance(
      workInProgress,
      suspenseInstance,
      suspenseState.treeContext,
    );
    const nextProps = workInProgress.pendingProps;
    const primaryChildren = nextProps.children;
    const primaryChildFragment = mountSuspensePrimaryChildren(
      workInProgress,
      primaryChildren,
      renderLanes,
    );
    // Mark the children as hydrating. This is a fast path to know whether this
    // tree is part of a hydrating tree. This is used to determine if a child
    // node has fully mounted yet, and for scheduling event replaying.
    // Conceptually this is similar to Placement in that a new subtree is
    // inserted into the React tree here. It just happens to not need DOM
    // mutations because it already exists.
    primaryChildFragment.flags |= Hydrating;
    return primaryChildFragment;
  }
}

function scheduleSuspenseWorkOnFiber(
  fiber: Fiber,
  renderLanes: Lanes,
  propagationRoot: Fiber,
) {
  fiber.lanes = mergeLanes(fiber.lanes, renderLanes);
  const alternate = fiber.alternate;
  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, renderLanes);
  }
  scheduleContextWorkOnParentPath(fiber.return, renderLanes, propagationRoot);
}

function propagateSuspenseContextChange(
  workInProgress: Fiber,
  firstChild: null | Fiber,
  renderLanes: Lanes,
): void {
  // Mark any Suspense boundaries with fallbacks as having work to do.
  // If they were previously forced into fallbacks, they may now be able
  // to unblock.
  let node = firstChild;
  while (node !== null) {
    if (node.tag === SuspenseComponent) {
      const state: SuspenseState | null = node.memoizedState;
      if (state !== null) {
        scheduleSuspenseWorkOnFiber(node, renderLanes, workInProgress);
      }
    } else if (node.tag === SuspenseListComponent) {
      // If the tail is hidden there might not be an Suspense boundaries
      // to schedule work on. In this case we have to schedule it on the
      // list itself.
      // We don't have to traverse to the children of the list since
      // the list will propagate the change when it rerenders.
      scheduleSuspenseWorkOnFiber(node, renderLanes, workInProgress);
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === workInProgress) {
      return;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}

function findLastContentRow(firstChild: null | Fiber): null | Fiber {
  // This is going to find the last row among these children that is already
  // showing content on the screen, as opposed to being in fallback state or
  // new. If a row has multiple Suspense boundaries, any of them being in the
  // fallback state, counts as the whole row being in a fallback state.
  // Note that the "rows" will be workInProgress, but any nested children
  // will still be current since we haven't rendered them yet. The mounted
  // order may not be the same as the new order. We use the new order.
  let row = firstChild;
  let lastContentRow: null | Fiber = null;
  while (row !== null) {
    const currentRow = row.alternate;
    // New rows can't be content rows.
    if (currentRow !== null && findFirstSuspended(currentRow) === null) {
      lastContentRow = row;
    }
    row = row.sibling;
  }
  return lastContentRow;
}

type SuspenseListRevealOrder = 'forwards' | 'backwards' | 'together' | void;

function validateRevealOrder(revealOrder: SuspenseListRevealOrder) {
  if (__DEV__) {
    if (
      revealOrder !== undefined &&
      revealOrder !== 'forwards' &&
      revealOrder !== 'backwards' &&
      revealOrder !== 'together' &&
      !didWarnAboutRevealOrder[revealOrder]
    ) {
      didWarnAboutRevealOrder[revealOrder] = true;
      if (typeof revealOrder === 'string') {
        switch (revealOrder.toLowerCase()) {
          case 'together':
          case 'forwards':
          case 'backwards': {
            console.error(
              '"%s" is not a valid value for revealOrder on <SuspenseList />. ' +
                'Use lowercase "%s" instead.',
              revealOrder,
              revealOrder.toLowerCase(),
            );
            break;
          }
          case 'forward':
          case 'backward': {
            console.error(
              '"%s" is not a valid value for revealOrder on <SuspenseList />. ' +
                'React uses the -s suffix in the spelling. Use "%ss" instead.',
              revealOrder,
              revealOrder.toLowerCase(),
            );
            break;
          }
          default:
            console.error(
              '"%s" is not a supported revealOrder on <SuspenseList />. ' +
                'Did you mean "together", "forwards" or "backwards"?',
              revealOrder,
            );
            break;
        }
      } else {
        console.error(
          '%s is not a supported value for revealOrder on <SuspenseList />. ' +
            'Did you mean "together", "forwards" or "backwards"?',
          revealOrder,
        );
      }
    }
  }
}

function validateTailOptions(
  tailMode: SuspenseListTailMode,
  revealOrder: SuspenseListRevealOrder,
) {
  if (__DEV__) {
    if (tailMode !== undefined && !didWarnAboutTailOptions[tailMode]) {
      if (tailMode !== 'collapsed' && tailMode !== 'hidden') {
        didWarnAboutTailOptions[tailMode] = true;
        console.error(
          '"%s" is not a supported value for tail on <SuspenseList />. ' +
            'Did you mean "collapsed" or "hidden"?',
          tailMode,
        );
      } else if (revealOrder !== 'forwards' && revealOrder !== 'backwards') {
        didWarnAboutTailOptions[tailMode] = true;
        console.error(
          '<SuspenseList tail="%s" /> is only valid if revealOrder is ' +
            '"forwards" or "backwards". ' +
            'Did you mean to specify revealOrder="forwards"?',
          tailMode,
        );
      }
    }
  }
}

function validateSuspenseListNestedChild(childSlot: mixed, index: number) {
  if (__DEV__) {
    const isAnArray = isArray(childSlot);
    const isIterable =
      !isAnArray && typeof getIteratorFn(childSlot) === 'function';
    if (isAnArray || isIterable) {
      const type = isAnArray ? 'array' : 'iterable';
      console.error(
        'A nested %s was passed to row #%s in <SuspenseList />. Wrap it in ' +
          'an additional SuspenseList to configure its revealOrder: ' +
          '<SuspenseList revealOrder=...> ... ' +
          '<SuspenseList revealOrder=...>{%s}</SuspenseList> ... ' +
          '</SuspenseList>',
        type,
        index,
        type,
      );
      return false;
    }
  }
  return true;
}

function validateSuspenseListChildren(
  children: mixed,
  revealOrder: SuspenseListRevealOrder,
) {
  if (__DEV__) {
    if (
      (revealOrder === 'forwards' || revealOrder === 'backwards') &&
      children !== undefined &&
      children !== null &&
      children !== false
    ) {
      if (isArray(children)) {
        for (let i = 0; i < children.length; i++) {
          if (!validateSuspenseListNestedChild(children[i], i)) {
            return;
          }
        }
      } else {
        const iteratorFn = getIteratorFn(children);
        if (typeof iteratorFn === 'function') {
          const childrenIterator = iteratorFn.call(children);
          if (childrenIterator) {
            let step = childrenIterator.next();
            let i = 0;
            for (; !step.done; step = childrenIterator.next()) {
              if (!validateSuspenseListNestedChild(step.value, i)) {
                return;
              }
              i++;
            }
          }
        } else {
          console.error(
            'A single row was passed to a <SuspenseList revealOrder="%s" />. ' +
              'This is not useful since it needs multiple rows. ' +
              'Did you mean to pass multiple children or an array?',
            revealOrder,
          );
        }
      }
    }
  }
}

function initSuspenseListRenderState(
  workInProgress: Fiber,
  isBackwards: boolean,
  tail: null | Fiber,
  lastContentRow: null | Fiber,
  tailMode: SuspenseListTailMode,
): void {
  const renderState: null | SuspenseListRenderState =
    workInProgress.memoizedState;
  if (renderState === null) {
    workInProgress.memoizedState = ({
      isBackwards: isBackwards,
      rendering: null,
      renderingStartTime: 0,
      last: lastContentRow,
      tail: tail,
      tailMode: tailMode,
    }: SuspenseListRenderState);
  } else {
    // We can reuse the existing object from previous renders.
    renderState.isBackwards = isBackwards;
    renderState.rendering = null;
    renderState.renderingStartTime = 0;
    renderState.last = lastContentRow;
    renderState.tail = tail;
    renderState.tailMode = tailMode;
  }
}

// This can end up rendering this component multiple passes.
// The first pass splits the children fibers into two sets. A head and tail.
// We first render the head. If anything is in fallback state, we do another
// pass through beginWork to rerender all children (including the tail) with
// the force suspend context. If the first render didn't have anything in
// in fallback state. Then we render each row in the tail one-by-one.
// That happens in the completeWork phase without going back to beginWork.
function updateSuspenseListComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  const nextProps = workInProgress.pendingProps;
  const revealOrder: SuspenseListRevealOrder = nextProps.revealOrder;
  const tailMode: SuspenseListTailMode = nextProps.tail;
  const newChildren = nextProps.children;

  validateRevealOrder(revealOrder);
  validateTailOptions(tailMode, revealOrder);
  validateSuspenseListChildren(newChildren, revealOrder);

  reconcileChildren(current, workInProgress, newChildren, renderLanes);

  let suspenseContext: SuspenseContext = suspenseStackCursor.current;

  const shouldForceFallback = hasSuspenseContext(
    suspenseContext,
    (ForceSuspenseFallback: SuspenseContext),
  );
  if (shouldForceFallback) {
    suspenseContext = setShallowSuspenseContext(
      suspenseContext,
      ForceSuspenseFallback,
    );
    workInProgress.flags |= DidCapture;
  } else {
    const didSuspendBefore =
      current !== null && (current.flags & DidCapture) !== NoFlags;
    if (didSuspendBefore) {
      // If we previously forced a fallback, we need to schedule work
      // on any nested boundaries to let them know to try to render
      // again. This is the same as context updating.
      propagateSuspenseContextChange(
        workInProgress,
        workInProgress.child,
        renderLanes,
      );
    }
    suspenseContext = setDefaultShallowSuspenseContext(suspenseContext);
  }
  pushSuspenseContext(workInProgress, suspenseContext);

  if ((workInProgress.mode & ConcurrentMode) === NoMode) {
    // In legacy mode, SuspenseList doesn't work so we just
    // use make it a noop by treating it as the default revealOrder.
    workInProgress.memoizedState = null;
  } else {
    switch (revealOrder) {
      case 'forwards': {
        const lastContentRow = findLastContentRow(workInProgress.child);
        let tail;
        if (lastContentRow === null) {
          // The whole list is part of the tail.
          // TODO: We could fast path by just rendering the tail now.
          tail = workInProgress.child;
          workInProgress.child = null;
        } else {
          // Disconnect the tail rows after the content row.
          // We're going to render them separately later.
          tail = lastContentRow.sibling;
          lastContentRow.sibling = null;
        }
        initSuspenseListRenderState(
          workInProgress,
          false, // isBackwards
          tail,
          lastContentRow,
          tailMode,
        );
        break;
      }
      case 'backwards': {
        // We're going to find the first row that has existing content.
        // At the same time we're going to reverse the list of everything
        // we pass in the meantime. That's going to be our tail in reverse
        // order.
        let tail = null;
        let row = workInProgress.child;
        workInProgress.child = null;
        while (row !== null) {
          const currentRow = row.alternate;
          // New rows can't be content rows.
          if (currentRow !== null && findFirstSuspended(currentRow) === null) {
            // This is the beginning of the main content.
            workInProgress.child = row;
            break;
          }
          const nextRow = row.sibling;
          row.sibling = tail;
          tail = row;
          row = nextRow;
        }
        // TODO: If workInProgress.child is null, we can continue on the tail immediately.
        initSuspenseListRenderState(
          workInProgress,
          true, // isBackwards
          tail,
          null, // last
          tailMode,
        );
        break;
      }
      case 'together': {
        initSuspenseListRenderState(
          workInProgress,
          false, // isBackwards
          null, // tail
          null, // last
          undefined,
        );
        break;
      }
      default: {
        // The default reveal order is the same as not having
        // a boundary.
        workInProgress.memoizedState = null;
      }
    }
  }
  return workInProgress.child;
}

function updatePortalComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
  const nextChildren = workInProgress.pendingProps;
  if (current === null) {
    // Portals are special because we don't append the children during mount
    // but at commit. Therefore we need to track insertions which the normal
    // flow doesn't do during mount. This doesn't happen at the root because
    // the root always starts with a "current" with a null child.
    // TODO: Consider unifying this with how the root works.
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes,
    );
  } else {
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  }
  return workInProgress.child;
}

let hasWarnedAboutUsingNoValuePropOnContextProvider = false;

function updateContextProvider(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  const providerType: ReactProviderType<any> = workInProgress.type;
  const context: ReactContext<any> = providerType._context;

  const newProps = workInProgress.pendingProps;
  const oldProps = workInProgress.memoizedProps;

  const newValue = newProps.value;

  if (__DEV__) {
    if (!('value' in newProps)) {
      if (!hasWarnedAboutUsingNoValuePropOnContextProvider) {
        hasWarnedAboutUsingNoValuePropOnContextProvider = true;
        console.error(
          'The `value` prop is required for the `<Context.Provider>`. Did you misspell it or forget to pass it?',
        );
      }
    }
    const providerPropTypes = workInProgress.type.propTypes;

    if (providerPropTypes) {
      checkPropTypes(providerPropTypes, newProps, 'prop', 'Context.Provider');
    }
  }

  pushProvider(workInProgress, context, newValue);

  if (enableLazyContextPropagation) {
    // In the lazy propagation implementation, we don't scan for matching
    // consumers until something bails out, because until something bails out
    // we're going to visit those nodes, anyway. The trade-off is that it shifts
    // responsibility to the consumer to track whether something has changed.
  } else {
    if (oldProps !== null) {
      const oldValue = oldProps.value;
      if (is(oldValue, newValue)) {
        // No change. Bailout early if children are the same.
        if (
          oldProps.children === newProps.children &&
          !hasLegacyContextChanged()
        ) {
          return bailoutOnAlreadyFinishedWork(
            current,
            workInProgress,
            renderLanes,
          );
        }
      } else {
        // The context value changed. Search for matching consumers and schedule
        // them to update.
        propagateContextChange(workInProgress, context, renderLanes);
      }
    }
  }

  const newChildren = newProps.children;
  reconcileChildren(current, workInProgress, newChildren, renderLanes);
  return workInProgress.child;
}

let hasWarnedAboutUsingContextAsConsumer = false;

function updateContextConsumer(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  let context: ReactContext<any> = workInProgress.type;
  // The logic below for Context differs depending on PROD or DEV mode. In
  // DEV mode, we create a separate object for Context.Consumer that acts
  // like a proxy to Context. This proxy object adds unnecessary code in PROD
  // so we use the old behaviour (Context.Consumer references Context) to
  // reduce size and overhead. The separate object references context via
  // a property called "_context", which also gives us the ability to check
  // in DEV mode if this property exists or not and warn if it does not.
  if (__DEV__) {
    if ((context: any)._context === undefined) {
      // This may be because it's a Context (rather than a Consumer).
      // Or it may be because it's older React where they're the same thing.
      // We only want to warn if we're sure it's a new React.
      if (context !== context.Consumer) {
        if (!hasWarnedAboutUsingContextAsConsumer) {
          hasWarnedAboutUsingContextAsConsumer = true;
          console.error(
            'Rendering <Context> directly is not supported and will be removed in ' +
              'a future major release. Did you mean to render <Context.Consumer> instead?',
          );
        }
      }
    } else {
      context = (context: any)._context;
    }
  }
  const newProps = workInProgress.pendingProps;
  const render = newProps.children;

  if (__DEV__) {
    if (typeof render !== 'function') {
      console.error(
        'A context consumer was rendered with multiple children, or a child ' +
          "that isn't a function. A context consumer expects a single child " +
          'that is a function. If you did pass a function, make sure there ' +
          'is no trailing or leading whitespace around it.',
      );
    }
  }

  prepareToReadContext(workInProgress, renderLanes);
  const newValue = readContext(context);
  if (enableSchedulingProfiler) {
    markComponentRenderStarted(workInProgress);
  }
  let newChildren;
  if (__DEV__) {
    ReactCurrentOwner.current = workInProgress;
    setIsRendering(true);
    newChildren = render(newValue);
    setIsRendering(false);
  } else {
    newChildren = render(newValue);
  }
  if (enableSchedulingProfiler) {
    markComponentRenderStopped();
  }

  // React DevTools reads this flag.
  workInProgress.flags |= PerformedWork;
  reconcileChildren(current, workInProgress, newChildren, renderLanes);
  return workInProgress.child;
}

function updateScopeComponent(current, workInProgress, renderLanes) {
  const nextProps = workInProgress.pendingProps;
  const nextChildren = nextProps.children;

  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}

export function markWorkInProgressReceivedUpdate() {
  didReceiveUpdate = true;
}

export function checkIfWorkInProgressReceivedUpdate() {
  return didReceiveUpdate;
}

function bailoutOnAlreadyFinishedWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  if (current !== null) {
    // Reuse previous dependencies
    workInProgress.dependencies = current.dependencies;
  }

  if (enableProfilerTimer) {
    // Don't update "base" render times for bailouts.
    stopProfilerTimerIfRunning(workInProgress);
  }

  markSkippedUpdateLanes(workInProgress.lanes);

  // Check if the children have any pending work.
  if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {
    // The children don't have any work either. We can skip them.
    // TODO: Once we add back resuming, we should check if the children are
    // a work-in-progress set. If so, we need to transfer their effects.

    if (enableLazyContextPropagation && current !== null) {
      // Before bailing out, check if there are any context changes in
      // the children.
      lazilyPropagateParentContextChanges(current, workInProgress, renderLanes);
      if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {
        return null;
      }
    } else {
      return null;
    }
  }

  // This fiber doesn't have work, but its subtree does. Clone the child
  // fibers and continue.
  cloneChildFibers(current, workInProgress);
  return workInProgress.child;
}

function remountFiber(
  current: Fiber,
  oldWorkInProgress: Fiber,
  newWorkInProgress: Fiber,
): Fiber | null {
  if (__DEV__) {
    const returnFiber = oldWorkInProgress.return;
    if (returnFiber === null) {
      // eslint-disable-next-line react-internal/prod-error-codes
      throw new Error('Cannot swap the root fiber.');
    }

    // Disconnect from the old current.
    // It will get deleted.
    current.alternate = null;
    oldWorkInProgress.alternate = null;

    // Connect to the new tree.
    newWorkInProgress.index = oldWorkInProgress.index;
    newWorkInProgress.sibling = oldWorkInProgress.sibling;
    newWorkInProgress.return = oldWorkInProgress.return;
    newWorkInProgress.ref = oldWorkInProgress.ref;

    // Replace the child/sibling pointers above it.
    if (oldWorkInProgress === returnFiber.child) {
      returnFiber.child = newWorkInProgress;
    } else {
      let prevSibling = returnFiber.child;
      if (prevSibling === null) {
        // eslint-disable-next-line react-internal/prod-error-codes
        throw new Error('Expected parent to have a child.');
      }
      while (prevSibling.sibling !== oldWorkInProgress) {
        prevSibling = prevSibling.sibling;
        if (prevSibling === null) {
          // eslint-disable-next-line react-internal/prod-error-codes
          throw new Error('Expected to find the previous sibling.');
        }
      }
      prevSibling.sibling = newWorkInProgress;
    }

    // Delete the old fiber and place the new one.
    // Since the old fiber is disconnected, we have to schedule it manually.
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [current];
      returnFiber.flags |= ChildDeletion;
    } else {
      deletions.push(current);
    }

    newWorkInProgress.flags |= Placement;

    // Restart work from the new fiber.
    return newWorkInProgress;
  } else {
    throw new Error(
      'Did not expect this call in production. ' +
        'This is a bug in React. Please file an issue.',
    );
  }
}

function checkScheduledUpdateOrContext(
  current: Fiber,
  renderLanes: Lanes,
): boolean {
  // Before performing an early bailout, we must check if there are pending
  // updates or context.
  const updateLanes = current.lanes;
  if (includesSomeLane(updateLanes, renderLanes)) {
    return true;
  }
  // No pending update, but because context is propagated lazily, we need
  // to check for a context change before we bail out.
  if (enableLazyContextPropagation) {
    const dependencies = current.dependencies;
    if (dependencies !== null && checkIfContextChanged(dependencies)) {
      return true;
    }
  }
  return false;
}

function attemptEarlyBailoutIfNoScheduledUpdate(
  current: Fiber,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  // This fiber does not have any pending work. Bailout without entering
  // the begin phase. There's still some bookkeeping we that needs to be done
  // in this optimized path, mostly pushing stuff onto the stack.
  switch (workInProgress.tag) {
    case HostRoot:
      pushHostRootContext(workInProgress);
      if (enableCache) {
        const root: FiberRoot = workInProgress.stateNode;
        const cache: Cache = current.memoizedState.cache;
        pushCacheProvider(workInProgress, cache);
        pushRootCachePool(root);
      }
      resetHydrationState();
      break;
    case HostComponent:
      pushHostContext(workInProgress);
      break;
    case ClassComponent: {
      const Component = workInProgress.type;
      if (isLegacyContextProvider(Component)) {
        pushLegacyContextProvider(workInProgress);
      }
      break;
    }
    case HostPortal:
      pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
      break;
    case ContextProvider: {
      const newValue = workInProgress.memoizedProps.value;
      const context: ReactContext<any> = workInProgress.type._context;
      pushProvider(workInProgress, context, newValue);
      break;
    }
    case Profiler:
      if (enableProfilerTimer) {
        // Profiler should only call onRender when one of its descendants actually rendered.
        const hasChildWork = includesSomeLane(
          renderLanes,
          workInProgress.childLanes,
        );
        if (hasChildWork) {
          workInProgress.flags |= Update;
        }

        if (enableProfilerCommitHooks) {
          // Reset effect durations for the next eventual effect phase.
          // These are reset during render to allow the DevTools commit hook a chance to read them,
          const stateNode = workInProgress.stateNode;
          stateNode.effectDuration = 0;
          stateNode.passiveEffectDuration = 0;
        }
      }
      break;
    case SuspenseComponent: {
      const state: SuspenseState | null = workInProgress.memoizedState;
      if (state !== null) {
        if (enableSuspenseServerRenderer) {
          if (state.dehydrated !== null) {
            pushSuspenseContext(
              workInProgress,
              setDefaultShallowSuspenseContext(suspenseStackCursor.current),
            );
            // We know that this component will suspend again because if it has
            // been unsuspended it has committed as a resolved Suspense component.
            // If it needs to be retried, it should have work scheduled on it.
            workInProgress.flags |= DidCapture;
            // We should never render the children of a dehydrated boundary until we
            // upgrade it. We return null instead of bailoutOnAlreadyFinishedWork.
            return null;
          }
        }

        // If this boundary is currently timed out, we need to decide
        // whether to retry the primary children, or to skip over it and
        // go straight to the fallback. Check the priority of the primary
        // child fragment.
        const primaryChildFragment: Fiber = (workInProgress.child: any);
        const primaryChildLanes = primaryChildFragment.childLanes;
        if (includesSomeLane(renderLanes, primaryChildLanes)) {
          // The primary children have pending work. Use the normal path
          // to attempt to render the primary children again.
          return updateSuspenseComponent(current, workInProgress, renderLanes);
        } else {
          // The primary child fragment does not have pending work marked
          // on it
          pushSuspenseContext(
            workInProgress,
            setDefaultShallowSuspenseContext(suspenseStackCursor.current),
          );
          // The primary children do not have pending work with sufficient
          // priority. Bailout.
          const child = bailoutOnAlreadyFinishedWork(
            current,
            workInProgress,
            renderLanes,
          );
          if (child !== null) {
            // The fallback children have pending work. Skip over the
            // primary children and work on the fallback.
            return child.sibling;
          } else {
            // Note: We can return `null` here because we already checked
            // whether there were nested context consumers, via the call to
            // `bailoutOnAlreadyFinishedWork` above.
            return null;
          }
        }
      } else {
        pushSuspenseContext(
          workInProgress,
          setDefaultShallowSuspenseContext(suspenseStackCursor.current),
        );
      }
      break;
    }
    case SuspenseListComponent: {
      const didSuspendBefore = (current.flags & DidCapture) !== NoFlags;

      let hasChildWork = includesSomeLane(
        renderLanes,
        workInProgress.childLanes,
      );

      if (enableLazyContextPropagation && !hasChildWork) {
        // Context changes may not have been propagated yet. We need to do
        // that now, before we can decide whether to bail out.
        // TODO: We use `childLanes` as a heuristic for whether there is
        // remaining work in a few places, including
        // `bailoutOnAlreadyFinishedWork` and
        // `updateDehydratedSuspenseComponent`. We should maybe extract this
        // into a dedicated function.
        lazilyPropagateParentContextChanges(
          current,
          workInProgress,
          renderLanes,
        );
        hasChildWork = includesSomeLane(renderLanes, workInProgress.childLanes);
      }

      if (didSuspendBefore) {
        if (hasChildWork) {
          // If something was in fallback state last time, and we have all the
          // same children then we're still in progressive loading state.
          // Something might get unblocked by state updates or retries in the
          // tree which will affect the tail. So we need to use the normal
          // path to compute the correct tail.
          return updateSuspenseListComponent(
            current,
            workInProgress,
            renderLanes,
          );
        }
        // If none of the children had any work, that means that none of
        // them got retried so they'll still be blocked in the same way
        // as before. We can fast bail out.
        workInProgress.flags |= DidCapture;
      }

      // If nothing suspended before and we're rendering the same children,
      // then the tail doesn't matter. Anything new that suspends will work
      // in the "together" mode, so we can continue from the state we had.
      const renderState = workInProgress.memoizedState;
      if (renderState !== null) {
        // Reset to the "together" mode in case we've started a different
        // update in the past but didn't complete it.
        renderState.rendering = null;
        renderState.tail = null;
        renderState.lastEffect = null;
      }
      pushSuspenseContext(workInProgress, suspenseStackCursor.current);

      if (hasChildWork) {
        break;
      } else {
        // If none of the children had any work, that means that none of
        // them got retried so they'll still be blocked in the same way
        // as before. We can fast bail out.
        return null;
      }
    }
    case OffscreenComponent:
    case LegacyHiddenComponent: {
      // Need to check if the tree still needs to be deferred. This is
      // almost identical to the logic used in the normal update path,
      // so we'll just enter that. The only difference is we'll bail out
      // at the next level instead of this one, because the child props
      // have not changed. Which is fine.
      // TODO: Probably should refactor `beginWork` to split the bailout
      // path from the normal path. I'm tempted to do a labeled break here
      // but I won't :)
      workInProgress.lanes = NoLanes;
      return updateOffscreenComponent(current, workInProgress, renderLanes);
    }
    case CacheComponent: {
      if (enableCache) {
        const cache: Cache = current.memoizedState.cache;
        pushCacheProvider(workInProgress, cache);
      }
      break;
    }
  }
  return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
}

function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  if (__DEV__) {
    if (workInProgress._debugNeedsRemount && current !== null) {
      // This will restart the begin phase with a new fiber.
      return remountFiber(
        current,
        workInProgress,
        createFiberFromTypeAndProps(
          workInProgress.type,
          workInProgress.key,
          workInProgress.pendingProps,
          workInProgress._debugOwner || null,
          workInProgress.mode,
          workInProgress.lanes,
        ),
      );
    }
  }

  if (current !== null) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;

    if (
      oldProps !== newProps ||
      hasLegacyContextChanged() ||
      // Force a re-render if the implementation changed due to hot reload:
      (__DEV__ ? workInProgress.type !== current.type : false)
    ) {
      // If props or context changed, mark the fiber as having performed work.
      // This may be unset if the props are determined to be equal later (memo).
      didReceiveUpdate = true;
    } else {
      // Neither props nor legacy context changes. Check if there's a pending
      // update or context change.
      const hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(
        current,
        renderLanes,
      );
      if (
        !hasScheduledUpdateOrContext &&
        // If this is the second pass of an error or suspense boundary, there
        // may not be work scheduled on `current`, so we check for this flag.
        (workInProgress.flags & DidCapture) === NoFlags
      ) {
        // No pending updates or context. Bail out now.
        didReceiveUpdate = false;
        return attemptEarlyBailoutIfNoScheduledUpdate(
          current,
          workInProgress,
          renderLanes,
        );
      }
      if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {
        // This is a special case that only exists for legacy mode.
        // See https://github.com/facebook/react/pull/19216.
        didReceiveUpdate = true;
      } else {
        // An update was scheduled on this fiber, but there are no new props
        // nor legacy context. Set this to false. If an update queue or context
        // consumer produces a changed value, it will set this to true. Otherwise,
        // the component will assume the children have not changed and bail out.
        didReceiveUpdate = false;
      }
    }
  } else {
    didReceiveUpdate = false;

    if (getIsHydrating() && isForkedChild(workInProgress)) {
      // Check if this child belongs to a list of muliple children in
      // its parent.
      //
      // In a true multi-threaded implementation, we would render children on
      // parallel threads. This would represent the beginning of a new render
      // thread for this subtree.
      //
      // We only use this for id generation during hydration, which is why the
      // logic is located in this special branch.
      const slotIndex = workInProgress.index;
      const numberOfForks = getForksAtLevel(workInProgress);
      pushTreeId(workInProgress, numberOfForks, slotIndex);
    }
  }

  // Before entering the begin phase, clear pending update priority.
  // TODO: This assumes that we're about to evaluate the component and process
  // the update queue. However, there's an exception: SimpleMemoComponent
  // sometimes bails out later in the begin phase. This indicates that we should
  // move this assignment out of the common path and into each branch.
  workInProgress.lanes = NoLanes;

  switch (workInProgress.tag) {
    case IndeterminateComponent: {
      return mountIndeterminateComponent(
        current,
        workInProgress,
        workInProgress.type,
        renderLanes,
      );
    }
    case LazyComponent: {
      const elementType = workInProgress.elementType;
      return mountLazyComponent(
        current,
        workInProgress,
        elementType,
        renderLanes,
      );
    }
    case FunctionComponent: {
      const Component = workInProgress.type;
      const unresolvedProps = workInProgress.pendingProps;
      const resolvedProps =
        workInProgress.elementType === Component
          ? unresolvedProps
          : resolveDefaultProps(Component, unresolvedProps);
      return updateFunctionComponent(
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes,
      );
    }
    case ClassComponent: {
      const Component = workInProgress.type;
      const unresolvedProps = workInProgress.pendingProps;
      const resolvedProps =
        workInProgress.elementType === Component
          ? unresolvedProps
          : resolveDefaultProps(Component, unresolvedProps);
      return updateClassComponent(
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes,
      );
    }
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);
    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);
    case HostText:
      return updateHostText(current, workInProgress);
    case SuspenseComponent:
      return updateSuspenseComponent(current, workInProgress, renderLanes);
    case HostPortal:
      return updatePortalComponent(current, workInProgress, renderLanes);
    case ForwardRef: {
      const type = workInProgress.type;
      const unresolvedProps = workInProgress.pendingProps;
      const resolvedProps =
        workInProgress.elementType === type
          ? unresolvedProps
          : resolveDefaultProps(type, unresolvedProps);
      return updateForwardRef(
        current,
        workInProgress,
        type,
        resolvedProps,
        renderLanes,
      );
    }
    case Fragment:
      return updateFragment(current, workInProgress, renderLanes);
    case Mode:
      return updateMode(current, workInProgress, renderLanes);
    case Profiler:
      return updateProfiler(current, workInProgress, renderLanes);
    case ContextProvider:
      return updateContextProvider(current, workInProgress, renderLanes);
    case ContextConsumer:
      return updateContextConsumer(current, workInProgress, renderLanes);
    case MemoComponent: {
      const type = workInProgress.type;
      const unresolvedProps = workInProgress.pendingProps;
      // Resolve outer props first, then resolve inner props.
      let resolvedProps = resolveDefaultProps(type, unresolvedProps);
      if (__DEV__) {
        if (workInProgress.type !== workInProgress.elementType) {
          const outerPropTypes = type.propTypes;
          if (outerPropTypes) {
            checkPropTypes(
              outerPropTypes,
              resolvedProps, // Resolved for outer only
              'prop',
              getComponentNameFromType(type),
            );
          }
        }
      }
      resolvedProps = resolveDefaultProps(type.type, resolvedProps);
      return updateMemoComponent(
        current,
        workInProgress,
        type,
        resolvedProps,
        renderLanes,
      );
    }
    case SimpleMemoComponent: {
      return updateSimpleMemoComponent(
        current,
        workInProgress,
        workInProgress.type,
        workInProgress.pendingProps,
        renderLanes,
      );
    }
    case IncompleteClassComponent: {
      const Component = workInProgress.type;
      const unresolvedProps = workInProgress.pendingProps;
      const resolvedProps =
        workInProgress.elementType === Component
          ? unresolvedProps
          : resolveDefaultProps(Component, unresolvedProps);
      return mountIncompleteClassComponent(
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes,
      );
    }
    case SuspenseListComponent: {
      return updateSuspenseListComponent(current, workInProgress, renderLanes);
    }
    case ScopeComponent: {
      if (enableScopeAPI) {
        return updateScopeComponent(current, workInProgress, renderLanes);
      }
      break;
    }
    case OffscreenComponent: {
      return updateOffscreenComponent(current, workInProgress, renderLanes);
    }
    case LegacyHiddenComponent: {
      return updateLegacyHiddenComponent(current, workInProgress, renderLanes);
    }
    case CacheComponent: {
      if (enableCache) {
        return updateCacheComponent(current, workInProgress, renderLanes);
      }
      break;
    }
    case TracingMarkerComponent: {
      if (enableTransitionTracing) {
        return updateTracingMarkerComponent(
          current,
          workInProgress,
          renderLanes,
        );
      }
      break;
    }
  }

  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
      'React. Please file an issue.',
  );
}

export {beginWork};
