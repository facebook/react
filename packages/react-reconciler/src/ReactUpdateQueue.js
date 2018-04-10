/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// UpdateQueue is a linked list of prioritized updates.
//
// Like fibers, update queues come in pairs: a current queue, which represents
// the visible state of the screen, and a work-in-progress queue, which is
// can be mutated and processed asynchronously before it is committed — a form
// of double buffering. If a work-in-progress render is discarded before
// finishing, we create a new work-in-progress by cloning the current queue.
//
// Both queues share a persistent, singly-linked list structure. To schedule an
// update, we append it to the end of both queues. Each queue maintains a
// pointer to first update in the persistent list that hasn't been processed.
// The work-in-progress pointer always has a position equal to or greater than
// the current queue, since we always work on that one. The current queue's
// pointer is only updated during the commit phase, when we swap in the
// work-in-progress.
//
// For example:
//
//   Current pointer:           A - B - C - D - E - F
//   Work-in-progress pointer:              D - E - F
//                                          ^
//                                          The work-in-progress queue has
//                                          processed more updates than current.
//
// The reason we append to both queues is because otherwise we might drop
// updates without ever processing them. For example, if we only add updates to
// the work-in-progress queue, some updates could be lost whenever a work-in
// -progress render restarts by cloning from current. Similarly, if we only add
// updates to the current queue, the updates will be lost whenever an already
// in-progress queue commits and swaps with the current queue. However, by
// adding to both queues, we guarantee that the update will be part of the next
// work-in-progress. (And because the work-in-progress queue becomes the
// current queue once it commits, there's no danger of applying the same
// update twice.)
//
// Prioritization
// --------------
//
// Updates are not sorted by priority, but by insertion; new updates are always
// appended to the end of the list.
//
// The priority is still important, though. When processing the update queue
// during the render phase, only the updates with sufficient priority are
// included in the result. If we skip an update because it has insufficient
// priority, it remains in the queue to be processed later, during a lower
// priority render. Crucially, all updates subsequent to a skipped update also
// remain in the queue *regardless of their priority*. That means high priority
// updates are sometimes processed twice, at two separate priorities. We also
// keep track of a base state, that represents the state before the first
// update in the queue is applied.
//
// For example:
//
//   Given a base state of '', and the following queue of updates
//
//     A1 - B2 - C1 - D2
//
//   where the number indicates the priority, and the update is applied to the
//   previous state by appending a letter, React will process these updates as
//   two separate renders, one per distinct priority level:
//
//   First render, at priority 1:
//     Base state: ''
//     Updates: [A1, C1]
//     Result state: 'AC'
//
//   Second render, at priority 2:
//     Base state: 'A'            <-  The base state does not include C1,
//                                    because B2 was skipped.
//     Updates: [B2, C1, D2]      <-  C1 was rebased on top of B2
//     Result state: 'ABCD'
//
// Because we process updates in insertion order, and rebase high priority
// updates when preceding updates are skipped, the final result is deterministic
// regardless of priority. Intermediate state may vary according to system
// resources, but the final state is always the same.
//
// Render phase updates
// --------------------
//
// A render phase update is one triggered during the render phase, while working
// on a work-in-progress tree. Our typical strategy of adding the update to both
// queues won't work, because if the work-in-progress is thrown out and
// restarted, we'll get duplicate updates. Instead, we only add render phase
// updates to the work-in-progress queue.
//
// Because normal updates are added to a persistent list that is shared between
// both queues, render phase updates go in a special list that only belongs to
// a single queue. This an artifact of structural sharing. If we instead
// implemented each queue as separate lists, we would append render phase
// updates to the end of the work-in-progress list.
//
// Examples of render phase updates:
// - getDerivedStateFromProps
// - getDerivedStateFromCatch
// - [future] loading state

import type {ExpirationTime} from './ReactFiberExpirationTime';
import type {CapturedValue, CapturedError} from './ReactCapturedValue';
import type {ReactNodeList} from 'shared/ReactTypes';

