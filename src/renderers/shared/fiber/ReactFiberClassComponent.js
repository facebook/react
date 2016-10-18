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

  function mount(workInProgress : Fiber, instance : any) {
    const state = instance.state || null;
    // The initial state must be added to the update queue in case
    // setState is called before the initial render.
    if (state !== null) {
      workInProgress.updateQueue = createUpdateQueue(state);
    }
    // The instance needs access to the fiber so that it can schedule updates
    ReactInstanceMap.set(instance, workInProgress);
    instance.updater = updater;
  }

  return {
    mount,
  };

};
