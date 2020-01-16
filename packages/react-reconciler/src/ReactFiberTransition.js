/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {UpdateQueue, Update} from './ReactFiberHooks';
import type {ExpirationTime} from './ReactFiberExpirationTime';
import type {SuspenseConfig} from './ReactFiberSuspenseConfig';

import ReactSharedInternals from 'shared/ReactSharedInternals';
import is from 'shared/objectIs';

import {
  UserBlockingPriority,
  NormalPriority,
  runWithPriority,
  getCurrentPriorityLevel,
} from './SchedulerWithReactIntegration';
import {
  scheduleUpdateOnFiber,
  computeExpirationForFiber,
  requestCurrentTimeForUpdate,
  warnIfNotScopedWithMatchingAct,
  warnIfNotCurrentlyActingUpdatesInDev,
  scheduleWork,
} from './ReactFiberWorkLoop';
import {NoWork} from './ReactFiberExpirationTime';
import {requestCurrentSuspenseConfig} from './ReactFiberSuspenseConfig';
import {
  requestRenderPhaseUpdate,
  setInvalidNestedHooksDispatcher,
} from './ReactFiberHooks';
import {
  createUpdate,
  ReplaceState,
  ForceUpdate,
  enqueueUpdate,
} from './ReactUpdateQueue';
import {get as getInstance} from 'shared/ReactInstanceMap';
import {isMounted} from 'react-reconciler/reflection';
import {preventIntermediateStates} from 'shared/ReactFeatureFlags';

const {ReactCurrentDispatcher, ReactCurrentBatchConfig} = ReactSharedInternals;

export type TransitionInstance = {|
  version: number,
  pendingTime: ExpirationTime,
  resolvedTime: ExpirationTime,
  fiber: Fiber,
|};

type Dispatch = <S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) => void;

type ClassSetState = (
  inst: any,
  payload: mixed,
  callback: ?() => mixed,
) => void;
type ClassReplaceState = (
  inst: any,
  payload: mixed,
  callback: ?() => mixed,
) => void;
type ClassForceUpdate = (inst: any, callback: ?() => mixed) => void;

// The implementation of dispatch, setState, et al can be swapped out at
// runtime, e.g. when calling `startTransition`. These references point to
// the current implementation.
let dispatchImpl: Dispatch = dispatchImplDefault;
let classSetStateImpl: ClassSetState = classSetStateImplDefault;
let classReplaceStateImpl: ClassReplaceState = classReplaceStateImplDefault;
let classForceUpdateImpl: ClassForceUpdate = classForceUpdateImplDefault;

// Inside `startTransition`, this is the transition instance that corresponds to
// the `useTransition` hook.
let currentTransition: TransitionInstance | null = null;
// The event time of the current transition.
let currentTransitionEventTime: ExpirationTime = NoWork;
// Inside `startTransition`, this is the expiration time of the update that
// turns on `isPending`. We also use it to turn off the `isPending` of previous
// transitions, if they exists.
let currentTransitionPendingTime: ExpirationTime = NoWork;
// The expiration time of the current transition. This is accumulated during
// `startTransition` because it depends on whether the current transition
// overlaps with any previous transitions.
let currentTransitionResolvedTime: ExpirationTime = NoWork;

let dispatchContinuations: Array<
  (ExpirationTime, ExpirationTime, SuspenseConfig | null) => void,
> | null = null;

let warnOnInvalidCallback;
if (__DEV__) {
  const didWarnOnInvalidCallback = new Set();

  warnOnInvalidCallback = function(callback: mixed, callerName: string) {
    if (callback === null || typeof callback === 'function') {
      return;
    }
    const key = callerName + '_' + (callback: any);
    if (!didWarnOnInvalidCallback.has(key)) {
      didWarnOnInvalidCallback.add(key);
      console.error(
        '%s(...): Expected the last optional `callback` argument to be a ' +
          'function. Instead received: %s.',
        callerName,
        callback,
      );
    }
  };
}

export function dispatch<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
): void {
  if (__DEV__) {
    if (typeof arguments[3] === 'function') {
      console.error(
        "State updates from the useState() and useReducer() Hooks don't " +
          'support the second callback argument. To execute a side effect ' +
          'after rendering, declare it in the component body with useEffect().',
      );
    }
  }

  dispatchImpl(fiber, queue, action);
}

export const classComponentUpdater = {
  isMounted,
  enqueueSetState(inst: any, payload: mixed, callback: ?() => mixed) {
    classSetStateImpl(inst, payload, callback);
  },
  enqueueReplaceState(inst: any, payload: mixed, callback: ?() => mixed) {
    classReplaceStateImpl(inst, payload, callback);
  },
  enqueueForceUpdate(inst: any, callback: ?() => mixed) {
    classForceUpdateImpl(inst, callback);
  },
};

