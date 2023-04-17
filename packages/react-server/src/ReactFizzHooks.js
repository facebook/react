/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Dispatcher} from 'react-reconciler/src/ReactInternalTypes';

import type {
  MutableSource,
  MutableSourceGetSnapshotFn,
  MutableSourceSubscribeFn,
  ReactContext,
  StartTransitionOptions,
  Thenable,
  Usable,
} from 'shared/ReactTypes';

import type {ResponseState} from './ReactServerFormatConfig';
import type {Task} from './ReactFizzServer';
import type {ThenableState} from './ReactFizzThenable';

import {readContext as readContextImpl} from './ReactFizzNewContext';
import {getTreeId} from './ReactFizzTreeContext';
import {createThenableState, trackUsedThenable} from './ReactFizzThenable';

import {makeId} from './ReactServerFormatConfig';

import {
  enableCache,
  enableUseHook,
  enableUseEffectEventHook,
  enableUseMemoCacheHook,
} from 'shared/ReactFeatureFlags';
import is from 'shared/objectIs';
import {
  REACT_SERVER_CONTEXT_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_MEMO_CACHE_SENTINEL,
} from 'shared/ReactSymbols';

type BasicStateAction<S> = (S => S) | S;
type Dispatch<A> = A => void;

type Update<A> = {
  action: A,
  next: Update<A> | null,
};

type UpdateQueue<A> = {
  last: Update<A> | null,
  dispatch: any,
};

type Hook = {
  memoizedState: any,
  queue: UpdateQueue<any> | null,
  next: Hook | null,
};

let currentlyRenderingComponent: Object | null = null;
let currentlyRenderingTask: Task | null = null;
let firstWorkInProgressHook: Hook | null = null;
let workInProgressHook: Hook | null = null;
// Whether the work-in-progress hook is a re-rendered hook
let isReRender: boolean = false;
// Whether an update was scheduled during the currently executing render pass.
let didScheduleRenderPhaseUpdate: boolean = false;
// Counts the number of useId hooks in this component
let localIdCounter: number = 0;
// Counts the number of use(thenable) calls in this component
let thenableIndexCounter: number = 0;
let thenableState: ThenableState | null = null;
// Lazily created map of render-phase updates
let renderPhaseUpdates: Map<UpdateQueue<any>, Update<any>> | null = null;
// Counter to prevent infinite loops.
let numberOfReRenders: number = 0;
const RE_RENDER_LIMIT = 25;

let isInHookUserCodeInDev = false;

// In DEV, this is the name of the currently executing primitive hook
let currentHookNameInDev: ?string;

function resolveCurrentlyRenderingComponent(): Object {
  if (currentlyRenderingComponent === null) {
    throw new Error(
      'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
        ' one of the following reasons:\n' +
        '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
        '2. You might be breaking the Rules of Hooks\n' +
        '3. You might have more than one copy of React in the same app\n' +
        'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.',
    );
  }

  if (__DEV__) {
    if (isInHookUserCodeInDev) {
      console.error(
        'Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. ' +
          'You can only call Hooks at the top level of your React function. ' +
          'For more information, see ' +
          'https://reactjs.org/link/rules-of-hooks',
      );
    }
  }
  return currentlyRenderingComponent;
}

function areHookInputsEqual(
  nextDeps: Array<mixed>,
  prevDeps: Array<mixed> | null,
) {
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
        `[${nextDeps.join(', ')}]`,
        `[${prevDeps.join(', ')}]`,
      );
    }
  }
  // $FlowFixMe[incompatible-use] found when upgrading Flow
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    // $FlowFixMe[incompatible-use] found when upgrading Flow
    if (is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}

function createHook(): Hook {
  if (numberOfReRenders > 0) {
    throw new Error('Rendered more hooks than during the previous render');
  }
  return {
    memoizedState: null,
    queue: null,
    next: null,
  };
}

function createWorkInProgressHook(): Hook {
  if (workInProgressHook === null) {
    // This is the first hook in the list
    if (firstWorkInProgressHook === null) {
      isReRender = false;
      firstWorkInProgressHook = workInProgressHook = createHook();
    } else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true;
      workInProgressHook = firstWorkInProgressHook;
    }
  } else {
    if (workInProgressHook.next === null) {
      isReRender = false;
      // Append to the end of the list
      workInProgressHook = workInProgressHook.next = createHook();
    } else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true;
      workInProgressHook = workInProgressHook.next;
    }
  }
  return workInProgressHook;
}

