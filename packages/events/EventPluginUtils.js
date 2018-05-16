/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactErrorUtils from 'shared/ReactErrorUtils';
import invariant from 'fbjs/lib/invariant';
import warning from 'fbjs/lib/warning';

export let getFiberCurrentPropsFromNode = null;
export let getInstanceFromNode = null;
export let getNodeFromInstance = null;

export const injection = {
  injectComponentTree: function(Injected) {
    ({
      getFiberCurrentPropsFromNode,
      getInstanceFromNode,
      getNodeFromInstance,
    } = Injected);
    if (__DEV__) {
      warning(
        getNodeFromInstance && getInstanceFromNode,
        'EventPluginUtils.injection.injectComponentTree(...): Injected ' +
          'module is missing getNodeFromInstance or getInstanceFromNode.',
      );
    }
  },
};

let validateEventDispatches;
if (__DEV__) {
  validateEventDispatches = function(event) {
    const dispatchListeners = event._dispatchListeners;
    const dispatchInstances = event._dispatchInstances;

    const listenersIsArr = Array.isArray(dispatchListeners);
    const listenersLen = listenersIsArr
      ? dispatchListeners.length
      : dispatchListeners ? 1 : 0;

    const instancesIsArr = Array.isArray(dispatchInstances);
    const instancesLen = instancesIsArr
      ? dispatchInstances.length
      : dispatchInstances ? 1 : 0;

    warning(
      instancesIsArr === listenersIsArr && instancesLen === listenersLen,
      'EventPluginUtils: Invalid `event`.',
    );
  };
}

/**
 * Dispatch the event to the listener.
 * @param {SyntheticEvent} event SyntheticEvent to handle
 * @param {boolean} simulated If the event is simulated (changes exn behavior)
 * @param {function} listener Application-level callback
 * @param {*} inst Internal component instance
 */
function executeDispatch(event, simulated, listener, inst) {
  const type = event.type || 'unknown-event';
  event.currentTarget = getNodeFromInstance(inst);
  ReactErrorUtils.invokeGuardedCallbackAndCatchFirstError(
    type,
    listener,
    undefined,
    event,
  );
  event.currentTarget = null;
}

/**
 * Standard/simple iteration through an event's collected dispatches.
 */
export function executeDispatchesInOrder(event, simulated) {
  const dispatchListeners = event._dispatchListeners;
  const dispatchInstances = event._dispatchInstances;
  if (__DEV__) {
    validateEventDispatches(event);
  }
  if (Array.isArray(dispatchListeners)) {
    for (let i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners and Instances are two parallel arrays that are always in sync.
      executeDispatch(
        event,
        simulated,
        dispatchListeners[i],
        dispatchInstances[i],
      );
    }
  } else if (dispatchListeners) {
    executeDispatch(event, simulated, dispatchListeners, dispatchInstances);
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
  if (Array.isArray(dispatchListeners)) {
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
  invariant(
    !Array.isArray(dispatchListener),
    'executeDirectDispatch(...): Invalid `event`.',
  );
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
