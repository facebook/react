/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {isForwardRef, isMemo, ForwardRef} from 'react-is';
import describeComponentFrame from 'shared/describeComponentFrame';
import getComponentName from 'shared/getComponentName';
import shallowEqual from 'shared/shallowEqual';
import invariant from 'shared/invariant';
import checkPropTypes from 'prop-types/checkPropTypes';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import warning from 'shared/warning';
import is from 'shared/objectIs';

import type {Dispatcher as DispatcherType} from 'react-reconciler/src/ReactFiberHooks';
import type {ReactContext} from 'shared/ReactTypes';
import type {ReactElement} from 'shared/ReactElementType';

type BasicStateAction<S> = (S => S) | S;
type Dispatch<A> = A => void;

type Update<A> = {
  action: A,
  next: Update<A> | null,
};

type UpdateQueue<A> = {
  first: Update<A> | null,
  dispatch: any,
};

type Hook = {
  memoizedState: any,
  queue: UpdateQueue<any> | null,
  next: Hook | null,
};

const {ReactCurrentDispatcher} = ReactSharedInternals;

const RE_RENDER_LIMIT = 25;

const emptyObject = {};
if (__DEV__) {
  Object.freeze(emptyObject);
}

// In DEV, this is the name of the currently executing primitive hook
let currentHookNameInDev: ?string;

function areHookInputsEqual(
  nextDeps: Array<mixed>,
  prevDeps: Array<mixed> | null,
) {
  if (prevDeps === null) {
    warning(
      false,
      '%s received a final argument during this render, but not during ' +
        'the previous render. Even though the final argument is optional, ' +
        'its type cannot change between renders.',
      currentHookNameInDev,
    );
    return false;
  }

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
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}

class Updater {
  constructor(renderer) {
    this._renderer = renderer;
    this._callbacks = [];
  }

  _renderer: ReactShallowRenderer;
  _callbacks: Array<any>;

  _enqueueCallback(callback, publicInstance) {
    if (typeof callback === 'function' && publicInstance) {
      this._callbacks.push({
        callback,
        publicInstance,
      });
    }
  }

  _invokeCallbacks() {
    const callbacks = this._callbacks;
    this._callbacks = [];

    callbacks.forEach(({callback, publicInstance}) => {
      callback.call(publicInstance);
    });
  }

  isMounted(publicInstance) {
    return !!this._renderer._element;
  }

  enqueueForceUpdate(publicInstance, callback, callerName) {
    this._enqueueCallback(callback, publicInstance);
    this._renderer._forcedUpdate = true;
    this._renderer.render(this._renderer._element, this._renderer._context);
  }

  enqueueReplaceState(publicInstance, completeState, callback, callerName) {
    this._enqueueCallback(callback, publicInstance);
    this._renderer._newState = completeState;
    this._renderer.render(this._renderer._element, this._renderer._context);
  }

  enqueueSetState(publicInstance, partialState, callback, callerName) {
    this._enqueueCallback(callback, publicInstance);
    const currentState = this._renderer._newState || publicInstance.state;

    if (typeof partialState === 'function') {
      partialState = partialState.call(
        publicInstance,
        currentState,
        publicInstance.props,
      );
    }

    // Null and undefined are treated as no-ops.
    if (partialState === null || partialState === undefined) {
      return;
    }

    this._renderer._newState = {
      ...currentState,
      ...partialState,
    };

    this._renderer.render(this._renderer._element, this._renderer._context);
  }
}

function createHook(): Hook {
  return {
    memoizedState: null,
    queue: null,
    next: null,
  };
}

function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  return typeof action === 'function' ? action(state) : action;
}

class ReactShallowRenderer {
  static createRenderer = function() {
    return new ReactShallowRenderer();
  };

  constructor() {
    this._reset();
  }

  _reset() {
    this._context = null;
    this._element = null;
    this._instance = null;
    this._newState = null;
    this._rendered = null;
    this._rendering = false;
    this._forcedUpdate = false;
    this._updater = new Updater(this);
    this._dispatcher = this._createDispatcher();
    this._workInProgressHook = null;
    this._firstWorkInProgressHook = null;
    this._isReRender = false;
    this._didScheduleRenderPhaseUpdate = false;
    this._renderPhaseUpdates = null;
    this._numberOfReRenders = 0;
  }

