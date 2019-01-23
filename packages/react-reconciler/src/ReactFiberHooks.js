/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';
import type {Fiber} from './ReactFiber';
import type {ExpirationTime} from './ReactFiberExpirationTime';
import type {HookEffectTag} from './ReactHookEffectTags';

import {NoWork} from './ReactFiberExpirationTime';
import {enableHooks} from 'shared/ReactFeatureFlags';
import {
  readContext,
  stashContextDependencies,
  unstashContextDependencies,
} from './ReactFiberNewContext';
import {
  Update as UpdateEffect,
  Passive as PassiveEffect,
} from 'shared/ReactSideEffectTags';
import {
  NoEffect as NoHookEffect,
  UnmountMutation,
  MountLayout,
  UnmountPassive,
  MountPassive,
} from './ReactHookEffectTags';
import {
  scheduleWork,
  computeExpirationForFiber,
  flushPassiveEffects,
  requestCurrentTime,
} from './ReactFiberScheduler';

import invariant from 'shared/invariant';
import warning from 'shared/warning';
import getComponentName from 'shared/getComponentName';
import is from 'shared/objectIs';
import {markWorkInProgressReceivedUpdate} from './ReactFiberBeginWork';

type Update<S, A> = {
  expirationTime: ExpirationTime,
  action: A,
  eagerReducer: ((S, A) => S) | null,
  eagerState: S | null,
  next: Update<S, A> | null,
};

type UpdateQueue<S, A> = {
  last: Update<S, A> | null,
  dispatch: (A => mixed) | null,
  eagerReducer: ((S, A) => S) | null,
  eagerState: S | null,
};

type HookType =
  | 'useState'
  | 'useReducer'
  | 'useContext'
  | 'useRef'
  | 'useEffect'
  | 'useLayoutEffect'
  | 'useCallback'
  | 'useMemo'
  | 'useImperativeHandle'
  | 'useDebugValue';

// the first instance of a hook mismatch in a component,
// represented by a portion of it's stacktrace
let currentHookMismatchInDev = null;

let didWarnAboutMismatchedHooksForComponent;
if (__DEV__) {
  didWarnAboutMismatchedHooksForComponent = new Set();
}

export type Hook = {
  memoizedState: any,

  baseState: any,
  baseUpdate: Update<any, any> | null,
  queue: UpdateQueue<any, any> | null,

  next: Hook | null,
};

type HookDev = Hook & {
  _debugType: HookType,
};

type Effect = {
  tag: HookEffectTag,
  create: () => mixed,
  destroy: (() => mixed) | null,
  deps: Array<mixed> | null,
  next: Effect,
};

export type FunctionComponentUpdateQueue = {
  lastEffect: Effect | null,
};

type BasicStateAction<S> = (S => S) | S;

type Dispatch<A> = A => void;

// These are set right before calling the component.
let renderExpirationTime: ExpirationTime = NoWork;
// The work-in-progress fiber. I've named it differently to distinguish it from
// the work-in-progress hook.
let currentlyRenderingFiber: Fiber | null = null;

// Hooks are stored as a linked list on the fiber's memoizedState field. The
// current hook list is the list that belongs to the current fiber. The
// work-in-progress hook list is a new list that will be added to the
// work-in-progress fiber.
let firstCurrentHook: Hook | null = null;
let currentHook: Hook | null = null;
let firstWorkInProgressHook: Hook | null = null;
let workInProgressHook: Hook | null = null;

let remainingExpirationTime: ExpirationTime = NoWork;
let componentUpdateQueue: FunctionComponentUpdateQueue | null = null;

// Updates scheduled during render will trigger an immediate re-render at the
// end of the current pass. We can't store these updates on the normal queue,
// because if the work is aborted, they should be discarded. Because this is
// a relatively rare case, we also don't want to add an additional field to
// either the hook or queue object types. So we store them in a lazily create
// map of queue -> render-phase updates, which are discarded once the component
// completes without re-rendering.

// Whether an update was scheduled during the currently executing render pass.
let didScheduleRenderPhaseUpdate: boolean = false;
// Lazily created map of render-phase updates
let renderPhaseUpdates: Map<
  UpdateQueue<any, any>,
  Update<any, any>,