import {
  enableGetDerivedStateFromCatch,
  debugRenderPhaseSideEffects,
  debugRenderPhaseSideEffectsForStrictMode,
} from 'shared/ReactFeatureFlags';
import {NoWork} from './ReactFiberExpirationTime';
import {
  UpdateQueue as UpdateQueueEffect,
  ForceUpdate as ForceUpdateEffect,
  ShouldCapture,
  DidCapture,
} from 'shared/ReactTypeOfSideEffect';
import {StrictMode} from './ReactTypeOfMode';
import {ClassComponent, HostComponent} from 'shared/ReactTypeOfWork';
import getComponentName from 'shared/getComponentName';
import {logCapturedError} from './ReactFiberErrorLogger';
import {getStackAddendumByWorkInProgressFiber} from 'shared/ReactFiberComponentTreeHook';

import invariant from 'fbjs/lib/invariant';
import warning from 'fbjs/lib/warning';

// An empty update. A no-op. Used for an effect update that already committed,
// to prevent it from firing multiple times.
const NoOp = 0;
// Used for updates that do not depend on the previous value.
const ReplaceState = 1;
// Used for updates that do depend on the previous value.
const UpdateState = 2;
// forceUpdate
const ForceUpdate = 3;
// getDerivedStateFromProps
const DeriveStateFromPropsUpdate = 4;
// Error handling
const CaptureError = 5;
// Error logging
const CaptureAndLogError = 6;
// Callbacks
const Callback = 7;

const ClassUpdateQueue = 0;
const RootUpdateQueue = 1;

type UpdateShared<Payload, U> = {
  payload: Payload,
  expirationTime: ExpirationTime,
  next: U | null,
  nextEffect: U | null,
};

type ClassUpdate<State, Props> =
  | ({tag: 0} & UpdateShared<null, ClassUpdate<State, Props>>)
  | ({tag: 1} & UpdateShared<
      $Shape<State> | ((State, Props) => $Shape<State> | null | void),
      ClassUpdate<State, Props>,
    >)
  | ({tag: 2} & UpdateShared<
      State | ((State, Props) => State | null | void),
      ClassUpdate<State, Props>,
    >)
  | ({tag: 3} & UpdateShared<null, ClassUpdate<State, Props>>)
  | ({tag: 4} & UpdateShared<null, ClassUpdate<State, Props>>)
  | ({tag: 5} & UpdateShared<mixed, ClassUpdate<State, Props>>)
  | ({tag: 6} & UpdateShared<mixed, ClassUpdate<State, Props>>)
  | ({tag: 7} & UpdateShared<mixed, ClassUpdate<State, Props>>);

type RootUpdate =
  | ({tag: 0} & UpdateShared<null, RootUpdate>)
  | ({tag: 1} & UpdateShared<ReactNodeList, RootUpdate>)
  | ({tag: 5} & UpdateShared<CapturedValue<mixed>, RootUpdate>)
  | ({tag: 6} & UpdateShared<CapturedValue<mixed>, RootUpdate>)
  | ({tag: 7} & UpdateShared<() => mixed, RootUpdate>);

type UpdateQueueShared<U, S> = {
  expirationTime: ExpirationTime,
  baseState: S,

  firstUpdate: U | null,
  lastUpdate: U | null,

  firstRenderPhaseUpdate: U | null,
  lastRenderPhaseUpdate: U | null,

  firstEffect: U | null,
  lastEffect: U | null,

  // DEV_only
  isProcessing?: boolean,
};

type ClassUpdateQueueType<State, Props> = UpdateQueueShared<
  ClassUpdate<State, Props>,
  State,
>;

type RootUpdateQueueType = UpdateQueueShared<RootUpdate, ReactNodeList>;

type UpdateQueueOwner<Queue, State> = {
  alternate: UpdateQueueOwner<Queue> | null,
  memoizedState: State,
};

let warnOnUndefinedDerivedState;
let didWarnUpdateInsideUpdate;
let didWarnAboutUndefinedDerivedState;
if (__DEV__) {
  didWarnUpdateInsideUpdate = false;
  didWarnAboutUndefinedDerivedState = new Set();

  warnOnUndefinedDerivedState = function(workInProgress, partialState) {
    if (partialState === undefined) {
      const componentName = getComponentName(workInProgress) || 'Component';
      if (!didWarnAboutUndefinedDerivedState.has(componentName)) {
        didWarnAboutUndefinedDerivedState.add(componentName);
        warning(
          false,
          '%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. ' +
            'You have returned undefined.',
          componentName,
        );
      }
    }
  };
}

