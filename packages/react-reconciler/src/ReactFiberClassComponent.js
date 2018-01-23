/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {ExpirationTime} from './ReactFiberExpirationTime';

import {Update} from 'shared/ReactTypeOfSideEffect';
import {
  debugRenderPhaseSideEffects,
  enableAsyncSubtreeAPI,
  warnAboutDeprecatedLifecycles,
} from 'shared/ReactFeatureFlags';
import ReactDebugAsyncWarnings from './ReactDebugAsyncWarnings';
import {isMounted} from 'react-reconciler/reflection';
import * as ReactInstanceMap from 'shared/ReactInstanceMap';
import emptyObject from 'fbjs/lib/emptyObject';
import getComponentName from 'shared/getComponentName';
import shallowEqual from 'fbjs/lib/shallowEqual';
import invariant from 'fbjs/lib/invariant';
import warning from 'fbjs/lib/warning';

import {startPhaseTimer, stopPhaseTimer} from './ReactDebugFiberPerf';
import {AsyncUpdates} from './ReactTypeOfInternalContext';
import {
  cacheContext,
  getMaskedContext,
  getUnmaskedContext,
  isContextConsumer,
} from './ReactFiberContext';
import {
  insertUpdateIntoFiber,
  processUpdateQueue,
} from './ReactFiberUpdateQueue';
import {hasContextChanged} from './ReactFiberContext';

const fakeInternalInstance = {};
const isArray = Array.isArray;

let didWarnAboutLegacyWillMount;
let didWarnAboutLegacyWillReceiveProps;
let didWarnAboutLegacyWillUpdate;
let didWarnAboutStateAssignmentForComponent;
let didWarnAboutUndefinedDerivedState;
let didWarnAboutUninitializedState;
let didWarnAboutWillReceivePropsAndDerivedState;
let warnOnInvalidCallback;

if (__DEV__) {
  if (warnAboutDeprecatedLifecycles) {
    didWarnAboutLegacyWillMount = {};
    didWarnAboutLegacyWillReceiveProps = {};
    didWarnAboutLegacyWillUpdate = {};
  }
  didWarnAboutStateAssignmentForComponent = {};
  didWarnAboutUndefinedDerivedState = {};
  didWarnAboutUninitializedState = {};
  didWarnAboutWillReceivePropsAndDerivedState = {};

  const didWarnOnInvalidCallback = {};

  warnOnInvalidCallback = function(callback: mixed, callerName: string) {
    if (callback === null || typeof callback === 'function') {
      return;
    }
    const key = `${callerName}_${(callback: any)}`;
    if (!didWarnOnInvalidCallback[key]) {
      warning(
        false,
        '%s(...): Expected the last optional `callback` argument to be a ' +
          'function. Instead received: %s.',
        callerName,
        callback,
      );
      didWarnOnInvalidCallback[key] = true;
    }
  };

  // This is so gross but it's at least non-critical and can be removed if
  // it causes problems. This is meant to give a nicer error message for
  // ReactDOM15.unstable_renderSubtreeIntoContainer(reactDOM16Component,
  // ...)) which otherwise throws a "_processChildContext is not a function"
  // exception.
  Object.defineProperty(fakeInternalInstance, '_processChildContext', {
    enumerable: false,
    value: function() {
      invariant(
        false,
        '_processChildContext is not available in React 16+. This likely ' +
          'means you have multiple copies of React and are attempting to nest ' +
          'a React 15 tree inside a React 16 tree using ' +
          "unstable_renderSubtreeIntoContainer, which isn't supported. Try " +
          'to make sure you have only one copy of React (and ideally, switch ' +
          'to ReactDOM.createPortal).',
      );
    },
  });
  Object.freeze(fakeInternalInstance);
}