> | null = null;
// Counter to prevent infinite loops.
let numberOfReRenders: number = -1;
const RE_RENDER_LIMIT = 25;

// In DEV, this is the name of the currently executing primitive hook
let currentHookNameInDev: ?HookType = null;

function resolveCurrentlyRenderingFiber(): Fiber {
  invariant(
    currentlyRenderingFiber !== null,
    'Hooks can only be called inside the body of a function component.',
  );
  return currentlyRenderingFiber;
}

function areHookInputsEqual(
  nextDeps: Array<mixed>,
  prevDeps: Array<mixed> | null,
) {
  if (prevDeps === null) {
    if (__DEV__) {
      warning(
        false,
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
      warning(
        false,
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
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}

// till we have String::padEnd, a small function to
// right-pad strings with spaces till a minimum length
function padEndSpaces(string: string, length: number) {
  if (__DEV__) {
    if (string.length >= length) {
      return string;
    } else {
      return string + ' ' + new Array(length - string.length).join(' ');
    }
  }
}

function flushHookMismatchWarnings() {
  // we'll show the diff of the low level hooks,
  // and a stack trace so the dev can locate where
  // the first mismatch is coming from
  if (__DEV__) {
    if (currentHookMismatchInDev !== null) {
      let componentName = getComponentName(
        ((currentlyRenderingFiber: any): Fiber).type,
      );
      if (!didWarnAboutMismatchedHooksForComponent.has(componentName)) {
        didWarnAboutMismatchedHooksForComponent.add(componentName);
        const hookStackDiff = [];
        let current = firstCurrentHook;
        const previousOrder = [];
        while (current !== null) {
          previousOrder.push(((current: any): HookDev)._debugType);
          current = current.next;
        }
        let workInProgress = firstWorkInProgressHook;
        const nextOrder = [];
        while (workInProgress !== null) {
          nextOrder.push(((workInProgress: any): HookDev)._debugType);
          workInProgress = workInProgress.next;
        }
        // some bookkeeping for formatting the output table
        const columnLength = Math.max.apply(
          null,
          previousOrder
            .map(hook => hook.length)
            .concat('   Previous render'.length),
        );

        let hookStackHeader =
          ((padEndSpaces('   Previous render', columnLength): any): string) +
          '    Next render\n';
        const hookStackWidth = hookStackHeader.length;
        hookStackHeader += '   ' + new Array(hookStackWidth - 2).join('-');
        const hookStackFooter = '   ' + new Array(hookStackWidth - 2).join('^');

        const hookStackLength = Math.max(
          previousOrder.length,
          nextOrder.length,
        );
        for (let i = 0; i < hookStackLength; i++) {
          hookStackDiff.push(
            ((padEndSpaces(i + 1 + '. ', 3): any): string) +
              ((padEndSpaces(previousOrder[i], columnLength): any): string) +
              ' ' +
              nextOrder[i],
          );
          if (previousOrder[i] !== nextOrder[i]) {
            break;
          }
        }
        warning(
          false,
          'React has detected a change in the order of Hooks called by %s. ' +
            'This will lead to bugs and errors if not fixed. ' +
            'For more information, read the Rules of Hooks: https://fb.me/rules-of-hooks\n\n' +
            '%s\n' +
            '%s\n' +
            '%s\n' +
            'The first Hook type mismatch occured at:\n' +
            '%s\n\n' +
            'This error occurred in the following component:',
          componentName,
          hookStackHeader,
          hookStackDiff.join('\n'),
          hookStackFooter,
          currentHookMismatchInDev,
        );
      }
      currentHookMismatchInDev = null;
    }
  }
}

export function renderWithHooks(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  props: any,
  refOrContext: any,
  nextRenderExpirationTime: ExpirationTime,
): any {
  if (!enableHooks) {
    return Component(props, refOrContext);
  }
  renderExpirationTime = nextRenderExpirationTime;
  currentlyRenderingFiber = workInProgress;
  firstCurrentHook = current !== null ? current.memoizedState : null;

  // The following should have already been reset
  // currentHook = null;
  // workInProgressHook = null;

  // remainingExpirationTime = NoWork;
  // componentUpdateQueue = null;

  // didScheduleRenderPhaseUpdate = false;
  // renderPhaseUpdates = null;
  // numberOfReRenders = -1;

  let children;
  do {
    didScheduleRenderPhaseUpdate = false;
    numberOfReRenders += 1;

    // Start over from the beginning of the list
    currentHook = null;
    workInProgressHook = null;
    componentUpdateQueue = null;

    children = Component(props, refOrContext);

    if (__DEV__) {
      if (
        current !== null &&
        workInProgressHook !== null &&
        currentHook === null
      ) {
        warning(
          false,
          '%s: Rendered more hooks than during the previous render. This is ' +
            'not currently supported and may lead to unexpected behavior.',
          getComponentName(Component),
        );
      }
      flushHookMismatchWarnings();
    }
  } while (didScheduleRenderPhaseUpdate);

  renderPhaseUpdates = null;
  numberOfReRenders = -1;

  const renderedWork: Fiber = (currentlyRenderingFiber: any);

  renderedWork.memoizedState = firstWorkInProgressHook;
  renderedWork.expirationTime = remainingExpirationTime;
  renderedWork.updateQueue = componentUpdateQueue;

  const didRenderTooFewHooks =
    currentHook !== null && currentHook.next !== null;

  renderExpirationTime = NoWork;
  currentlyRenderingFiber = null;

  firstCurrentHook = null;
  currentHook = null;
  firstWorkInProgressHook = null;
  workInProgressHook = null;

  remainingExpirationTime = NoWork;
  componentUpdateQueue = null;

  if (__DEV__) {
    currentHookNameInDev = null;
  }

  // These were reset above
  // didScheduleRenderPhaseUpdate = false;
  // renderPhaseUpdates = null;
  // numberOfReRenders = -1;

  invariant(
    !didRenderTooFewHooks,
    'Rendered fewer hooks than expected. This may be caused by an accidental ' +
      'early return statement.',
  );

  return children;
}

export function bailoutHooks(
  current: Fiber,
  workInProgress: Fiber,
  expirationTime: ExpirationTime,
) {
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.effectTag &= ~(PassiveEffect | UpdateEffect);
  if (current.expirationTime <= expirationTime) {
    current.expirationTime = NoWork;
  }
}

export function resetHooks(): void {
  if (!enableHooks) {
    return;
  }
  if (__DEV__) {
    flushHookMismatchWarnings();
  }

  // This is used to reset the state of this module when a component throws.
  // It's also called inside mountIndeterminateComponent if we determine the
  // component is a module-style component.
  renderExpirationTime = NoWork;
  currentlyRenderingFiber = null;

  firstCurrentHook = null;
  currentHook = null;
  firstWorkInProgressHook = null;
  workInProgressHook = null;

  remainingExpirationTime = NoWork;
  componentUpdateQueue = null;

  if (__DEV__) {
    currentHookNameInDev = null;
  }

  didScheduleRenderPhaseUpdate = false;
  renderPhaseUpdates = null;
  numberOfReRenders = -1;
}

function createHook(): Hook {
  let hook: Hook = __DEV__
    ? {
        _debugType: ((currentHookNameInDev: any): HookType),
        memoizedState: null,

        baseState: null,
        queue: null,
        baseUpdate: null,

        next: null,
      }
    : {
        memoizedState: null,

        baseState: null,
        queue: null,
        baseUpdate: null,

        next: null,
      };

  return hook;
}

function cloneHook(hook: Hook): Hook {
  let nextHook: Hook = __DEV__
    ? {
        _debugType: ((currentHookNameInDev: any): HookType),
        memoizedState: hook.memoizedState,

        baseState: hook.baseState,
        queue: hook.queue,
        baseUpdate: hook.baseUpdate,

        next: null,
      }
    : {
        memoizedState: hook.memoizedState,

        baseState: hook.baseState,
        queue: hook.queue,
        baseUpdate: hook.baseUpdate,

        next: null,
      };

  if (__DEV__) {
    if (currentHookMismatchInDev === null) {
      if (currentHookNameInDev !== ((hook: any): HookDev)._debugType) {
        currentHookMismatchInDev = new Error('tracer').stack
          .split('\n')
          .slice(4)
          .join('\n');
      }
    }
  }
  return nextHook;
}

function createWorkInProgressHook(): Hook {
  if (workInProgressHook === null) {
    // This is the first hook in the list
    if (firstWorkInProgressHook === null) {
      currentHook = firstCurrentHook;
      if (currentHook === null) {
        // This is a newly mounted hook
        workInProgressHook = createHook();
      } else {
        // Clone the current hook.
        workInProgressHook = cloneHook(currentHook);
      }
      firstWorkInProgressHook = workInProgressHook;
    } else {
      // There's already a work-in-progress. Reuse it.
      currentHook = firstCurrentHook;
      workInProgressHook = firstWorkInProgressHook;
    }
  } else {
    if (workInProgressHook.next === null) {
      let hook;
      if (currentHook === null) {
        // This is a newly mounted hook
        hook = createHook();
      } else {
        currentHook = currentHook.next;
        if (currentHook === null) {
          // This is a newly mounted hook
          hook = createHook();
        } else {
          // Clone the current hook.
          hook = cloneHook(currentHook);
        }
      }
      // Append to the end of the list
      workInProgressHook = workInProgressHook.next = hook;
    } else {
      // There's already a work-in-progress. Reuse it.
      workInProgressHook = workInProgressHook.next;
      currentHook = currentHook !== null ? currentHook.next : null;
    }
  }
  return workInProgressHook;
}

function createFunctionComponentUpdateQueue(): FunctionComponentUpdateQueue {
  return {
    lastEffect: null,
  };
}

function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  return typeof action === 'function' ? action(state) : action;
}

export function useContext<T>(
  context: ReactContext<T>,
  observedBits: void | number | boolean,
): T {
  if (__DEV__) {
    currentHookNameInDev = 'useContext';
    createWorkInProgressHook();
    currentHookNameInDev = null;
  }
  // Ensure we're in a function component (class components support only the
  // .unstable_read() form)
  resolveCurrentlyRenderingFiber();
  return readContext(context, observedBits);
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

export function useReducer<S, A>(
  reducer: (S, A) => S,
  initialState: S,
  initialAction: A | void | null,
): [S, Dispatch<A>] {
  if (__DEV__) {
    if (reducer !== basicStateReducer) {
      currentHookNameInDev = 'useReducer';
    }
  }
  let fiber = (currentlyRenderingFiber = resolveCurrentlyRenderingFiber());
  workInProgressHook = createWorkInProgressHook();
  if (__DEV__) {
    currentHookNameInDev = null;
  }
  let queue: UpdateQueue<S, A> | null = (workInProgressHook.queue: any);
  if (queue !== null) {
    // Already have a queue, so this is an update.
    if (numberOfReRenders > 0) {
      // This is a re-render. Apply the new render phase updates to the previous
      // work-in-progress hook.
      const dispatch: Dispatch<A> = (queue.dispatch: any);
      if (renderPhaseUpdates !== null) {
        // Render phase updates are stored in a map of queue -> linked list
        const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
        if (firstRenderPhaseUpdate !== undefined) {
          renderPhaseUpdates.delete(queue);
          let newState = workInProgressHook.memoizedState;
          let update = firstRenderPhaseUpdate;
          do {
            // Process this render phase update. We don't have to check the
            // priority because it will always be the same as the current
            // render's.
            const action = update.action;
            // Temporarily clear to forbid calling Hooks in a reducer.
            currentlyRenderingFiber = null;
            stashContextDependencies();
            newState = reducer(newState, action);
            currentlyRenderingFiber = fiber;
            unstashContextDependencies();
            update = update.next;
          } while (update !== null);

          workInProgressHook.memoizedState = newState;

          // Don't persist the state accumlated from the render phase updates to
          // the base state unless the queue is empty.
          // TODO: Not sure if this is the desired semantics, but it's what we
          // do for gDSFP. I can't remember why.
          if (workInProgressHook.baseUpdate === queue.last) {
            workInProgressHook.baseState = newState;
          }

          return [newState, dispatch];
        }
      }
      return [workInProgressHook.memoizedState, dispatch];
    }

    // The last update in the entire queue
    const last = queue.last;
    // The last update that is part of the base state.
    const baseUpdate = workInProgressHook.baseUpdate;
    const baseState = workInProgressHook.baseState;

    // Find the first unprocessed update.
    let first;
    if (baseUpdate !== null) {
      if (last !== null) {
        // For the first update, the queue is a circular linked list where
        // `queue.last.next = queue.first`. Once the first update commits, and
        // the `baseUpdate` is no longer empty, we can unravel the list.
        last.next = null;
      }
      first = baseUpdate.next;
    } else {
      first = last !== null ? last.next : null;
    }
    if (first !== null) {
      let newState = baseState;
      let newBaseState = null;
      let newBaseUpdate = null;
      let prevUpdate = baseUpdate;
      let update = first;
      let didSkip = false;
      do {
        const updateExpirationTime = update.expirationTime;
        if (updateExpirationTime < renderExpirationTime) {
          // Priority is insufficient. Skip this update. If this is the first
          // skipped update, the previous update/state is the new base
          // update/state.
          if (!didSkip) {
            didSkip = true;
            newBaseUpdate = prevUpdate;
            newBaseState = newState;
          }
          // Update the remaining priority in the queue.
          if (updateExpirationTime > remainingExpirationTime) {
            remainingExpirationTime = updateExpirationTime;
          }
        } else {
          // Process this update.
          if (update.eagerReducer === reducer) {
            // If this update was processed eagerly, and its reducer matches the
            // current reducer, we can use the eagerly computed state.
            newState = ((update.eagerState: any): S);
          } else {
            const action = update.action;
            // Temporarily clear to forbid calling Hooks in a reducer.
            currentlyRenderingFiber = null;
            stashContextDependencies();
            newState = reducer(newState, action);
            currentlyRenderingFiber = fiber;
            unstashContextDependencies();
          }
        }
        prevUpdate = update;
        update = update.next;
      } while (update !== null && update !== first);

      if (!didSkip) {
        newBaseUpdate = prevUpdate;
        newBaseState = newState;
      }

      workInProgressHook.memoizedState = newState;
      workInProgressHook.baseUpdate = newBaseUpdate;
      workInProgressHook.baseState = newBaseState;

      // Mark that the fiber performed work, but only if the new state is
      // different from the current state.
      if (newState !== (currentHook: any).memoizedState) {
        markWorkInProgressReceivedUpdate();
      }

      queue.eagerReducer = reducer;
      queue.eagerState = newState;
    }

    const dispatch: Dispatch<A> = (queue.dispatch: any);
    return [workInProgressHook.memoizedState, dispatch];
  }
  // Temporarily clear to forbid calling Hooks in a reducer.
  currentlyRenderingFiber = null;
  stashContextDependencies();
  // There's no existing queue, so this is the initial render.
  if (reducer === basicStateReducer) {
    // Special case for `useState`.
    if (typeof initialState === 'function') {
      initialState = initialState();
    }
  } else if (initialAction !== undefined && initialAction !== null) {
    initialState = reducer(initialState, initialAction);
  }
  currentlyRenderingFiber = fiber;
  unstashContextDependencies();
  workInProgressHook.memoizedState = workInProgressHook.baseState = initialState;
  queue = workInProgressHook.queue = {
    last: null,
    dispatch: null,
    eagerReducer: reducer,
    eagerState: initialState,
  };
  const dispatch: Dispatch<A> = (queue.dispatch = (dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any));
  return [workInProgressHook.memoizedState, dispatch];
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
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
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

export function useRef<T>(initialValue: T): {current: T} {
  currentlyRenderingFiber = resolveCurrentlyRenderingFiber();
  if (__DEV__) {
    currentHookNameInDev = 'useRef';
  }
  workInProgressHook = createWorkInProgressHook();
  if (__DEV__) {
    currentHookNameInDev = null;
  }
  let ref;

  if (workInProgressHook.memoizedState === null) {
    ref = {current: initialValue};
    if (__DEV__) {
      Object.seal(ref);
    }
    workInProgressHook.memoizedState = ref;
  } else {
    ref = workInProgressHook.memoizedState;
  }
  return ref;
}

export function useLayoutEffect(
  create: () => mixed,
  deps: Array<mixed> | void | null,
): void {
  if (__DEV__) {
    if (currentHookNameInDev !== 'useImperativeHandle') {
      currentHookNameInDev = 'useLayoutEffect';
    }
  }
  useEffectImpl(UpdateEffect, UnmountMutation | MountLayout, create, deps);
}

export function useEffect(
  create: () => mixed,
  deps: Array<mixed> | void | null,
): void {
  if (__DEV__) {
    currentHookNameInDev = 'useEffect';
  }
  useEffectImpl(
    UpdateEffect | PassiveEffect,
    UnmountPassive | MountPassive,
    create,
    deps,
  );
}

function useEffectImpl(fiberEffectTag, hookEffectTag, create, deps): void {
  currentlyRenderingFiber = resolveCurrentlyRenderingFiber();
  workInProgressHook = createWorkInProgressHook();

  const nextDeps = deps === undefined ? null : deps;
  let destroy = null;
  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        pushEffect(NoHookEffect, create, destroy, nextDeps);
        if (__DEV__) {
          currentHookNameInDev = null;
        }
        return;
      }
    }
  }

  currentlyRenderingFiber.effectTag |= fiberEffectTag;
  workInProgressHook.memoizedState = pushEffect(
    hookEffectTag,
    create,
    destroy,
    nextDeps,
  );
  if (__DEV__) {
    currentHookNameInDev = null;
  }
}

export function useImperativeHandle<T>(
  ref: {current: T | null} | ((inst: T | null) => mixed) | null | void,
  create: () => T,
  deps: Array<mixed> | void | null,
): void {
  if (__DEV__) {
    currentHookNameInDev = 'useImperativeHandle';
    warning(
      typeof create === 'function',
      'Expected useImperativeHandle() second argument to be a function ' +
        'that creates a handle. Instead received: %s.',
      create !== null ? typeof create : 'null',
    );
  }
  // TODO: If deps are provided, should we skip comparing the ref itself?
  const nextDeps =
    deps !== null && deps !== undefined ? deps.concat([ref]) : [ref];

  // TODO: I've implemented this on top of useEffect because it's almost the
  // same thing, and it would require an equal amount of code. It doesn't seem
  // like a common enough use case to justify the additional size.
  useLayoutEffect(() => {
    if (typeof ref === 'function') {
      const refCallback = ref;
      const inst = create();
      refCallback(inst);
      return () => refCallback(null);
    } else if (ref !== null && ref !== undefined) {
      const refObject = ref;
      if (__DEV__) {
        warning(
          refObject.hasOwnProperty('current'),
          'Expected useImperativeHandle() first argument to either be a ' +
            'ref callback or React.createRef() object. Instead received: %s.',
          'an object with keys {' + Object.keys(refObject).join(', ') + '}',
        );
      }
      const inst = create();
      refObject.current = inst;
      return () => {
        refObject.current = null;
      };
    }
  }, nextDeps);
}

export function useDebugValue(
  value: any,
  formatterFn: ?(value: any) => any,
): void {
  if (__DEV__) {
    currentHookNameInDev = 'useDebugValue';
  }

  // This will trigger a warning if the hook is used in a non-Function component.
  resolveCurrentlyRenderingFiber();

  // This hook is normally a no-op.
  // The react-debug-hooks package injects its own implementation
  // so that e.g. DevTools can display custom hook values.
}

export function useCallback<T>(
  callback: T,
  deps: Array<mixed> | void | null,
): T {
  if (__DEV__) {
    currentHookNameInDev = 'useCallback';
  }
  currentlyRenderingFiber = resolveCurrentlyRenderingFiber();
  workInProgressHook = createWorkInProgressHook();

  const nextDeps = deps === undefined ? null : deps;

  const prevState = workInProgressHook.memoizedState;
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1];
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        currentHookNameInDev = null;
        return prevState[0];
      }
    }
  }
  workInProgressHook.memoizedState = [callback, nextDeps];
  if (__DEV__) {
    currentHookNameInDev = null;
  }
  return callback;
}