  _context: null | Object;
  _newState: null | Object;
  _instance: any;
  _element: null | ReactElement;
  _rendered: null | mixed;
  _updater: Updater;
  _rendering: boolean;
  _forcedUpdate: boolean;
  _dispatcher: DispatcherType;
  _workInProgressHook: null | Hook;
  _firstWorkInProgressHook: null | Hook;
  _renderPhaseUpdates: Map<UpdateQueue<any>, Update<any>> | null;
  _isReRender: boolean;
  _didScheduleRenderPhaseUpdate: boolean;
  _numberOfReRenders: number;

  _validateCurrentlyRenderingComponent() {
    invariant(
      this._rendering && !this._instance,
      'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
        ' one of the following reasons:\n' +
        '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
        '2. You might be breaking the Rules of Hooks\n' +
        '3. You might have more than one copy of React in the same app\n' +
        'See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.',
    );
  }

  _createDispatcher(): DispatcherType {
    const useReducer = <S, I, A>(
      reducer: (S, A) => S,
      initialArg: I,
      init?: I => S,
    ): [S, Dispatch<A>] => {
      this._validateCurrentlyRenderingComponent();
      this._createWorkInProgressHook();
      const workInProgressHook: Hook = (this._workInProgressHook: any);

      if (this._isReRender) {
        // This is a re-render.
        const queue: UpdateQueue<A> = (workInProgressHook.queue: any);
        const dispatch: Dispatch<A> = (queue.dispatch: any);
        if (this._numberOfReRenders > 0) {
          // Apply the new render phase updates to the previous current hook.
          if (this._renderPhaseUpdates !== null) {
            // Render phase updates are stored in a map of queue -> linked list
            const firstRenderPhaseUpdate = this._renderPhaseUpdates.get(queue);
            if (firstRenderPhaseUpdate !== undefined) {
              (this._renderPhaseUpdates: any).delete(queue);
              let newState = workInProgressHook.memoizedState;
              let update = firstRenderPhaseUpdate;
              do {
                const action = update.action;
                newState = reducer(newState, action);
                update = update.next;
              } while (update !== null);
              workInProgressHook.memoizedState = newState;
              return [newState, dispatch];
            }
          }
          return [workInProgressHook.memoizedState, dispatch];
        }
        // Process updates outside of render
        let newState = workInProgressHook.memoizedState;
        let update = queue.first;
        if (update !== null) {
          do {
            const action = update.action;
            newState = reducer(newState, action);
            update = update.next;
          } while (update !== null);
          queue.first = null;
          workInProgressHook.memoizedState = newState;
        }
        return [newState, dispatch];
      } else {
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
        workInProgressHook.memoizedState = initialState;
        const queue: UpdateQueue<A> = (workInProgressHook.queue = {
          first: null,
          dispatch: null,
        });
        const dispatch: Dispatch<
          A,
        > = (queue.dispatch = (this._dispatchAction.bind(this, queue): any));
        return [workInProgressHook.memoizedState, dispatch];
      }
    };

    const useState = <S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] => {
      return useReducer(
        basicStateReducer,
        // useReducer has a special case to support lazy useState initializers
        (initialState: any),
      );
    };

    const useMemo = <T>(
      nextCreate: () => T,
      deps: Array<mixed> | void | null,
    ): T => {
      this._validateCurrentlyRenderingComponent();
      this._createWorkInProgressHook();

      const nextDeps = deps !== undefined ? deps : null;

      if (
        this._workInProgressHook !== null &&
        this._workInProgressHook.memoizedState !== null
      ) {
        const prevState = this._workInProgressHook.memoizedState;
        const prevDeps = prevState[1];
        if (nextDeps !== null) {
          if (areHookInputsEqual(nextDeps, prevDeps)) {
            return prevState[0];
          }
        }
      }

      const nextValue = nextCreate();
      (this._workInProgressHook: any).memoizedState = [nextValue, nextDeps];
      return nextValue;
    };

