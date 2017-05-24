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

import type {Fiber} from 'ReactFiber';
import type {PriorityLevel} from 'ReactPriorityLevel';

var {
  addUpdate,
  addReplaceUpdate,
  addForceUpdate,
} = require('ReactFiberUpdateQueue');
var {isMounted} = require('ReactFiberTreeReflection');
var ReactInstanceMap = require('ReactInstanceMap');
var getComponentName = require('getComponentName');
var invariant = require('fbjs/lib/invariant');

const isArray = Array.isArray;

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
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

// Call immediately after constructing a class instance.
function validateClassInstance(workInProgress: Fiber, initialProps: mixed, initialState: mixed) {
  const instance = workInProgress.stateNode;
  const ctor = workInProgress.type;
  if (__DEV__) {
    const name = getComponentName(workInProgress);
    const renderPresent = instance.render;
    warning(
      renderPresent,
      '%s(...): No `render` method found on the returned component ' +
        'instance: you may have forgotten to define `render`.',
      name,
    );
    const noGetInitialStateOnES6 =
      !instance.getInitialState ||
      instance.getInitialState.isReactClassApproved ||
      initialState;
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
      ctor.prototype &&
      ctor.prototype.isPureReactComponent &&
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
    const noComponentWillRecieveProps =
      typeof instance.componentWillRecieveProps !== 'function';
    warning(
      noComponentWillRecieveProps,
      '%s has a method called ' +
        'componentWillRecieveProps(). Did you mean componentWillReceiveProps()?',
      name,
    );
    const hasMutatedProps = instance.props !== initialProps;
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
  if (initialState !== undefined && (typeof initialState !== 'object' || isArray(initialState))) {
    invariant(
      false,
      '%s.state: must be set to an object or null',
      getComponentName(workInProgress),
    );
  }
  if (typeof instance.getChildContext === 'function') {
    invariant(
      typeof workInProgress.type.childContextTypes === 'object',
      '%s.getChildContext(): childContextTypes must be defined in order to ' +
        'use getChildContext().',
      getComponentName(workInProgress),
    );
  }
}
exports.validateClassInstance = validateClassInstance;

type Callback = () => mixed;

function callClassInstanceMethod<A, B, C, D>(
  instance: any,
  lifecycle: (a: A, b: B, c: C) => D,
  instanceProps: mixed,
  instanceContext: mixed,
  instanceState: mixed,
  a: A,
  b: B,
  c: C,
): D | void {
  instance.props = instanceProps;
  instance.context = instanceContext;
  instance.state = instanceState;
  return lifecycle.call(instance, a, b, c);
}
exports.callClassInstanceMethod = callClassInstanceMethod;

function ClassUpdater(
  scheduleUpdate: (fiber: Fiber, priorityLevel: PriorityLevel) => void,
  getPriorityContext: (fiber: Fiber, forceAsync: boolean) => PriorityLevel,
) {
  return {
    isMounted,
    enqueueSetState(instance: any, partialState: mixed, callback: ?Callback) {
      const fiber = ReactInstanceMap.get(instance);
      const priorityLevel = getPriorityContext(fiber, false);
      callback = callback === undefined ? null : callback;
      if (__DEV__) {
        warnOnInvalidCallback(callback, 'setState');
      }
      addUpdate(fiber, partialState, callback, priorityLevel);
      scheduleUpdate(fiber, priorityLevel);
    },
    enqueueReplaceState(instance: any, state: mixed, callback: ?Callback) {
      const fiber = ReactInstanceMap.get(instance);
      const priorityLevel = getPriorityContext(fiber, false);
      callback = callback === undefined ? null : callback;
      if (__DEV__) {
        warnOnInvalidCallback(callback, 'replaceState');
      }
      addReplaceUpdate(fiber, state, callback, priorityLevel);
      scheduleUpdate(fiber, priorityLevel);
    },
    enqueueForceUpdate(instance: any, callback: ?Callback) {
      const fiber = ReactInstanceMap.get(instance);
      const priorityLevel = getPriorityContext(fiber, false);
      callback = callback === undefined ? null : callback;
      if (__DEV__) {
        warnOnInvalidCallback(callback, 'forceUpdate');
      }
      addForceUpdate(fiber, callback, priorityLevel);
      scheduleUpdate(fiber, priorityLevel);
    },
  };
}
exports.ClassUpdater = ClassUpdater;
