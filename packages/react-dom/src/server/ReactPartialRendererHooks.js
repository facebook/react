/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Dispatcher as DispatcherType,
  TimeoutConfig,
} from 'react-reconciler/src/ReactFiberHooks';
import type {ThreadID} from './ReactThreadIDAllocator';
import type {
  MutableSource,
  MutableSourceGetSnapshotFn,
  MutableSourceSubscribeFn,
  ReactContext,
  ReactEventResponderListener,
} from 'shared/ReactTypes';
import type {SuspenseConfig} from 'react-reconciler/src/ReactFiberSuspenseConfig';
import type {ReactDOMListenerMap} from 'shared/ReactDOMTypes';

import {validateContextBounds} from './ReactPartialRendererContext';

import invariant from 'shared/invariant';
import is from 'shared/objectIs';

type BasicStateAction<S> = (S => S) | S;
type Dispatch<A> = A => void;

type Update<A> = {|
  action: A,
  next: Update<A> | null,
|};

type UpdateQueue<A> = {|
  last: Update<A> | null,
  dispatch: any,
|};

type Hook = {|
  memoizedState: any,
  queue: UpdateQueue<any> | null,
  next: Hook | null,
|};

const RE_RENDER_LIMIT = 25;

function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  // $FlowFixMe: Flow doesn't like mixed types
  return typeof action === 'function' ? action(state) : action;
}

export function useReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  const reactPartialRendererHooks = new ReactDOMServerRendererHooks();
  return reactPartialRendererHooks.useReducer(reducer, initialArg, init);
}

export function useState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  const reactPartialRendererHooks = new ReactDOMServerRendererHooks();
  if (__DEV__) {
    reactPartialRendererHooks.currentHookNameInDev = 'useState';
  }
  return reactPartialRendererHooks.useReducer(
    basicStateReducer,
    // useReducer has a special case to support lazy useState initializers
    (initialState: any),
  );
}

export function useLayoutEffect(
  create: () => (() => void) | void,
  inputs: Array<mixed> | void | null,
) {
  const reactPartialRendererHooks = new ReactDOMServerRendererHooks();
  return reactPartialRendererHooks.useLayoutEffect(create, inputs);
}

export function useCallback<T>(
  callback: T,
  deps: Array<mixed> | void | null,
): T {
  // Callbacks are passed as they are in the server environment.
  return callback;
}

function useResponder(responder, props): ReactEventResponderListener<any, any> {
  return {
    props,
    responder,
  };
}

function useEvent(event: any): ReactDOMListenerMap {
  return {
    clear: noop,
    setListener: noop,
  };
}

function noop(): void {}

export class ReactDOMServerRendererHooks {
  currentlyRenderingComponent: Object | null;
  firstWorkInProgressHook: Hook | null;
  workInProgressHook: Hook | null;
  // Whether the work-in-progress hook is a re-rendered hook
  isReRender: boolean;
  // Whether an update was scheduled during the currently executing render pass.
  didScheduleRenderPhaseUpdate: boolean;
  // Lazily created map of render-phase updates
  renderPhaseUpdates: Map<UpdateQueue<any>, Update<any>> | null;
  // Counter to prevent infinite loops.
  numberOfReRenders: number;

  isInHookUserCodeInDev: boolean;

  // In DEV, this is the name of the currently executing primitive hook
  currentHookNameInDev: ?string;

  currentThreadID: ThreadID;

  Dispatcher: DispatcherType;

