/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  MutableSource,
  MutableSourceGetSnapshotFn,
  MutableSourceSubscribeFn,
  ReactContext,
} from 'shared/ReactTypes';
import type {Fiber, Dispatcher, HookType} from './ReactInternalTypes';
import type {Lanes, Lane} from './ReactFiberLane.old';
import type {HookFlags} from './ReactHookEffectTags';
import type {FiberRoot} from './ReactInternalTypes';
import type {Cache} from './ReactFiberCacheComponent.old';
import type {Flags} from './ReactFiberFlags';

import ReactSharedInternals from 'shared/ReactSharedInternals';
import {
  enableDebugTracing,
  enableSchedulingProfiler,
  enableNewReconciler,
  enableCache,
  enableUseRefAccessWarning,
  enableStrictEffects,
  enableLazyContextPropagation,
  enableSuspenseLayoutEffectSemantics,
  enableUseMutableSource,
} from 'shared/ReactFeatureFlags';

import {
  NoMode,
  ConcurrentMode,
  DebugTracingMode,
  StrictEffectsMode,
} from './ReactTypeOfMode';
import {
  NoLane,
  SyncLane,
  NoLanes,
  isSubsetOfLanes,
  includesBlockingLane,
  mergeLanes,
  removeLanes,
  intersectLanes,
  isTransitionLane,
  markRootEntangled,
  markRootMutableRead,
  NoTimestamp,
} from './ReactFiberLane.old';
import {
  ContinuousEventPriority,
  getCurrentUpdatePriority,
  setCurrentUpdatePriority,
  higherEventPriority,
} from './ReactEventPriorities.old';
import {readContext, checkIfContextChanged} from './ReactFiberNewContext.old';
import {HostRoot, CacheComponent} from './ReactWorkTags';
import {
  LayoutStatic as LayoutStaticEffect,
  MountLayoutDev as MountLayoutDevEffect,
  MountPassiveDev as MountPassiveDevEffect,
  Passive as PassiveEffect,
  PassiveStatic as PassiveStaticEffect,
  StaticMask as StaticMaskEffect,
  Update as UpdateEffect,
  StoreConsistency,
} from './ReactFiberFlags';
import {
  HasEffect as HookHasEffect,
  Layout as HookLayout,
  Passive as HookPassive,
  Insertion as HookInsertion,
} from './ReactHookEffectTags';
import {
  getWorkInProgressRoot,
  scheduleUpdateOnFiber,
  requestUpdateLane,
  requestEventTime,
  markSkippedUpdateLanes,
  isInterleavedUpdate,
} from './ReactFiberWorkLoop.old';

import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
import is from 'shared/objectIs';
import isArray from 'shared/isArray';
import {
  markWorkInProgressReceivedUpdate,
  checkIfWorkInProgressReceivedUpdate,
} from './ReactFiberBeginWork.old';
import {getIsHydrating} from './ReactFiberHydrationContext.old';
import {
  getWorkInProgressVersion,
  markSourceAsDirty,
  setWorkInProgressVersion,
  warnAboutMultipleRenderersDEV,
} from './ReactMutableSource.old';
import {logStateUpdateScheduled} from './DebugTracing';
import {markStateUpdateScheduled} from './ReactFiberDevToolsHook.old';
import {createCache, CacheContext} from './ReactFiberCacheComponent.old';
import {
  createUpdate as createLegacyQueueUpdate,
  enqueueUpdate as enqueueLegacyQueueUpdate,
  entangleTransitions as entangleLegacyQueueTransitions,
} from './ReactUpdateQueue.old';
import {pushInterleavedQueue} from './ReactFiberInterleavedUpdates.old';
import {warnOnSubscriptionInsideStartTransition} from 'shared/ReactFeatureFlags';
import {getTreeId} from './ReactFiberTreeContext.old';

const {ReactCurrentDispatcher, ReactCurrentBatchConfig} = ReactSharedInternals;

type Update<S, A> = {|
  lane: Lane,
  action: A,
  hasEagerState: boolean,
  eagerState: S | null,
  next: Update<S, A>,
|};

export type UpdateQueue<S, A> = {|
  pending: Update<S, A> | null,
  interleaved: Update<S, A> | null,
  lanes: Lanes,
  dispatch: (A => mixed) | null,
  lastRenderedReducer: ((S, A) => S) | null,
  lastRenderedState: S | null,
|};

let didWarnAboutMismatchedHooksForComponent;
let didWarnUncachedGetSnapshot;
if (__DEV__) {
  didWarnAboutMismatchedHooksForComponent = new Set();
}

export type Hook = {|
  memoizedState: any,
  baseState: any,
  baseQueue: Update<any, any> | null,
  queue: any,
  next: Hook | null,
|};

export type Effect = {|
  tag: HookFlags,
  create: () => (() => void) | void,
  destroy: (() => void) | void,
  deps: Array<mixed> | null,
  next: Effect,
|};

type StoreInstance<T> = {|
  value: T,
  getSnapshot: () => T,
|};

type StoreConsistencyCheck<T> = {|
  value: T,
  getSnapshot: () => T,
|};

export type FunctionComponentUpdateQueue = {|
  lastEffect: Effect | null,
  stores: Array<StoreConsistencyCheck<any>> | null,
|};

type BasicStateAction<S> = (S => S) | S;

type Dispatch<A> = A => void;

// These are set right before calling the component.
let renderLanes: Lanes = NoLanes;
// The work-in-progress fiber. I've named it differently to distinguish it from
// the work-in-progress hook.
let currentlyRenderingFiber: Fiber = (null: any);

// Hooks are stored as a linked list on the fiber's memoizedState field. The
// current hook list is the list that belongs to the current fiber. The
// work-in-progress hook list is a new list that will be added to the
// work-in-progress fiber.
let currentHook: Hook | null = null;
let workInProgressHook: Hook | null = null;

// Whether an update was scheduled at any point during the render phase. This
// does not get reset if we do another render pass; only when we're completely
// finished evaluating this component. This is an optimization so we know
// whether we need to clear render phase updates after a throw.
let didScheduleRenderPhaseUpdate: boolean = false;
// Where an update was scheduled only during the current render pass. This
// gets reset after each attempt.
// TODO: Maybe there's some way to consolidate this with
// `didScheduleRenderPhaseUpdate`. Or with `numberOfReRenders`.
let didScheduleRenderPhaseUpdateDuringThisPass: boolean = false;
// Counts the number of useId hooks in this component.
let localIdCounter: number = 0;
// Used for ids that are generated completely client-side (i.e. not during
// hydration). This counter is global, so client ids are not stable across
// render attempts.
let globalClientIdCounter: number = 0;

const RE_RENDER_LIMIT = 25;

// In DEV, this is the name of the currently executing primitive hook
let currentHookNameInDev: ?HookType = null;

// In DEV, this list ensures that hooks are called in the same order between renders.
// The list stores the order of hooks used during the initial render (mount).
// Subsequent renders (updates) reference this list.
let hookTypesDev: Array<HookType> | null = null;
let hookTypesUpdateIndexDev: number = -1;

// In DEV, this tracks whether currently rendering component needs to ignore
// the dependencies for Hooks that need them (e.g. useEffect or useMemo).
// When true, such Hooks will always be "remounted". Only used during hot reload.
let ignorePreviousDependencies: boolean = false;

function mountHookTypesDev() {
  if (__DEV__) {
    const hookName = ((currentHookNameInDev: any): HookType);

    if (hookTypesDev === null) {
      hookTypesDev = [hookName];
    } else {
      hookTypesDev.push(hookName);
    }
  }
}

function updateHookTypesDev() {
  if (__DEV__) {
    const hookName = ((currentHookNameInDev: any): HookType);

    if (hookTypesDev !== null) {
      hookTypesUpdateIndexDev++;
      if (hookTypesDev[hookTypesUpdateIndexDev] !== hookName) {
        warnOnHookMismatchInDev(hookName);
      }
    }
  }
}

function checkDepsAreArrayDev(deps: mixed) {
  if (__DEV__) {
    if (deps !== undefined && deps !== null && !isArray(deps)) {
      // Verify deps, but only on mount to avoid extra checks.
      // It's unlikely their type would change as usually you define them inline.
      console.error(
        '%s received a final argument that is not an array (instead, received `%s`). When ' +
          'specified, the final argument must be an array.',
        currentHookNameInDev,
        typeof deps,
      );
    }
  }
}

function warnOnHookMismatchInDev(currentHookName: HookType) {
  if (__DEV__) {
    const componentName = getComponentNameFromFiber(currentlyRenderingFiber);
    if (!didWarnAboutMismatchedHooksForComponent.has(componentName)) {
      didWarnAboutMismatchedHooksForComponent.add(componentName);

      if (hookTypesDev !== null) {
        let table = '';

        const secondColumnStart = 30;

        for (let i = 0; i <= ((hookTypesUpdateIndexDev: any): number); i++) {
          const oldHookName = hookTypesDev[i];
          const newHookName =
            i === ((hookTypesUpdateIndexDev: any): number)
              ? currentHookName
              : oldHookName;

          let row = `${i + 1}. ${oldHookName}`;

          // Extra space so second column lines up
          // lol @ IE not supporting String#repeat
          while (row.length < secondColumnStart) {
            row += ' ';
          }

          row += newHookName + '\n';

          table += row;
        }

        console.error(
          'React has detected a change in the order of Hooks called by %s. ' +
            'This will lead to bugs and errors if not fixed. ' +
            'For more information, read the Rules of Hooks: https://reactjs.org/link/rules-of-hooks\n\n' +
            '   Previous render            Next render\n' +
            '   ------------------------------------------------------\n' +
            '%s' +
            '   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n',
          componentName,
          table,
        );
      }
    }
  }
}

function throwInvalidHookError() {
  throw new Error(
    'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
      ' one of the following reasons:\n' +
      '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
      '2. You might be breaking the Rules of Hooks\n' +
      '3. You might have more than one copy of React in the same app\n' +
      'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.',
  );
}

function areHookInputsEqual(
  nextDeps: Array<mixed>,
  prevDeps: Array<mixed> | null,
) {
  if (__DEV__) {
    if (ignorePreviousDependencies) {
      // Only true when this component is being hot reloaded.
      return false;
    }
  }

  if (prevDeps === null) {
    if (__DEV__) {
      console.error(
        '%s received a final argument during this render, but not during ' +
          'the previous render. Even though the final argument is optional, ' +
          'its type cannot change between renders.',
        currentHookNameInDev,
      );
    }
    return false;
  }

  if (__DEV__) {
    // Don't bother comparing lengths in prod because these arrays should be
    // passed inline.
    if (nextDeps.length !== prevDeps.length) {
      console.error(
        'The final argument passed to %s changed size between renders. The ' +
          'order and size of this array must remain constant.\n\n' +
          'Previous: %s\n' +
          'Incoming: %s',
        currentHookNameInDev,
        `[${prevDeps.join(', ')}]`,
        `[${nextDeps.join(', ')}]`,
      );
    }
  }
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}