function createUpdateQueue(baseState) {
  const queue = {
    expirationTime: NoWork,
    baseState,
    firstUpdate: null,
    lastUpdate: null,
    firstRenderPhaseUpdate: null,
    lastRenderPhaseUpdate: null,
    firstEffect: null,
    lastEffect: null,
  };
  if (__DEV__) {
    queue.isProcessing = false;
  }
  return queue;
}

function cloneUpdateQueue(currentQueue) {
  const queue = {
    expirationTime: currentQueue.expirationTime,
    baseState: currentQueue.baseState,
    firstUpdate: currentQueue.firstUpdate,
    lastUpdate: currentQueue.lastUpdate,

    // These are only valid for the lifetime of a single work-in-progress.
    firstRenderPhaseUpdate: null,
    lastRenderPhaseUpdate: null,
    firstEffect: null,
    lastEffect: null,
  };
  if (__DEV__) {
    queue.isProcessing = false;
  }
  return queue;
}

function createUpdate() {
  return {
    tag: NoOp,
    payload: null,
    expirationTime: NoWork,
    next: null,
    nextEffect: null,
  };
}

export function createStateReplace<P, U>(
  payload: P,
  expirationTime: ExpirationTime,
): U {
  const update = (createUpdate(): any);
  update.tag = ReplaceState;
  update.expirationTime = expirationTime;
  update.payload = payload;
  return update;
}

export function createStateUpdate<P, U>(
  payload: P,
  expirationTime: ExpirationTime,
): U {
  const update = (createUpdate(): any);
  update.tag = UpdateState;
  update.expirationTime = expirationTime;
  update.payload = payload;
  return update;
}

export function createForceUpdate<U>(expirationTime): U {
  const update = (createUpdate(): any);
  update.tag = ForceUpdate;
  update.expirationTime = expirationTime;
  return update;
}

export function createDeriveStateFromPropsUpdate(expirationTime) {
  const update = (createUpdate(): any);
  update.tag = DeriveStateFromPropsUpdate;
  update.expirationTime = expirationTime;
  return update;
}

export function createCatchUpdate<P, U>(
  payload: P,
  expirationTime: ExpirationTime,
): U {
  const update = (createUpdate(): any);
  update.tag = CaptureAndLogError;
  update.expirationTime = expirationTime;
  update.payload = payload;
  return update;
}

export function createCallbackEffect<P, U>(
  payload: P,
  expirationTime: ExpirationTime,
): U {
  const update = (createUpdate(): any);
  update.tag = Callback;
  update.expirationTime = expirationTime;
  update.payload = payload;
  return update;
}

function appendUpdateToQueue(queue, update, expirationTime) {
  // Append the update to the end of the list.
  if (queue.lastUpdate === null) {
    // Queue is empty
    queue.firstUpdate = queue.lastUpdate = update;
  } else {
    queue.lastUpdate.next = update;
    queue.lastUpdate = update;
  }
  if (
    queue.expirationTime === NoWork ||
    queue.expirationTime > expirationTime
  ) {
    // The incoming update has the earliest expiration of any update in the
    // queue. Update the queue's expiration time.
    queue.expirationTime = expirationTime;
  }
}

