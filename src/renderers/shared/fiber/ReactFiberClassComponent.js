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
import type { UpdateQueue } from 'ReactFiberUpdateQueue';

var { LowPriority } = require('ReactPriorityLevel');
var {
  createUpdateQueue,
  addToQueue,
  addCallbackToQueue,
  mergeUpdateQueue,
} = require('ReactFiberUpdateQueue');
var ReactInstanceMap = require('ReactInstanceMap');

module.exports = function(scheduleUpdate : (fiber: Fiber, priorityLevel : PriorityLevel) => void) {

  function scheduleUpdateQueue(fiber: Fiber, updateQueue: UpdateQueue, priorityLevel : PriorityLevel) {
    fiber.updateQueue = updateQueue;
    // Schedule update on the alternate as well, since we don't know which tree
    // is current.
    if (fiber.alternate) {
      fiber.alternate.updateQueue = updateQueue;
    }
    scheduleUpdate(fiber, priorityLevel);
  }

  // Class component state updater
  const updater = {
    enqueueSetState(instance, partialState) {
      const fiber = ReactInstanceMap.get(instance);
      const updateQueue = fiber.updateQueue ?
        addToQueue(fiber.updateQueue, partialState) :
        createUpdateQueue(partialState);
      scheduleUpdateQueue(fiber, updateQueue, LowPriority);
    },
    enqueueReplaceState(instance, state) {
      const fiber = ReactInstanceMap.get(instance);
      const updateQueue = createUpdateQueue(state);
      updateQueue.isReplace = true;
      scheduleUpdateQueue(fiber, updateQueue, LowPriority);
    },
    enqueueForceUpdate(instance) {
      const fiber = ReactInstanceMap.get(instance);
      const updateQueue = fiber.updateQueue || createUpdateQueue(null);
      updateQueue.isForced = true;
      scheduleUpdateQueue(fiber, updateQueue, LowPriority);
    },
    enqueueCallback(instance, callback) {
      const fiber = ReactInstanceMap.get(instance);
      let updateQueue = fiber.updateQueue ?
        fiber.updateQueue :
        createUpdateQueue(null);
      addCallbackToQueue(updateQueue, callback);
      fiber.updateQueue = updateQueue;
      if (fiber.alternate) {
        fiber.alternate.updateQueue = updateQueue;
      }
    },
  };

  function adoptClassInstance(workInProgress : Fiber, instance : any) : void {
    instance.updater = updater;
    workInProgress.stateNode = instance;
    // The instance needs access to the fiber so that it can schedule updates
    ReactInstanceMap.set(instance, workInProgress);
  }

  function constructClassInstance(workInProgress : Fiber) : any {
    const ctor = workInProgress.type;
    const props = workInProgress.pendingProps;
    const instance = new ctor(props);
    adoptClassInstance(workInProgress, instance);
    return instance;
  }

  // Invokes the mount life-cycles on a previously never rendered instance.
  function mountClassInstance(workInProgress : Fiber) : void {
    const instance = workInProgress.stateNode;

    const state = instance.state || null;

    let props = workInProgress.pendingProps;
    if (!props) {
      throw new Error('There must be pending props for an initial mount.');
    }

    instance.props = props;
    instance.state = state;

    if (typeof instance.componentWillMount === 'function') {
      instance.componentWillMount();
      // If we had additional state updates during this life-cycle, let's
      // process them now.
      const updateQueue = workInProgress.updateQueue;
      if (updateQueue) {
        instance.state = mergeUpdateQueue(updateQueue, state, props);
      }
    }
  }

  // Called on a preexisting class instance. Returns false if a resumed render
  // could be reused.
  function resumeMountClassInstance(workInProgress : Fiber) : boolean {
    const instance = workInProgress.stateNode;
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

    // TODO: Should we deal with a setState that happened after the last
    // componentWillMount and before this componentWillMount? Probably
    // unsupported anyway.

    const updateQueue = workInProgress.updateQueue;

    // If this completed, we might be able to just reuse this instance.
    if (typeof instance.shouldComponentUpdate === 'function' &&
        !(updateQueue && updateQueue.isForced) &&
        workInProgress.memoizedProps !== null &&
        !instance.shouldComponentUpdate(newProps, newState)) {
      return false;
    }

    // If we didn't bail out we need to construct a new instance. We don't
    // want to reuse one that failed to fully mount.
    const newInstance = constructClassInstance(workInProgress);
    newInstance.props = newProps;
    newInstance.state = newState = newInstance.state || null;

    if (typeof newInstance.componentWillMount === 'function') {
      newInstance.componentWillMount();
      // If we had additional state updates during this life-cycle, let's
      // process them now.
      const newUpdateQueue = workInProgress.updateQueue;
      if (newUpdateQueue) {
        instance.state = mergeUpdateQueue(newUpdateQueue, newState, newProps);
      }
    }
    return true;
  }

  // Invokes the update life-cycles and returns false if it shouldn't rerender.
  function updateClassInstance(current : Fiber, workInProgress : Fiber) : boolean {
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

    // Note: During these life-cycles, instance.props/instance.state are what
    // ever the previously attempted to render - not the "current". However,
    // during componentDidUpdate we pass the "current" props.

    if (oldProps !== newProps) {
      if (typeof instance.componentWillReceiveProps === 'function') {
        instance.componentWillReceiveProps(newProps);
      }
    }

    // Compute the next state using the memoized state and the update queue.
    const updateQueue = workInProgress.updateQueue;
    const previousState = workInProgress.memoizedState;
    // TODO: Previous state can be null.
    let newState;
    if (updateQueue) {
      newState = mergeUpdateQueue(updateQueue, previousState, newProps);
    } else {
      newState = previousState;
    }

    if (typeof instance.shouldComponentUpdate === 'function' &&
        !(updateQueue && updateQueue.isForced) &&
        oldProps !== null &&
        !instance.shouldComponentUpdate(newProps, newState)) {
      // TODO: Should this get the new props/state updated regardless?
      return false;
    }

    if (typeof instance.componentWillUpdate === 'function') {
      instance.componentWillUpdate(newProps, newState);
    }

    instance.props = newProps;
    instance.state = newState;
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