export function prepareToUseHooks(
  task: Task,
  componentIdentity: Object,
  prevThenableState: ThenableState | null,
): void {
  currentlyRenderingComponent = componentIdentity;
  currentlyRenderingTask = task;
  if (__DEV__) {
    isInHookUserCodeInDev = false;
  }

  // The following should have already been reset
  // didScheduleRenderPhaseUpdate = false;
  // firstWorkInProgressHook = null;
  // numberOfReRenders = 0;
  // renderPhaseUpdates = null;
  // workInProgressHook = null;

  localIdCounter = 0;
  thenableIndexCounter = 0;
  thenableState = prevThenableState;
}

export function finishHooks(
  Component: any,
  props: any,
  children: any,
  refOrContext: any,
): any {
  // This must be called after every function component to prevent hooks from
  // being used in classes.

  while (didScheduleRenderPhaseUpdate) {
    // Updates were scheduled during the render phase. They are stored in
    // the `renderPhaseUpdates` map. Call the component again, reusing the
    // work-in-progress hooks and applying the additional updates on top. Keep
    // restarting until no more updates are scheduled.
    didScheduleRenderPhaseUpdate = false;
    localIdCounter = 0;
    thenableIndexCounter = 0;
    numberOfReRenders += 1;

    // Start over from the beginning of the list
    workInProgressHook = null;

    children = Component(props, refOrContext);
  }
  resetHooksState();
  return children;
}

export function getThenableStateAfterSuspending(): null | ThenableState {
  const state = thenableState;
  thenableState = null;
  return state;
}

export function checkDidRenderIdHook(): boolean {
  // This should be called immediately after every finishHooks call.
  // Conceptually, it's part of the return value of finishHooks; it's only a
  // separate function to avoid using an array tuple.
  const didRenderIdHook = localIdCounter !== 0;
  return didRenderIdHook;
}

// Reset the internal hooks state if an error occurs while rendering a component
export function resetHooksState(): void {
  if (__DEV__) {
    isInHookUserCodeInDev = false;
  }

  currentlyRenderingComponent = null;
  currentlyRenderingTask = null;
  didScheduleRenderPhaseUpdate = false;
  firstWorkInProgressHook = null;
  numberOfReRenders = 0;
  renderPhaseUpdates = null;
  workInProgressHook = null;
}

function readContext<T>(context: ReactContext<T>): T {
  if (__DEV__) {
    if (isInHookUserCodeInDev) {
      console.error(
        'Context can only be read while React is rendering. ' +
          'In classes, you can read it in the render method or getDerivedStateFromProps. ' +
          'In function components, you can read it directly in the function body, but not ' +
          'inside Hooks like useReducer() or useMemo().',
      );
    }
  }
  return readContextImpl(context);
}

function useContext<T>(context: ReactContext<T>): T {
  if (__DEV__) {
    currentHookNameInDev = 'useContext';
  }
  resolveCurrentlyRenderingComponent();
  return readContextImpl(context);
}

function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  // $FlowFixMe[incompatible-use]: Flow doesn't like mixed types
  return typeof action === 'function' ? action(state) : action;
}

export function useState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  if (__DEV__) {
    currentHookNameInDev = 'useState';
  }
  return useReducer(
    basicStateReducer,
    // useReducer has a special case to support lazy useState initializers
    (initialState: any),
  );
}