    const useRef = <T>(initialValue: T): {current: T} => {
      this._validateCurrentlyRenderingComponent();
      this._createWorkInProgressHook();
      const previousRef = (this._workInProgressHook: any).memoizedState;
      if (previousRef === null) {
        const ref = {current: initialValue};
        if (__DEV__) {
          Object.seal(ref);
        }
        (this._workInProgressHook: any).memoizedState = ref;
        return ref;
      } else {
        return previousRef;
      }
    };

    const readContext = <T>(
      context: ReactContext<T>,
      observedBits: void | number | boolean,
    ): T => {
      return context._currentValue;
    };

    const noOp = () => {
      this._validateCurrentlyRenderingComponent();
    };

    const identity = (fn: Function): Function => {
      return fn;
    };

    return {
      readContext,
      useCallback: (identity: any),
      useContext: <T>(context: ReactContext<T>): T => {
        this._validateCurrentlyRenderingComponent();
        return readContext(context);
      },
      useDebugValue: noOp,
      useEffect: noOp,
      useImperativeHandle: noOp,
      useLayoutEffect: noOp,
      useMemo,
      useReducer,
      useRef,
      useState,
      useListener: noOp,
    };
  }

  _dispatchAction<A>(queue: UpdateQueue<A>, action: A) {
    invariant(
      this._numberOfReRenders < RE_RENDER_LIMIT,
      'Too many re-renders. React limits the number of renders to prevent ' +
        'an infinite loop.',
    );

    if (this._rendering) {
      // This is a render phase update. Stash it in a lazily-created map of
      // queue -> linked list of updates. After this render pass, we'll restart
      // and apply the stashed updates on top of the work-in-progress hook.
      this._didScheduleRenderPhaseUpdate = true;
      const update: Update<A> = {
        action,
        next: null,
      };
      let renderPhaseUpdates = this._renderPhaseUpdates;
      if (renderPhaseUpdates === null) {
        this._renderPhaseUpdates = renderPhaseUpdates = new Map();
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
      const update: Update<A> = {
        action,
        next: null,
      };

      // Append the update to the end of the list.
      let last = queue.first;
      if (last === null) {
        queue.first = update;
      } else {
        while (last.next !== null) {
          last = last.next;
        }
        last.next = update;
      }

      // Re-render now.
      this.render(this._element, this._context);
    }
  }

  _createWorkInProgressHook(): Hook {
    if (this._workInProgressHook === null) {
      // This is the first hook in the list
      if (this._firstWorkInProgressHook === null) {
        this._isReRender = false;
        this._firstWorkInProgressHook = this._workInProgressHook = createHook();
      } else {
        // There's already a work-in-progress. Reuse it.
        this._isReRender = true;
        this._workInProgressHook = this._firstWorkInProgressHook;
      }
    } else {
      if (this._workInProgressHook.next === null) {
        this._isReRender = false;
        // Append to the end of the list
        this._workInProgressHook = (this
          ._workInProgressHook: any).next = createHook();
      } else {
        // There's already a work-in-progress. Reuse it.
        this._isReRender = true;
        this._workInProgressHook = this._workInProgressHook.next;
      }
    }
    return this._workInProgressHook;
  }

  _finishHooks(element: ReactElement, context: null | Object) {
    if (this._didScheduleRenderPhaseUpdate) {
      // Updates were scheduled during the render phase. They are stored in
      // the `renderPhaseUpdates` map. Call the component again, reusing the
      // work-in-progress hooks and applying the additional updates on top. Keep
      // restarting until no more updates are scheduled.
      this._didScheduleRenderPhaseUpdate = false;
      this._numberOfReRenders += 1;

      // Start over from the beginning of the list
      this._workInProgressHook = null;
      this._rendering = false;
      this.render(element, context);
    } else {
      this._workInProgressHook = null;
      this._renderPhaseUpdates = null;
      this._numberOfReRenders = 0;
    }
  }

  getMountedInstance() {
    return this._instance;
  }

  getRenderOutput() {
    return this._rendered;
  }

  render(element: ReactElement | null, context: null | Object = emptyObject) {
    invariant(
      React.isValidElement(element),
      'ReactShallowRenderer render(): Invalid component element.%s',
      typeof element === 'function'
        ? ' Instead of passing a component class, make sure to instantiate ' +
          'it by passing it to React.createElement.'
        : '',
    );
    element = ((element: any): ReactElement);
    // Show a special message for host elements since it's a common case.
    invariant(
      typeof element.type !== 'string',
      'ReactShallowRenderer render(): Shallow rendering works only with custom ' +
        'components, not primitives (%s). Instead of calling `.render(el)` and ' +
        'inspecting the rendered output, look at `el.props` directly instead.',
      element.type,
    );
    invariant(
      isForwardRef(element) ||
        (typeof element.type === 'function' || isMemo(element.type)),
      'ReactShallowRenderer render(): Shallow rendering works only with custom ' +
        'components, but the provided element type was `%s`.',
      Array.isArray(element.type)
        ? 'array'
        : element.type === null
          ? 'null'
          : typeof element.type,
    );

    if (this._rendering) {
      return;
    }
    if (this._element != null && this._element.type !== element.type) {
      this._reset();
    }

    const elementType = isMemo(element.type) ? element.type.type : element.type;
    const previousElement = this._element;

    this._rendering = true;
    this._element = element;
    this._context = getMaskedContext(elementType.contextTypes, context);

    // Inner memo component props aren't currently validated in createElement.
    if (isMemo(element.type) && elementType.propTypes) {
      currentlyValidatingElement = element;
      checkPropTypes(
        elementType.propTypes,
        element.props,
        'prop',
        getComponentName(elementType),
        getStackAddendum,
      );
    }

    if (this._instance) {
      this._updateClassComponent(elementType, element, this._context);
    } else {
      if (shouldConstruct(elementType)) {
        this._instance = new elementType(
          element.props,
          this._context,
          this._updater,
        );
        if (typeof elementType.getDerivedStateFromProps === 'function') {
          const partialState = elementType.getDerivedStateFromProps.call(
            null,
            element.props,
            this._instance.state,
          );
          if (partialState != null) {
            this._instance.state = Object.assign(
              {},
              this._instance.state,
              partialState,
            );
          }
        }

        if (elementType.contextTypes) {
          currentlyValidatingElement = element;
          checkPropTypes(
            elementType.contextTypes,
            this._context,
            'context',
            getName(elementType, this._instance),
            getStackAddendum,
          );

          currentlyValidatingElement = null;
        }

        this._mountClassComponent(elementType, element, this._context);
      } else {
        let shouldRender = true;
        if (isMemo(element.type) && previousElement !== null) {
          // This is a Memo component that is being re-rendered.
          const compare = element.type.compare || shallowEqual;
          if (compare(previousElement.props, element.props)) {
            shouldRender = false;
          }
        }
        if (shouldRender) {
          const prevDispatcher = ReactCurrentDispatcher.current;
          ReactCurrentDispatcher.current = this._dispatcher;
          try {
            // elementType could still be a ForwardRef if it was
            // nested inside Memo.
            if (elementType.$$typeof === ForwardRef) {
              invariant(
                typeof elementType.render === 'function',
                'forwardRef requires a render function but was given %s.',
                typeof elementType.render,
              );
              this._rendered = elementType.render.call(
                undefined,
                element.props,
                element.ref,
              );
            } else {
              this._rendered = elementType(element.props, this._context);
            }
          } finally {
            ReactCurrentDispatcher.current = prevDispatcher;
          }
          this._finishHooks(element, context);
        }
      }
    }

    this._rendering = false;
    this._updater._invokeCallbacks();

    return this.getRenderOutput();
  }

  unmount() {
    if (this._instance) {
      if (typeof this._instance.componentWillUnmount === 'function') {
        this._instance.componentWillUnmount();
      }
    }
    this._reset();
  }

  _mountClassComponent(
    elementType: Function,
    element: ReactElement,
    context: null | Object,
  ) {
    this._instance.context = context;
    this._instance.props = element.props;
    this._instance.state = this._instance.state || null;
    this._instance.updater = this._updater;

    if (
      typeof this._instance.UNSAFE_componentWillMount === 'function' ||
      typeof this._instance.componentWillMount === 'function'
    ) {
      const beforeState = this._newState;

      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (
        typeof elementType.getDerivedStateFromProps !== 'function' &&
        typeof this._instance.getSnapshotBeforeUpdate !== 'function'
      ) {
        if (typeof this._instance.componentWillMount === 'function') {
          this._instance.componentWillMount();
        }
        if (typeof this._instance.UNSAFE_componentWillMount === 'function') {
          this._instance.UNSAFE_componentWillMount();
        }
      }

      // setState may have been called during cWM
      if (beforeState !== this._newState) {
        this._instance.state = this._newState || emptyObject;
      }
    }

    this._rendered = this._instance.render();
    // Intentionally do not call componentDidMount()
    // because DOM refs are not available.
  }

  _updateClassComponent(
    elementType: Function,
    element: ReactElement,
    context: null | Object,
  ) {
    const {props} = element;

    const oldState = this._instance.state || emptyObject;
    const oldProps = this._instance.props;

    if (oldProps !== props) {
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (
        typeof elementType.getDerivedStateFromProps !== 'function' &&
        typeof this._instance.getSnapshotBeforeUpdate !== 'function'
      ) {
        if (typeof this._instance.componentWillReceiveProps === 'function') {
          this._instance.componentWillReceiveProps(props, context);
        }
        if (
          typeof this._instance.UNSAFE_componentWillReceiveProps === 'function'
        ) {
          this._instance.UNSAFE_componentWillReceiveProps(props, context);
        }
      }
    }

    // Read state after cWRP in case it calls setState
    let state = this._newState || oldState;
    if (typeof elementType.getDerivedStateFromProps === 'function') {
      const partialState = elementType.getDerivedStateFromProps.call(
        null,
        props,
        state,
      );
      if (partialState != null) {
        state = Object.assign({}, state, partialState);
      }
    }

    let shouldUpdate = true;
    if (this._forcedUpdate) {
      shouldUpdate = true;
      this._forcedUpdate = false;
    } else if (typeof this._instance.shouldComponentUpdate === 'function') {
      shouldUpdate = !!this._instance.shouldComponentUpdate(
        props,
        state,
        context,
      );
    } else if (
      elementType.prototype &&
      elementType.prototype.isPureReactComponent
    ) {
      shouldUpdate =
        !shallowEqual(oldProps, props) || !shallowEqual(oldState, state);
    }

    if (shouldUpdate) {
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (
        typeof elementType.getDerivedStateFromProps !== 'function' &&
        typeof this._instance.getSnapshotBeforeUpdate !== 'function'
      ) {
        if (typeof this._instance.componentWillUpdate === 'function') {
          this._instance.componentWillUpdate(props, state, context);
        }
        if (typeof this._instance.UNSAFE_componentWillUpdate === 'function') {
          this._instance.UNSAFE_componentWillUpdate(props, state, context);
        }
      }
    }

    this._instance.context = context;
    this._instance.props = props;
    this._instance.state = state;
    this._newState = null;

    if (shouldUpdate) {
      this._rendered = this._instance.render();
    }
    // Intentionally do not call componentDidUpdate()
    // because DOM refs are not available.
  }
}