export function enqueueUpdate<Queue, State, Update>(
  owner: UpdateQueueOwner<Queue, State>,
  update: Update,
  expirationTime: ExpirationTime,
) {
  // Update queues are created lazily.
  const alternate = owner.alternate;
  let queue1;
  let queue2;
  if (alternate === null) {
    // There's only one owner.
    queue1 = owner.updateQueue;
    queue2 = null;
    if (queue1 === null) {
      queue1 = owner.updateQueue = createUpdateQueue(owner.memoizedState);
    }
  } else {
    // There are two owners.
    queue1 = owner.updateQueue;
    queue2 = alternate.updateQueue;
    if (queue1 === null) {
      if (queue2 === null) {
        // Neither owner has an update queue. Create new ones.
        queue1 = owner.updateQueue = createUpdateQueue(owner.memoizedState);
        queue2 = alternate.updateQueue = createUpdateQueue(
          alternate.memoizedState,
        );
      } else {
        // Only one owner has an update queue. Clone to create a new one.
        queue1 = owner.updateQueue = cloneUpdateQueue(queue2);
      }
    } else {
      if (queue2 === null) {
        // Only one owner has an update queue. Clone to create a new one.
        queue2 = alternate.updateQueue = cloneUpdateQueue(queue1);
      } else {
        // Both owners have an update queue.
      }
    }
  }
  if (queue2 === null || queue1 === queue2) {
    // There's only a single queue.
    appendUpdateToQueue(queue1, update, expirationTime);
  } else {
    // There are two queues. We need to append the update to both queues,
    // while accounting for the persistent structure of the list — we don't
    // want the same update to be added multiple times.
    if (queue1.lastUpdate === null || queue2.lastUpdate === null) {
      // One of the queues is not empty. We must add the update to both queues.
      appendUpdateToQueue(queue1, update, expirationTime);
      appendUpdateToQueue(queue2, update, expirationTime);
    } else {
      // Both queues are non-empty. The last update is the same in both lists,
      // because of structural sharing. So, only append to one of the lists.
      appendUpdateToQueue(queue1, update, expirationTime);
      // But we still need to update the `lastUpdate` pointer of queue2.
      queue2.lastUpdate = update;
    }
  }

  if (__DEV__) {
    if (
      owner.tag === ClassComponent &&
      (queue1.isProcessing || (queue2 !== null && queue2.isProcessing)) &&
      !didWarnUpdateInsideUpdate
    ) {
      warning(
        false,
        'An update (setState, replaceState, or forceUpdate) was scheduled ' +
          'from inside an update function. Update functions should be pure, ' +
          'with zero side-effects. Consider using componentDidUpdate or a ' +
          'callback.',
      );
      didWarnUpdateInsideUpdate = true;
    }
  }
}

export function enqueueRenderPhaseUpdate<Queue, State, Update>(
  workInProgressOwner: UpdateQueueOwner<Queue, State>,
  update: Update,
  renderExpirationTime: ExpirationTime,
) {
  // Render phase updates go into a separate list, and only on the work-in-
  // progress queue.
  let workInProgressQueue = workInProgressOwner.updateQueue;
  if (workInProgressQueue === null) {
    workInProgressQueue = workInProgressOwner.updateQueue = createUpdateQueue(
      workInProgressOwner.memoizedState,
    );
  } else {
    // TODO: I put this here rather than createWorkInProgress so that we don't
    // clone the queue unnecessarily. There's probably a better way to
    // structure this.
    workInProgressQueue = ensureWorkInProgressQueueIsAClone(
      workInProgressOwner,
      workInProgressQueue,
    );
  }

  // Append the update to the end of the list.
  if (workInProgressQueue.lastRenderPhaseUpdate === null) {
    // This is the first render phase update
    workInProgressQueue.firstRenderPhaseUpdate = workInProgressQueue.lastRenderPhaseUpdate = update;
  } else {
    workInProgressQueue.lastRenderPhaseUpdate.next = update;
    workInProgressQueue.lastRenderPhaseUpdate = update;
  }
  if (
    workInProgressQueue.expirationTime === NoWork ||
    workInProgressQueue.expirationTime > renderExpirationTime
  ) {
    // The incoming update has the earliest expiration of any update in the
    // queue. Update the queue's expiration time.
    workInProgressQueue.expirationTime = renderExpirationTime;
  }
}

function addToEffectList(queue, update) {
  // Set this to null, in case it was mutated during an aborted render.
  update.nextEffect = null;
  if (queue.lastEffect === null) {
    queue.firstEffect = queue.lastEffect = update;
  } else {
    queue.lastEffect.nextEffect = update;
    queue.lastEffect = update;
  }
}