export function useReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  if (__DEV__) {
    if (reducer !== basicStateReducer) {
      currentHookNameInDev = 'useReducer';
    }
  }
  currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
  workInProgressHook = createWorkInProgressHook();
  if (isReRender) {
    // This is a re-render. Apply the new render phase updates to the previous
    // current hook.
    const queue: UpdateQueue<A> = (workInProgressHook.queue: any);
    const dispatch: Dispatch<A> = (queue.dispatch: any);
    if (renderPhaseUpdates !== null) {
      // Render phase updates are stored in a map of queue -> linked list
      const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
      if (firstRenderPhaseUpdate !== undefined) {
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        renderPhaseUpdates.delete(queue);
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        let newState = workInProgressHook.memoizedState;
        let update: Update<any> = firstRenderPhaseUpdate;
        do {
          // Process this render phase update. We don't have to check the
          // priority because it will always be the same as the current
          // render's.
          const action = update.action;
          if (__DEV__) {
            isInHookUserCodeInDev = true;
          }
          newState = reducer(newState, action);
          if (__DEV__) {
            isInHookUserCodeInDev = false;
          }
          // $FlowFixMe[incompatible-type] we bail out when we get a null
          update = update.next;
        } while (update !== null);

        // $FlowFixMe[incompatible-use] found when upgrading Flow
        workInProgressHook.memoizedState = newState;

        return [newState, dispatch];
      }
    }
    // $FlowFixMe[incompatible-use] found when upgrading Flow
    return [workInProgressHook.memoizedState, dispatch];
  } else {
    if (__DEV__) {
      isInHookUserCodeInDev = true;
    }
    let initialState;
    if (reducer === basicStateReducer) {
      // Special case for `useState`.
      initialState =
        typeof initialArg === 'function'
          ? ((initialArg: any): () => S)()
          : ((initialArg: any): S);
    } else {
      initialState =
        init !== undefined ? init(initialArg) : ((initialArg: any): S);
    }
    if (__DEV__) {
      isInHookUserCodeInDev = false;
    }
    // $FlowFixMe[incompatible-use] found when upgrading Flow
    workInProgressHook.memoizedState = initialState;
    // $FlowFixMe[incompatible-use] found when upgrading Flow
    const queue: UpdateQueue<A> = (workInProgressHook.queue = {
      last: null,
      dispatch: null,
    });
    const dispatch: Dispatch<A> = (queue.dispatch = (dispatchAction.bind(
      null,
      currentlyRenderingComponent,
      queue,
    ): any));
    // $FlowFixMe[incompatible-use] found when upgrading Flow
    return [workInProgressHook.memoizedState, dispatch];
  }
}