export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;

  if (__DEV__) {
    hookTypesDev =
      current !== null
        ? ((current._debugHookTypes: any): Array<HookType>)
        : null;
    hookTypesUpdateIndexDev = -1;
    // Used for hot reloading:
    ignorePreviousDependencies =
      current !== null && current.type !== workInProgress.type;
  }

  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.lanes = NoLanes;

  // The following should have already been reset
  // currentHook = null;
  // workInProgressHook = null;

  // didScheduleRenderPhaseUpdate = false;
  // localIdCounter = 0;

  // TODO Warn if no hooks are used at all during mount, then some are used during update.
  // Currently we will identify the update render as a mount because memoizedState === null.
  // This is tricky because it's valid for certain types of components (e.g. React.lazy)

  // Using memoizedState to differentiate between mount/update only works if at least one stateful hook is used.
  // Non-stateful hooks (e.g. context) don't get added to memoizedState,
  // so memoizedState would be null during updates and mounts.
  if (__DEV__) {
    if (current !== null && current.memoizedState !== null) {
      ReactCurrentDispatcher.current = HooksDispatcherOnUpdateInDEV;
    } else if (hookTypesDev !== null) {
      // This dispatcher handles an edge case where a component is updating,
      // but no stateful hooks have been used.
      // We want to match the production code behavior (which will use HooksDispatcherOnMount),
      // but with the extra DEV validation to ensure hooks ordering hasn't changed.
      // This dispatcher does that.
      ReactCurrentDispatcher.current = HooksDispatcherOnMountWithHookTypesInDEV;
    } else {
      ReactCurrentDispatcher.current = HooksDispatcherOnMountInDEV;
    }
  } else {
    ReactCurrentDispatcher.current =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;
  }

  let children = Component(props, secondArg);

  // Check if there was a render phase update
  if (didScheduleRenderPhaseUpdateDuringThisPass) {
    // Keep rendering in a loop for as long as render phase updates continue to
    // be scheduled. Use a counter to prevent infinite loops.
    let numberOfReRenders: number = 0;
    do {
      didScheduleRenderPhaseUpdateDuringThisPass = false;
      localIdCounter = 0;

      if (numberOfReRenders >= RE_RENDER_LIMIT) {
        throw new Error(
          'Too many re-renders. React limits the number of renders to prevent ' +
            'an infinite loop.',
        );
      }

      numberOfReRenders += 1;
      if (__DEV__) {
        // Even when hot reloading, allow dependencies to stabilize
        // after first render to prevent infinite render phase updates.
        ignorePreviousDependencies = false;
      }

      // Start over from the beginning of the list
      currentHook = null;
      workInProgressHook = null;

      workInProgress.updateQueue = null;

      if (__DEV__) {
        // Also validate hook order for cascading updates.
        hookTypesUpdateIndexDev = -1;
      }

      ReactCurrentDispatcher.current = __DEV__
        ? HooksDispatcherOnRerenderInDEV
        : HooksDispatcherOnRerender;

      children = Component(props, secondArg);
    } while (didScheduleRenderPhaseUpdateDuringThisPass);
  }

  // We can assume the previous dispatcher is always this one, since we set it
  // at the beginning of the render phase and there's no re-entrance.
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;

  if (__DEV__) {
    workInProgress._debugHookTypes = hookTypesDev;
  }

  // This check uses currentHook so that it works the same in DEV and prod bundles.
  // hookTypesDev could catch more cases (e.g. context) but only in DEV bundles.
  const didRenderTooFewHooks =
    currentHook !== null && currentHook.next !== null;

  renderLanes = NoLanes;
  currentlyRenderingFiber = (null: any);

  currentHook = null;
  workInProgressHook = null;

  if (__DEV__) {
    currentHookNameInDev = null;
    hookTypesDev = null;
    hookTypesUpdateIndexDev = -1;

    // Confirm that a static flag was not added or removed since the last
    // render. If this fires, it suggests that we incorrectly reset the static
    // flags in some other part of the codebase. This has happened before, for
    // example, in the SuspenseList implementation.
    if (
      current !== null &&
      (current.flags & StaticMaskEffect) !==
        (workInProgress.flags & StaticMaskEffect) &&
      // Disable this warning in legacy mode, because legacy Suspense is weird
      // and creates false positives. To make this work in legacy mode, we'd
      // need to mark fibers that commit in an incomplete state, somehow. For
      // now I'll disable the warning that most of the bugs that would trigger
      // it are either exclusive to concurrent mode or exist in both.
      (current.mode & ConcurrentMode) !== NoMode
    ) {
      console.error(
        'Internal React error: Expected static flag was missing. Please ' +
          'notify the React team.',
      );
    }
  }

  didScheduleRenderPhaseUpdate = false;
  // This is reset by checkDidRenderIdHook
  // localIdCounter = 0;

  if (didRenderTooFewHooks) {
    throw new Error(
      'Rendered fewer hooks than expected. This may be caused by an accidental ' +
        'early return statement.',
    );
  }

  if (enableLazyContextPropagation) {
    if (current !== null) {
      if (!checkIfWorkInProgressReceivedUpdate()) {
        // If there were no changes to props or state, we need to check if there
        // was a context change. We didn't already do this because there's no
        // 1:1 correspondence between dependencies and hooks. Although, because
        // there almost always is in the common case (`readContext` is an
        // internal API), we could compare in there. OTOH, we only hit this case
        // if everything else bails out, so on the whole it might be better to
        // keep the comparison out of the common path.
        const currentDependencies = current.dependencies;
        if (
          currentDependencies !== null &&
          checkIfContextChanged(currentDependencies)
        ) {
          markWorkInProgressReceivedUpdate();
        }
      }
    }
  }
  return children;
}

export function checkDidRenderIdHook() {
  // This should be called immediately after every renderWithHooks call.
  // Conceptually, it's part of the return value of renderWithHooks; it's only a
  // separate function to avoid using an array tuple.
  const didRenderIdHook = localIdCounter !== 0;
  localIdCounter = 0;
  return didRenderIdHook;
}

export function bailoutHooks(
  current: Fiber,
  workInProgress: Fiber,
  lanes: Lanes,
) {
  workInProgress.updateQueue = current.updateQueue;
  // TODO: Don't need to reset the flags here, because they're reset in the
  // complete phase (bubbleProperties).
  if (
    __DEV__ &&
    enableStrictEffects &&
    (workInProgress.mode & StrictEffectsMode) !== NoMode
  ) {
    workInProgress.flags &= ~(
      MountPassiveDevEffect |
      MountLayoutDevEffect |
      PassiveEffect |
      UpdateEffect
    );
  } else {
    workInProgress.flags &= ~(PassiveEffect | UpdateEffect);
  }
  current.lanes = removeLanes(current.lanes, lanes);
}

export function resetHooksAfterThrow(): void {
  // We can assume the previous dispatcher is always this one, since we set it
  // at the beginning of the render phase and there's no re-entrance.
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;

  if (didScheduleRenderPhaseUpdate) {
    // There were render phase updates. These are only valid for this render
    // phase, which we are now aborting. Remove the updates from the queues so
    // they do not persist to the next render. Do not remove updates from hooks
    // that weren't processed.
    //
    // Only reset the updates from the queue if it has a clone. If it does
    // not have a clone, that means it wasn't processed, and the updates were
    // scheduled before we entered the render phase.
    let hook: Hook | null = currentlyRenderingFiber.memoizedState;
    while (hook !== null) {
      const queue = hook.queue;
      if (queue !== null) {
        queue.pending = null;
      }
      hook = hook.next;
    }
    didScheduleRenderPhaseUpdate = false;
  }

  renderLanes = NoLanes;
  currentlyRenderingFiber = (null: any);

  currentHook = null;
  workInProgressHook = null;

  if (__DEV__) {
    hookTypesDev = null;
    hookTypesUpdateIndexDev = -1;

    currentHookNameInDev = null;

    isUpdatingOpaqueValueInRenderPhase = false;
  }

  didScheduleRenderPhaseUpdateDuringThisPass = false;
  localIdCounter = 0;
}

function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    memoizedState: null,

    baseState: null,
    baseQueue: null,
    queue: null,

    next: null,
  };

  if (workInProgressHook === null) {
    // This is the first hook in the list
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // Append to the end of the list
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}

function updateWorkInProgressHook(): Hook {
  // This function is used both for updates and for re-renders triggered by a
  // render phase update. It assumes there is either a current hook we can
  // clone, or a work-in-progress hook from a previous render pass that we can
  // use as a base. When we reach the end of the base list, we must switch to
  // the dispatcher used for mounts.
  let nextCurrentHook: null | Hook;
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    nextCurrentHook = currentHook.next;
  }

  let nextWorkInProgressHook: null | Hook;
  if (workInProgressHook === null) {
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else {
    nextWorkInProgressHook = workInProgressHook.next;
  }

  if (nextWorkInProgressHook !== null) {
    // There's already a work-in-progress. Reuse it.
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;

    currentHook = nextCurrentHook;
  } else {
    // Clone from the current hook.

    if (nextCurrentHook === null) {
      throw new Error('Rendered more hooks than during the previous render.');
    }

    currentHook = nextCurrentHook;

    const newHook: Hook = {
      memoizedState: currentHook.memoizedState,

      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,

      next: null,
    };

    if (workInProgressHook === null) {
      // This is the first hook in the list.
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
      // Append to the end of the list.
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }
  return workInProgressHook;
}

function createFunctionComponentUpdateQueue(): FunctionComponentUpdateQueue {
  return {
    lastEffect: null,
    stores: null,
  };
}

function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  // $FlowFixMe: Flow doesn't like mixed types
  return typeof action === 'function' ? action(state) : action;
}

function mountReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  const hook = mountWorkInProgressHook();
  let initialState;
  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = ((initialArg: any): S);
  }
  hook.memoizedState = hook.baseState = initialState;
  const queue: UpdateQueue<S, A> = {
    pending: null,
    interleaved: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: (initialState: any),
  };
  hook.queue = queue;
  const dispatch: Dispatch<A> = (queue.dispatch = (dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any));
  return [hook.memoizedState, dispatch];
}

function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;

  if (queue === null) {
    throw new Error(
      'Should have a queue. This is likely a bug in React. Please file an issue.',
    );
  }

  queue.lastRenderedReducer = reducer;

  const current: Hook = (currentHook: any);

  // The last rebase update that is NOT part of the base state.
  let baseQueue = current.baseQueue;

  // The last pending update that hasn't been processed yet.
  const pendingQueue = queue.pending;
  if (pendingQueue !== null) {
    // We have new updates that haven't been processed yet.
    // We'll add them to the base queue.
    if (baseQueue !== null) {
      // Merge the pending queue and the base queue.
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }
    if (__DEV__) {
      if (current.baseQueue !== baseQueue) {
        // Internal invariant that should never happen, but feasibly could in
        // the future if we implement resuming, or some form of that.
        console.error(
          'Internal error: Expected work-in-progress queue to be a clone. ' +
            'This is a bug in React.',
        );
      }
    }
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }

  if (baseQueue !== null) {
    // We have a queue to process.
    const first = baseQueue.next;
    let newState = current.baseState;

    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;
    do {
      const updateLane = update.lane;
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        // Priority is insufficient. Skip this update. If this is the first
        // skipped update, the previous update/state is the new base
        // update/state.
        const clone: Update<S, A> = {
          lane: updateLane,
          action: update.action,
          hasEagerState: update.hasEagerState,
          eagerState: update.eagerState,
          next: (null: any),
        };
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;
        } else {
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        // Update the remaining priority in the queue.
        // TODO: Don't need to accumulate this. Instead, we can remove
        // renderLanes from the original lanes.
        currentlyRenderingFiber.lanes = mergeLanes(
          currentlyRenderingFiber.lanes,
          updateLane,
        );
        markSkippedUpdateLanes(updateLane);
      } else {
        // This update does have sufficient priority.

        if (newBaseQueueLast !== null) {
          const clone: Update<S, A> = {
            // This update is going to be committed so we never want uncommit
            // it. Using NoLane works because 0 is a subset of all bitmasks, so
            // this will never be skipped by the check above.
            lane: NoLane,
            action: update.action,
            hasEagerState: update.hasEagerState,
            eagerState: update.eagerState,
            next: (null: any),
          };
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }

        // Process this update.
        if (update.hasEagerState) {
          // If this update is a state update (not a reducer) and was processed eagerly,
          // we can use the eagerly computed state
          newState = ((update.eagerState: any): S);
        } else {
          const action = update.action;
          newState = reducer(newState, action);
        }
      }
      update = update.next;
    } while (update !== null && update !== first);

    if (newBaseQueueLast === null) {
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = (newBaseQueueFirst: any);
    }

    // Mark that the fiber performed work, but only if the new state is
    // different from the current state.
    if (!is(newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();
    }

    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;

    queue.lastRenderedState = newState;
  }

  // Interleaved updates are stored on a separate queue. We aren't going to
  // process them during this render, but we do need to track which lanes
  // are remaining.
  const lastInterleaved = queue.interleaved;
  if (lastInterleaved !== null) {
    let interleaved = lastInterleaved;
    do {
      const interleavedLane = interleaved.lane;
      currentlyRenderingFiber.lanes = mergeLanes(
        currentlyRenderingFiber.lanes,
        interleavedLane,
      );
      markSkippedUpdateLanes(interleavedLane);
      interleaved = ((interleaved: any).next: Update<S, A>);
    } while (interleaved !== lastInterleaved);
  } else if (baseQueue === null) {
    // `queue.lanes` is used for entangling transitions. We can set it back to
    // zero once the queue is empty.
    queue.lanes = NoLanes;
  }

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  return [hook.memoizedState, dispatch];
}

function rerenderReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;

  if (queue === null) {
    throw new Error(
      'Should have a queue. This is likely a bug in React. Please file an issue.',
    );
  }

  queue.lastRenderedReducer = reducer;

  // This is a re-render. Apply the new render phase updates to the previous
  // work-in-progress hook.
  const dispatch: Dispatch<A> = (queue.dispatch: any);
  const lastRenderPhaseUpdate = queue.pending;
  let newState = hook.memoizedState;
  if (lastRenderPhaseUpdate !== null) {
    // The queue doesn't persist past this render pass.
    queue.pending = null;

    const firstRenderPhaseUpdate = lastRenderPhaseUpdate.next;
    let update = firstRenderPhaseUpdate;
    do {
      // Process this render phase update. We don't have to check the
      // priority because it will always be the same as the current
      // render's.
      const action = update.action;
      newState = reducer(newState, action);
      update = update.next;
    } while (update !== firstRenderPhaseUpdate);

    // Mark that the fiber performed work, but only if the new state is
    // different from the current state.
    if (!is(newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();
    }

    hook.memoizedState = newState;
    // Don't persist the state accumulated from the render phase updates to
    // the base state unless the queue is empty.
    // TODO: Not sure if this is the desired semantics, but it's what we
    // do for gDSFP. I can't remember why.
    if (hook.baseQueue === null) {
      hook.baseState = newState;
    }

    queue.lastRenderedState = newState;
  }
  return [newState, dispatch];
}

type MutableSourceMemoizedState<Source, Snapshot> = {|
  refs: {
    getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
    setSnapshot: Snapshot => void,
  },
  source: MutableSource<any>,
  subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
|};

function readFromUnsubscribedMutableSource<Source, Snapshot>(
  root: FiberRoot,
  source: MutableSource<Source>,
  getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
): Snapshot {
  if (__DEV__) {
    warnAboutMultipleRenderersDEV(source);
  }

  const getVersion = source._getVersion;
  const version = getVersion(source._source);

  // Is it safe for this component to read from this source during the current render?
  let isSafeToReadFromSource = false;

  // Check the version first.
  // If this render has already been started with a specific version,
  // we can use it alone to determine if we can safely read from the source.
  const currentRenderVersion = getWorkInProgressVersion(source);
  if (currentRenderVersion !== null) {
    // It's safe to read if the store hasn't been mutated since the last time
    // we read something.
    isSafeToReadFromSource = currentRenderVersion === version;
  } else {
    // If there's no version, then this is the first time we've read from the
    // source during the current render pass, so we need to do a bit more work.
    // What we need to determine is if there are any hooks that already
    // subscribed to the source, and if so, whether there are any pending
    // mutations that haven't been synchronized yet.
    //
    // If there are no pending mutations, then `root.mutableReadLanes` will be
    // empty, and we know we can safely read.
    //
    // If there *are* pending mutations, we may still be able to safely read
    // if the currently rendering lanes are inclusive of the pending mutation
    // lanes, since that guarantees that the value we're about to read from
    // the source is consistent with the values that we read during the most
    // recent mutation.
    isSafeToReadFromSource = isSubsetOfLanes(
      renderLanes,
      root.mutableReadLanes,
    );

    if (isSafeToReadFromSource) {
      // If it's safe to read from this source during the current render,
      // store the version in case other components read from it.
      // A changed version number will let those components know to throw and restart the render.
      setWorkInProgressVersion(source, version);
    }
  }

  if (isSafeToReadFromSource) {
    const snapshot = getSnapshot(source._source);
    if (__DEV__) {
      if (typeof snapshot === 'function') {
        console.error(
          'Mutable source should not return a function as the snapshot value. ' +
            'Functions may close over mutable values and cause tearing.',
        );
      }
    }
    return snapshot;
  } else {
    // This handles the special case of a mutable source being shared between renderers.
    // In that case, if the source is mutated between the first and second renderer,
    // The second renderer don't know that it needs to reset the WIP version during unwind,
    // (because the hook only marks sources as dirty if it's written to their WIP version).
    // That would cause this tear check to throw again and eventually be visible to the user.
    // We can avoid this infinite loop by explicitly marking the source as dirty.
    //
    // This can lead to tearing in the first renderer when it resumes,
    // but there's nothing we can do about that (short of throwing here and refusing to continue the render).
    markSourceAsDirty(source);

    // Intentioally throw an error to force React to retry synchronously. During
    // the synchronous retry, it will block interleaved mutations, so we should
    // get a consistent read. Therefore, the following error should never be
    // visible to the user.

    // We expect this error not to be thrown during the synchronous retry,
    // because we blocked interleaved mutations.
    throw new Error(
      'Cannot read from mutable source during the current render without tearing. This may be a bug in React. Please file an issue.',
    );
  }
}

function useMutableSource<Source, Snapshot>(
  hook: Hook,
  source: MutableSource<Source>,
  getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
  subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
): Snapshot {
  if (!enableUseMutableSource) {
    return (undefined: any);
  }

  const root = ((getWorkInProgressRoot(): any): FiberRoot);

  if (root === null) {
    throw new Error(
      'Expected a work-in-progress root. This is a bug in React. Please file an issue.',
    );
  }

  const getVersion = source._getVersion;
  const version = getVersion(source._source);

  const dispatcher = ReactCurrentDispatcher.current;

  // eslint-disable-next-line prefer-const
  let [currentSnapshot, setSnapshot] = dispatcher.useState(() =>
    readFromUnsubscribedMutableSource(root, source, getSnapshot),
  );
  let snapshot = currentSnapshot;

  // Grab a handle to the state hook as well.
  // We use it to clear the pending update queue if we have a new source.
  const stateHook = ((workInProgressHook: any): Hook);

  const memoizedState = ((hook.memoizedState: any): MutableSourceMemoizedState<
    Source,
    Snapshot,
  >);
  const refs = memoizedState.refs;
  const prevGetSnapshot = refs.getSnapshot;
  const prevSource = memoizedState.source;
  const prevSubscribe = memoizedState.subscribe;

  const fiber = currentlyRenderingFiber;

  hook.memoizedState = ({
    refs,
    source,
    subscribe,
  }: MutableSourceMemoizedState<Source, Snapshot>);

  // Sync the values needed by our subscription handler after each commit.
  dispatcher.useEffect(() => {
    refs.getSnapshot = getSnapshot;

    // Normally the dispatch function for a state hook never changes,
    // but this hook recreates the queue in certain cases  to avoid updates from stale sources.
    // handleChange() below needs to reference the dispatch function without re-subscribing,
    // so we use a ref to ensure that it always has the latest version.
    refs.setSnapshot = setSnapshot;

    // Check for a possible change between when we last rendered now.
    const maybeNewVersion = getVersion(source._source);
    if (!is(version, maybeNewVersion)) {
      const maybeNewSnapshot = getSnapshot(source._source);
      if (__DEV__) {
        if (typeof maybeNewSnapshot === 'function') {
          console.error(
            'Mutable source should not return a function as the snapshot value. ' +
              'Functions may close over mutable values and cause tearing.',
          );
        }
      }

      if (!is(snapshot, maybeNewSnapshot)) {
        setSnapshot(maybeNewSnapshot);

        const lane = requestUpdateLane(fiber);
        markRootMutableRead(root, lane);
      }
      // If the source mutated between render and now,
      // there may be state updates already scheduled from the old source.
      // Entangle the updates so that they render in the same batch.
      markRootEntangled(root, root.mutableReadLanes);
    }
  }, [getSnapshot, source, subscribe]);

  // If we got a new source or subscribe function, re-subscribe in a passive effect.
  dispatcher.useEffect(() => {
    const handleChange = () => {
      const latestGetSnapshot = refs.getSnapshot;
      const latestSetSnapshot = refs.setSnapshot;

      try {
        latestSetSnapshot(latestGetSnapshot(source._source));

        // Record a pending mutable source update with the same expiration time.
        const lane = requestUpdateLane(fiber);

        markRootMutableRead(root, lane);
      } catch (error) {
        // A selector might throw after a source mutation.
        // e.g. it might try to read from a part of the store that no longer exists.
        // In this case we should still schedule an update with React.
        // Worst case the selector will throw again and then an error boundary will handle it.
        latestSetSnapshot(
          (() => {
            throw error;
          }: any),
        );
      }
    };

    const unsubscribe = subscribe(source._source, handleChange);
    if (__DEV__) {
      if (typeof unsubscribe !== 'function') {
        console.error(
          'Mutable source subscribe function must return an unsubscribe function.',
        );
      }
    }

    return unsubscribe;
  }, [source, subscribe]);

  // If any of the inputs to useMutableSource change, reading is potentially unsafe.
  //
  // If either the source or the subscription have changed we can't can't trust the update queue.
  // Maybe the source changed in a way that the old subscription ignored but the new one depends on.
  //
  // If the getSnapshot function changed, we also shouldn't rely on the update queue.
  // It's possible that the underlying source was mutated between the when the last "change" event fired,
  // and when the current render (with the new getSnapshot function) is processed.
  //
  // In both cases, we need to throw away pending updates (since they are no longer relevant)
  // and treat reading from the source as we do in the mount case.
  if (
    !is(prevGetSnapshot, getSnapshot) ||
    !is(prevSource, source) ||
    !is(prevSubscribe, subscribe)
  ) {
    // Create a new queue and setState method,
    // So if there are interleaved updates, they get pushed to the older queue.
    // When this becomes current, the previous queue and dispatch method will be discarded,
    // including any interleaving updates that occur.
    const newQueue: UpdateQueue<Snapshot, BasicStateAction<Snapshot>> = {
      pending: null,
      interleaved: null,
      lanes: NoLanes,
      dispatch: null,
      lastRenderedReducer: basicStateReducer,
      lastRenderedState: snapshot,
    };
    newQueue.dispatch = setSnapshot = (dispatchSetState.bind(
      null,
      currentlyRenderingFiber,
      newQueue,
    ): any);
    stateHook.queue = newQueue;
    stateHook.baseQueue = null;
    snapshot = readFromUnsubscribedMutableSource(root, source, getSnapshot);
    stateHook.memoizedState = stateHook.baseState = snapshot;
  }

  return snapshot;
}