function processSingleClassUpdate<State, Props>(
  workInProgress: Fiber,
  queue: ClassUpdateQueue<State, Props>,
  update: ClassUpdate<State, Props>,
  prevState: State,
): State {
  const payload = update.payload;
  switch (update.tag) {
    case ReplaceState: {
      if (typeof payload === 'function') {
        // Updater function
        const instance = workInProgress.stateNode;
        const nextProps = workInProgress.pendingProps;

        if (
          debugRenderPhaseSideEffects ||
          (debugRenderPhaseSideEffectsForStrictMode &&
            workInProgress.mode & StrictMode)
        ) {
          // Invoke the updater an extra time to help detect side-effects.
          payload.call(instance, prevState, nextProps);
        }

        return payload.call(instance, prevState, nextProps);
      }
      // State object
      return payload;
    }
    case UpdateState: {
      let partialState;
      if (typeof payload === 'function') {
        // Updater function
        const instance = workInProgress.stateNode;
        const nextProps = workInProgress.pendingProps;

        if (
          debugRenderPhaseSideEffects ||
          (debugRenderPhaseSideEffectsForStrictMode &&
            workInProgress.mode & StrictMode)
        ) {
          // Invoke the updater an extra time to help detect side-effects.
          payload.call(instance, prevState, nextProps);
        }

        partialState = payload.call(instance, prevState, nextProps);
      } else {
        // Partial state object
        partialState = payload;
      }
      if (partialState === null || partialState === undefined) {
        // Null and undefined are treated as no-ops.
        return prevState;
      }
      // Merge the partial state and the previous state.
      return Object.assign({}, prevState, partialState);
    }
    case ForceUpdate: {
      workInProgress.effectTag |= ForceUpdateEffect;
      return prevState;
    }
    case DeriveStateFromPropsUpdate: {
      const getDerivedStateFromProps =
        workInProgress.type.getDerivedStateFromProps;
      const nextProps = workInProgress.pendingProps;

      if (
        debugRenderPhaseSideEffects ||
        (debugRenderPhaseSideEffectsForStrictMode &&
          workInProgress.mode & StrictMode)
      ) {
        // Invoke the function an extra time to help detect side-effects.
        getDerivedStateFromProps(nextProps, prevState);
      }

      const partialState = getDerivedStateFromProps(nextProps, prevState);

      if (__DEV__) {
        warnOnUndefinedDerivedState(workInProgress, partialState);
      }
      // Merge the partial state and the previous state.
      return Object.assign({}, prevState, partialState);
    }
    case CaptureAndLogError: {
      const instance = workInProgress.stateNode;
      if (typeof instance.componentDidCatch === 'function') {
        workInProgress.effectTag |= UpdateQueueEffect;
        addToEffectList(queue, update);
      }
    }
    // Intentional fall-through to the next case, to calculate the derived state
    // eslint-disable-next-line no-fallthrough
    case CaptureError: {
      const errorInfo = update.payload;
      const getDerivedStateFromCatch =
        workInProgress.type.getDerivedStateFromCatch;

      workInProgress.effectTag =
        (workInProgress.effectTag & ~ShouldCapture) | DidCapture;

      if (
        enableGetDerivedStateFromCatch &&
        typeof getDerivedStateFromCatch === 'function'
      ) {
        const error = errorInfo.value;
        if (
          debugRenderPhaseSideEffects ||
          (debugRenderPhaseSideEffectsForStrictMode &&
            workInProgress.mode & StrictMode)
        ) {
          // Invoke the function an extra time to help detect side-effects.
          getDerivedStateFromCatch(error);
        }

        // TODO: Pass prevState as second argument?
        const partialState = getDerivedStateFromCatch(error);

        // Merge the partial state and the previous state.
        return Object.assign({}, prevState, partialState);
      } else {
        return prevState;
      }
    }
    case Callback: {
      workInProgress.effectTag |= UpdateQueueEffect;
      addToEffectList(queue, update);
      return prevState;
    }
    default:
      return prevState;
  }
}

function processSingleRootUpdate(
  workInProgress: Fiber,
  queue: RootUpdateQueue,
  update: RootUpdate,
  prevChildren: ReactNodeList,
): ReactNodeList {
  switch (update.tag) {
    case ReplaceState: {
      const nextChildren = update.payload;
      return nextChildren;
    }
    case CaptureAndLogError: {
      workInProgress.effectTag =
        (workInProgress.effectTag & ~ShouldCapture) | DidCapture;
    }
    // Intentional fall-through to the next case, to calculate the derived state
    // eslint-disable-next-line no-fallthrough
    case CaptureError: {
      workInProgress.effectTag |= UpdateQueueEffect;
      addToEffectList(queue, update);
      // Unmount the root by rendering null.
      return null;
    }
    case Callback: {
      workInProgress.effectTag |= UpdateQueueEffect;
      addToEffectList(queue, update);
      return prevChildren;
    }
    default:
      return prevChildren;
  }
}