function useMemo<T>(nextCreate: () => T, deps: Array<mixed> | void | null): T {
  currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
  workInProgressHook = createWorkInProgressHook();

  const nextDeps = deps === undefined ? null : deps;

  if (workInProgressHook !== null) {
    const prevState = workInProgressHook.memoizedState;
    if (prevState !== null) {
      if (nextDeps !== null) {
        const prevDeps = prevState[1];
        if (areHookInputsEqual(nextDeps, prevDeps)) {
          return prevState[0];
        }
      }
    }
  }

  if (__DEV__) {
    isInHookUserCodeInDev = true;
  }
  const nextValue = nextCreate();
  if (__DEV__) {
    isInHookUserCodeInDev = false;
  }
  // $FlowFixMe[incompatible-use] found when upgrading Flow
  workInProgressHook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function useRef<T>(initialValue: T): {current: T} {
  currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
  workInProgressHook = createWorkInProgressHook();
  const previousRef = workInProgressHook.memoizedState;
  if (previousRef === null) {
    const ref = {current: initialValue};
    if (__DEV__) {
      Object.seal(ref);
    }
    // $FlowFixMe[incompatible-use] found when upgrading Flow
    workInProgressHook.memoizedState = ref;
    return ref;
  } else {
    return previousRef;
  }
}

function dispatchAction<A>(
  componentIdentity: Object,
  queue: UpdateQueue<A>,
  action: A,
): void {
  if (numberOfReRenders >= RE_RENDER_LIMIT) {
    throw new Error(
      'Too many re-renders. React limits the number of renders to prevent ' +
        'an infinite loop.',
    );
  }

  if (componentIdentity === currentlyRenderingComponent) {
    // This is a render phase update. Stash it in a lazily-created map of
    // queue -> linked list of updates. After this render pass, we'll restart
    // and apply the stashed updates on top of the work-in-progress hook.
    didScheduleRenderPhaseUpdate = true;
    const update: Update<A> = {
      action,
      next: null,
    };
    if (renderPhaseUpdates === null) {
      renderPhaseUpdates = new Map();
    }
    const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
    if (firstRenderPhaseUpdate === undefined) {
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      renderPhaseUpdates.set(queue, update);
    } else {
      // Append the update to the end of the list.
      let lastRenderPhaseUpdate = firstRenderPhaseUpdate;
      while (lastRenderPhaseUpdate.next !== null) {
        lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
      }
      lastRenderPhaseUpdate.next = update;
    }
  } else {
    // This means an update has happened after the function component has
    // returned. On the server this is a no-op. In React Fiber, the update
    // would be scheduled for a future render.
  }
}

export function useCallback<T>(
  callback: T,
  deps: Array<mixed> | void | null,
): T {
  return useMemo(() => callback, deps);
}

function throwOnUseEffectEventCall() {
  throw new Error(
    "A function wrapped in useEffectEvent can't be called during rendering.",
  );
}

export function useEffectEvent<Args, Return, F: (...Array<Args>) => Return>(
  callback: F,
): F {
  // $FlowIgnore[incompatible-return]
  return throwOnUseEffectEventCall;
}

// TODO Decide on how to implement this hook for server rendering.
// If a mutation occurs during render, consider triggering a Suspense boundary
// and falling back to client rendering.
function useMutableSource<Source, Snapshot>(
  source: MutableSource<Source>,
  getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
  subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
): Snapshot {
  resolveCurrentlyRenderingComponent();
  return getSnapshot(source._source);
}

function useSyncExternalStore<T>(
  subscribe: (() => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T,
): T {
  if (getServerSnapshot === undefined) {
    throw new Error(
      'Missing getServerSnapshot, which is required for ' +
        'server-rendered content. Will revert to client rendering.',
    );
  }
  return getServerSnapshot();
}

function useDeferredValue<T>(value: T): T {
  resolveCurrentlyRenderingComponent();
  return value;
}

function unsupportedStartTransition() {
  throw new Error('startTransition cannot be called during server rendering.');
}

function useTransition(): [
  boolean,
  (callback: () => void, options?: StartTransitionOptions) => void,
] {
  resolveCurrentlyRenderingComponent();
  return [false, unsupportedStartTransition];
}

function useId(): string {
  const task: Task = (currentlyRenderingTask: any);
  const treeId = getTreeId(task.treeContext);

  const responseState = currentResponseState;
  if (responseState === null) {
    throw new Error(
      'Invalid hook call. Hooks can only be called inside of the body of a function component.',
    );
  }

  const localId = localIdCounter++;
  return makeId(responseState, treeId, localId);
}

function use<T>(usable: Usable<T>): T {
  if (usable !== null && typeof usable === 'object') {
    // $FlowFixMe[method-unbinding]
    if (typeof usable.then === 'function') {
      // This is a thenable.
      const thenable: Thenable<T> = (usable: any);
      return unwrapThenable(thenable);
    } else if (
      usable.$$typeof === REACT_CONTEXT_TYPE ||
      usable.$$typeof === REACT_SERVER_CONTEXT_TYPE
    ) {
      const context: ReactContext<T> = (usable: any);
      return readContext(context);
    }
  }

  // eslint-disable-next-line react-internal/safe-string-coercion
  throw new Error('An unsupported type was passed to use(): ' + String(usable));
}

export function unwrapThenable<T>(thenable: Thenable<T>): T {
  const index = thenableIndexCounter;
  thenableIndexCounter += 1;
  if (thenableState === null) {
    thenableState = createThenableState();
  }
  return trackUsedThenable(thenableState, thenable, index);
}

function unsupportedRefresh() {
  throw new Error('Cache cannot be refreshed during server rendering.');
}

function useCacheRefresh(): <T>(?() => T, ?T) => void {
  return unsupportedRefresh;
}

function useMemoCache(size: number): Array<any> {
  const data = new Array<any>(size);
  for (let i = 0; i < size; i++) {
    data[i] = REACT_MEMO_CACHE_SENTINEL;
  }
  return data;
}

function noop(): void {}

export const HooksDispatcher: Dispatcher = {
  readContext,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
  useInsertionEffect: noop,
  useLayoutEffect: noop,
  useCallback,
  // useImperativeHandle is not run in the server environment
  useImperativeHandle: noop,
  // Effects are not run in the server environment.
  useEffect: noop,
  // Debugging effect
  useDebugValue: noop,
  useDeferredValue,
  useTransition,
  useId,
  // Subscriptions are not setup in a server environment.
  useMutableSource,
  useSyncExternalStore,
};

if (enableCache) {
  HooksDispatcher.useCacheRefresh = useCacheRefresh;
}
if (enableUseEffectEventHook) {
  HooksDispatcher.useEffectEvent = useEffectEvent;
}
if (enableUseMemoCacheHook) {
  HooksDispatcher.useMemoCache = useMemoCache;
}
if (enableUseHook) {
  HooksDispatcher.use = use;
}

export let currentResponseState: null | ResponseState = (null: any);
export function setCurrentResponseState(
  responseState: null | ResponseState,
): void {
  currentResponseState = responseState;
}