function mountMutableSource<Source, Snapshot>(
  source: MutableSource<Source>,
  getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
  subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
): Snapshot {
  if (!enableUseMutableSource) {
    return (undefined: any);
  }

  const hook = mountWorkInProgressHook();
  hook.memoizedState = ({
    refs: {
      getSnapshot,
      setSnapshot: (null: any),
    },
    source,
    subscribe,
  }: MutableSourceMemoizedState<Source, Snapshot>);
  return useMutableSource(hook, source, getSnapshot, subscribe);
}

function updateMutableSource<Source, Snapshot>(
  source: MutableSource<Source>,
  getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
  subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
): Snapshot {
  if (!enableUseMutableSource) {
    return (undefined: any);
  }

  const hook = updateWorkInProgressHook();
  return useMutableSource(hook, source, getSnapshot, subscribe);
}

function mountSyncExternalStore<T>(
  subscribe: (() => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T,
): T {
  const fiber = currentlyRenderingFiber;
  const hook = mountWorkInProgressHook();

  let nextSnapshot;
  const isHydrating = getIsHydrating();
  if (isHydrating) {
    if (getServerSnapshot === undefined) {
      throw new Error(
        'Missing getServerSnapshot, which is required for ' +
          'server-rendered content. Will revert to client rendering.',
      );
    }
    nextSnapshot = getServerSnapshot();
    if (__DEV__) {
      if (!didWarnUncachedGetSnapshot) {
        if (nextSnapshot !== getServerSnapshot()) {
          console.error(
            'The result of getServerSnapshot should be cached to avoid an infinite loop',
          );
          didWarnUncachedGetSnapshot = true;
        }
      }
    }
  } else {
    nextSnapshot = getSnapshot();
    if (__DEV__) {
      if (!didWarnUncachedGetSnapshot) {
        if (nextSnapshot !== getSnapshot()) {
          console.error(
            'The result of getSnapshot should be cached to avoid an infinite loop',
          );
          didWarnUncachedGetSnapshot = true;
        }
      }
    }
    // Unless we're rendering a blocking lane, schedule a consistency check.
    // Right before committing, we will walk the tree and check if any of the
    // stores were mutated.
    //
    // We won't do this if we're hydrating server-rendered content, because if
    // the content is stale, it's already visible anyway. Instead we'll patch
    // it up in a passive effect.
    const root: FiberRoot | null = getWorkInProgressRoot();

    if (root === null) {
      throw new Error(
        'Expected a work-in-progress root. This is a bug in React. Please file an issue.',
      );
    }

    if (!includesBlockingLane(root, renderLanes)) {
      pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
    }
  }

  // Read the current snapshot from the store on every render. This breaks the
  // normal rules of React, and only works because store updates are
  // always synchronous.
  hook.memoizedState = nextSnapshot;
  const inst: StoreInstance<T> = {
    value: nextSnapshot,
    getSnapshot,
  };
  hook.queue = inst;

  // Schedule an effect to subscribe to the store.
  mountEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [subscribe]);

  // Schedule an effect to update the mutable instance fields. We will update
  // this whenever subscribe, getSnapshot, or value changes. Because there's no
  // clean-up function, and we track the deps correctly, we can call pushEffect
  // directly, without storing any additional state. For the same reason, we
  // don't need to set a static flag, either.
  // TODO: We can move this to the passive phase once we add a pre-commit
  // consistency check. See the next comment.
  fiber.flags |= PassiveEffect;
  pushEffect(
    HookHasEffect | HookPassive,
    updateStoreInstance.bind(null, fiber, inst, nextSnapshot, getSnapshot),
    undefined,
    null,
  );

  return nextSnapshot;
}

function updateSyncExternalStore<T>(
  subscribe: (() => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T,
): T {
  const fiber = currentlyRenderingFiber;
  const hook = updateWorkInProgressHook();
  // Read the current snapshot from the store on every render. This breaks the
  // normal rules of React, and only works because store updates are
  // always synchronous.
  const nextSnapshot = getSnapshot();
  if (__DEV__) {
    if (!didWarnUncachedGetSnapshot) {
      if (nextSnapshot !== getSnapshot()) {
        console.error(
          'The result of getSnapshot should be cached to avoid an infinite loop',
        );
        didWarnUncachedGetSnapshot = true;
      }
    }
  }
  const prevSnapshot = hook.memoizedState;
  const snapshotChanged = !is(prevSnapshot, nextSnapshot);
  if (snapshotChanged) {
    hook.memoizedState = nextSnapshot;
    markWorkInProgressReceivedUpdate();
  }
  const inst = hook.queue;

  updateEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [
    subscribe,
  ]);

  // Whenever getSnapshot or subscribe changes, we need to check in the
  // commit phase if there was an interleaved mutation. In concurrent mode
  // this can happen all the time, but even in synchronous mode, an earlier
  // effect may have mutated the store.
  if (
    inst.getSnapshot !== getSnapshot ||
    snapshotChanged ||
    // Check if the susbcribe function changed. We can save some memory by
    // checking whether we scheduled a subscription effect above.
    (workInProgressHook !== null &&
      workInProgressHook.memoizedState.tag & HookHasEffect)
  ) {
    fiber.flags |= PassiveEffect;
    pushEffect(
      HookHasEffect | HookPassive,
      updateStoreInstance.bind(null, fiber, inst, nextSnapshot, getSnapshot),
      undefined,
      null,
    );

    // Unless we're rendering a blocking lane, schedule a consistency check.
    // Right before committing, we will walk the tree and check if any of the
    // stores were mutated.
    const root: FiberRoot | null = getWorkInProgressRoot();

    if (root === null) {
      throw new Error(
        'Expected a work-in-progress root. This is a bug in React. Please file an issue.',
      );
    }

    if (!includesBlockingLane(root, renderLanes)) {
      pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
    }
  }

  return nextSnapshot;
}

function pushStoreConsistencyCheck<T>(
  fiber: Fiber,
  getSnapshot: () => T,
  renderedSnapshot: T,
) {
  fiber.flags |= StoreConsistency;
  const check: StoreConsistencyCheck<T> = {
    getSnapshot,
    value: renderedSnapshot,
  };
  let componentUpdateQueue: null | FunctionComponentUpdateQueue = (currentlyRenderingFiber.updateQueue: any);
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = (componentUpdateQueue: any);
    componentUpdateQueue.stores = [check];
  } else {
    const stores = componentUpdateQueue.stores;
    if (stores === null) {
      componentUpdateQueue.stores = [check];
    } else {
      stores.push(check);
    }
  }
}

function updateStoreInstance<T>(
  fiber: Fiber,
  inst: StoreInstance<T>,
  nextSnapshot: T,
  getSnapshot: () => T,
) {
  // These are updated in the passive phase
  inst.value = nextSnapshot;
  inst.getSnapshot = getSnapshot;

  // Something may have been mutated in between render and commit. This could
  // have been in an event that fired before the passive effects, or it could
  // have been in a layout effect. In that case, we would have used the old
  // snapsho and getSnapshot values to bail out. We need to check one more time.
  if (checkIfSnapshotChanged(inst)) {
    // Force a re-render.
    forceStoreRerender(fiber);
  }
}

function subscribeToStore(fiber, inst, subscribe) {
  const handleStoreChange = () => {
    // The store changed. Check if the snapshot changed since the last time we
    // read from the store.
    if (checkIfSnapshotChanged(inst)) {
      // Force a re-render.
      forceStoreRerender(fiber);
    }
  };
  // Subscribe to the store and return a clean-up function.
  return subscribe(handleStoreChange);
}

function checkIfSnapshotChanged(inst) {
  const latestGetSnapshot = inst.getSnapshot;
  const prevValue = inst.value;
  try {
    const nextValue = latestGetSnapshot();
    return !is(prevValue, nextValue);
  } catch (error) {
    return true;
  }
}

function forceStoreRerender(fiber) {
  scheduleUpdateOnFiber(fiber, SyncLane, NoTimestamp);
}

function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  const hook = mountWorkInProgressHook();
  if (typeof initialState === 'function') {
    // $FlowFixMe: Flow doesn't like mixed types
    initialState = initialState();
  }
  hook.memoizedState = hook.baseState = initialState;
  const queue: UpdateQueue<S, BasicStateAction<S>> = {
    pending: null,
    interleaved: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: (initialState: any),
  };
  hook.queue = queue;
  const dispatch: Dispatch<
    BasicStateAction<S>,
  > = (queue.dispatch = (dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any));
  return [hook.memoizedState, dispatch];
}

function updateState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  return updateReducer(basicStateReducer, (initialState: any));
}

function rerenderState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  return rerenderReducer(basicStateReducer, (initialState: any));
}

function pushEffect(tag, create, destroy, deps) {
  const effect: Effect = {
    tag,
    create,
    destroy,
    deps,
    // Circular
    next: (null: any),
  };
  let componentUpdateQueue: null | FunctionComponentUpdateQueue = (currentlyRenderingFiber.updateQueue: any);
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = (componentUpdateQueue: any);
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}

let stackContainsErrorMessage: boolean | null = null;

function getCallerStackFrame(): string {
  // eslint-disable-next-line react-internal/prod-error-codes
  const stackFrames = new Error('Error message').stack.split('\n');

  // Some browsers (e.g. Chrome) include the error message in the stack
  // but others (e.g. Firefox) do not.
  if (stackContainsErrorMessage === null) {
    stackContainsErrorMessage = stackFrames[0].includes('Error message');
  }

  return stackContainsErrorMessage
    ? stackFrames.slice(3, 4).join('\n')
    : stackFrames.slice(2, 3).join('\n');
}

function mountRef<T>(initialValue: T): {|current: T|} {
  const hook = mountWorkInProgressHook();
  if (enableUseRefAccessWarning) {
    if (__DEV__) {
      // Support lazy initialization pattern shown in docs.
      // We need to store the caller stack frame so that we don't warn on subsequent renders.
      let hasBeenInitialized = initialValue != null;
      let lazyInitGetterStack = null;
      let didCheckForLazyInit = false;

      // Only warn once per component+hook.
      let didWarnAboutRead = false;
      let didWarnAboutWrite = false;

      let current = initialValue;
      const ref = {
        get current() {
          if (!hasBeenInitialized) {
            didCheckForLazyInit = true;
            lazyInitGetterStack = getCallerStackFrame();
          } else if (currentlyRenderingFiber !== null && !didWarnAboutRead) {
            if (
              lazyInitGetterStack === null ||
              lazyInitGetterStack !== getCallerStackFrame()
            ) {
              didWarnAboutRead = true;
              console.warn(
                '%s: Unsafe read of a mutable value during render.\n\n' +
                  'Reading from a ref during render is only safe if:\n' +
                  '1. The ref value has not been updated, or\n' +
                  '2. The ref holds a lazily-initialized value that is only set once.\n',
                getComponentNameFromFiber(currentlyRenderingFiber) || 'Unknown',
              );
            }
          }
          return current;
        },
        set current(value) {
          if (currentlyRenderingFiber !== null && !didWarnAboutWrite) {
            if (
              hasBeenInitialized ||
              (!hasBeenInitialized && !didCheckForLazyInit)
            ) {
              didWarnAboutWrite = true;
              console.warn(
                '%s: Unsafe write of a mutable value during render.\n\n' +
                  'Writing to a ref during render is only safe if the ref holds ' +
                  'a lazily-initialized value that is only set once.\n',
                getComponentNameFromFiber(currentlyRenderingFiber) || 'Unknown',
              );
            }
          }

          hasBeenInitialized = true;
          current = value;
        },
      };
      Object.seal(ref);
      hook.memoizedState = ref;
      return ref;
    } else {
      const ref = {current: initialValue};
      hook.memoizedState = ref;
      return ref;
    }
  } else {
    const ref = {current: initialValue};
    hook.memoizedState = ref;
    return ref;
  }
}