function processSingleUpdate(
  typeOfUpdateQueue,
  owner,
  queue,
  update,
  prevState,
) {
  switch (typeOfUpdateQueue) {
    case ClassUpdateQueue:
      const classUpdate: ClassUpdate<any, any> = (update: any);
      return processSingleClassUpdate(owner, queue, classUpdate, prevState);
    case RootUpdateQueue:
      const rootUpdate: RootUpdate = (update: any);
      return processSingleRootUpdate(owner, queue, rootUpdate, prevState);
    default:
      return prevState;
  }
}

function ensureWorkInProgressQueueIsAClone(owner, queue) {
  const alternate = owner.alternate;
  if (alternate !== null) {
    // If the work-in-progress queue is equal to the current queue,
    // we need to clone it first.
    if (queue === alternate.updateQueue) {
      queue = owner.updateQueue = cloneUpdateQueue(queue);
    }
  }
  return queue;
}

export function processClassUpdateQueue<Props, State>(
  workInProgress: Fiber,
  queue: ClassUpdateQueueType<Props, State>,
  renderExpirationTime: ExpirationTime,
) {
  return processUpdateQueue(
    ClassUpdateQueue,
    workInProgress,
    queue,
    renderExpirationTime,
  );
}

export function processRootUpdateQueue(
  workInProgress: Fiber,
  queue: RootUpdateQueueType,
  renderExpirationTime,
) {
  return processUpdateQueue(
    RootUpdateQueue,
    workInProgress,
    queue,
    renderExpirationTime,
  );
}

function processUpdateQueue(
  typeOfUpdateQueue,
  owner,
  queue,
  renderExpirationTime,
): void {
  if (
    queue.expirationTime === NoWork ||
    queue.expirationTime > renderExpirationTime
  ) {
    // Insufficient priority. Bailout.
    return;
  }

  queue = ensureWorkInProgressQueueIsAClone(owner, queue);

  if (__DEV__) {
    queue.isProcessing = true;
  }

  // These values may change as we process the queue.
  let newBaseState = queue.baseState;
  let newFirstUpdate = null;
  let newExpirationTime = NoWork;

  // Iterate through the list of updates to compute the result.
  let update = queue.firstUpdate;
  let resultState = newBaseState;
  while (update !== null) {
    const updateExpirationTime = update.expirationTime;
    if (updateExpirationTime > renderExpirationTime) {
      // This update does not have sufficient priority. Skip it.
      if (newFirstUpdate === null) {
        // This is the first skipped update. It will be the first update in
        // the new list.
        newFirstUpdate = update;
        // Since this is the first update that was skipped, the current result
        // is the new base state.
        newBaseState = resultState;
      }
      // Since this update will remain in the list, update the remaining
      // expiration time.
      if (
        newExpirationTime === NoWork ||
        newExpirationTime > updateExpirationTime
      ) {
        newExpirationTime = updateExpirationTime;
      }
    } else {
      // This update does have sufficient priority. Process it and compute
      // a new result.
      resultState = processSingleUpdate(
        typeOfUpdateQueue,
        owner,
        queue,
        update,
        resultState,
      );
    }
    // Continue to the next update.
    update = update.next;
  }

  // Separately, iterate though the list of render phase updates.
  let newFirstRenderPhaseUpdate = null;
  update = queue.firstRenderPhaseUpdate;
  while (update !== null) {
    const updateExpirationTime = update.expirationTime;
    if (updateExpirationTime > renderExpirationTime) {
      // This update does not have sufficient priority. Skip it.
      if (newFirstRenderPhaseUpdate === null) {
        // This is the first skipped render phase update. It will be the first
        // update in the new list.
        newFirstUpdate = update;
        // If this is the first update that was skipped (including the non-
        // render phase updates!), the current result is the new base state.
        if (newFirstUpdate === null) {
          newBaseState = resultState;
        }
      }
      // Since this update will remain in the list, update the remaining
      // expiration time.
      if (
        newExpirationTime === NoWork ||
        newExpirationTime > updateExpirationTime
      ) {
        newExpirationTime = updateExpirationTime;
      }
    } else {
      // This update does have sufficient priority. Process it and compute
      // a new result.
      resultState = processSingleUpdate(
        typeOfUpdateQueue,
        owner,
        queue,
        update,
        resultState,
      );
    }
    update = update.next;
  }
  if (newFirstUpdate === null) {
    queue.lastUpdate = null;
  }
  if (newFirstRenderPhaseUpdate === null) {
    queue.lastRenderPhaseUpdate = null;
  }
  if (newFirstUpdate === null && newFirstRenderPhaseUpdate === null) {
    // We processed every update, without skipping. That means the new base
    // state is the same as the result state.
    newBaseState = resultState;
  }

  queue.baseState = newBaseState;
  queue.firstUpdate = newFirstUpdate;
  queue.firstRenderPhaseUpdate = newFirstRenderPhaseUpdate;
  queue.expirationTime = newExpirationTime;

  owner.memoizedState = resultState;

  if (__DEV__) {
    queue.isProcessing = false;
  }
}