  constructor() {
    this.currentlyRenderingComponent = null;
    this.firstWorkInProgressHook = null;
    this.workInProgressHook = null;
    // Whether the work-in-progress hook is a re-rendered hook
    this.isReRender = false;
    // Whether an update was scheduled during the currently executing render pass.
    this.didScheduleRenderPhaseUpdate = false;
    // Lazily created map of render-phase updates
    this.renderPhaseUpdates = null;
    // Counter to prevent infinite loops.
    this.numberOfReRenders = 0;

    this.isInHookUserCodeInDev = false;

    this.currentThreadID = 0;

    const self = this;
    this.Dispatcher = {
      readContext: self.readContext.bind(self),
      useContext: self.useContext.bind(self),
      useMemo: self.useMemo.bind(self),
      useReducer: self.useReducer.bind(self),
      useRef: self.useRef.bind(self),
      useState: self.useState.bind(self),
      useLayoutEffect: self.useLayoutEffect.bind(self),
      useCallback,
      // useImperativeHandle is not run in the server environment
      useImperativeHandle: noop,
      // Effects are not run in the server environment.
      useEffect: noop,
      // Debugging effect
      useDebugValue: noop,
      useResponder,
      useDeferredValue: self.useDeferredValue.bind(self),
      useTransition: self.useTransition.bind(self),
      useEvent,
      // Subscriptions are not setup in a server environment.
      useMutableSource: self.useMutableSource.bind(self),
    };
  }

  prepareToUseHooks(componentIdentity: Object): void {
    this.currentlyRenderingComponent = componentIdentity;
    if (__DEV__) {
      this.isInHookUserCodeInDev = false;
    }

    // The following should have already been reset
    // didScheduleRenderPhaseUpdate = false;
    // firstWorkInProgressHook = null;
    // numberOfReRenders = 0;
    // renderPhaseUpdates = null;
    // workInProgressHook = null;
  }

  finishHooks(
    Component: any,
    props: any,
    children: any,
    refOrContext: any,
  ): any {
    // This must be called after every function component to prevent hooks from
    // being used in classes.

    while (this.didScheduleRenderPhaseUpdate) {
      // Updates were scheduled during the render phase. They are stored in
      // the `renderPhaseUpdates` map. Call the component again, reusing the
      // work-in-progress hooks and applying the additional updates on top. Keep
      // restarting until no more updates are scheduled.
      this.didScheduleRenderPhaseUpdate = false;
      this.numberOfReRenders += 1;

      // Start over from the beginning of the list
      this.workInProgressHook = null;

      children = Component(props, refOrContext);
    }
    this.currentlyRenderingComponent = null;
    this.firstWorkInProgressHook = null;
    this.numberOfReRenders = 0;
    this.renderPhaseUpdates = null;
    this.workInProgressHook = null;
    if (__DEV__) {
      this.isInHookUserCodeInDev = false;
    }

    // These were reset above
    // currentlyRenderingComponent = null;
    // didScheduleRenderPhaseUpdate = false;
    // firstWorkInProgressHook = null;
    // numberOfReRenders = 0;
    // renderPhaseUpdates = null;
    // workInProgressHook = null;

    return children;
  }

  setCurrentThreadID(threadID: ThreadID) {
    this.currentThreadID = threadID;
  }

  createHook(): Hook {
    if (this.numberOfReRenders > 0) {
      invariant(false, 'Rendered more hooks than during the previous render');
    }
    return {
      memoizedState: null,
      queue: null,
      next: null,
    };
  }

  readContext<T>(
    context: ReactContext<T>,
    observedBits: void | number | boolean,
  ): T {
    let threadID = this.currentThreadID;
    validateContextBounds(context, threadID);
    if (__DEV__) {
      if (this.isInHookUserCodeInDev) {
        console.error(
          'Context can only be read while React is rendering. ' +
            'In classes, you can read it in the render method or getDerivedStateFromProps. ' +
            'In function components, you can read it directly in the function body, but not ' +
            'inside Hooks like useReducer() or useMemo().',
        );
      }
    }
    return context[threadID];
  }

  useContext<T>(
    context: ReactContext<T>,
    observedBits: void | number | boolean,
  ): T {
    if (__DEV__) {
      this.currentHookNameInDev = 'useContext';
    }
    this.resolveCurrentlyRenderingComponent();
    let threadID = this.currentThreadID;
    validateContextBounds(context, threadID);
    return context[threadID];
  }

  resolveCurrentlyRenderingComponent(): Object {
    invariant(
      this.currentlyRenderingComponent !== null,
      'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
        ' one of the following reasons:\n' +
        '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
        '2. You might be breaking the Rules of Hooks\n' +
        '3. You might have more than one copy of React in the same app\n' +
        'See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.',
    );
    if (__DEV__) {
      if (this.isInHookUserCodeInDev) {
        console.error(
          'Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. ' +
            'You can only call Hooks at the top level of your React function. ' +
            'For more information, see ' +
            'https://fb.me/rules-of-hooks',
        );
      }
    }
    return this.currentlyRenderingComponent;
  }