function updateRef<T>(initialValue: T): {|current: T|} {
  const hook = updateWorkInProgressHook();
  return hook.memoizedState;
}

function mountEffectImpl(fiberFlags, hookFlags, create, deps): void {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    undefined,
    nextDeps,
  );
}

function updateEffectImpl(fiberFlags, hookFlags, create, deps): void {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy = undefined;

  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
        return;
      }
    }
  }

  currentlyRenderingFiber.flags |= fiberFlags;

  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    destroy,
    nextDeps,
  );
}

function mountEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  if (
    __DEV__ &&
    enableStrictEffects &&
    (currentlyRenderingFiber.mode & StrictEffectsMode) !== NoMode
  ) {
    return mountEffectImpl(
      MountPassiveDevEffect | PassiveEffect | PassiveStaticEffect,
      HookPassive,
      create,
      deps,
    );
  } else {
    return mountEffectImpl(
      PassiveEffect | PassiveStaticEffect,
      HookPassive,
      create,
      deps,
    );
  }
}

function updateEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}

function mountInsertionEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  return mountEffectImpl(UpdateEffect, HookInsertion, create, deps);
}

function updateInsertionEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  return updateEffectImpl(UpdateEffect, HookInsertion, create, deps);
}

function mountLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  let fiberFlags: Flags = UpdateEffect;
  if (enableSuspenseLayoutEffectSemantics) {
    fiberFlags |= LayoutStaticEffect;
  }
  if (
    __DEV__ &&
    enableStrictEffects &&
    (currentlyRenderingFiber.mode & StrictEffectsMode) !== NoMode
  ) {
    fiberFlags |= MountLayoutDevEffect;
  }
  return mountEffectImpl(fiberFlags, HookLayout, create, deps);
}

function updateLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  return updateEffectImpl(UpdateEffect, HookLayout, create, deps);
}

function imperativeHandleEffect<T>(
  create: () => T,
  ref: {|current: T | null|} | ((inst: T | null) => mixed) | null | void,
) {
  if (typeof ref === 'function') {
    const refCallback = ref;
    const inst = create();
    refCallback(inst);
    return () => {
      refCallback(null);
    };
  } else if (ref !== null && ref !== undefined) {
    const refObject = ref;
    if (__DEV__) {
      if (!refObject.hasOwnProperty('current')) {
        console.error(
          'Expected useImperativeHandle() first argument to either be a ' +
            'ref callback or React.createRef() object. Instead received: %s.',
          'an object with keys {' + Object.keys(refObject).join(', ') + '}',
        );
      }
    }
    const inst = create();
    refObject.current = inst;
    return () => {
      refObject.current = null;
    };
  }
}

function mountImperativeHandle<T>(
  ref: {|current: T | null|} | ((inst: T | null) => mixed) | null | void,
  create: () => T,
  deps: Array<mixed> | void | null,
): void {
  if (__DEV__) {
    if (typeof create !== 'function') {
      console.error(
        'Expected useImperativeHandle() second argument to be a function ' +
          'that creates a handle. Instead received: %s.',
        create !== null ? typeof create : 'null',
      );
    }
  }

  // TODO: If deps are provided, should we skip comparing the ref itself?
  const effectDeps =
    deps !== null && deps !== undefined ? deps.concat([ref]) : null;

  let fiberFlags: Flags = UpdateEffect;
  if (enableSuspenseLayoutEffectSemantics) {
    fiberFlags |= LayoutStaticEffect;
  }
  if (
    __DEV__ &&
    enableStrictEffects &&
    (currentlyRenderingFiber.mode & StrictEffectsMode) !== NoMode
  ) {
    fiberFlags |= MountLayoutDevEffect;
  }
  return mountEffectImpl(
    fiberFlags,
    HookLayout,
    imperativeHandleEffect.bind(null, create, ref),
    effectDeps,
  );
}

function updateImperativeHandle<T>(
  ref: {|current: T | null|} | ((inst: T | null) => mixed) | null | void,
  create: () => T,
  deps: Array<mixed> | void | null,
): void {
  if (__DEV__) {
    if (typeof create !== 'function') {
      console.error(
        'Expected useImperativeHandle() second argument to be a function ' +
          'that creates a handle. Instead received: %s.',
        create !== null ? typeof create : 'null',
      );
    }
  }

  // TODO: If deps are provided, should we skip comparing the ref itself?
  const effectDeps =
    deps !== null && deps !== undefined ? deps.concat([ref]) : null;

  return updateEffectImpl(
    UpdateEffect,
    HookLayout,
    imperativeHandleEffect.bind(null, create, ref),
    effectDeps,
  );
}

function mountDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
  // This hook is normally a no-op.
  // The react-debug-hooks package injects its own implementation
  // so that e.g. DevTools can display custom hook values.
}

const updateDebugValue = mountDebugValue;

function mountCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  hook.memoizedState = [callback, nextDeps];
  return callback;
}

function updateCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1];
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        return prevState[0];
      }
    }
  }
  hook.memoizedState = [callback, nextDeps];
  return callback;
}

function mountMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function updateMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  if (prevState !== null) {
    // Assume these are defined. If they're not, areHookInputsEqual will warn.
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1];
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        return prevState[0];
      }
    }
  }
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function mountDeferredValue<T>(value: T): T {
  const [prevValue, setValue] = mountState(value);
  mountEffect(() => {
    const prevTransition = ReactCurrentBatchConfig.transition;
    ReactCurrentBatchConfig.transition = 1;
    try {
      setValue(value);
    } finally {
      ReactCurrentBatchConfig.transition = prevTransition;
    }
  }, [value]);
  return prevValue;
}

function updateDeferredValue<T>(value: T): T {
  const [prevValue, setValue] = updateState(value);
  updateEffect(() => {
    const prevTransition = ReactCurrentBatchConfig.transition;
    ReactCurrentBatchConfig.transition = 1;
    try {
      setValue(value);
    } finally {
      ReactCurrentBatchConfig.transition = prevTransition;
    }
  }, [value]);
  return prevValue;
}

function rerenderDeferredValue<T>(value: T): T {
  const [prevValue, setValue] = rerenderState(value);
  updateEffect(() => {
    const prevTransition = ReactCurrentBatchConfig.transition;
    ReactCurrentBatchConfig.transition = 1;
    try {
      setValue(value);
    } finally {
      ReactCurrentBatchConfig.transition = prevTransition;
    }
  }, [value]);
  return prevValue;
}

function startTransition(setPending, callback) {
  const previousPriority = getCurrentUpdatePriority();
  setCurrentUpdatePriority(
    higherEventPriority(previousPriority, ContinuousEventPriority),
  );

  setPending(true);

  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = 1;
  try {
    setPending(false);
    callback();
  } finally {
    setCurrentUpdatePriority(previousPriority);
    ReactCurrentBatchConfig.transition = prevTransition;
    if (__DEV__) {
      if (
        prevTransition !== 1 &&
        warnOnSubscriptionInsideStartTransition &&
        ReactCurrentBatchConfig._updatedFibers
      ) {
        const updatedFibersCount = ReactCurrentBatchConfig._updatedFibers.size;
        if (updatedFibersCount > 10) {
          console.warn(
            'Detected a large number of updates inside startTransition. ' +
              'If this is due to a subscription please re-write it to use React provided hooks. ' +
              'Otherwise concurrent mode guarantees are off the table.',
          );
        }
        ReactCurrentBatchConfig._updatedFibers.clear();
      }
    }
  }
}

function mountTransition(): [boolean, (() => void) => void] {
  const [isPending, setPending] = mountState(false);
  // The `start` method never changes.
  const start = startTransition.bind(null, setPending);
  const hook = mountWorkInProgressHook();
  hook.memoizedState = start;
  return [isPending, start];
}

function updateTransition(): [boolean, (() => void) => void] {
  const [isPending] = updateState(false);
  const hook = updateWorkInProgressHook();
  const start = hook.memoizedState;
  return [isPending, start];
}

function rerenderTransition(): [boolean, (() => void) => void] {
  const [isPending] = rerenderState(false);
  const hook = updateWorkInProgressHook();
  const start = hook.memoizedState;
  return [isPending, start];
}

let isUpdatingOpaqueValueInRenderPhase = false;
export function getIsUpdatingOpaqueValueInRenderPhaseInDEV(): boolean | void {
  if (__DEV__) {
    return isUpdatingOpaqueValueInRenderPhase;
  }
}

function mountId(): string {
  const hook = mountWorkInProgressHook();

  const root = ((getWorkInProgressRoot(): any): FiberRoot);
  // TODO: In Fizz, id generation is specific to each server config. Maybe we
  // should do this in Fiber, too? Deferring this decision for now because
  // there's no other place to store the prefix except for an internal field on
  // the public createRoot object, which the fiber tree does not currently have
  // a reference to.
  const identifierPrefix = root.identifierPrefix;

  let id;
  if (getIsHydrating()) {
    const treeId = getTreeId();

    // Use a captial R prefix for server-generated ids.
    id = identifierPrefix + 'R:' + treeId;

    // Unless this is the first id at this level, append a number at the end
    // that represents the position of this useId hook among all the useId
    // hooks for this fiber.
    const localId = localIdCounter++;
    if (localId > 0) {
      id += ':' + localId.toString(32);
    }
  } else {
    // Use a lowercase r prefix for client-generated ids.
    const globalClientId = globalClientIdCounter++;
    id = identifierPrefix + 'r:' + globalClientId.toString(32);
  }

  hook.memoizedState = id;
  return id;
}

function updateId(): string {
  const hook = updateWorkInProgressHook();
  const id: string = hook.memoizedState;
  return id;
}

function mountRefresh() {
  const hook = mountWorkInProgressHook();
  const refresh = (hook.memoizedState = refreshCache.bind(
    null,
    currentlyRenderingFiber,
  ));
  return refresh;
}

function updateRefresh() {
  const hook = updateWorkInProgressHook();
  return hook.memoizedState;
}

function refreshCache<T>(fiber: Fiber, seedKey: ?() => T, seedValue: T) {
  if (!enableCache) {
    return;
  }
  // TODO: Does Cache work in legacy mode? Should decide and write a test.
  // TODO: Consider warning if the refresh is at discrete priority, or if we
  // otherwise suspect that it wasn't batched properly.
  let provider = fiber.return;
  while (provider !== null) {
    switch (provider.tag) {
      case CacheComponent:
      case HostRoot: {
        const lane = requestUpdateLane(provider);
        const eventTime = requestEventTime();
        const root = scheduleUpdateOnFiber(provider, lane, eventTime);
        if (root !== null) {
          entangleLegacyQueueTransitions(root, provider, lane);
        }

        // TODO: If a refresh never commits, the new cache created here must be
        // released. A simple case is start refreshing a cache boundary, but then
        // unmount that boundary before the refresh completes.
        const seededCache = createCache();
        if (seedKey !== null && seedKey !== undefined && root !== null) {
          // Seed the cache with the value passed by the caller. This could be
          // from a server mutation, or it could be a streaming response.
          seededCache.data.set(seedKey, seedValue);
        }

        // Schedule an update on the cache boundary to trigger a refresh.
        const refreshUpdate = createLegacyQueueUpdate(eventTime, lane);
        const payload = {
          cache: seededCache,
        };
        refreshUpdate.payload = payload;
        enqueueLegacyQueueUpdate(provider, refreshUpdate, lane);
        return;
      }
    }
    provider = provider.return;
  }
  // TODO: Warn if unmounted?
}

function dispatchReducerAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
  if (__DEV__) {
    if (typeof arguments[3] === 'function') {
      console.error(
        "State updates from the useState() and useReducer() Hooks don't support the " +
          'second callback argument. To execute a side effect after ' +
          'rendering, declare it in the component body with useEffect().',
      );
    }
  }

  const lane = requestUpdateLane(fiber);

  const update: Update<S, A> = {
    lane,
    action,
    hasEagerState: false,
    eagerState: null,
    next: (null: any),
  };

  if (isRenderPhaseUpdate(fiber)) {
    enqueueRenderPhaseUpdate(queue, update);
  } else {
    enqueueUpdate(fiber, queue, update, lane);
    const eventTime = requestEventTime();
    const root = scheduleUpdateOnFiber(fiber, lane, eventTime);
    if (root !== null) {
      entangleTransitionUpdate(root, queue, lane);
    }
  }

  markUpdateInDevTools(fiber, lane, action);
}

function dispatchSetState<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
  if (__DEV__) {
    if (typeof arguments[3] === 'function') {
      console.error(
        "State updates from the useState() and useReducer() Hooks don't support the " +
          'second callback argument. To execute a side effect after ' +
          'rendering, declare it in the component body with useEffect().',
      );
    }
  }

  const lane = requestUpdateLane(fiber);

  const update: Update<S, A> = {
    lane,
    action,
    hasEagerState: false,
    eagerState: null,
    next: (null: any),
  };

  if (isRenderPhaseUpdate(fiber)) {
    enqueueRenderPhaseUpdate(queue, update);
  } else {
    enqueueUpdate(fiber, queue, update, lane);

    const alternate = fiber.alternate;
    if (
      fiber.lanes === NoLanes &&
      (alternate === null || alternate.lanes === NoLanes)
    ) {
      // The queue is currently empty, which means we can eagerly compute the
      // next state before entering the render phase. If the new state is the
      // same as the current state, we may be able to bail out entirely.
      const lastRenderedReducer = queue.lastRenderedReducer;
      if (lastRenderedReducer !== null) {
        let prevDispatcher;
        if (__DEV__) {
          prevDispatcher = ReactCurrentDispatcher.current;
          ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
        }
        try {
          const currentState: S = (queue.lastRenderedState: any);
          const eagerState = lastRenderedReducer(currentState, action);
          // Stash the eagerly computed state, and the reducer used to compute
          // it, on the update object. If the reducer hasn't changed by the
          // time we enter the render phase, then the eager state can be used
          // without calling the reducer again.
          update.hasEagerState = true;
          update.eagerState = eagerState;
          if (is(eagerState, currentState)) {
            // Fast path. We can bail out without scheduling React to re-render.
            // It's still possible that we'll need to rebase this update later,
            // if the component re-renders for a different reason and by that
            // time the reducer has changed.
            return;
          }
        } catch (error) {
          // Suppress the error. It will throw again in the render phase.
        } finally {
          if (__DEV__) {
            ReactCurrentDispatcher.current = prevDispatcher;
          }
        }
      }
    }
    const eventTime = requestEventTime();
    const root = scheduleUpdateOnFiber(fiber, lane, eventTime);
    if (root !== null) {
      entangleTransitionUpdate(root, queue, lane);
    }
  }

  markUpdateInDevTools(fiber, lane, action);
}

function isRenderPhaseUpdate(fiber: Fiber) {
  const alternate = fiber.alternate;
  return (
    fiber === currentlyRenderingFiber ||
    (alternate !== null && alternate === currentlyRenderingFiber)
  );
}

function enqueueRenderPhaseUpdate<S, A>(
  queue: UpdateQueue<S, A>,
  update: Update<S, A>,
) {
  // This is a render phase update. Stash it in a lazily-created map of
  // queue -> linked list of updates. After this render pass, we'll restart
  // and apply the stashed updates on top of the work-in-progress hook.
  didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
  const pending = queue.pending;
  if (pending === null) {
    // This is the first update. Create a circular list.
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  queue.pending = update;
}

function enqueueUpdate<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  update: Update<S, A>,
  lane: Lane,
) {
  if (isInterleavedUpdate(fiber, lane)) {
    const interleaved = queue.interleaved;
    if (interleaved === null) {
      // This is the first update. Create a circular list.
      update.next = update;
      // At the end of the current render, this queue's interleaved updates will
      // be transferred to the pending queue.
      pushInterleavedQueue(queue);
    } else {
      update.next = interleaved.next;
      interleaved.next = update;
    }
    queue.interleaved = update;
  } else {
    const pending = queue.pending;
    if (pending === null) {
      // This is the first update. Create a circular list.
      update.next = update;
    } else {
      update.next = pending.next;
      pending.next = update;
    }
    queue.pending = update;
  }
}

function entangleTransitionUpdate<S, A>(
  root: FiberRoot,
  queue: UpdateQueue<S, A>,
  lane: Lane,
) {
  if (isTransitionLane(lane)) {
    let queueLanes = queue.lanes;

    // If any entangled lanes are no longer pending on the root, then they
    // must have finished. We can remove them from the shared queue, which
    // represents a superset of the actually pending lanes. In some cases we
    // may entangle more than we need to, but that's OK. In fact it's worse if
    // we *don't* entangle when we should.
    queueLanes = intersectLanes(queueLanes, root.pendingLanes);

    // Entangle the new transition lane with the other transition lanes.
    const newQueueLanes = mergeLanes(queueLanes, lane);
    queue.lanes = newQueueLanes;
    // Even if queue.lanes already include lane, we don't know for certain if
    // the lane finished since the last time we entangled it. So we need to
    // entangle it again, just to be sure.
    markRootEntangled(root, newQueueLanes);
  }
}

function markUpdateInDevTools(fiber, lane, action) {
  if (__DEV__) {
    if (enableDebugTracing) {
      if (fiber.mode & DebugTracingMode) {
        const name = getComponentNameFromFiber(fiber) || 'Unknown';
        logStateUpdateScheduled(name, lane, action);
      }
    }
  }

  if (enableSchedulingProfiler) {
    markStateUpdateScheduled(fiber, lane);
  }
}

function getCacheSignal(): AbortSignal {
  if (!enableCache) {
    throw new Error('Not implemented.');
  }
  const cache: Cache = readContext(CacheContext);
  return cache.controller.signal;
}

function getCacheForType<T>(resourceType: () => T): T {
  if (!enableCache) {
    throw new Error('Not implemented.');
  }
  const cache: Cache = readContext(CacheContext);
  let cacheForType: T | void = (cache.data.get(resourceType): any);
  if (cacheForType === undefined) {
    cacheForType = resourceType();
    cache.data.set(resourceType, cacheForType);
  }
  return cacheForType;
}

export const ContextOnlyDispatcher: Dispatcher = {
  readContext,

  useCallback: throwInvalidHookError,
  useContext: throwInvalidHookError,
  useEffect: throwInvalidHookError,
  useImperativeHandle: throwInvalidHookError,
  useInsertionEffect: throwInvalidHookError,
  useLayoutEffect: throwInvalidHookError,
  useMemo: throwInvalidHookError,
  useReducer: throwInvalidHookError,
  useRef: throwInvalidHookError,
  useState: throwInvalidHookError,
  useDebugValue: throwInvalidHookError,
  useDeferredValue: throwInvalidHookError,
  useTransition: throwInvalidHookError,
  useMutableSource: throwInvalidHookError,
  useSyncExternalStore: throwInvalidHookError,
  useId: throwInvalidHookError,

  unstable_isNewReconciler: enableNewReconciler,
};
if (enableCache) {
  (ContextOnlyDispatcher: Dispatcher).getCacheSignal = getCacheSignal;
  (ContextOnlyDispatcher: Dispatcher).getCacheForType = getCacheForType;
  (ContextOnlyDispatcher: Dispatcher).useCacheRefresh = throwInvalidHookError;
}

const HooksDispatcherOnMount: Dispatcher = {
  readContext,

  useCallback: mountCallback,
  useContext: readContext,
  useEffect: mountEffect,
  useImperativeHandle: mountImperativeHandle,
  useLayoutEffect: mountLayoutEffect,
  useInsertionEffect: mountInsertionEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
  useDebugValue: mountDebugValue,
  useDeferredValue: mountDeferredValue,
  useTransition: mountTransition,
  useMutableSource: mountMutableSource,
  useSyncExternalStore: mountSyncExternalStore,
  useId: mountId,

  unstable_isNewReconciler: enableNewReconciler,
};
if (enableCache) {
  (HooksDispatcherOnMount: Dispatcher).getCacheSignal = getCacheSignal;
  (HooksDispatcherOnMount: Dispatcher).getCacheForType = getCacheForType;
  (HooksDispatcherOnMount: Dispatcher).useCacheRefresh = mountRefresh;
}

const HooksDispatcherOnUpdate: Dispatcher = {
  readContext,

  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useInsertionEffect: updateInsertionEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState,
  useDebugValue: updateDebugValue,
  useDeferredValue: updateDeferredValue,
  useTransition: updateTransition,
  useMutableSource: updateMutableSource,
  useSyncExternalStore: updateSyncExternalStore,
  useId: updateId,

  unstable_isNewReconciler: enableNewReconciler,
};
if (enableCache) {
  (HooksDispatcherOnUpdate: Dispatcher).getCacheSignal = getCacheSignal;
  (HooksDispatcherOnUpdate: Dispatcher).getCacheForType = getCacheForType;
  (HooksDispatcherOnUpdate: Dispatcher).useCacheRefresh = updateRefresh;
}

const HooksDispatcherOnRerender: Dispatcher = {
  readContext,

  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useInsertionEffect: updateInsertionEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: rerenderReducer,
  useRef: updateRef,
  useState: rerenderState,
  useDebugValue: updateDebugValue,
  useDeferredValue: rerenderDeferredValue,
  useTransition: rerenderTransition,
  useMutableSource: updateMutableSource,
  useSyncExternalStore: updateSyncExternalStore,
  useId: updateId,

  unstable_isNewReconciler: enableNewReconciler,
};
if (enableCache) {
  (HooksDispatcherOnRerender: Dispatcher).getCacheSignal = getCacheSignal;
  (HooksDispatcherOnRerender: Dispatcher).getCacheForType = getCacheForType;
  (HooksDispatcherOnRerender: Dispatcher).useCacheRefresh = updateRefresh;
}

let HooksDispatcherOnMountInDEV: Dispatcher | null = null;
let HooksDispatcherOnMountWithHookTypesInDEV: Dispatcher | null = null;
let HooksDispatcherOnUpdateInDEV: Dispatcher | null = null;
let HooksDispatcherOnRerenderInDEV: Dispatcher | null = null;
let InvalidNestedHooksDispatcherOnMountInDEV: Dispatcher | null = null;
let InvalidNestedHooksDispatcherOnUpdateInDEV: Dispatcher | null = null;
let InvalidNestedHooksDispatcherOnRerenderInDEV: Dispatcher | null = null;