let currentlyValidatingElement = null;

function getDisplayName(element) {
  if (element == null) {
    return '#empty';
  } else if (typeof element === 'string' || typeof element === 'number') {
    return '#text';
  } else if (typeof element.type === 'string') {
    return element.type;
  } else {
    const elementType = isMemo(element.type) ? element.type.type : element.type;
    return elementType.displayName || elementType.name || 'Unknown';
  }
}

function getStackAddendum() {
  let stack = '';
  if (currentlyValidatingElement) {
    const name = getDisplayName(currentlyValidatingElement);
    const owner = currentlyValidatingElement._owner;
    stack += describeComponentFrame(
      name,
      currentlyValidatingElement._source,
      owner && getComponentName(owner.type),
    );
  }
  return stack;
}

function getName(type, instance) {
  const constructor = instance && instance.constructor;
  return (
    type.displayName ||
    (constructor && constructor.displayName) ||
    type.name ||
    (constructor && constructor.name) ||
    null
  );
}

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

function getMaskedContext(contextTypes, unmaskedContext) {
  if (!contextTypes || !unmaskedContext) {
    return emptyObject;
  }
  const context = {};
  for (let key in contextTypes) {
    context[key] = unmaskedContext[key];
  }
  return context;
}

export default ReactShallowRenderer;
