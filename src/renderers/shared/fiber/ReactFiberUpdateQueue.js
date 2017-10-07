/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactFiberUpdateQueue
 * @flow
 */

'use strict';

import type {Fiber} from 'ReactFiber';
import type {PriorityLevel} from 'ReactPriorityLevel';
import type {ExpirationTime} from 'ReactFiberExpirationTime';

const {Callback: CallbackEffect} = require('ReactTypeOfSideEffect');

const {Done} = require('ReactFiberExpirationTime');

const {ClassComponent, HostRoot} = require('ReactTypeOfWork');

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
}

type PartialState<State, Props> =
  | $Subtype<State>
  | ((prevState: State, props: Props) => $Subtype<State>);

type Callback = () => mixed;

export type Update<State> = {
  priorityLevel: PriorityLevel | null,
  expirationTime: ExpirationTime,
  partialState: PartialState<State, any>,
  callback: Callback | null,
  isReplace: boolean,
  isForced: boolean,
  next: Update<State> | null,
  nextCallback: Update<State> | null,
};

// Singly linked-list of updates. When an update is scheduled, it is added to
// the queue of the current fiber and the work-in-progress fiber. The two queues
// are separate but they share a persistent structure.
//
// During reconciliation, updates are removed from the work-in-progress fiber,
// but they remain on the current fiber. That ensures that if a work-in-progress
// is aborted, the aborted updates are recovered by cloning from current.
//
// The work-in-progress queue is always a subset of the current queue.
//
// When the tree is committed, the work-in-progress becomes the current.
export type UpdateQueue<State> = {
  // A processed update is not removed from the queue if there are any
  // unprocessed updates that came before it. In that case, we need to keep
  // track of the base state, which represents the base state of the first
  // unprocessed update, which is the same as the first update in the list.
  baseState: State | null,
  // For the same reason, we keep track of the remaining expiration time.
  expirationTime: ExpirationTime,
  first: Update<State> | null,
  last: Update<State> | null,
  firstCallback: Update<State> | null,
  lastCallback: Update<State> | null,
  hasForceUpdate: boolean,

  // Dev only
  isProcessing?: boolean,
};

function createUpdateQueue<State>(baseState: State): UpdateQueue<State> {
  const queue: UpdateQueue<State> = {
    baseState,
    expirationTime: Done,
    first: null,
    last: null,
    firstCallback: null,
    lastCallback: null,
    hasForceUpdate: false,
  };
  if (__DEV__) {
    queue.isProcessing = false;
  }
  return queue;
}
exports.createUpdateQueue = createUpdateQueue;

const COALESCENCE_THRESHOLD: ExpirationTime = 10;

function insertUpdateIntoQueue<State>(
  queue: UpdateQueue<State>,
  update: Update<State>,
  currentTime: ExpirationTime,
) {
  if (queue.last === null) {
    // Queue is empty
    queue.first = queue.last = update;
    if (
      queue.expirationTime === Done ||
      queue.expirationTime > update.expirationTime
    ) {
      queue.expirationTime = update.expirationTime;
    }
    return;
  }

  // If the priority is not null, see if there are other pending updates with
  // the same priority. If so, we may need to coalesce them into the same
  // expiration bucket.
  const priorityLevel = update.priorityLevel;
  if (priorityLevel !== null) {
    let coalescentUpdate = null;
    if (queue.last.priorityLevel === priorityLevel) {
      // Fast path where the last update has the same priority.
      coalescentUpdate = queue.last;
    } else {
      // Scan the list for the last update with the same priority.
      let node = queue.first;
      while (node !== null) {
        if (node.priorityLevel === priorityLevel) {
          coalescentUpdate = node;
        }
        node = node.next;
      }
    }
    if (coalescentUpdate !== null) {
      const coalescedTime = coalescentUpdate.expirationTime;
      // If the remaining time is greater than the threshold, add the new
      // update to the same expiration bucket.
      if (coalescedTime - currentTime > COALESCENCE_THRESHOLD) {
        update.expirationTime = coalescedTime;
      }
    }
  }

  // Append the update to the end of the list.
  queue.last.next = update;
  queue.last = update;
  if (
    queue.expirationTime === Done ||
    queue.expirationTime > update.expirationTime
  ) {
    queue.expirationTime = update.expirationTime;
  }
}
exports.insertUpdateIntoQueue = insertUpdateIntoQueue;

function insertUpdateIntoFiber<State>(
  fiber: Fiber,
  update: Update<State>,
  currentTime: ExpirationTime,
) {
  // We'll have at least one and at most two distinct update queues.
  const alternateFiber = fiber.alternate;
  let queue1 = fiber.updateQueue;
  if (queue1 === null) {
    queue1 = fiber.updateQueue = createUpdateQueue(fiber.memoizedState);
  }

  let queue2;
  if (alternateFiber !== null) {
    queue2 = alternateFiber.updateQueue;
    if (queue2 === null) {
      queue2 = alternateFiber.updateQueue = createUpdateQueue(
        alternateFiber.memoizedState,
      );
    }
  } else {
    queue2 = null;
  }
  queue2 = queue2 !== queue1 ? queue2 : null;

  // Warn if an update is scheduled from inside an updater function.
  if (__DEV__) {
    if (queue1.isProcessing || (queue2 !== null && queue2.isProcessing)) {
      warning(
        false,
        'An update (setState, replaceState, or forceUpdate) was scheduled ' +
          'from inside an update function. Update functions should be pure, ' +
          'with zero side-effects. Consider using componentDidUpdate or a ' +
          'callback.',
      );
    }
  }

  // If there's only one queue, add the update to that queue and exit.
  if (queue2 === null) {
    insertUpdateIntoQueue(queue1, update, currentTime);
    return;
  }

  // If either queue is empty, we need to add to both queues.
  if (queue1.last === null || queue2.last === null) {
    insertUpdateIntoQueue(queue1, update, currentTime);
    insertUpdateIntoQueue(queue2, update, currentTime);
    return;
  }

  // If both lists are not empty, the last update is the same for both lists
  // because of structural sharing. So, we should only append to one of
  // the lists.
  insertUpdateIntoQueue(queue1, update, currentTime);
  // But we still need to update the `last` pointer of queue2.
  queue2.last = update;
}
exports.insertUpdateIntoFiber = insertUpdateIntoFiber;