function dispatchImplDefault<S, A>(
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
  const eventTime = requestCurrentTimeForUpdate();
  const suspenseConfig = requestCurrentSuspenseConfig();
  const expirationTime = computeExpirationForFiber(
    eventTime,
    fiber,
    suspenseConfig,
  );
  dispatchForExpirationTime(
    fiber,
    queue,
    action,
    eventTime,
    expirationTime,
    suspenseConfig,
  );
}

function dispatchForExpirationTime<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
  eventTime: ExpirationTime,
  expirationTime: ExpirationTime,
  suspenseConfig: SuspenseConfig | null,
) {
  const update: Update<S, A> = {
    eventTime,
    expirationTime,
    suspenseConfig,
    action,
    eagerReducer: null,
    eagerState: null,
    next: (null: any),
  };

  if (__DEV__) {
    update.priority = getCurrentPriorityLevel();
  }

  // Append the update to the end of the list.
  const pending = queue.pending;
  if (pending === null) {
    // This is the first update. Create a circular list.
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  queue.pending = update;

  const alternate = fiber.alternate;
  if (
    fiber.expirationTime === NoWork &&
    (alternate === null || alternate.expirationTime === NoWork)
  ) {
    // The queue is currently empty, which means we can eagerly compute the
    // next state before entering the render phase. If the new state is the
    // same as the current state, we may be able to bail out entirely.
    const lastRenderedReducer = queue.lastRenderedReducer;
    if (lastRenderedReducer !== null) {
      const prevDispatcher = __DEV__ ? setInvalidNestedHooksDispatcher() : null;
      try {
        const currentState: S = (queue.lastRenderedState: any);
        const eagerState = lastRenderedReducer(currentState, action);
        // Stash the eagerly computed state, and the reducer used to compute
        // it, on the update object. If the reducer hasn't changed by the
        // time we enter the render phase, then the eager state can be used
        // without calling the reducer again.
        update.eagerReducer = lastRenderedReducer;
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
  if (__DEV__) {
    // $FlowExpectedError - jest isn't a global, and isn't recognized outside of tests
    if ('undefined' !== typeof jest) {
      warnIfNotScopedWithMatchingAct(fiber);
      warnIfNotCurrentlyActingUpdatesInDev(fiber);
    }
  }

  scheduleWork(fiber, expirationTime);
}

function dispatchImplRenderPhase<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
  const update = requestRenderPhaseUpdate(fiber, action);
  if (update === null) {
    // This is an update on a fiber other than the one that is currently
    // rendering. Fallback to default implementation
    // TODO: This is undefined behavior. It should either warn or throw.
    dispatchImplDefault(fiber, queue, action);
    return;
  }

  // Append the update to the end of the list.
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

function dispatchImplInsideTransition<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
  const transition: TransitionInstance = (currentTransition: any);
  setTransition(queue, transition);

  const continuation = dispatchForExpirationTime.bind(
    null,
    fiber,
    queue,
    action,
  );
  if (dispatchContinuations === null) {
    dispatchContinuations = [continuation];
  } else {
    dispatchContinuations.push(continuation);
  }
}

export function setRenderPhaseDispatchImpl(): Dispatch {
  const prev = dispatchImpl;
  dispatchImpl = dispatchImplRenderPhase;
  return prev;
}

export function restoreDispatchImpl(prevDispatchImpl: Dispatch): void {
  dispatchImpl = prevDispatchImpl;
}

function classSetStateImplDefault(inst, payload, callback) {
  const fiber = getInstance(inst);
  const eventTime = requestCurrentTimeForUpdate();
  const suspenseConfig = requestCurrentSuspenseConfig();
  const expirationTime = computeExpirationForFiber(
    eventTime,
    fiber,
    suspenseConfig,
  );
  classSetStateForExpirationTime(
    fiber,
    payload,
    callback,
    eventTime,
    expirationTime,
    suspenseConfig,
  );
}

function classReplaceStateImplDefault(inst, payload, callback) {
  const fiber = getInstance(inst);
  const eventTime = requestCurrentTimeForUpdate();
  const suspenseConfig = requestCurrentSuspenseConfig();
  const expirationTime = computeExpirationForFiber(
    eventTime,
    fiber,
    suspenseConfig,
  );
  classReplaceStateForExpirationTime(
    fiber,
    payload,
    callback,
    eventTime,
    expirationTime,
    suspenseConfig,
  );
}

function classForceUpdateImplDefault(inst, callback) {
  const fiber = getInstance(inst);
  const eventTime = requestCurrentTimeForUpdate();
  const suspenseConfig = requestCurrentSuspenseConfig();
  const expirationTime = computeExpirationForFiber(
    eventTime,
    fiber,
    suspenseConfig,
  );
  classForceUpdateForExpirationTime(
    fiber,
    callback,
    eventTime,
    expirationTime,
    suspenseConfig,
  );
}

function classSetStateForExpirationTime(
  fiber,
  payload,
  callback,
  eventTime,
  expirationTime,
  suspenseConfig,
) {
  const update = createUpdate(eventTime, expirationTime, suspenseConfig);
  update.payload = payload;
  if (callback !== undefined && callback !== null) {
    if (__DEV__) {
      warnOnInvalidCallback(callback, 'setState');
    }
    update.callback = callback;
  }
  enqueueUpdate(fiber, update);
  scheduleWork(fiber, expirationTime);
}

function classReplaceStateForExpirationTime(
  fiber,
  payload,
  callback,
  eventTime,
  expirationTime,
  suspenseConfig,
) {
  const update = createUpdate(eventTime, expirationTime, suspenseConfig);
  update.tag = ReplaceState;
  update.payload = payload;
  if (callback !== undefined && callback !== null) {
    if (__DEV__) {
      warnOnInvalidCallback(callback, 'replaceState');
    }
    update.callback = callback;
  }
  enqueueUpdate(fiber, update);
  scheduleWork(fiber, expirationTime);
}

function classForceUpdateForExpirationTime(
  fiber,
  callback,
  eventTime,
  expirationTime,
  suspenseConfig,
) {
  const update = createUpdate(eventTime, expirationTime, suspenseConfig);
  update.tag = ForceUpdate;
  if (callback !== undefined && callback !== null) {
    if (__DEV__) {
      warnOnInvalidCallback(callback, 'forceUpdate');
    }
    update.callback = callback;
  }
  enqueueUpdate(fiber, update);
  scheduleWork(fiber, expirationTime);
}

function classSetStateImplInsideTransition(inst, payload, callback) {
  const fiber = getInstance(inst);
  const updateQueue = fiber.updateQueue;
  const sharedQueue = updateQueue !== null ? updateQueue.shared : null;
  if (sharedQueue === null) {
    // TODO: Fire warning for update on unmounted component
    return;
  }

  const transition: TransitionInstance = (currentTransition: any);
  setTransition(sharedQueue, transition);

  const continuation = classSetStateForExpirationTime.bind(
    null,
    fiber,
    payload,
    callback,
  );
  if (dispatchContinuations === null) {
    dispatchContinuations = [continuation];
  } else {
    dispatchContinuations.push(continuation);
  }
}

function classReplaceStateImplInsideTransition(inst, payload, callback) {
  const fiber = getInstance(inst);
  const updateQueue = fiber.updateQueue;
  const sharedQueue = updateQueue !== null ? updateQueue.shared : null;
  if (sharedQueue === null) {
    // TODO: Fire warning for update on unmounted component
    return;
  }

  const transition: TransitionInstance = (currentTransition: any);
  setTransition(sharedQueue, transition);

  const continuation = classReplaceStateForExpirationTime.bind(
    null,
    fiber,
    payload,
    callback,
  );
  if (dispatchContinuations === null) {
    dispatchContinuations = [continuation];
  } else {
    dispatchContinuations.push(continuation);
  }
}

function classForceUpdateImplInsideTransition(inst, callback) {
  const fiber = getInstance(inst);
  const updateQueue = fiber.updateQueue;
  const sharedQueue = updateQueue !== null ? updateQueue.shared : null;
  if (sharedQueue === null) {
    // TODO: Fire warning for update on unmounted component
    return;
  }

  const transition: TransitionInstance = (currentTransition: any);
  setTransition(sharedQueue, transition);

  const continuation = classForceUpdateForExpirationTime.bind(
    null,
    fiber,
    callback,
  );
  if (dispatchContinuations === null) {
    dispatchContinuations = [continuation];
  } else {
    dispatchContinuations.push(continuation);
  }
}

export function startTransition(
  transitionInstance: TransitionInstance,
  config: SuspenseConfig | null | void,
  callback: () => void,
) {
  if (dispatchImpl === dispatchImplRenderPhase) {
    // Wrapping an update in `startTransition` has no effect in the
    // render phase.
    // TODO: This should warn.
    callback();
    return;
  }

  const suspenseConfig = config === undefined ? null : config;
  const fiber = transitionInstance.fiber;

  // Don't need to reset this at the end because it's impossible to read
  // from outside of a `startTransition` callback.
  currentTransitionEventTime = requestCurrentTimeForUpdate();
  currentTransitionResolvedTime = NoWork;

  // TODO: runWithPriority shouldn't be necessary here. React should manage its
  // own concept of priority, and only consult Scheduler for updates that are
  // scheduled from outside a React context.
  const priorityLevel = getCurrentPriorityLevel();
  runWithPriority(
    priorityLevel < UserBlockingPriority ? UserBlockingPriority : priorityLevel,
    () => {
      currentTransitionPendingTime = computeExpirationForFiber(
        currentTransitionEventTime,
        fiber,
        null,
      );
    },
  );
  runWithPriority(
    priorityLevel > NormalPriority ? NormalPriority : priorityLevel,
    () => {
      const previousConfig = ReactCurrentBatchConfig.suspense;
      const previousTransition = currentTransition;
      const previousDispatchContinuations = dispatchContinuations;
      const previousDispatchImpl = dispatchImpl;
      const previousClassSetStateImpl = classSetStateImpl;
      const previousClassReplaceStateImpl = classReplaceStateImpl;
      const previousClassForceUpdateImpl = classForceUpdateImpl;
      ReactCurrentBatchConfig.suspense = suspenseConfig;
      currentTransition = transitionInstance;
      dispatchContinuations = null;
      dispatchImpl = dispatchImplInsideTransition;
      classSetStateImpl = classSetStateImplInsideTransition;
      classReplaceStateImpl = classReplaceStateImplInsideTransition;
      classForceUpdateImpl = classForceUpdateImplInsideTransition;
      try {
        callback();
      } finally {
        if (currentTransitionResolvedTime === NoWork) {
          // This transition did not overlap with any previous transitions.
          // Compute a new concurrent expiration time.
          currentTransitionResolvedTime = computeExpirationForFiber(
            currentTransitionEventTime,
            fiber,
            suspenseConfig,
          );
        }

        // Set the expiration time at which the pending transition will finish.
        // Because there's only a single transition per useTransition hook, we
        // don't need a queue here; we can cheat by only tracking the most
        // recently scheduled transition.
        transitionInstance.pendingTime = currentTransitionPendingTime;
        transitionInstance.resolvedTime = currentTransitionResolvedTime;
        transitionInstance.version++;

        const continuations = dispatchContinuations;
        const eventTime = currentTransitionEventTime;
        const pendingTime = currentTransitionPendingTime;
        const resolvedTime = currentTransitionResolvedTime;

        ReactCurrentBatchConfig.suspense = previousConfig;
        currentTransition = previousTransition;
        dispatchContinuations = previousDispatchContinuations;
        dispatchImpl = previousDispatchImpl;
        classSetStateImpl = previousClassSetStateImpl;
        classReplaceStateImpl = previousClassReplaceStateImpl;
        classForceUpdateImpl = previousClassForceUpdateImpl;
        currentTransitionPendingTime = NoWork;

        if (continuations !== null) {
          // Don't need to schedule work at the resolved time because the
          // pending time is always higher priority.
          scheduleUpdateOnFiber(fiber, pendingTime);

          // These continuations are internal functions that should never throw,
          // but just in case, do them at the very end, after all the
          // clean-up code.
          for (let i = 0; i < continuations.length; i++) {
            const continuation = continuations[i];
            continuation(eventTime, resolvedTime, suspenseConfig);
          }
        }
      }
    },
  );
}

function setTransition(
  queue: {pendingTransition: TransitionInstance | null},
  transition: TransitionInstance,
) {
  const prevTransition = queue.pendingTransition;
  if (transition !== prevTransition) {
    queue.pendingTransition = transition;
    if (prevTransition !== null) {
      // There's already a pending transition on this queue. The new transition
      // supersedes the old one. Turn of the `isPending` state of the
      // previous transition.

      // Track the expiration time of the superseded transition. If there are
      // multiple, choose the highest priority one.
      if (preventIntermediateStates) {
        const resolvedTime = prevTransition.resolvedTime;
        if (currentTransitionResolvedTime < resolvedTime) {
          currentTransitionResolvedTime = resolvedTime;
        }
      }

      // Turn off the `isPending` state of the previous transition, at the same
      // priority we use to turn on the `isPending` state of the
      // current transition.
      prevTransition.resolvedTime = currentTransitionPendingTime;
      prevTransition.version++;
      scheduleUpdateOnFiber(prevTransition.fiber, currentTransitionPendingTime);
    }
  }
}