function logError(boundary: Fiber, errorInfo: CapturedValue<mixed>) {
  const source = errorInfo.source;
  let stack = errorInfo.stack;
  if (stack === null) {
    stack = getStackAddendumByWorkInProgressFiber(source);
  }

  const capturedError: CapturedError = {
    componentName: source !== null ? getComponentName(source) : null,
    componentStack: stack !== null ? stack : '',
    error: errorInfo.value,
    errorBoundary: null,
    errorBoundaryName: null,
    errorBoundaryFound: false,
    willRetry: false,
  };

  if (boundary !== null && boundary.tag === ClassComponent) {
    capturedError.errorBoundary = boundary.stateNode;
    capturedError.errorBoundaryName = getComponentName(boundary);
    capturedError.errorBoundaryFound = true;
    capturedError.willRetry = true;
  }

  try {
    logCapturedError(capturedError);
  } catch (e) {
    // Prevent cycle if logCapturedError() throws.
    // A cycle may still occur if logCapturedError renders a component that throws.
    const suppressLogging = e && e.suppressReactErrorLogging;
    if (!suppressLogging) {
      console.error(e);
    }
  }
}

export type UpdateQueueMethods = {
  commitClassUpdateQueue<State, Props>(
    owner: Fiber,
    finishedQueue: ClassUpdateQueueType<State, Props>,
    renderExpirationTime: ExpirationTime,
  ): void,
  commitRootUpdateQueue(
    owner: Fiber,
    finishedQueue: RootUpdateQueueType,
    renderExpirationTime: ExpirationTime,
  ): void,
};