function getUpdateExpirationTime(fiber: Fiber): ExpirationTime {
  if (fiber.tag !== ClassComponent && fiber.tag !== HostRoot) {
    return Done;
  }
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) {
    return Done;
  }
  return getUpdateQueueExpirationTime(updateQueue);
}
exports.getUpdateExpirationTime = getUpdateExpirationTime;

function getUpdateQueueExpirationTime<State>(
  updateQueue: UpdateQueue<State>,
): ExpirationTime {
  return updateQueue.expirationTime;
}
exports.getUpdateQueueExpirationTime = getUpdateQueueExpirationTime;

function getStateFromUpdate(update, instance, prevState, props) {
  const partialState = update.partialState;
  if (typeof partialState === 'function') {
    const updateFn = partialState;
    // $FlowFixMe - Idk how to type State correctly.
    return updateFn.call(instance, prevState, props);
  } else {
    return partialState;
  }
}

function processUpdateQueue<State>(
  queue: UpdateQueue<State>,
  instance: mixed,
  props: mixed,
  renderExpirationTime: ExpirationTime,
): State | null {
  if (__DEV__) {
    // Set this flag so we can warn if setState is called inside the update
    // function of another setState.
    queue.isProcessing = true;
  }

  // Reset the remaining expiration time. If we skip over any updates, we'll
  // increase this accordingly.
  queue.expirationTime = Done;

  let state = queue.baseState;
  let dontMutatePrevState = true;
  let update = queue.first;
  let didSkip = false;
  while (update !== null) {
    const updateExpirationTime = update.expirationTime;
    if (
      updateExpirationTime === Done ||
      updateExpirationTime > renderExpirationTime
    ) {
      // This update does not have sufficient priority. Skip it.
      const remainingExpirationTime = queue.expirationTime;
      if (
        remainingExpirationTime === Done ||
        remainingExpirationTime > updateExpirationTime
      ) {
        // Update the remaining expiration time.
        queue.expirationTime = updateExpirationTime;
      }
      if (!didSkip) {
        didSkip = true;
        queue.baseState = state;
      }
      // Continue to the next update.
      update = update.next;
      continue;
    }

    // This update does have sufficient priority.

    // If no previous updates were skipped, drop this update from the queue by
    // advancing the head of the list.
    if (!didSkip) {
      queue.first = update.next;
      if (queue.first === null) {
        queue.last = null;
      }
    }

    // Process the update
    let partialState;
    if (update.isReplace) {
      state = getStateFromUpdate(update, instance, state, props);
      dontMutatePrevState = true;
    } else {
      partialState = getStateFromUpdate(update, instance, state, props);
      if (partialState) {
        if (dontMutatePrevState) {
          // $FlowFixMe - Idk how to type State properly.
          state = Object.assign({}, state, partialState);
        } else {
          state = Object.assign(state, partialState);
        }
        dontMutatePrevState = false;
      }
    }
    if (update.isForced) {
      queue.hasForceUpdate = true;
    }
    if (update.callback !== null) {
      // Append to list of callbacks.
      if (queue.lastCallback === null) {
        queue.lastCallback = queue.firstCallback = update;
      } else {
        queue.lastCallback.nextCallback = update;
        queue.lastCallback = update;
      }
    }
    update = update.next;
  }
  if (!didSkip) {
    didSkip = true;
    queue.baseState = state;
  }

  if (__DEV__) {
    // No longer processing.
    queue.isProcessing = false;
  }

  return state;
}
exports.processUpdateQueue = processUpdateQueue;

function beginUpdateQueue<State>(
  current: Fiber | null,
  workInProgress: Fiber,
  queue: UpdateQueue<State>,
  instance: any,
  props: any,
  renderExpirationTime: ExpirationTime,
): State | null {
  if (current !== null && current.updateQueue === queue) {
    // We need to create a work-in-progress queue, by cloning the current queue.
    const currentQueue = queue;
    queue = workInProgress.updateQueue = {
      baseState: currentQueue.baseState,
      expirationTime: currentQueue.expirationTime,
      first: currentQueue.first,
      last: currentQueue.last,
      // These fields are no longer valid because they were already committed.
      // Reset them.
      firstCallback: null,
      lastCallback: null,
      hasForceUpdate: false,
    };
  }

  const state = processUpdateQueue(
    queue,
    instance,
    props,
    renderExpirationTime,
  );

  const updatedQueue = workInProgress.updateQueue;
  if (updatedQueue !== null) {
    if (updatedQueue.lastCallback !== null) {
      workInProgress.effectTag |= CallbackEffect;
    } else if (updatedQueue.first === null && !updatedQueue.hasForceUpdate) {
      // The queue is empty. We can reset it.
      workInProgress.updateQueue = null;
    }
  }

  return state;
}
exports.beginUpdateQueue = beginUpdateQueue;