export function useMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  if (__DEV__) {
    currentHookNameInDev = 'useMemo';
  }
  let fiber = (currentlyRenderingFiber = resolveCurrentlyRenderingFiber());
  workInProgressHook = createWorkInProgressHook();

  const nextDeps = deps === undefined ? null : deps;

  const prevState = workInProgressHook.memoizedState;
  if (prevState !== null) {
    // Assume these are defined. If they're not, areHookInputsEqual will warn.
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1];
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        if (__DEV__) {
          currentHookNameInDev = null;
        }
        return prevState[0];
      }
    }
  }

  // Temporarily clear to forbid calling Hooks.
  currentlyRenderingFiber = null;
  stashContextDependencies();
  const nextValue = nextCreate();
  currentlyRenderingFiber = fiber;
  unstashContextDependencies();
  workInProgressHook.memoizedState = [nextValue, nextDeps];
  if (__DEV__) {
    currentHookNameInDev = null;
  }
  return nextValue;
}

function dispatchAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
  invariant(
    numberOfReRenders < RE_RENDER_LIMIT,
    'Too many re-renders. React limits the number of renders to prevent ' +
      'an infinite loop.',
  );

  if (__DEV__) {
    warning(
      arguments.length <= 3,
      "State updates from the useState() and useReducer() Hooks don't support the " +
        'second callback argument. To execute a side effect after ' +
        'rendering, declare it in the component body with useEffect().',
    );
  }

  const alternate = fiber.alternate;
  if (
    fiber === currentlyRenderingFiber ||
    (alternate !== null && alternate === currentlyRenderingFiber)
  ) {
    // This is a render phase update. Stash it in a lazily-created map of
    // queue -> linked list of updates. After this render pass, we'll restart
    // and apply the stashed updates on top of the work-in-progress hook.
    didScheduleRenderPhaseUpdate = true;
    const update: Update<S, A> = {
      expirationTime: renderExpirationTime,
      action,
      eagerReducer: null,
      eagerState: null,
      next: null,
    };
    if (renderPhaseUpdates === null) {
      renderPhaseUpdates = new Map();
    }
    const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
    if (firstRenderPhaseUpdate === undefined) {
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
    flushPassiveEffects();

    const currentTime = requestCurrentTime();
    const expirationTime = computeExpirationForFiber(currentTime, fiber);

    const update: Update<S, A> = {
      expirationTime,
      action,
      eagerReducer: null,
      eagerState: null,
      next: null,
    };

    // Append the update to the end of the list.
    const last = queue.last;
    if (last === null) {
      // This is the first update. Create a circular list.
      update.next = update;
    } else {
      const first = last.next;
      if (first !== null) {
        // Still circular.
        update.next = first;
      }
      last.next = update;
    }
    queue.last = update;

    if (
      fiber.expirationTime === NoWork &&
      (alternate === null || alternate.expirationTime === NoWork)
    ) {
      // The queue is currently empty, which means we can eagerly compute the
      // next state before entering the render phase. If the new state is the
      // same as the current state, we may be able to bail out entirely.
      const eagerReducer = queue.eagerReducer;
      if (eagerReducer !== null) {
        try {
          const currentState: S = (queue.eagerState: any);
          // Temporarily clear to forbid calling Hooks in a reducer.
          let maybeFiber = currentlyRenderingFiber; // Note: likely null now unlike `fiber`
          currentlyRenderingFiber = null;
          stashContextDependencies();
          const eagerState = eagerReducer(currentState, action);
          currentlyRenderingFiber = maybeFiber;
          unstashContextDependencies();
          // Stash the eagerly computed state, and the reducer used to compute
          // it, on the update object. If the reducer hasn't changed by the
          // time we enter the render phase, then the eager state can be used
          // without calling the reducer again.
          update.eagerReducer = eagerReducer;
          update.eagerState = eagerState;
          if (eagerState === currentState) {
            // Fast path. We can bail out without scheduling React to re-render.
            // It's still possible that we'll need to rebase this update later,
            // if the component re-renders for a different reason and by that
            // time the reducer has changed.
            return;
          }
        } catch (error) {
          // Suppress the error. It will throw again in the render phase.
        }
      }
    }
    scheduleWork(fiber, expirationTime);
  }
}
