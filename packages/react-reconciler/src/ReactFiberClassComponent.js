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
import type {LegacyContext} from './ReactFiberContext';
import type {CapturedValue} from './ReactCapturedValue';

import {Update} from 'shared/ReactTypeOfSideEffect';
import {
  enableGetDerivedStateFromCatch,
  debugRenderPhaseSideEffects,
  debugRenderPhaseSideEffectsForStrictMode,
  warnAboutDeprecatedLifecycles,
} from 'shared/ReactFeatureFlags';
import ReactStrictModeWarnings from './ReactStrictModeWarnings';
import {isMounted} from 'react-reconciler/reflection';
import * as ReactInstanceMap from 'shared/ReactInstanceMap';
import emptyObject from 'fbjs/lib/emptyObject';
import getComponentName from 'shared/getComponentName';
import shallowEqual from 'fbjs/lib/shallowEqual';
import invariant from 'fbjs/lib/invariant';
import warning from 'fbjs/lib/warning';

import {startPhaseTimer, stopPhaseTimer} from './ReactDebugFiberPerf';
import {StrictMode} from './ReactTypeOfMode';
import {
  insertUpdateIntoFiber,
  processUpdateQueue,
} from './ReactFiberUpdateQueue';

const fakeInternalInstance = {};
const isArray = Array.isArray;

let didWarnAboutStateAssignmentForComponent;
let didWarnAboutUndefinedDerivedState;
let didWarnAboutUninitializedState;
let didWarnAboutWillReceivePropsAndDerivedState;
let warnOnInvalidCallback;

