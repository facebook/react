/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberClassComponent
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';
import type { PriorityLevel } from 'ReactPriorityLevel';

var {
  getMaskedContext,
} = require('ReactFiberContext');
var {
  addUpdate,
  addReplaceUpdate,
  addForceUpdate,
  addCallback,
  beginUpdateQueue,
} = require('ReactFiberUpdateQueue');
var { hasContextChanged } = require('ReactFiberContext');
var { getComponentName, isMounted } = require('ReactFiberTreeReflection');
var ReactInstanceMap = require('ReactInstanceMap');
var shallowEqual = require('shallowEqual');
var warning = require('warning');
var invariant = require('invariant');

const isArray = Array.isArray;

module.exports = function(
  scheduleUpdate : (fiber : Fiber, priorityLevel : PriorityLevel) => void,
  getPriorityContext : () => PriorityLevel,
) {

  // Class component state updater
  const updater = {
    isMounted,
    enqueueSetState(instance, partialState, callback) {
      const fiber = ReactInstanceMap.get(instance);
      const priorityLevel = getPriorityContext();
      addUpdate(fiber, partialState, callback || null, priorityLevel);
      scheduleUpdate(fiber, priorityLevel);
    },
    enqueueReplaceState(instance, state, callback) {
      const fiber = ReactInstanceMap.get(instance);
      const priorityLevel = getPriorityContext();
      addReplaceUpdate(fiber, state, callback || null, priorityLevel);
      scheduleUpdate(fiber, priorityLevel);
    },
    enqueueForceUpdate(instance, callback) {
      const fiber = ReactInstanceMap.get(instance);
      const priorityLevel = getPriorityContext();
      addForceUpdate(fiber, callback || null, priorityLevel);
      scheduleUpdate(fiber, priorityLevel);
    },
    enqueueCallback(instance, callback) {
      const fiber = ReactInstanceMap.get(instance);
      const priorityLevel = getPriorityContext();
      addCallback(fiber, callback || null, priorityLevel);
      scheduleUpdate(fiber, priorityLevel);
    },
  };

  function checkShouldComponentUpdate(workInProgress, oldProps, newProps, newState, newContext) {
    if (oldProps === null || (workInProgress.updateQueue && workInProgress.updateQueue.hasForceUpdate)) {
      // If the workInProgress already has an Update effect, return true
      return true;
    }

    const instance = workInProgress.stateNode;
    if (typeof instance.shouldComponentUpdate === 'function') {
      const shouldUpdate = instance.shouldComponentUpdate(newProps, newState, newContext);

      if (__DEV__) {
        warning(
          shouldUpdate !== undefined,
          '%s.shouldComponentUpdate(): Returned undefined instead of a ' +
          'boolean value. Make sure to return true or false.',
          getComponentName(workInProgress)
        );
      }

      return shouldUpdate;
    }

    const type = workInProgress.type;
    if (type.prototype && type.prototype.isPureReactComponent) {
      return (
        !shallowEqual(oldProps, newProps) ||
        !shallowEqual(instance.state, newState)
      );
    }

    return true;
  }

  function checkClassInstance(workInProgress: Fiber) {
    const instance = workInProgress.stateNode;
    if (__DEV__) {
      const name = getComponentName(workInProgress);
      const renderPresent = instance.render;
      warning(
        renderPresent,
        '%s(...): No `render` method found on the returned component ' +
        'instance: you may have forgotten to define `render`.',
        name
      );
      const noGetInitialStateOnES6 = (
        !instance.getInitialState ||
        instance.getInitialState.isReactClassApproved ||
        instance.state
      );
      warning(
        noGetInitialStateOnES6,
        'getInitialState was defined on %s, a plain JavaScript class. ' +
        'This is only supported for classes created using React.createClass. ' +
        'Did you mean to define a state property instead?',
        name
      );
      const noGetDefaultPropsOnES6 = (
        !instance.getDefaultProps ||
        instance.getDefaultProps.isReactClassApproved
      );
      warning(
        noGetDefaultPropsOnES6,
        'getDefaultProps was defined on %s, a plain JavaScript class. ' +
        'This is only supported for classes created using React.createClass. ' +
        'Use a static property to define defaultProps instead.',
        name
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
      const noComponentShouldUpdate = typeof instance.componentShouldUpdate !== 'function';
      warning(
        noComponentShouldUpdate,
        '%s has a method called ' +
        'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' +
        'The name is phrased as a question because the function is ' +
        'expected to return a value.',
        name
      );
      const noComponentDidUnmount = typeof instance.componentDidUnmount !== 'function';
      warning(
        noComponentDidUnmount,
        '%s has a method called ' +
        'componentDidUnmount(). But there is no such lifecycle method. ' +
        'Did you mean componentWillUnmount()?',
        name
      );
      const noComponentWillRecieveProps = typeof instance.componentWillRecieveProps !== 'function';
      warning(
        noComponentWillRecieveProps,
        '%s has a method called ' +
        'componentWillRecieveProps(). Did you mean componentWillReceiveProps()?',
        name
      );
      const hasMutatedProps = instance.props !== workInProgress.pendingProps;
      warning(
        instance.props === undefined || !hasMutatedProps,
        '%s(...): When calling super() in `%s`, make sure to pass ' +
        'up the same props that your component\'s constructor was passed.',
        name,
        name
      );
    }

    const state = instance.state;
    if (state && (typeof state !== 'object' || isArray(state))) {
      invariant(
        false,
        '%s.state: must be set to an object or null',
        getComponentName(workInProgress)
      );
    }
    if (typeof instance.getChildContext === 'function') {
      invariant(
        typeof workInProgress.type.childContextTypes === 'object',
        '%s.getChildContext(): childContextTypes must be defined in order to ' +
        'use getChildContext().',
        getComponentName(workInProgress)
      );
    }
  }

  function adoptClassInstance(workInProgress : Fiber, instance : any) : void {
    instance.updater = updater;
    workInProgress.stateNode = instance;
    // The instance needs access to the fiber so that it can schedule updates
    ReactInstanceMap.set(instance, workInProgress);
  }

  function constructClassInstance(workInProgress : Fiber) : any {
    const ctor = workInProgress.type;
    const props = workInProgress.pendingProps;
    const context = getMaskedContext(workInProgress);
    const instance = new ctor(props, context);
    adoptClassInstance(workInProgress, instance);
    checkClassInstance(workInProgress);
    return instance;
  }

  // Invokes the mount life-cycles on a previously never rendered instance.
  function mountClassInstance(workInProgress : Fiber, priorityLevel : PriorityLevel) : void {
    const instance = workInProgress.stateNode;
    const state = instance.state || null;

    let props = workInProgress.pendingProps;
    if (!props) {
      throw new Error('There must be pending props for an initial mount.');
    }

    instance.props = props;
    instance.state = state;
    instance.context = getMaskedContext(workInProgress);

    if (typeof instance.componentWillMount === 'function') {
      instance.componentWillMount();
      // If we had additional state updates during this life-cycle, let's
      // process them now.
      const updateQueue = workInProgress.updateQueue;
      if (updateQueue) {
        instance.state = beginUpdateQueue(
          workInProgress,
          updateQueue,
          instance,
          state,
          props,
          priorityLevel
        );
      }
    }
  }

  // Called on a preexisting class instance. Returns false if a resumed render
  // could be reused.
  function resumeMountClassInstance(workInProgress : Fiber, priorityLevel : PriorityLevel) : boolean {
    let newState = workInProgress.memoizedState;
    let newProps = workInProgress.pendingProps;
    if (!newProps) {
      // If there isn't any new props, then we'll reuse the memoized props.
      // This could be from already completed work.
      newProps = workInProgress.memoizedProps;
      if (!newProps) {
        throw new Error('There should always be pending or memoized props.');
      }
    }
    const newContext = getMaskedContext(workInProgress);

    // TODO: Should we deal with a setState that happened after the last
    // componentWillMount and before this componentWillMount? Probably
    // unsupported anyway.

    if (!checkShouldComponentUpdate(
      workInProgress,
      workInProgress.memoizedProps,
      newProps,
      newState,
      newContext
    )) {
      return false;
    }

    // If we didn't bail out we need to construct a new instance. We don't
    // want to reuse one that failed to fully mount.
    const newInstance = constructClassInstance(workInProgress);
    newInstance.props = newProps;
    newInstance.state = newState = newInstance.state || null;
    newInstance.context = getMaskedContext(workInProgress);

    if (typeof newInstance.componentWillMount === 'function') {
      newInstance.componentWillMount();
    }
    // If we had additional state updates, process them now.
    // They may be from componentWillMount() or from error boundary's setState()
    // during initial mounting.
    const newUpdateQueue = workInProgress.updateQueue;
    if (newUpdateQueue) {
      newInstance.state = beginUpdateQueue(
        workInProgress,
        newUpdateQueue,
        newInstance,
        newState,
        newProps,
        priorityLevel
      );
    }
    return true;
  }

  // Invokes the update life-cycles and returns false if it shouldn't rerender.
  function updateClassInstance(current : Fiber, workInProgress : Fiber, priorityLevel : PriorityLevel) : boolean {
    const instance = workInProgress.stateNode;

    const oldProps = workInProgress.memoizedProps || current.memoizedProps;
    let newProps = workInProgress.pendingProps;
    if (!newProps) {
      // If there aren't any new props, then we'll reuse the memoized props.
      // This could be from already completed work.
      newProps = oldProps;
      if (!newProps) {
        throw new Error('There should always be pending or memoized props.');
      }
    }
    const oldContext = instance.context;
    const newContext = getMaskedContext(workInProgress);

    // Note: During these life-cycles, instance.props/instance.state are what
    // ever the previously attempted to render - not the "current". However,
    // during componentDidUpdate we pass the "current" props.

    if (oldProps !== newProps || oldContext !== newContext) {
      if (typeof instance.componentWillReceiveProps === 'function') {
        instance.componentWillReceiveProps(newProps, newContext);
      }
    }

    // Compute the next state using the memoized state and the update queue.
    const updateQueue = workInProgress.updateQueue;
    const oldState = workInProgress.memoizedState;
    // TODO: Previous state can be null.
    let newState;
    if (updateQueue) {
      newState = beginUpdateQueue(
        workInProgress,
        updateQueue,
        instance,
        oldState,
        newProps,
        priorityLevel
      );
    } else {
      newState = oldState;
    }

    if (oldProps === newProps &&
        oldState === newState &&
        !hasContextChanged() &&
        !(updateQueue && updateQueue.hasForceUpdate)) {
      return false;
    }

    if (!checkShouldComponentUpdate(
      workInProgress,
      oldProps,
      newProps,
      newState,
      newContext
    )) {
      // TODO: Should this get the new props/state updated regardless?
      return false;
    }

    if (typeof instance.componentWillUpdate === 'function') {
      instance.componentWillUpdate(newProps, newState, newContext);
    }

    instance.props = newProps;
    instance.state = newState;
    instance.context = newContext;
    return true;
  }

  return {
    adoptClassInstance,
    constructClassInstance,
    mountClassInstance,
    resumeMountClassInstance,
    updateClassInstance,
  };

};