export default function<T, P, I, TI, HI, PI, C, CC, CX, PL>(
  config: HostConfig<T, P, I, TI, HI, PI, C, CC, CX, PL>,
  markLegacyErrorBoundaryAsFailed: (instance: mixed) => void,
  onUncaughtError,
): UpdateQueueMethods {
  const {getPublicInstance} = config;

  function callCallbackEffect(effect, context) {
    // Change the effect to no-op so it doesn't fire more than once.
    const callback = effect.payload;

    effect.tag = NoOp;
    effect.payload = null;

    invariant(
      typeof callback === 'function',
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: %s',
      callback,
    );
    callback.call(context);
  }

  function commitClassEffect<State, Props>(
    finishedWork: Fiber,
    effect: ClassUpdate<State, Props>,
  ) {
    switch (effect.tag) {
      case Callback: {
        const instance = finishedWork.stateNode;
        callCallbackEffect(effect, instance);
        break;
      }
      case CaptureAndLogError: {
        // Change the tag to CaptureError so that we derive state
        // correctly on rebase, but we don't log more than once.
        effect.tag = CaptureError;

        const errorInfo = effect.payload;
        const instance = finishedWork.stateNode;
        const ctor = finishedWork.type;

        if (
          !enableGetDerivedStateFromCatch ||
          typeof ctor.getDerivedStateFromCatch !== 'function'
        ) {
          // To preserve the preexisting retry behavior of error boundaries,
          // we keep track of which ones already failed during this batch.
          // This gets reset before we yield back to the browser.
          // TODO: Warn in strict mode if getDerivedStateFromCatch is
          // not defined.
          markLegacyErrorBoundaryAsFailed(instance);
        }

        instance.props = finishedWork.memoizedProps;
        instance.state = finishedWork.memoizedState;
        const error = errorInfo.value;
        const stack = errorInfo.stack;
        logError(finishedWork, errorInfo);
        instance.componentDidCatch(error, {
          componentStack: stack !== null ? stack : '',
        });
        break;
      }
    }
  }

  function commitRootEffect(finishedWork: Fiber, effect: RootUpdate) {
    switch (effect.tag) {
      case Callback: {
        let instance = null;
        if (finishedWork.child !== null) {
          switch (finishedWork.child.tag) {
            case HostComponent:
              instance = getPublicInstance(finishedWork.child.stateNode);
              break;
            case ClassComponent:
              instance = finishedWork.child.stateNode;
              break;
          }
        }
        callCallbackEffect(effect, instance);
        break;
      }
      case CaptureAndLogError: {
        // Change the tag to CaptureError so that we derive state
        // correctly on rebase, but we don't log more than once.
        effect.tag = CaptureError;
        const errorInfo = effect.payload;
        const error = errorInfo.value;

        onUncaughtError(error);

        logError(finishedWork, errorInfo);
        break;
      }
    }
  }

  function commitEffect(typeOfUpdateQueue, owner, queue, effect) {
    switch (typeOfUpdateQueue) {
      case ClassUpdateQueue: {
        const classEffect: ClassEffect<any, any> = (effect: any);
        commitClassEffect(owner, classEffect);
        break;
      }
      case RootUpdateQueue: {
        const rootEffect: ClassEffect<any, any> = (effect: any);
        commitRootEffect(owner, rootEffect);
        break;
      }
    }
  }

  function commitClassUpdateQueue<State, Props>(
    owner: Fiber,
    finishedQueue: ClassUpdateQueueType<State, Props>,
    renderExpirationTime: ExpirationTime,
  ): void {
    return commitUpdateQueue(
      ClassUpdateQueue,
      owner,
      finishedQueue,
      renderExpirationTime,
    );
  }

  function commitRootUpdateQueue(
    owner: Fiber,
    finishedQueue: RootUpdateQueueType,
    renderExpirationTime: ExpirationTime,
  ): void {
    return commitUpdateQueue(
      RootUpdateQueue,
      owner,
      finishedQueue,
      renderExpirationTime,
    );
  }

  function commitUpdateQueue(
    typeOfUpdateQueue,
    owner,
    finishedQueue,
    renderExpirationTime,
  ): void {
    // If the finished render included render phase updates, and there are still
    // lower priority updates left over, we need to keep the render phase updates
    // in the queue so that they are rebased and not dropped once we process the
    // queue again at the lower priority.
    if (finishedQueue.firstRenderPhaseUpdate !== null) {
      // Join the render phase update list to the end of the normal list.
      if (finishedQueue.lastUpdate === null) {
        // This should be unreachable.
        if (__DEV__) {
          warning(false, 'Expected a non-empty queue.');
        }
      } else {
        finishedQueue.lastUpdate.next = finishedQueue.firstRenderPhaseUpdate;
        finishedQueue.lastUpdate = finishedQueue.lastRenderPhaseUpdate;
      }
      if (
        finishedQueue.expirationTime === NoWork ||
        finishedQueue.expirationTime > renderExpirationTime
      ) {
        // Update the queue's expiration time.
        finishedQueue.expirationTime = renderExpirationTime;
      }
      // Clear the list of render phase updates.
      finishedQueue.firstRenderPhaseUpdate = finishedQueue.lastRenderPhaseUpdate = null;
    }

    // Commit the effects
    let effect = finishedQueue.firstEffect;
    finishedQueue.firstEffect = finishedQueue.lastEffect = null;
    while (effect !== null) {
      commitEffect(typeOfUpdateQueue, owner, finishedQueue, effect);
      effect = effect.nextEffect;
    }
  }

  return {
    commitClassUpdateQueue,
    commitRootUpdateQueue,
  };
}