if (__DEV__) {
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
function callGetDerivedStateFromCatch(ctor: any, capturedValues: Array<mixed>) {
  const resultState = {};
  for (let i = 0; i < capturedValues.length; i++) {
    const capturedValue: CapturedValue<mixed> = (capturedValues[i]: any);
    const error = capturedValue.value;
    const partialState = ctor.getDerivedStateFromCatch.call(null, error);
    if (partialState !== null && partialState !== undefined) {
      Object.assign(resultState, partialState);
    }
  }
  return resultState;
}

export default function(
  legacyContext: LegacyContext,
  scheduleWork: (fiber: Fiber, expirationTime: ExpirationTime) => void,
  computeExpirationForFiber: (fiber: Fiber) => ExpirationTime,
  memoizeProps: (workInProgress: Fiber, props: any) => void,
  memoizeState: (workInProgress: Fiber, state: any) => void,
) {
  const {
    cacheContext,
    getMaskedContext,
    getUnmaskedContext,
    isContextConsumer,
    hasContextChanged,
  } = legacyContext;

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
        capturedValue: null,
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
        capturedValue: null,
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
        capturedValue: null,
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
    const ctor = workInProgress.type;
    if (typeof instance.shouldComponentUpdate === 'function') {
      startPhaseTimer(workInProgress, 'shouldComponentUpdate');
      const shouldUpdate = instance.shouldComponentUpdate(
        newProps,
        newState,
        newContext,
      );
      stopPhaseTimer();

      if (__DEV__) {
        warning(
          shouldUpdate !== undefined,
          '%s.shouldComponentUpdate(): Returned undefined instead of a ' +
            'boolean value. Make sure to return true or false.',
          getComponentName(workInProgress) || 'Component',
        );
      }

      return shouldUpdate;
    }

    if (ctor.prototype && ctor.prototype.isPureReactComponent) {
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
      const name = getComponentName(workInProgress) || 'Component';
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
      const state = instance.state;
      if (state && (typeof state !== 'object' || isArray(state))) {
        warning(false, '%s.state: must be set to an object or null', name);
      }
      if (typeof instance.getChildContext === 'function') {
        warning(
          typeof type.childContextTypes === 'object',
          '%s.getChildContext(): childContextTypes must be defined in order to ' +
            'use getChildContext().',
          name,
        );
      }
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

    // Instantiate twice to help detect side-effects.
    if (
      debugRenderPhaseSideEffects ||
      (debugRenderPhaseSideEffectsForStrictMode &&
        workInProgress.mode & StrictMode)
    ) {
      new ctor(props, context); // eslint-disable-line no-new
    }

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
        const componentName = getComponentName(workInProgress) || 'Component';
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
      state,
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
      instance.componentWillMount();
    }
    if (typeof instance.UNSAFE_componentWillMount === 'function') {
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
          getComponentName(workInProgress) || 'Component',
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
    startPhaseTimer(workInProgress, 'componentWillReceiveProps');
    if (typeof instance.componentWillReceiveProps === 'function') {
      instance.componentWillReceiveProps(newProps, newContext);
    }
    if (typeof instance.UNSAFE_componentWillReceiveProps === 'function') {
      instance.UNSAFE_componentWillReceiveProps(newProps, newContext);
    }
    stopPhaseTimer();

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
    nextProps: any,
    prevState: any,
  ) {
    const {type} = workInProgress;

    if (typeof type.getDerivedStateFromProps === 'function') {
      if (__DEV__) {
        // Don't warn about react-lifecycles-compat polyfilled components
        if (
          (typeof instance.componentWillReceiveProps === 'function' &&
            instance.componentWillReceiveProps.__suppressDeprecationWarning !==
              true) ||
          typeof instance.UNSAFE_componentWillReceiveProps === 'function'
        ) {
          const componentName = getComponentName(workInProgress) || 'Component';
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

      if (
        debugRenderPhaseSideEffects ||
        (debugRenderPhaseSideEffectsForStrictMode &&
          workInProgress.mode & StrictMode)
      ) {
        // Invoke method an extra time to help detect side-effects.
        type.getDerivedStateFromProps.call(null, nextProps, prevState);
      }

      const partialState = type.getDerivedStateFromProps.call(
        null,
        nextProps,
        prevState,
      );

      if (__DEV__) {
        if (partialState === undefined) {
          const componentName = getComponentName(workInProgress) || 'Component';
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
    const ctor = workInProgress.type;
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

    if (__DEV__) {
      if (workInProgress.mode & StrictMode) {
        ReactStrictModeWarnings.recordUnsafeLifecycleWarnings(
          workInProgress,
          instance,
        );
      }

      if (warnAboutDeprecatedLifecycles) {
        ReactStrictModeWarnings.recordDeprecationWarnings(
          workInProgress,
          instance,
        );
      }
    }

    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
    if (
      (typeof instance.UNSAFE_componentWillMount === 'function' ||
        typeof instance.componentWillMount === 'function') &&
      typeof ctor.getDerivedStateFromProps !== 'function'
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

  function resumeMountClassInstance(
    workInProgress: Fiber,
    renderExpirationTime: ExpirationTime,
  ): boolean {
    const ctor = workInProgress.type;
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

    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
    if (
      (typeof instance.UNSAFE_componentWillReceiveProps === 'function' ||
        typeof instance.componentWillReceiveProps === 'function') &&
      typeof ctor.getDerivedStateFromProps !== 'function'
    ) {
      if (oldProps !== newProps || oldContext !== newContext) {
        callComponentWillReceiveProps(
          workInProgress,
          instance,
          newProps,
          newContext,
        );
      }
    }

    // Compute the next state using the memoized state and the update queue.
    const oldState = workInProgress.memoizedState;
    // TODO: Previous state can be null.
    let newState;
    let derivedStateFromCatch;
    if (workInProgress.updateQueue !== null) {
      newState = processUpdateQueue(
        null,
        workInProgress,
        workInProgress.updateQueue,
        instance,
        newProps,
        renderExpirationTime,
      );

      let updateQueue = workInProgress.updateQueue;
      if (
        updateQueue !== null &&
        updateQueue.capturedValues !== null &&
        (enableGetDerivedStateFromCatch &&
          typeof ctor.getDerivedStateFromCatch === 'function')
      ) {
        const capturedValues = updateQueue.capturedValues;
        // Don't remove these from the update queue yet. We need them in
        // finishClassComponent. Do the reset there.
        // TODO: This is awkward. Refactor class components.
        // updateQueue.capturedValues = null;
        derivedStateFromCatch = callGetDerivedStateFromCatch(
          ctor,
          capturedValues,
        );
      }
    } else {
      newState = oldState;
    }

    let derivedStateFromProps;
    if (oldProps !== newProps) {
      // The prevState parameter should be the partially updated state.
      // Otherwise, spreading state in return values could override updates.
      derivedStateFromProps = callGetDerivedStateFromProps(
        workInProgress,
        instance,
        newProps,
        newState,
      );
    }

    if (derivedStateFromProps !== null && derivedStateFromProps !== undefined) {
      // Render-phase updates (like this) should not be added to the update queue,
      // So that multiple render passes do not enqueue multiple updates.
      // Instead, just synchronously merge the returned state into the instance.
      newState =
        newState === null || newState === undefined
          ? derivedStateFromProps
          : Object.assign({}, newState, derivedStateFromProps);
    }
    if (derivedStateFromCatch !== null && derivedStateFromCatch !== undefined) {
      // Render-phase updates (like this) should not be added to the update queue,
      // So that multiple render passes do not enqueue multiple updates.
      // Instead, just synchronously merge the returned state into the instance.
      newState =
        newState === null || newState === undefined
          ? derivedStateFromCatch
          : Object.assign({}, newState, derivedStateFromCatch);
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
      if (typeof instance.componentDidMount === 'function') {
        workInProgress.effectTag |= Update;
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
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
      if (
        (typeof instance.UNSAFE_componentWillMount === 'function' ||
          typeof instance.componentWillMount === 'function') &&
        typeof ctor.getDerivedStateFromProps !== 'function'
      ) {
        startPhaseTimer(workInProgress, 'componentWillMount');
        if (typeof instance.componentWillMount === 'function') {
          instance.componentWillMount();
        }
        if (typeof instance.UNSAFE_componentWillMount === 'function') {
          instance.UNSAFE_componentWillMount();
        }
        stopPhaseTimer();
      }
      if (typeof instance.componentDidMount === 'function') {
        workInProgress.effectTag |= Update;
      }
    } else {
      // If an update was already in progress, we should schedule an Update
      // effect even though we're bailing out, so that cWU/cDU are called.
      if (typeof instance.componentDidMount === 'function') {
        workInProgress.effectTag |= Update;
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

  // Invokes the update life-cycles and returns false if it shouldn't rerender.
  function updateClassInstance(
    current: Fiber,
    workInProgress: Fiber,
    renderExpirationTime: ExpirationTime,
  ): boolean {
    const ctor = workInProgress.type;
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

    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
    if (
      (typeof instance.UNSAFE_componentWillReceiveProps === 'function' ||
        typeof instance.componentWillReceiveProps === 'function') &&
      typeof ctor.getDerivedStateFromProps !== 'function'
    ) {
      if (oldProps !== newProps || oldContext !== newContext) {
        callComponentWillReceiveProps(
          workInProgress,
          instance,
          newProps,
          newContext,
        );
      }
    }

    // Compute the next state using the memoized state and the update queue.
    const oldState = workInProgress.memoizedState;
    // TODO: Previous state can be null.
    let newState;
    let derivedStateFromCatch;
    if (workInProgress.updateQueue !== null) {
      newState = processUpdateQueue(
        current,
        workInProgress,
        workInProgress.updateQueue,
        instance,
        newProps,
        renderExpirationTime,
      );

      let updateQueue = workInProgress.updateQueue;
      if (
        updateQueue !== null &&
        updateQueue.capturedValues !== null &&
        (enableGetDerivedStateFromCatch &&
          typeof ctor.getDerivedStateFromCatch === 'function')
      ) {
        const capturedValues = updateQueue.capturedValues;
        // Don't remove these from the update queue yet. We need them in
        // finishClassComponent. Do the reset there.
        // TODO: This is awkward. Refactor class components.
        // updateQueue.capturedValues = null;
        derivedStateFromCatch = callGetDerivedStateFromCatch(
          ctor,
          capturedValues,
        );
      }
    } else {
      newState = oldState;
    }

    let derivedStateFromProps;
    if (oldProps !== newProps) {
      // The prevState parameter should be the partially updated state.
      // Otherwise, spreading state in return values could override updates.
      derivedStateFromProps = callGetDerivedStateFromProps(
        workInProgress,
        instance,
        newProps,
        newState,
      );
    }

    if (derivedStateFromProps !== null && derivedStateFromProps !== undefined) {
      // Render-phase updates (like this) should not be added to the update queue,
      // So that multiple render passes do not enqueue multiple updates.
      // Instead, just synchronously merge the returned state into the instance.
      newState =
        newState === null || newState === undefined
          ? derivedStateFromProps
          : Object.assign({}, newState, derivedStateFromProps);
    }
    if (derivedStateFromCatch !== null && derivedStateFromCatch !== undefined) {
      // Render-phase updates (like this) should not be added to the update queue,
      // So that multiple render passes do not enqueue multiple updates.
      // Instead, just synchronously merge the returned state into the instance.
      newState =
        newState === null || newState === undefined
          ? derivedStateFromCatch
          : Object.assign({}, newState, derivedStateFromCatch);
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
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
      if (
        (typeof instance.UNSAFE_componentWillUpdate === 'function' ||
          typeof instance.componentWillUpdate === 'function') &&
        typeof ctor.getDerivedStateFromProps !== 'function'
      ) {
        startPhaseTimer(workInProgress, 'componentWillUpdate');
        if (typeof instance.componentWillUpdate === 'function') {
          instance.componentWillUpdate(newProps, newState, newContext);
        }
        if (typeof instance.UNSAFE_componentWillUpdate === 'function') {
          instance.UNSAFE_componentWillUpdate(newProps, newState, newContext);
        }
        stopPhaseTimer();
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
    resumeMountClassInstance,
    updateClassInstance,
  };
}
