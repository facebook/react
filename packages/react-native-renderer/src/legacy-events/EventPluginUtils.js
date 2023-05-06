/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {invokeGuardedCallbackAndCatchFirstError} from 'shared/ReactErrorUtils';
import isArray from 'shared/isArray';

export let getFiberCurrentPropsFromNode = null;
export let getInstanceFromNode = null;
export let getNodeFromInstance = null;

export function setComponentTree(
  getFiberCurrentPropsFromNodeImpl,
  getInstanceFromNodeImpl,
  getNodeFromInstanceImpl,
) {
  getFiberCurrentPropsFromNode = getFiberCurrentPropsFromNodeImpl;
  getInstanceFromNode = getInstanceFromNodeImpl;
  getNodeFromInstance = getNodeFromInstanceImpl;
  if (__DEV__) {
    if (!getNodeFromInstance || !getInstanceFromNode) {
      console.error(
        'EventPluginUtils.setComponentTree(...): Injected ' +
          'module is missing getNodeFromInstance or getInstanceFromNode.',
      );
    }
  }
}

function validateEventDispatches(event) {
  if (__DEV__) {
    const dispatchListeners = event._dispatchListeners;
    const dispatchInstances = event._dispatchInstances;

    const listenersIsArr = isArray(dispatchListeners);
    const listenersLen = listenersIsArr
      ? dispatchListeners.length
      : dispatchListeners
      ? 1
      : 0;

    const instancesIsArr = isArray(dispatchInstances);
    const instancesLen = instancesIsArr
      ? dispatchInstances.length
      : dispatchInstances
      ? 1
      : 0;

    if (instancesIsArr !== listenersIsArr || instancesLen !== listenersLen) {
      console.error('EventPluginUtils: Invalid `event`.');
    }
  }
}

/**
 * Dispatch the event to the listener.
 * @param {SyntheticEvent} event SyntheticEvent to handle
 * @param {function} listener Application-level callback
 * @param {*} inst Internal component instance
 */
export function executeDispatch(event, listener, inst) {
  const type = event.type || 'unknown-event';
  event.currentTarget = getNodeFromInstance(inst);
  invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
  event.currentTarget = null;
}

/**
 * Standard/simple iteration through an event's collected dispatches.
 */
export function executeDispatchesInOrder(event) {
  const dispatchListeners = event._dispatchListeners;
  const dispatchInstances = event._dispatchInstances;
  if (__DEV__) {
    validateEventDispatches(event);
  }
  if (isArray(dispatchListeners)) {
    for (let i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners and Instances are two parallel arrays that are always in sync.
      executeDispatch(event, dispatchListeners[i], dispatchInstances[i]);
    }
  } else if (dispatchListeners) {
    executeDispatch(event, dispatchListeners, dispatchInstances);
  }
  event._dispatchListeners = null;
  event._dispatchInstances = null;
}

/**
 * Standard/simple iteration through an event's collected dispatches, but stops
 * at the first dispatch execution returning true, and returns that id.
 *
 * @return {?string} id of the first dispatch execution who's listener returns
 * true, or null if no listener returned true.
 */
function executeDispatchesInOrderStopAtTrueImpl(event) {
  const dispatchListeners = event._dispatchListeners;
  const dispatchInstances = event._dispatchInstances;
  if (__DEV__) {
    validateEventDispatches(event);
  }
  if (isArray(dispatchListeners)) {
    for (let i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners and Instances are two parallel arrays that are always in sync.
      if (dispatchListeners[i](event, dispatchInstances[i])) {
        return dispatchInstances[i];
      }
    }
  } else if (dispatchListeners) {
    if (dispatchListeners(event, dispatchInstances)) {
      return dispatchInstances;
    }
  }
  return null;
}

/**
 * @see executeDispatchesInOrderStopAtTrueImpl
 */
export function executeDispatchesInOrderStopAtTrue(event) {
  const ret = executeDispatchesInOrderStopAtTrueImpl(event);
  event._dispatchInstances = null;
  event._dispatchListeners = null;
  return ret;
}

/**
 * Execution of a "direct" dispatch - there must be at most one dispatch
 * accumulated on the event or it is considered an error. It doesn't really make
 * sense for an event with multiple dispatches (bubbled) to keep track of the
 * return values at each dispatch execution, but it does tend to make sense when
 * dealing with "direct" dispatches.
 *
 * @return {*} The return value of executing the single dispatch.
 */
export function executeDirectDispatch(event) {
  if (__DEV__) {
    validateEventDispatches(event);
  }
  const dispatchListener = event._dispatchListeners;
  const dispatchInstance = event._dispatchInstances;

  if (isArray(dispatchListener)) {
    throw new Error('executeDirectDispatch(...): Invalid `event`.');
  }

  event.currentTarget = dispatchListener
    ? getNodeFromInstance(dispatchInstance)
    : null;
  const res = dispatchListener ? dispatchListener(event) : null;
  event.currentTarget = null;
  event._dispatchListeners = null;
  event._dispatchInstances = null;
  return res;
}

/**
 * @param {SyntheticEvent} event
 * @return {boolean} True iff number of dispatches accumulated is greater than 0.
 */
export function hasDispatches(event) {
  return !!event._dispatchListeners;
}
