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

import {debugRenderPhaseSideEffects} from 'shared/ReactFeatureFlags';
import {isMounted} from 'shared/ReactFiberTreeReflection';
import * as ReactInstanceMap from 'shared/ReactInstanceMap';
import getComponentName from 'shared/getComponentName';
import invariant from 'fbjs/lib/invariant';
import warning from 'fbjs/lib/warning';

import {startPhaseTimer, stopPhaseTimer} from './ReactDebugFiberPerf';
import {insertUpdateIntoFiber} from './ReactFiberUpdateQueue';

const isArray = Array.isArray;

if (__DEV__) {
  var didWarnAboutStateAssignmentForComponent = {};

  var warnOnInvalidCallback = function(callback: mixed, callerName: string) {
    warning(
      callback === null || typeof callback === 'function',
      '%s(...): Expected the last optional `callback` argument to be a ' +
        'function. Instead received: %s.',
      callerName,
      callback,
    );
  };
}

export default function(
  scheduleWork: (fiber: Fiber, expirationTime: ExpirationTime) => void,
  computeExpirationForFiber: (fiber: Fiber) => ExpirationTime,
) {
  // Class component state updater
  const classUpdater = {
    isMounted,
    enqueueSetState(
      instance: any,
      partialState: mixed,
      callback: ?() => mixed,
    ) {
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
    enqueueReplaceState(instance: any, state: mixed, callback: ?() => mixed) {
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
    enqueueForceUpdate(instance: any, callback: ?() => mixed) {
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

  function callComponentWillMount(workInProgress: Fiber, instance: any) {
    startPhaseTimer(workInProgress, 'componentWillMount');
    const oldState = instance.state;
    instance.componentWillMount();
    stopPhaseTimer();

    // Simulate an async bailout/interruption by invoking lifecycle twice.
    if (debugRenderPhaseSideEffects) {
      instance.componentWillMount();
    }

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
      classUpdater.enqueueReplaceState(instance, instance.state, null);
    }
  }

  function callComponentWillReceiveProps(
    workInProgress: Fiber,
    instance: any,
    newProps: mixed,
    newContext: mixed,
  ) {
    startPhaseTimer(workInProgress, 'componentWillReceiveProps');
    const oldState = instance.state;
    instance.componentWillReceiveProps(newProps, newContext);
    stopPhaseTimer();

    // Simulate an async bailout/interruption by invoking lifecycle twice.
    if (debugRenderPhaseSideEffects) {
      instance.componentWillReceiveProps(newProps, newContext);
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
      classUpdater.enqueueReplaceState(instance, instance.state, null);
    }
  }

  function callShouldComponentUpdate(
    workInProgress: Fiber,
    instance: any,
    nextProps: mixed,
    nextState: mixed,
    nextContext: mixed,
  ): boolean {
    startPhaseTimer(workInProgress, 'shouldComponentUpdate');
    const shouldUpdate = instance.shouldComponentUpdate(
      nextProps,
      nextState,
      nextContext,
    );
    stopPhaseTimer();
    // Simulate an async bailout/interruption by invoking lifecycle twice.
    if (debugRenderPhaseSideEffects) {
      instance.shouldComponentUpdate(nextProps, nextState, nextContext);
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

  function callComponentWillUpdate(
    workInProgress: Fiber,
    instance: any,
    nextProps: mixed,
    nextState: mixed,
    nextContext: mixed,
  ) {
    startPhaseTimer(workInProgress, 'componentWillUpdate');
    instance.componentWillUpdate(nextProps, nextState, nextContext);
    stopPhaseTimer();
    // Simulate an async bailout/interruption by invoking lifecycle twice.
    if (debugRenderPhaseSideEffects) {
      instance.componentWillUpdate(nextProps, nextState, nextContext);
    }
  }

  return {
    classUpdater,
    checkClassInstance,
    callComponentWillMount,
    callComponentWillReceiveProps,
    callShouldComponentUpdate,
    callComponentWillUpdate,
  };
}