  useMemo<T>(nextCreate: () => T, deps: Array<mixed> | void | null): T {
    this.currentlyRenderingComponent = this.resolveCurrentlyRenderingComponent();
    this.workInProgressHook = this.createWorkInProgressHook();

    const nextDeps = deps === undefined ? null : deps;

    if (this.workInProgressHook !== null) {
      const prevState = this.workInProgressHook.memoizedState;
      if (prevState !== null) {
        if (nextDeps !== null) {
          const prevDeps = prevState[1];
          if (this.areHookInputsEqual(nextDeps, prevDeps)) {
            return prevState[0];
          }
        }
      }
    }

    if (__DEV__) {
      this.isInHookUserCodeInDev = true;
    }
    const nextValue = nextCreate();
    if (__DEV__) {
      this.isInHookUserCodeInDev = false;
    }
    if (this.workInProgressHook)
      this.workInProgressHook.memoizedState = [nextValue, nextDeps];
    return nextValue;
  }

  areHookInputsEqual(nextDeps: Array<mixed>, prevDeps: Array<mixed> | null) {
    if (prevDeps === null) {
      if (__DEV__) {
        console.error(
          '%s received a final argument during this render, but not during ' +
            'the previous render. Even though the final argument is optional, ' +
            'its type cannot change between renders.',
          this.currentHookNameInDev,
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
          this.currentHookNameInDev,
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

  useReducer<S, I, A>(
    reducer: (S, A) => S,
    initialArg: I,
    init?: I => S,
  ): [S, Dispatch<A>] {
    if (__DEV__) {
      if (reducer !== basicStateReducer) {
        this.currentHookNameInDev = 'useReducer';
      }
    }
    this.currentlyRenderingComponent = this.resolveCurrentlyRenderingComponent();
    this.workInProgressHook = this.createWorkInProgressHook();
    if (this.isReRender) {
      // This is a re-render. Apply the new render phase updates to the previous
      // current hook.
      const queue: UpdateQueue<A> = (this.workInProgressHook.queue: any);
      const dispatch: Dispatch<A> = (queue.dispatch: any);
      if (this.renderPhaseUpdates !== null) {
        // Render phase updates are stored in a map of queue -> linked list
        const firstRenderPhaseUpdate = this.renderPhaseUpdates.get(queue);
        if (firstRenderPhaseUpdate !== undefined) {
          // $FlowFixMe
          this.renderPhaseUpdates.delete(queue);
          // $FlowFixMe
          let newState = this.workInProgressHook.memoizedState;
          let update = firstRenderPhaseUpdate;
          do {
            // Process this render phase update. We don't have to check the
            // priority because it will always be the same as the current
            // render's.
            const action = update.action;
            if (__DEV__) {
              this.isInHookUserCodeInDev = true;
            }
            newState = reducer(newState, action);
            if (__DEV__) {
              this.isInHookUserCodeInDev = false;
            }
            update = update.next;
          } while (update !== null);

          // $FlowFixMe
          this.workInProgressHook.memoizedState = newState;

          return [newState, dispatch];
        }
      }
      // $FlowFixMe
      return [this.workInProgressHook.memoizedState, dispatch];
    } else {
      if (__DEV__) {
        this.isInHookUserCodeInDev = true;
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
        this.isInHookUserCodeInDev = false;
      }
      this.workInProgressHook.memoizedState = initialState;
      const queue: UpdateQueue<A> = (this.workInProgressHook.queue = {
        last: null,
        dispatch: null,
      });
      const dispatch: Dispatch<A> = (queue.dispatch = (this.dispatchAction.bind(
        this,
        this.currentlyRenderingComponent,
        queue,
      ): any));
      // $FlowFixMe
      return [this.workInProgressHook.memoizedState, dispatch];
    }
  }

  useRef<T>(initialValue: T): {|current: T|} {
    this.currentlyRenderingComponent = this.resolveCurrentlyRenderingComponent();
    this.workInProgressHook = this.createWorkInProgressHook();
    const previousRef = this.workInProgressHook.memoizedState;
    if (previousRef === null) {
      const ref = {current: initialValue};
      if (__DEV__) {
        Object.seal(ref);
      }
      this.workInProgressHook.memoizedState = ref;
      return ref;
    } else {
      return previousRef;
    }
  }

  useState<S>(initialState: (() => S) | S): [S, Dispatch<BasicStateAction<S>>] {
    if (__DEV__) {
      this.currentHookNameInDev = 'useState';
    }
    return this.useReducer(
      basicStateReducer,
      // useReducer has a special case to support lazy useState initializers
      (initialState: any),
    );
  }

  useLayoutEffect(
    create: () => (() => void) | void,
    inputs: Array<mixed> | void | null,
  ) {
    if (__DEV__) {
      this.currentHookNameInDev = 'useLayoutEffect';
      console.error(
        'useLayoutEffect does nothing on the server, because its effect cannot ' +
          "be encoded into the server renderer's output format. This will lead " +
          'to a mismatch between the initial, non-hydrated UI and the intended ' +
          'UI. To avoid this, useLayoutEffect should only be used in ' +
          'components that render exclusively on the client. ' +
          'See https://fb.me/react-uselayouteffect-ssr for common fixes.',
      );
    }
  }

  useDeferredValue<T>(value: T, config: TimeoutConfig | null | void): T {
    this.resolveCurrentlyRenderingComponent();
    return value;
  }

  useTransition(
    config: SuspenseConfig | null | void,
  ): [(callback: () => void) => void, boolean] {
    this.resolveCurrentlyRenderingComponent();
    const startTransition = callback => {
      callback();
    };
    return [startTransition, false];
  }

  // TODO Decide on how to implement this hook for server rendering.
  // If a mutation occurs during render, consider triggering a Suspense boundary
  // and falling back to client rendering.
  useMutableSource<Source, Snapshot>(
    source: MutableSource<Source>,
    getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
    subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
  ): Snapshot {
    this.resolveCurrentlyRenderingComponent();
    return getSnapshot(source._source);
  }

  createWorkInProgressHook(): Hook {
    if (this.workInProgressHook === null) {
      // This is the first hook in the list
      if (this.firstWorkInProgressHook === null) {
        this.isReRender = false;
        this.firstWorkInProgressHook = this.workInProgressHook = this.createHook();
      } else {
        // There's already a work-in-progress. Reuse it.
        this.isReRender = true;
        this.workInProgressHook = this.firstWorkInProgressHook;
      }
    } else {
      if (this.workInProgressHook.next === null) {
        this.isReRender = false;
        // Append to the end of the list
        // $FlowFixMe
        this.workInProgressHook = this.workInProgressHook.next = this.createHook();
      } else {
        // There's already a work-in-progress. Reuse it.
        this.isReRender = true;
        this.workInProgressHook = this.workInProgressHook.next;
      }
    }
    return this.workInProgressHook;
  }

  dispatchAction<A>(
    componentIdentity: Object,
    queue: UpdateQueue<A>,
    action: A,
  ) {
    invariant(
      this.numberOfReRenders < RE_RENDER_LIMIT,
      'Too many re-renders. React limits the number of renders to prevent ' +
        'an infinite loop.',
    );

    if (componentIdentity === this.currentlyRenderingComponent) {
      // This is a render phase update. Stash it in a lazily-created map of
      // queue -> linked list of updates. After this render pass, we'll restart
      // and apply the stashed updates on top of the work-in-progress hook.
      this.didScheduleRenderPhaseUpdate = true;
      const update: Update<A> = {
        action,
        next: null,
      };
      if (this.renderPhaseUpdates === null) {
        this.renderPhaseUpdates = new Map();
      }
      const firstRenderPhaseUpdate = this.renderPhaseUpdates.get(queue);
      if (firstRenderPhaseUpdate === undefined) {
        // $FlowFixMe
        this.renderPhaseUpdates.set(queue, update);
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
}