export default function(
  scheduleWork: (fiber: Fiber, expirationTime: ExpirationTime) => void,
  computeExpirationForFiber: (fiber: Fiber) => ExpirationTime,
  memoizeProps: (workInProgress: Fiber, props: any) => void,
  memoizeState: (workInProgress: Fiber, state: any) => void,
) {
  // Class component state updater
  const updater = {
    isMounted,
    enqueueSetState(instance, partialState, callback) {
      const fiber = ReactInstanceMap.get(instance);
      callback = callback === undefined ? null : callback;
      if (__DEV__) {
        warnOnInvalidCallback(callback, 'setState');
      }
      const expirationTime = computeExpirationForFiber(fiber);
      const update = {
        expirationTime,
        partialState,
        callback,
        isReplace: false,
        isForced: false,
        nextCallback: null,
        next: null,
      };
      insertUpdateIntoFiber(fiber, update);
      scheduleWork(fiber, expirationTime);
    },
    enqueueReplaceState(instance, state, callback) {
      const fiber = ReactInstanceMap.get(instance);
      callback = callback === undefined ? null : callback;
      if (__DEV__) {
        warnOnInvalidCallback(callback, 'replaceState');
      }
      const expirationTime = computeExpirationForFiber(fiber);
      const update = {
        expirationTime,
        partialState: state,
        callback,
        isReplace: true,
        isForced: false,
        nextCallback: null,
        next: null,
      };
      insertUpdateIntoFiber(fiber, update);
      scheduleWork(fiber, expirationTime);
    },
    enqueueForceUpdate(instance, callback) {
      const fiber = ReactInstanceMap.get(instance);
      callback = callback === undefined ? null : callback;
      if (__DEV__) {
        warnOnInvalidCallback(callback, 'forceUpdate');
      }
      const expirationTime = computeExpirationForFiber(fiber);
      const update = {
        expirationTime,
        partialState: null,
        callback,
        isReplace: false,
        isForced: true,
        nextCallback: null,
        next: null,
      };
      insertUpdateIntoFiber(fiber, update);
      scheduleWork(fiber, expirationTime);
    },
  };

  function checkShouldComponentUpdate(
    workInProgress,
    oldProps,
    newProps,
    oldState,
    newState,
    newContext,
  ) {
    if (
      oldProps === null ||
      (workInProgress.updateQueue !== null &&
        workInProgress.updateQueue.hasForceUpdate)
    ) {
      // If the workInProgress already has an Update effect, return true
      return true;
    }

    const instance = workInProgress.stateNode;
    const type = workInProgress.type;
    if (typeof instance.shouldComponentUpdate === 'function') {
      startPhaseTimer(workInProgress, 'shouldComponentUpdate');
      const shouldUpdate = instance.shouldComponentUpdate(
        newProps,
        newState,
        newContext,
      );
      stopPhaseTimer();

      // Simulate an async bailout/interruption by invoking lifecycle twice.
      if (debugRenderPhaseSideEffects) {
        instance.shouldComponentUpdate(newProps, newState, newContext);
      }

      if (__DEV__) {
        warning(
          shouldUpdate !== undefined,
          '%s.shouldComponentUpdate(): Returned undefined instead of a ' +
            'boolean value. Make sure to return true or false.',
          getComponentName(workInProgress) || 'Unknown',
        );
      }

      return shouldUpdate;
    }

    if (type.prototype && type.prototype.isPureReactComponent) {
      return (
        !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState)
      );
    }

    return true;
  }

  function checkClassInstance(workInProgress: Fiber) {
    const instance = workInProgress.stateNode;
    const type = workInProgress.type;
    if (__DEV__) {
      const name = getComponentName(workInProgress);
      const renderPresent = instance.render;

      if (!renderPresent) {
        if (type.prototype && typeof type.prototype.render === 'function') {
          warning(
            false,
            '%s(...): No `render` method found on the returned component ' +
              'instance: did you accidentally return an object from the constructor?',
            name,
          );
        } else {
          warning(
            false,
            '%s(...): No `render` method found on the returned component ' +
              'instance: you may have forgotten to define `render`.',
            name,
          );
        }
      }

      const noGetInitialStateOnES6 =
        !instance.getInitialState ||
        instance.getInitialState.isReactClassApproved ||
        instance.state;
      warning(
        noGetInitialStateOnES6,
        'getInitialState was defined on %s, a plain JavaScript class. ' +
          'This is only supported for classes created using React.createClass. ' +
          'Did you mean to define a state property instead?',
        name,
      );
      const noGetDefaultPropsOnES6 =
        !instance.getDefaultProps ||
        instance.getDefaultProps.isReactClassApproved;
      warning(
        noGetDefaultPropsOnES6,
        'getDefaultProps was defined on %s, a plain JavaScript class. ' +
          'This is only supported for classes created using React.createClass. ' +
          'Use a static property to define defaultProps instead.',
        name,
      );
      const noInstancePropTypes = !instance.propTypes;
      warning(
        noInstancePropTypes,
        'propTypes was defined as an instance property on %s. Use a static ' +
          'property to define propTypes instead.',
        name,
      );
      const noInstanceContextTypes = !instance.contextTypes;
      warning(
        noInstanceContextTypes,
        'contextTypes was defined as an instance property on %s. Use a static ' +
          'property to define contextTypes instead.',
        name,
      );
      const noComponentShouldUpdate =
        typeof instance.componentShouldUpdate !== 'function';
      warning(
        noComponentShouldUpdate,
        '%s has a method called ' +
          'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' +
          'The name is phrased as a question because the function is ' +
          'expected to return a value.',
        name,
      );
      if (
        type.prototype &&
        type.prototype.isPureReactComponent &&
        typeof instance.shouldComponentUpdate !== 'undefined'
      ) {
        warning(
          false,
          '%s has a method called shouldComponentUpdate(). ' +
            'shouldComponentUpdate should not be used when extending React.PureComponent. ' +
            'Please extend React.Component if shouldComponentUpdate is used.',
          getComponentName(workInProgress) || 'A pure component',
        );
      }
      const noComponentDidUnmount =
        typeof instance.componentDidUnmount !== 'function';
      warning(
        noComponentDidUnmount,
        '%s has a method called ' +
          'componentDidUnmount(). But there is no such lifecycle method. ' +
          'Did you mean componentWillUnmount()?',
        name,
      );
      const noComponentDidReceiveProps =
        typeof instance.componentDidReceiveProps !== 'function';
      warning(
        noComponentDidReceiveProps,
        '%s has a method called ' +
          'componentDidReceiveProps(). But there is no such lifecycle method. ' +
          'If you meant to update the state in response to changing props, ' +
          'use componentWillReceiveProps(). If you meant to fetch data or ' +
          'run side-effects or mutations after React has updated the UI, use componentDidUpdate().',
        name,
      );
      const noComponentWillRecieveProps =
        typeof instance.componentWillRecieveProps !== 'function';
      warning(
        noComponentWillRecieveProps,
        '%s has a method called ' +
          'componentWillRecieveProps(). Did you mean componentWillReceiveProps()?',
        name,
      );
      const noUnsafeComponentWillRecieveProps =
        typeof instance.UNSAFE_componentWillRecieveProps !== 'function';
      warning(
        noUnsafeComponentWillRecieveProps,
        '%s has a method called ' +
          'UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?',
        name,
      );
      const hasMutatedProps = instance.props !== workInProgress.pendingProps;
      warning(
        instance.props === undefined || !hasMutatedProps,
        '%s(...): When calling super() in `%s`, make sure to pass ' +
          "up the same props that your component's constructor was passed.",
        name,
        name,
      );
      const noInstanceDefaultProps = !instance.defaultProps;
      warning(
        noInstanceDefaultProps,
        'Setting defaultProps as an instance property on %s is not supported and will be ignored.' +
          ' Instead, define defaultProps as a static property on %s.',
        name,
        name,
      );
    }

    const state = instance.state;
    if (state && (typeof state !== 'object' || isArray(state))) {
      warning(
        false,
        '%s.state: must be set to an object or null',
        getComponentName(workInProgress),
      );
    }
    if (typeof instance.getChildContext === 'function') {
      warning(
        typeof workInProgress.type.childContextTypes === 'object',
        '%s.getChildContext(): childContextTypes must be defined in order to ' +
          'use getChildContext().',
        getComponentName(workInProgress),
      );
    }
  }

  function resetInputPointers(workInProgress: Fiber, instance: any) {
    instance.props = workInProgress.memoizedProps;
    instance.state = workInProgress.memoizedState;
  }

  function adoptClassInstance(workInProgress: Fiber, instance: any): void {
    instance.updater = updater;
    workInProgress.stateNode = instance;
    // The instance needs access to the fiber so that it can schedule updates
    ReactInstanceMap.set(instance, workInProgress);
    if (__DEV__) {
      instance._reactInternalInstance = fakeInternalInstance;
    }
  }

  function constructClassInstance(workInProgress: Fiber, props: any): any {
    const ctor = workInProgress.type;
    const unmaskedContext = getUnmaskedContext(workInProgress);
    const needsContext = isContextConsumer(workInProgress);
    const context = needsContext
      ? getMaskedContext(workInProgress, unmaskedContext)
      : emptyObject;
    const instance = new ctor(props, context);
    const state =
      instance.state !== null && instance.state !== undefined
        ? instance.state
        : null;
    adoptClassInstance(workInProgress, instance);

    if (__DEV__) {
      if (
        typeof ctor.getDerivedStateFromProps === 'function' &&
        state === null
      ) {
        const componentName = getComponentName(workInProgress) || 'Unknown';
        if (!didWarnAboutUninitializedState[componentName]) {
          warning(
            false,
            '%s: Did not properly initialize state during construction. ' +
              'Expected state to be an object, but it was %s.',
            componentName,
            instance.state === null ? 'null' : 'undefined',
          );
          didWarnAboutUninitializedState[componentName] = true;
        }
      }
    }

    workInProgress.memoizedState = state;

    const partialState = callGetDerivedStateFromProps(
      workInProgress,
      instance,
      props,
    );

    if (partialState !== null && partialState !== undefined) {
      // Render-phase updates (like this) should not be added to the update queue,
      // So that multiple render passes do not enqueue multiple updates.
      // Instead, just synchronously merge the returned state into the instance.
      workInProgress.memoizedState = Object.assign(
        {},
        workInProgress.memoizedState,
        partialState,
      );
    }

    // Cache unmasked context so we can avoid recreating masked context unless necessary.
    // ReactFiberContext usually updates this cache but can't for newly-created instances.
    if (needsContext) {
      cacheContext(workInProgress, unmaskedContext, context);
    }

    return instance;
  }

  function callComponentWillMount(workInProgress, instance) {
    startPhaseTimer(workInProgress, 'componentWillMount');
    const oldState = instance.state;

    if (typeof instance.componentWillMount === 'function') {
      if (__DEV__) {
        if (warnAboutDeprecatedLifecycles) {
          const componentName = getComponentName(workInProgress) || 'Component';
          if (!didWarnAboutLegacyWillMount[componentName]) {
            warning(
              false,
              '%s: componentWillMount() is deprecated and will be ' +
                'removed in the next major version. Read about the motivations ' +
                'behind this change: ' +
                'https://fb.me/react-async-component-lifecycle-hooks' +
                '\n\n' +
                'As a temporary workaround, you can rename to ' +
                'UNSAFE_componentWillMount instead.',
              componentName,
            );
            didWarnAboutLegacyWillMount[componentName] = true;
          }
        }
      }
      instance.componentWillMount();
    } else {
      instance.UNSAFE_componentWillMount();
    }

    stopPhaseTimer();

    if (oldState !== instance.state) {
      if (__DEV__) {
        warning(
          false,
          '%s.componentWillMount(): Assigning directly to this.state is ' +
            "deprecated (except inside a component's " +
            'constructor). Use setState instead.',
          getComponentName(workInProgress),
        );
      }
      updater.enqueueReplaceState(instance, instance.state, null);
    }
  }

  function callComponentWillReceiveProps(
    workInProgress,
    instance,
    newProps,
    newContext,
  ) {
    const oldState = instance.state;
    if (typeof instance.componentWillReceiveProps === 'function') {
      if (__DEV__) {
        if (warnAboutDeprecatedLifecycles) {
          const componentName = getComponentName(workInProgress) || 'Component';
          if (!didWarnAboutLegacyWillReceiveProps[componentName]) {
            warning(
              false,
              '%s: componentWillReceiveProps() is deprecated and ' +
                'will be removed in the next major version. Use ' +
                'static getDerivedStateFromProps() instead. Read about the ' +
                'motivations behind this change: ' +
                'https://fb.me/react-async-component-lifecycle-hooks' +
                '\n\n' +
                'As a temporary workaround, you can rename to ' +
                'UNSAFE_componentWillReceiveProps instead.',
              componentName,
            );
            didWarnAboutLegacyWillReceiveProps[componentName] = true;
          }
        }
      }

      startPhaseTimer(workInProgress, 'componentWillReceiveProps');
      instance.componentWillReceiveProps(newProps, newContext);
      stopPhaseTimer();
    } else {
      startPhaseTimer(workInProgress, 'componentWillReceiveProps');
      instance.UNSAFE_componentWillReceiveProps(newProps, newContext);
      stopPhaseTimer();

      // Simulate an async bailout/interruption by invoking lifecycle twice.
      if (debugRenderPhaseSideEffects) {
        instance.UNSAFE_componentWillReceiveProps(newProps, newContext);
      }
    }

    if (instance.state !== oldState) {
      if (__DEV__) {
        const componentName = getComponentName(workInProgress) || 'Component';
        if (!didWarnAboutStateAssignmentForComponent[componentName]) {
          warning(
            false,
            '%s.componentWillReceiveProps(): Assigning directly to ' +
              "this.state is deprecated (except inside a component's " +
              'constructor). Use setState instead.',
            componentName,
          );
          didWarnAboutStateAssignmentForComponent[componentName] = true;
        }
      }
      updater.enqueueReplaceState(instance, instance.state, null);
    }
  }

  function callGetDerivedStateFromProps(
    workInProgress: Fiber,
    instance: any,
    props: any,
  ) {
    const {type} = workInProgress;

    if (typeof type.getDerivedStateFromProps === 'function') {
      if (__DEV__) {
        if (
          typeof instance.componentWillReceiveProps === 'function' ||
          typeof instance.UNSAFE_componentWillReceiveProps === 'function'
        ) {
          const componentName = getComponentName(workInProgress) || 'Unknown';
          if (!didWarnAboutWillReceivePropsAndDerivedState[componentName]) {
            warning(
              false,
              '%s: Defines both componentWillReceiveProps() and static ' +
                'getDerivedStateFromProps() methods. We recommend using ' +
                'only getDerivedStateFromProps().',
              componentName,
            );
            didWarnAboutWillReceivePropsAndDerivedState[componentName] = true;
          }
        }
      }

      const partialState = type.getDerivedStateFromProps.call(
        null,
        props,
        workInProgress.memoizedState,
      );

      if (__DEV__) {
        if (partialState === undefined) {
          const componentName = getComponentName(workInProgress) || 'Unknown';
          if (!didWarnAboutUndefinedDerivedState[componentName]) {
            warning(
              false,
              '%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. ' +
                'You have returned undefined.',
              componentName,
            );
            didWarnAboutUndefinedDerivedState[componentName] = componentName;
          }
        }
      }

      return partialState;
    }
  }

  // Invokes the mount life-cycles on a previously never rendered instance.
  function mountClassInstance(
    workInProgress: Fiber,
    renderExpirationTime: ExpirationTime,
  ): void {
    const current = workInProgress.alternate;

    if (__DEV__) {
      checkClassInstance(workInProgress);
    }

    const instance = workInProgress.stateNode;
    const props = workInProgress.pendingProps;
    const unmaskedContext = getUnmaskedContext(workInProgress);

    instance.props = props;
    instance.state = workInProgress.memoizedState;
    instance.refs = emptyObject;
    instance.context = getMaskedContext(workInProgress, unmaskedContext);

    if (
      enableAsyncSubtreeAPI &&
      workInProgress.type != null &&
      workInProgress.type.prototype != null &&
      workInProgress.type.prototype.unstable_isAsyncReactComponent === true
    ) {
      workInProgress.internalContextTag |= AsyncUpdates;
    }

    if (__DEV__) {
      // If we're inside of an async sub-tree,
      // Warn about any unsafe lifecycles on this class component.
      if (workInProgress.internalContextTag & AsyncUpdates) {
        ReactDebugAsyncWarnings.recordLifecycleWarnings(
          workInProgress,
          instance,
        );
      }
    }

    if (
      typeof instance.UNSAFE_componentWillMount === 'function' ||
      typeof instance.componentWillMount === 'function'
    ) {
      callComponentWillMount(workInProgress, instance);
      // If we had additional state updates during this life-cycle, let's
      // process them now.
      const updateQueue = workInProgress.updateQueue;
      if (updateQueue !== null) {
        instance.state = processUpdateQueue(
          current,
          workInProgress,
          updateQueue,
          instance,
          props,
          renderExpirationTime,
        );
      }
    }
    if (typeof instance.componentDidMount === 'function') {
      workInProgress.effectTag |= Update;
    }
  }

  // Called on a preexisting class instance. Returns false if a resumed render
  // could be reused.
  // function resumeMountClassInstance(
  //   workInProgress: Fiber,
  //   priorityLevel: PriorityLevel,
  // ): boolean {
  //   const instance = workInProgress.stateNode;
  //   resetInputPointers(workInProgress, instance);

  //   let newState = workInProgress.memoizedState;
  //   let newProps = workInProgress.pendingProps;
  //   if (!newProps) {
  //     // If there isn't any new props, then we'll reuse the memoized props.
  //     // This could be from already completed work.
  //     newProps = workInProgress.memoizedProps;
  //     invariant(
  //       newProps != null,
  //       'There should always be pending or memoized props. This error is ' +
  //         'likely caused by a bug in React. Please file an issue.',
  //     );
  //   }
  //   const newUnmaskedContext = getUnmaskedContext(workInProgress);
  //   const newContext = getMaskedContext(workInProgress, newUnmaskedContext);

  //   const oldContext = instance.context;
  //   const oldProps = workInProgress.memoizedProps;

  //   if (
  //     typeof instance.componentWillReceiveProps === 'function' &&
  //     (oldProps !== newProps || oldContext !== newContext)
  //   ) {
  //     callComponentWillReceiveProps(
  //       workInProgress,
  //       instance,
  //       newProps,
  //       newContext,
  //     );
  //   }

  //   // Process the update queue before calling shouldComponentUpdate
  //   const updateQueue = workInProgress.updateQueue;
  //   if (updateQueue !== null) {
  //     newState = processUpdateQueue(
  //       workInProgress,
  //       updateQueue,
  //       instance,
  //       newState,
  //       newProps,
  //       priorityLevel,
  //     );
  //   }

  //   // TODO: Should we deal with a setState that happened after the last
  //   // componentWillMount and before this componentWillMount? Probably
  //   // unsupported anyway.

  //   if (
  //     !checkShouldComponentUpdate(
  //       workInProgress,
  //       workInProgress.memoizedProps,
  //       newProps,
  //       workInProgress.memoizedState,
  //       newState,
  //       newContext,
  //     )
  //   ) {
  //     // Update the existing instance's state, props, and context pointers even
  //     // though we're bailing out.
  //     instance.props = newProps;
  //     instance.state = newState;
  //     instance.context = newContext;
  //     return false;
  //   }

  //   // Update the input pointers now so that they are correct when we call
  //   // componentWillMount
  //   instance.props = newProps;
  //   instance.state = newState;
  //   instance.context = newContext;

  //   if (typeof instance.componentWillMount === 'function') {
  //     callComponentWillMount(workInProgress, instance);
  //     // componentWillMount may have called setState. Process the update queue.
  //     const newUpdateQueue = workInProgress.updateQueue;
  //     if (newUpdateQueue !== null) {
  //       newState = processUpdateQueue(
  //         workInProgress,
  //         newUpdateQueue,
  //         instance,
  //         newState,
  //         newProps,
  //         priorityLevel,
  //       );
  //     }
  //   }

  //   if (typeof instance.componentDidMount === 'function') {
  //     workInProgress.effectTag |= Update;
  //   }

  //   instance.state = newState;

  //   return true;
  // }

  // Invokes the update life-cycles and returns false if it shouldn't rerender.
  function updateClassInstance(
    current: Fiber,
    workInProgress: Fiber,
    renderExpirationTime: ExpirationTime,
  ): boolean {
    const instance = workInProgress.stateNode;
    resetInputPointers(workInProgress, instance);

    const oldProps = workInProgress.memoizedProps;
    const newProps = workInProgress.pendingProps;
    const oldContext = instance.context;
    const newUnmaskedContext = getUnmaskedContext(workInProgress);
    const newContext = getMaskedContext(workInProgress, newUnmaskedContext);

    // Note: During these life-cycles, instance.props/instance.state are what
    // ever the previously attempted to render - not the "current". However,
    // during componentDidUpdate we pass the "current" props.

    if (
      (typeof instance.UNSAFE_componentWillReceiveProps === 'function' ||
        typeof instance.componentWillReceiveProps === 'function') &&
      (oldProps !== newProps || oldContext !== newContext)
    ) {
      callComponentWillReceiveProps(
        workInProgress,
        instance,
        newProps,
        newContext,
      );
    }

    let partialState;
    if (oldProps !== newProps) {
      partialState = callGetDerivedStateFromProps(
        workInProgress,
        instance,
        newProps,
      );
    }

    // Compute the next state using the memoized state and the update queue.
    const oldState = workInProgress.memoizedState;
    // TODO: Previous state can be null.
    let newState;
    if (workInProgress.updateQueue !== null) {
      newState = processUpdateQueue(
        current,
        workInProgress,
        workInProgress.updateQueue,
        instance,
        newProps,
        renderExpirationTime,
      );
    } else {
      newState = oldState;
    }

    if (partialState !== null && partialState !== undefined) {
      // Render-phase updates (like this) should not be added to the update queue,
      // So that multiple render passes do not enqueue multiple updates.
      // Instead, just synchronously merge the returned state into the instance.
      newState =
        newState === null || newState === undefined
          ? partialState
          : Object.assign({}, newState, partialState);
    }

    if (
      oldProps === newProps &&
      oldState === newState &&
      !hasContextChanged() &&
      !(
        workInProgress.updateQueue !== null &&
        workInProgress.updateQueue.hasForceUpdate
      )
    ) {
      // If an update was already in progress, we should schedule an Update
      // effect even though we're bailing out, so that cWU/cDU are called.
      if (typeof instance.componentDidUpdate === 'function') {
        if (
          oldProps !== current.memoizedProps ||
          oldState !== current.memoizedState
        ) {
          workInProgress.effectTag |= Update;
        }
      }
      return false;
    }

    const shouldUpdate = checkShouldComponentUpdate(
      workInProgress,
      oldProps,
      newProps,
      oldState,
      newState,
      newContext,
    );

    if (shouldUpdate) {
      if (
        typeof instance.UNSAFE_componentWillUpdate === 'function' ||
        typeof instance.componentWillUpdate === 'function'
      ) {
        if (typeof instance.componentWillUpdate === 'function') {
          if (__DEV__) {
            if (warnAboutDeprecatedLifecycles) {
              const componentName =
                getComponentName(workInProgress) || 'Component';
              if (!didWarnAboutLegacyWillUpdate[componentName]) {
                warning(
                  false,
                  '%s: componentWillUpdate() is deprecated and will be ' +
                    'removed in the next major version. Read about the motivations ' +
                    'behind this change: ' +
                    'https://fb.me/react-async-component-lifecycle-hooks' +
                    '\n\n' +
                    'As a temporary workaround, you can rename to ' +
                    'UNSAFE_componentWillUpdate instead.',
                  componentName,
                );
                didWarnAboutLegacyWillUpdate[componentName] = true;
              }
            }
          }

          startPhaseTimer(workInProgress, 'componentWillUpdate');
          instance.componentWillUpdate(newProps, newState, newContext);
          stopPhaseTimer();
        } else {
          startPhaseTimer(workInProgress, 'componentWillUpdate');
          instance.UNSAFE_componentWillUpdate(newProps, newState, newContext);
          stopPhaseTimer();

          // Simulate an async bailout/interruption by invoking lifecycle twice.
          if (debugRenderPhaseSideEffects) {
            instance.UNSAFE_componentWillUpdate(newProps, newState, newContext);
          }
        }
      }
      if (typeof instance.componentDidUpdate === 'function') {
        workInProgress.effectTag |= Update;
      }
    } else {
      // If an update was already in progress, we should schedule an Update
      // effect even though we're bailing out, so that cWU/cDU are called.
      if (typeof instance.componentDidUpdate === 'function') {
        if (
          oldProps !== current.memoizedProps ||
          oldState !== current.memoizedState
        ) {
          workInProgress.effectTag |= Update;
        }
      }

      // If shouldComponentUpdate returned false, we should still update the
      // memoized props/state to indicate that this work can be reused.
      memoizeProps(workInProgress, newProps);
      memoizeState(workInProgress, newState);
    }

    // Update the existing instance's state, props, and context pointers even
    // if shouldComponentUpdate returns false.
    instance.props = newProps;
    instance.state = newState;
    instance.context = newContext;

    return shouldUpdate;
  }

  return {
    adoptClassInstance,
    callGetDerivedStateFromProps,
    constructClassInstance,
    mountClassInstance,
    // resumeMountClassInstance,
    updateClassInstance,
  };
}