if (__DEV__) {
  const warnInvalidContextAccess = () => {
    console.error(
      'Context can only be read while React is rendering. ' +
        'In classes, you can read it in the render method or getDerivedStateFromProps. ' +
        'In function components, you can read it directly in the function body, but not ' +
        'inside Hooks like useReducer() or useMemo().',
    );
  };

  const warnInvalidHookAccess = () => {
    console.error(
      'Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. ' +
        'You can only call Hooks at the top level of your React function. ' +
        'For more information, see ' +
        'https://reactjs.org/link/rules-of-hooks',
    );
  };

  HooksDispatcherOnMountInDEV = {
    readContext<T>(context: ReactContext<T>): T {
      return readContext(context);
    },
    useCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
      currentHookNameInDev = 'useCallback';
      mountHookTypesDev();
      checkDepsAreArrayDev(deps);
      return mountCallback(callback, deps);
    },
    useContext<T>(context: ReactContext<T>): T {
      currentHookNameInDev = 'useContext';
      mountHookTypesDev();
      return readContext(context);
    },
    useEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useEffect';
      mountHookTypesDev();
      checkDepsAreArrayDev(deps);
      return mountEffect(create, deps);
    },
    useImperativeHandle<T>(
      ref: {|current: T | null|} | ((inst: T | null) => mixed) | null | void,
      create: () => T,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useImperativeHandle';
      mountHookTypesDev();
      checkDepsAreArrayDev(deps);
      return mountImperativeHandle(ref, create, deps);
    },
    useInsertionEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useInsertionEffect';
      mountHookTypesDev();
      checkDepsAreArrayDev(deps);
      return mountInsertionEffect(create, deps);
    },
    useLayoutEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useLayoutEffect';
      mountHookTypesDev();
      checkDepsAreArrayDev(deps);
      return mountLayoutEffect(create, deps);
    },
    useMemo<T>(create: () => T, deps: Array<mixed> | void | null): T {
      currentHookNameInDev = 'useMemo';
      mountHookTypesDev();
      checkDepsAreArrayDev(deps);
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;
      try {
        return mountMemo(create, deps);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useReducer<S, I, A>(
      reducer: (S, A) => S,
      initialArg: I,
      init?: I => S,
    ): [S, Dispatch<A>] {
      currentHookNameInDev = 'useReducer';
      mountHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;
      try {
        return mountReducer(reducer, initialArg, init);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useRef<T>(initialValue: T): {|current: T|} {
      currentHookNameInDev = 'useRef';
      mountHookTypesDev();
      return mountRef(initialValue);
    },
    useState<S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] {
      currentHookNameInDev = 'useState';
      mountHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;
      try {
        return mountState(initialState);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
      currentHookNameInDev = 'useDebugValue';
      mountHookTypesDev();
      return mountDebugValue(value, formatterFn);
    },
    useDeferredValue<T>(value: T): T {
      currentHookNameInDev = 'useDeferredValue';
      mountHookTypesDev();
      return mountDeferredValue(value);
    },
    useTransition(): [boolean, (() => void) => void] {
      currentHookNameInDev = 'useTransition';
      mountHookTypesDev();
      return mountTransition();
    },
    useMutableSource<Source, Snapshot>(
      source: MutableSource<Source>,
      getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
      subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
    ): Snapshot {
      currentHookNameInDev = 'useMutableSource';
      mountHookTypesDev();
      return mountMutableSource(source, getSnapshot, subscribe);
    },
    useSyncExternalStore<T>(
      subscribe: (() => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ): T {
      currentHookNameInDev = 'useSyncExternalStore';
      mountHookTypesDev();
      return mountSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    },
    useId(): string {
      currentHookNameInDev = 'useId';
      mountHookTypesDev();
      return mountId();
    },

    unstable_isNewReconciler: enableNewReconciler,
  };
  if (enableCache) {
    (HooksDispatcherOnMountInDEV: Dispatcher).getCacheSignal = getCacheSignal;
    (HooksDispatcherOnMountInDEV: Dispatcher).getCacheForType = getCacheForType;
    (HooksDispatcherOnMountInDEV: Dispatcher).useCacheRefresh = function useCacheRefresh() {
      currentHookNameInDev = 'useCacheRefresh';
      mountHookTypesDev();
      return mountRefresh();
    };
  }

  HooksDispatcherOnMountWithHookTypesInDEV = {
    readContext<T>(context: ReactContext<T>): T {
      return readContext(context);
    },
    useCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
      currentHookNameInDev = 'useCallback';
      updateHookTypesDev();
      return mountCallback(callback, deps);
    },
    useContext<T>(context: ReactContext<T>): T {
      currentHookNameInDev = 'useContext';
      updateHookTypesDev();
      return readContext(context);
    },
    useEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useEffect';
      updateHookTypesDev();
      return mountEffect(create, deps);
    },
    useImperativeHandle<T>(
      ref: {|current: T | null|} | ((inst: T | null) => mixed) | null | void,
      create: () => T,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useImperativeHandle';
      updateHookTypesDev();
      return mountImperativeHandle(ref, create, deps);
    },
    useInsertionEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useInsertionEffect';
      updateHookTypesDev();
      return mountInsertionEffect(create, deps);
    },
    useLayoutEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useLayoutEffect';
      updateHookTypesDev();
      return mountLayoutEffect(create, deps);
    },
    useMemo<T>(create: () => T, deps: Array<mixed> | void | null): T {
      currentHookNameInDev = 'useMemo';
      updateHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;
      try {
        return mountMemo(create, deps);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useReducer<S, I, A>(
      reducer: (S, A) => S,
      initialArg: I,
      init?: I => S,
    ): [S, Dispatch<A>] {
      currentHookNameInDev = 'useReducer';
      updateHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;
      try {
        return mountReducer(reducer, initialArg, init);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useRef<T>(initialValue: T): {|current: T|} {
      currentHookNameInDev = 'useRef';
      updateHookTypesDev();
      return mountRef(initialValue);
    },
    useState<S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] {
      currentHookNameInDev = 'useState';
      updateHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;
      try {
        return mountState(initialState);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
      currentHookNameInDev = 'useDebugValue';
      updateHookTypesDev();
      return mountDebugValue(value, formatterFn);
    },
    useDeferredValue<T>(value: T): T {
      currentHookNameInDev = 'useDeferredValue';
      updateHookTypesDev();
      return mountDeferredValue(value);
    },
    useTransition(): [boolean, (() => void) => void] {
      currentHookNameInDev = 'useTransition';
      updateHookTypesDev();
      return mountTransition();
    },
    useMutableSource<Source, Snapshot>(
      source: MutableSource<Source>,
      getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
      subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
    ): Snapshot {
      currentHookNameInDev = 'useMutableSource';
      updateHookTypesDev();
      return mountMutableSource(source, getSnapshot, subscribe);
    },
    useSyncExternalStore<T>(
      subscribe: (() => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ): T {
      currentHookNameInDev = 'useSyncExternalStore';
      updateHookTypesDev();
      return mountSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    },
    useId(): string {
      currentHookNameInDev = 'useId';
      updateHookTypesDev();
      return mountId();
    },

    unstable_isNewReconciler: enableNewReconciler,
  };
  if (enableCache) {
    (HooksDispatcherOnMountWithHookTypesInDEV: Dispatcher).getCacheSignal = getCacheSignal;
    (HooksDispatcherOnMountWithHookTypesInDEV: Dispatcher).getCacheForType = getCacheForType;
    (HooksDispatcherOnMountWithHookTypesInDEV: Dispatcher).useCacheRefresh = function useCacheRefresh() {
      currentHookNameInDev = 'useCacheRefresh';
      updateHookTypesDev();
      return mountRefresh();
    };
  }

  HooksDispatcherOnUpdateInDEV = {
    readContext<T>(context: ReactContext<T>): T {
      return readContext(context);
    },
    useCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
      currentHookNameInDev = 'useCallback';
      updateHookTypesDev();
      return updateCallback(callback, deps);
    },
    useContext<T>(context: ReactContext<T>): T {
      currentHookNameInDev = 'useContext';
      updateHookTypesDev();
      return readContext(context);
    },
    useEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useEffect';
      updateHookTypesDev();
      return updateEffect(create, deps);
    },
    useImperativeHandle<T>(
      ref: {|current: T | null|} | ((inst: T | null) => mixed) | null | void,
      create: () => T,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useImperativeHandle';
      updateHookTypesDev();
      return updateImperativeHandle(ref, create, deps);
    },
    useInsertionEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useInsertionEffect';
      updateHookTypesDev();
      return updateInsertionEffect(create, deps);
    },
    useLayoutEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useLayoutEffect';
      updateHookTypesDev();
      return updateLayoutEffect(create, deps);
    },
    useMemo<T>(create: () => T, deps: Array<mixed> | void | null): T {
      currentHookNameInDev = 'useMemo';
      updateHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
      try {
        return updateMemo(create, deps);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useReducer<S, I, A>(
      reducer: (S, A) => S,
      initialArg: I,
      init?: I => S,
    ): [S, Dispatch<A>] {
      currentHookNameInDev = 'useReducer';
      updateHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
      try {
        return updateReducer(reducer, initialArg, init);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useRef<T>(initialValue: T): {|current: T|} {
      currentHookNameInDev = 'useRef';
      updateHookTypesDev();
      return updateRef(initialValue);
    },
    useState<S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] {
      currentHookNameInDev = 'useState';
      updateHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
      try {
        return updateState(initialState);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
      currentHookNameInDev = 'useDebugValue';
      updateHookTypesDev();
      return updateDebugValue(value, formatterFn);
    },
    useDeferredValue<T>(value: T): T {
      currentHookNameInDev = 'useDeferredValue';
      updateHookTypesDev();
      return updateDeferredValue(value);
    },
    useTransition(): [boolean, (() => void) => void] {
      currentHookNameInDev = 'useTransition';
      updateHookTypesDev();
      return updateTransition();
    },
    useMutableSource<Source, Snapshot>(
      source: MutableSource<Source>,
      getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
      subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
    ): Snapshot {
      currentHookNameInDev = 'useMutableSource';
      updateHookTypesDev();
      return updateMutableSource(source, getSnapshot, subscribe);
    },
    useSyncExternalStore<T>(
      subscribe: (() => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ): T {
      currentHookNameInDev = 'useSyncExternalStore';
      updateHookTypesDev();
      return updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    },
    useId(): string {
      currentHookNameInDev = 'useId';
      updateHookTypesDev();
      return updateId();
    },

    unstable_isNewReconciler: enableNewReconciler,
  };
  if (enableCache) {
    (HooksDispatcherOnUpdateInDEV: Dispatcher).getCacheSignal = getCacheSignal;
    (HooksDispatcherOnUpdateInDEV: Dispatcher).getCacheForType = getCacheForType;
    (HooksDispatcherOnUpdateInDEV: Dispatcher).useCacheRefresh = function useCacheRefresh() {
      currentHookNameInDev = 'useCacheRefresh';
      updateHookTypesDev();
      return updateRefresh();
    };
  }

  HooksDispatcherOnRerenderInDEV = {
    readContext<T>(context: ReactContext<T>): T {
      return readContext(context);
    },

    useCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
      currentHookNameInDev = 'useCallback';
      updateHookTypesDev();
      return updateCallback(callback, deps);
    },
    useContext<T>(context: ReactContext<T>): T {
      currentHookNameInDev = 'useContext';
      updateHookTypesDev();
      return readContext(context);
    },
    useEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useEffect';
      updateHookTypesDev();
      return updateEffect(create, deps);
    },
    useImperativeHandle<T>(
      ref: {|current: T | null|} | ((inst: T | null) => mixed) | null | void,
      create: () => T,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useImperativeHandle';
      updateHookTypesDev();
      return updateImperativeHandle(ref, create, deps);
    },
    useInsertionEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useInsertionEffect';
      updateHookTypesDev();
      return updateInsertionEffect(create, deps);
    },
    useLayoutEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useLayoutEffect';
      updateHookTypesDev();
      return updateLayoutEffect(create, deps);
    },
    useMemo<T>(create: () => T, deps: Array<mixed> | void | null): T {
      currentHookNameInDev = 'useMemo';
      updateHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnRerenderInDEV;
      try {
        return updateMemo(create, deps);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useReducer<S, I, A>(
      reducer: (S, A) => S,
      initialArg: I,
      init?: I => S,
    ): [S, Dispatch<A>] {
      currentHookNameInDev = 'useReducer';
      updateHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnRerenderInDEV;
      try {
        return rerenderReducer(reducer, initialArg, init);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useRef<T>(initialValue: T): {|current: T|} {
      currentHookNameInDev = 'useRef';
      updateHookTypesDev();
      return updateRef(initialValue);
    },
    useState<S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] {
      currentHookNameInDev = 'useState';
      updateHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnRerenderInDEV;
      try {
        return rerenderState(initialState);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
      currentHookNameInDev = 'useDebugValue';
      updateHookTypesDev();
      return updateDebugValue(value, formatterFn);
    },
    useDeferredValue<T>(value: T): T {
      currentHookNameInDev = 'useDeferredValue';
      updateHookTypesDev();
      return rerenderDeferredValue(value);
    },
    useTransition(): [boolean, (() => void) => void] {
      currentHookNameInDev = 'useTransition';
      updateHookTypesDev();
      return rerenderTransition();
    },
    useMutableSource<Source, Snapshot>(
      source: MutableSource<Source>,
      getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
      subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
    ): Snapshot {
      currentHookNameInDev = 'useMutableSource';
      updateHookTypesDev();
      return updateMutableSource(source, getSnapshot, subscribe);
    },
    useSyncExternalStore<T>(
      subscribe: (() => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ): T {
      currentHookNameInDev = 'useSyncExternalStore';
      updateHookTypesDev();
      return updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    },
    useId(): string {
      currentHookNameInDev = 'useId';
      updateHookTypesDev();
      return updateId();
    },

    unstable_isNewReconciler: enableNewReconciler,
  };
  if (enableCache) {
    (HooksDispatcherOnRerenderInDEV: Dispatcher).getCacheSignal = getCacheSignal;
    (HooksDispatcherOnRerenderInDEV: Dispatcher).getCacheForType = getCacheForType;
    (HooksDispatcherOnRerenderInDEV: Dispatcher).useCacheRefresh = function useCacheRefresh() {
      currentHookNameInDev = 'useCacheRefresh';
      updateHookTypesDev();
      return updateRefresh();
    };
  }

  InvalidNestedHooksDispatcherOnMountInDEV = {
    readContext<T>(context: ReactContext<T>): T {
      warnInvalidContextAccess();
      return readContext(context);
    },
    useCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
      currentHookNameInDev = 'useCallback';
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountCallback(callback, deps);
    },
    useContext<T>(context: ReactContext<T>): T {
      currentHookNameInDev = 'useContext';
      warnInvalidHookAccess();
      mountHookTypesDev();
      return readContext(context);
    },
    useEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useEffect';
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountEffect(create, deps);
    },
    useImperativeHandle<T>(
      ref: {|current: T | null|} | ((inst: T | null) => mixed) | null | void,
      create: () => T,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useImperativeHandle';
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountImperativeHandle(ref, create, deps);
    },
    useInsertionEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useInsertionEffect';
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountInsertionEffect(create, deps);
    },
    useLayoutEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useLayoutEffect';
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountLayoutEffect(create, deps);
    },
    useMemo<T>(create: () => T, deps: Array<mixed> | void | null): T {
      currentHookNameInDev = 'useMemo';
      warnInvalidHookAccess();
      mountHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;
      try {
        return mountMemo(create, deps);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useReducer<S, I, A>(
      reducer: (S, A) => S,
      initialArg: I,
      init?: I => S,
    ): [S, Dispatch<A>] {
      currentHookNameInDev = 'useReducer';
      warnInvalidHookAccess();
      mountHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;
      try {
        return mountReducer(reducer, initialArg, init);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useRef<T>(initialValue: T): {|current: T|} {
      currentHookNameInDev = 'useRef';
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountRef(initialValue);
    },
    useState<S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] {
      currentHookNameInDev = 'useState';
      warnInvalidHookAccess();
      mountHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;
      try {
        return mountState(initialState);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
      currentHookNameInDev = 'useDebugValue';
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountDebugValue(value, formatterFn);
    },
    useDeferredValue<T>(value: T): T {
      currentHookNameInDev = 'useDeferredValue';
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountDeferredValue(value);
    },
    useTransition(): [boolean, (() => void) => void] {
      currentHookNameInDev = 'useTransition';
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountTransition();
    },
    useMutableSource<Source, Snapshot>(
      source: MutableSource<Source>,
      getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
      subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
    ): Snapshot {
      currentHookNameInDev = 'useMutableSource';
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountMutableSource(source, getSnapshot, subscribe);
    },
    useSyncExternalStore<T>(
      subscribe: (() => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ): T {
      currentHookNameInDev = 'useSyncExternalStore';
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    },
    useId(): string {
      currentHookNameInDev = 'useId';
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountId();
    },

    unstable_isNewReconciler: enableNewReconciler,
  };
  if (enableCache) {
    (InvalidNestedHooksDispatcherOnMountInDEV: Dispatcher).getCacheSignal = getCacheSignal;
    (InvalidNestedHooksDispatcherOnMountInDEV: Dispatcher).getCacheForType = getCacheForType;
    (InvalidNestedHooksDispatcherOnMountInDEV: Dispatcher).useCacheRefresh = function useCacheRefresh() {
      currentHookNameInDev = 'useCacheRefresh';
      updateHookTypesDev();
      return mountRefresh();
    };
  }

  InvalidNestedHooksDispatcherOnUpdateInDEV = {
    readContext<T>(context: ReactContext<T>): T {
      warnInvalidContextAccess();
      return readContext(context);
    },
    useCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
      currentHookNameInDev = 'useCallback';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateCallback(callback, deps);
    },
    useContext<T>(context: ReactContext<T>): T {
      currentHookNameInDev = 'useContext';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return readContext(context);
    },
    useEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useEffect';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateEffect(create, deps);
    },
    useImperativeHandle<T>(
      ref: {|current: T | null|} | ((inst: T | null) => mixed) | null | void,
      create: () => T,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useImperativeHandle';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateImperativeHandle(ref, create, deps);
    },
    useInsertionEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useInsertionEffect';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateInsertionEffect(create, deps);
    },
    useLayoutEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useLayoutEffect';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateLayoutEffect(create, deps);
    },
    useMemo<T>(create: () => T, deps: Array<mixed> | void | null): T {
      currentHookNameInDev = 'useMemo';
      warnInvalidHookAccess();
      updateHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
      try {
        return updateMemo(create, deps);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useReducer<S, I, A>(
      reducer: (S, A) => S,
      initialArg: I,
      init?: I => S,
    ): [S, Dispatch<A>] {
      currentHookNameInDev = 'useReducer';
      warnInvalidHookAccess();
      updateHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
      try {
        return updateReducer(reducer, initialArg, init);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useRef<T>(initialValue: T): {|current: T|} {
      currentHookNameInDev = 'useRef';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateRef(initialValue);
    },
    useState<S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] {
      currentHookNameInDev = 'useState';
      warnInvalidHookAccess();
      updateHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
      try {
        return updateState(initialState);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
      currentHookNameInDev = 'useDebugValue';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateDebugValue(value, formatterFn);
    },
    useDeferredValue<T>(value: T): T {
      currentHookNameInDev = 'useDeferredValue';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateDeferredValue(value);
    },
    useTransition(): [boolean, (() => void) => void] {
      currentHookNameInDev = 'useTransition';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateTransition();
    },
    useMutableSource<Source, Snapshot>(
      source: MutableSource<Source>,
      getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
      subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
    ): Snapshot {
      currentHookNameInDev = 'useMutableSource';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateMutableSource(source, getSnapshot, subscribe);
    },
    useSyncExternalStore<T>(
      subscribe: (() => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ): T {
      currentHookNameInDev = 'useSyncExternalStore';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    },
    useId(): string {
      currentHookNameInDev = 'useId';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateId();
    },

    unstable_isNewReconciler: enableNewReconciler,
  };
  if (enableCache) {
    (InvalidNestedHooksDispatcherOnUpdateInDEV: Dispatcher).getCacheSignal = getCacheSignal;
    (InvalidNestedHooksDispatcherOnUpdateInDEV: Dispatcher).getCacheForType = getCacheForType;
    (InvalidNestedHooksDispatcherOnUpdateInDEV: Dispatcher).useCacheRefresh = function useCacheRefresh() {
      currentHookNameInDev = 'useCacheRefresh';
      updateHookTypesDev();
      return updateRefresh();
    };
  }

  InvalidNestedHooksDispatcherOnRerenderInDEV = {
    readContext<T>(context: ReactContext<T>): T {
      warnInvalidContextAccess();
      return readContext(context);
    },

    useCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
      currentHookNameInDev = 'useCallback';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateCallback(callback, deps);
    },
    useContext<T>(context: ReactContext<T>): T {
      currentHookNameInDev = 'useContext';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return readContext(context);
    },
    useEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useEffect';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateEffect(create, deps);
    },
    useImperativeHandle<T>(
      ref: {|current: T | null|} | ((inst: T | null) => mixed) | null | void,
      create: () => T,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useImperativeHandle';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateImperativeHandle(ref, create, deps);
    },
    useInsertionEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useInsertionEffect';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateInsertionEffect(create, deps);
    },
    useLayoutEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      currentHookNameInDev = 'useLayoutEffect';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateLayoutEffect(create, deps);
    },
    useMemo<T>(create: () => T, deps: Array<mixed> | void | null): T {
      currentHookNameInDev = 'useMemo';
      warnInvalidHookAccess();
      updateHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
      try {
        return updateMemo(create, deps);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useReducer<S, I, A>(
      reducer: (S, A) => S,
      initialArg: I,
      init?: I => S,
    ): [S, Dispatch<A>] {
      currentHookNameInDev = 'useReducer';
      warnInvalidHookAccess();
      updateHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
      try {
        return rerenderReducer(reducer, initialArg, init);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useRef<T>(initialValue: T): {|current: T|} {
      currentHookNameInDev = 'useRef';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateRef(initialValue);
    },
    useState<S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] {
      currentHookNameInDev = 'useState';
      warnInvalidHookAccess();
      updateHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
      try {
        return rerenderState(initialState);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
    useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
      currentHookNameInDev = 'useDebugValue';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateDebugValue(value, formatterFn);
    },
    useDeferredValue<T>(value: T): T {
      currentHookNameInDev = 'useDeferredValue';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return rerenderDeferredValue(value);
    },
    useTransition(): [boolean, (() => void) => void] {
      currentHookNameInDev = 'useTransition';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return rerenderTransition();
    },
    useMutableSource<Source, Snapshot>(
      source: MutableSource<Source>,
      getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
      subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
    ): Snapshot {
      currentHookNameInDev = 'useMutableSource';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateMutableSource(source, getSnapshot, subscribe);
    },
    useSyncExternalStore<T>(
      subscribe: (() => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ): T {
      currentHookNameInDev = 'useSyncExternalStore';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    },
    useId(): string {
      currentHookNameInDev = 'useId';
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateId();
    },

    unstable_isNewReconciler: enableNewReconciler,
  };
  if (enableCache) {
    (InvalidNestedHooksDispatcherOnRerenderInDEV: Dispatcher).getCacheSignal = getCacheSignal;
    (InvalidNestedHooksDispatcherOnRerenderInDEV: Dispatcher).getCacheForType = getCacheForType;
    (InvalidNestedHooksDispatcherOnRerenderInDEV: Dispatcher).useCacheRefresh = function useCacheRefresh() {
      currentHookNameInDev = 'useCacheRefresh';
      updateHookTypesDev();
      return updateRefresh();
    };
  }
}
