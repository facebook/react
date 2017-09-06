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

// Callbacks are not validated until invocation
type Callback = mixed;

export type Update<State> = {
  priorityLevel: PriorityLevel | null,
  expirationTime: ExpirationTime,
  partialState: PartialState<State, any>,
  callback: Callback | null,
  isReplace: boolean,
  isForced: boolean,
  isTopLevelUnmount: boolean,
  next: Update<State> | null,
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
  first: Update<State> | null,
  last: Update<State> | null,
  hasForceUpdate: boolean,
  callbackList: null | Array<Callback>,

  // Dev only
  isProcessing?: boolean,
};

let _queue1;
let _queue2;

function createUpdateQueue<State>(): UpdateQueue<State> {
  const queue: UpdateQueue = {
    first: null,
    last: null,
    hasForceUpdate: false,
    callbackList: null,
  };
  if (__DEV__) {
    queue.isProcessing = false;
  }
  return queue;
}
exports.createUpdateQueue = createUpdateQueue;

function cloneUpdate(update: Update<State>): Update<State> {
  return {
    priorityLevel: update.priorityLevel,
    expirationTime: update.expirationTime,
    partialState: update.partialState,
    callback: update.callback,
    isReplace: update.isReplace,
    isForced: update.isForced,
    isTopLevelUnmount: update.isTopLevelUnmount,
    next: null,
  };
}

const COALESCENCE_THRESHOLD: ExpirationTime = 10;

function insertUpdateIntoPosition(
  queue: UpdateQueue<State>,
  update: Update<State>,
  insertAfter: Update<State> | null,
  insertBefore: Update<State> | null,
  currentTime: ExpirationTime,
) {
  if (insertAfter !== null) {
    insertAfter.next = update;
    // If we receive multiple updates to the same fiber at the same priority
    // level, we coalesce them by assigning the same expiration time, so that
    // they all flush at the same time. Because this causes an interruption, it
    // could lead to starvation, so we stop coalescing once the time until the
    // expiration time reaches a certain threshold.
    if (
      // Only coalesce if a priority level is specified
      update.priorityLevel !== null &&
      insertAfter !== null &&
      insertAfter.priorityLevel === update.priorityLevel
    ) {
      const coalescedTime = insertAfter.expirationTime;
      if (coalescedTime - currentTime > COALESCENCE_THRESHOLD) {
        update.expirationTime = coalescedTime;
      }
    }
  } else {
    // This is the first item in the queue.
    update.next = queue.first;
    queue.first = update;
  }

  if (insertBefore !== null) {
    update.next = insertBefore;
  } else {
    // This is the last item in the queue.
    queue.last = update;
  }
}

// Returns the update after which the incoming update should be inserted into
// the queue, or null if it should be inserted at beginning.
function findInsertionPosition(
  queue: UpdateQueue<State>,
  update: Update<State>,
): Update<State> | null {
  const expirationTime = update.expirationTime;
  let insertAfter = null;
  let insertBefore = null;
  if (queue.last !== null && queue.last.expirationTime <= expirationTime) {
    // Fast path for the common case where the update should be inserted at
    // the end of the queue.
    insertAfter = queue.last;
  } else {
    insertBefore = queue.first;
    while (
      insertBefore !== null &&
      insertBefore.expirationTime <= expirationTime
    ) {
      insertAfter = insertBefore;
      insertBefore = insertBefore.next;
    }
  }
  return insertAfter;
}

function ensureUpdateQueues(fiber: Fiber) {
  const alternateFiber = fiber.alternate;

  let queue1 = fiber.updateQueue;
  if (queue1 === null) {
    queue1 = fiber.updateQueue = createUpdateQueue();
  }

  let queue2;
  if (alternateFiber !== null) {
    queue2 = alternateFiber.updateQueue;
    if (queue2 === null) {
      queue2 = alternateFiber.updateQueue = createUpdateQueue();
    }
  } else {
    queue2 = null;
  }

  _queue1 = queue1;
  // Return null if there is no alternate queue, or if its queue is the same.
  _queue2 = queue2 !== queue1 ? queue2 : null;
}

// The work-in-progress queue is a subset of the current queue (if it exists).
// We need to insert the incoming update into both lists. However, it's possible
// that the correct position in one list will be different from the position in
// the other. Consider the following case:
//
//     Current:             3-5-6
//     Work-in-progress:        6
//
// Then we receive an update with priority 4 and insert it into each list:
//
//     Current:             3-4-5-6
//     Work-in-progress:        4-6
//
// In the current queue, the new update's `next` pointer points to the update
// with priority 5. But in the work-in-progress queue, the pointer points to the
// update with priority 6. Because these two queues share the same persistent
// data structure, this won't do. (This can only happen when the incoming update
// has higher priority than all the updates in the work-in-progress queue.)
//
// To solve this, in the case where the incoming update needs to be inserted
// into two different positions, we'll make a clone of the update and insert
// each copy into a separate queue. This forks the list while maintaining a
// persistent structure, because the update that is added to the work-in-progress
// is always added to the front of the list.
//
// However, if incoming update is inserted into the same position of both lists,
// we shouldn't make a copy.
//
// If the update is cloned, it returns the cloned update.
function insertUpdateIntoFiber(
  fiber: Fiber,
  update: Update<State>,
  currentTime: ExpirationTime,
): Update<State> | null {
  // We'll have at least one and at most two distinct update queues.
  ensureUpdateQueues(fiber);
  const queue1 = _queue1;
  const queue2 = _queue2;

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

  // Find the insertion position in the first queue.
  const insertAfter1 = findInsertionPosition(queue1, update);
  const insertBefore1 = insertAfter1 !== null
    ? insertAfter1.next
    : queue1.first;

  if (queue2 === null) {
    // If there's no alternate queue, there's nothing else to do but insert.
    insertUpdateIntoPosition(
      queue1,
      update,
      insertAfter1,
      insertBefore1,
      currentTime,
    );
    return null;
  }

  // If there is an alternate queue, find the insertion position.
  const insertAfter2 = findInsertionPosition(queue2, update);
  const insertBefore2 = insertAfter2 !== null
    ? insertAfter2.next
    : queue2.first;

  // Now we can insert into the first queue. This must come after finding both
  // insertion positions because it mutates the list.
  insertUpdateIntoPosition(
    queue1,
    update,
    insertAfter1,
    insertBefore1,
    currentTime,
  );

  // See if the insertion positions are equal. Be careful to only compare
  // non-null values.
  if (
    (insertBefore1 === insertBefore2 && insertBefore1 !== null) ||
    (insertAfter1 === insertAfter2 && insertAfter1 !== null)
  ) {
    // The insertion positions are the same, so when we inserted into the first
    // queue, it also inserted into the alternate. All we need to do is update
    // the alternate queue's `first` and `last` pointers, in case they
    // have changed.
    if (insertAfter2 === null) {
      queue2.first = update;
    }
    if (insertBefore2 === null) {
      queue2.last = null;
    }
    return null;
  } else {
    // The insertion positions are different, so we need to clone the update and
    // insert the clone into the alternate queue.
    const update2 = cloneUpdate(update);
    insertUpdateIntoPosition(
      queue2,
      update2,
      insertAfter2,
      insertBefore2,
      currentTime,
    );
    return update2;
  }
}
exports.insertUpdateIntoFiber = insertUpdateIntoFiber;

function insertUpdateIntoQueue(
  queue: UpdateQueue,
  update: Update<State>,
  currentTime: ExpirationTime,
) {
  const insertAfter = findInsertionPosition(queue, update);
  const insertBefore = insertAfter !== null ? insertAfter.next : null;
  insertUpdateIntoPosition(
    queue,
    update,
    insertAfter,
    insertBefore,
    currentTime,
  );
}
exports.insertUpdateIntoQueue = insertUpdateIntoQueue;

function getUpdateExpirationTime(fiber: Fiber): ExpirationTime {
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) {
    return Done;
  }
  if (fiber.tag !== ClassComponent && fiber.tag !== HostRoot) {
    return Done;
  }
  return getUpdateQueueExpirationTime(updateQueue);
}
exports.getUpdateExpirationTime = getUpdateExpirationTime;

function getUpdateQueueExpirationTime<State>(
  updateQueue: UpdateQueue<State>,
): ExpirationTime {
  return updateQueue.first !== null ? updateQueue.first.expirationTime : Done;
}
exports.getUpdateQueueExpirationTime = getUpdateQueueExpirationTime;

function getStateFromUpdate(update, instance, prevState, props) {
  const partialState = update.partialState;
  if (typeof partialState === 'function') {
    const updateFn = partialState;
    return updateFn.call(instance, prevState, props);
  } else {
    return partialState;
  }
}

function processUpdateQueue(
  queue: UpdateQueue<State>,
  instance: mixed,
  prevState: State,
  props: mixed,
  renderExpirationTime: ExpirationTime,
): State {
  if (__DEV__) {
    // Set this flag so we can warn if setState is called inside the update
    // function of another setState.
    queue.isProcessing = true;
  }

  // Calculate these using the the existing values as a base.
  let callbackList = queue.callbackList;
  let hasForceUpdate = queue.hasForceUpdate;

  // Applies updates with matching priority to the previous state to create
  // a new state object.
  let state = prevState;
  let dontMutatePrevState = true;
  let update = queue.first;
  while (update !== null && update.expirationTime <= renderExpirationTime) {
    // Remove each update from the queue right before it is processed. That way
    // if setState is called from inside an updater function, the new update
    // will be inserted in the correct position.
    queue.first = update.next;
    if (queue.first === null) {
      queue.last = null;
    }

    let partialState;
    if (update.isReplace) {
      state = getStateFromUpdate(update, instance, state, props);
      dontMutatePrevState = true;
    } else {
      partialState = getStateFromUpdate(update, instance, state, props);
      if (partialState) {
        if (dontMutatePrevState) {
          state = Object.assign({}, state, partialState);
        } else {
          state = Object.assign(state, partialState);
        }
        dontMutatePrevState = false;
      }
    }
    if (update.isForced) {
      hasForceUpdate = true;
    }
    // Second condition ignores top-level unmount callbacks if they are not the
    // last update in the queue, since a subsequent update will cause a remount.
    if (
      update.callback !== null &&
      !(update.isTopLevelUnmount && update.next !== null)
    ) {
      callbackList = callbackList !== null ? callbackList : [];
      callbackList.push(update.callback);
    }
    update = update.next;
  }

  queue.callbackList = callbackList;
  queue.hasForceUpdate = hasForceUpdate;

  if (__DEV__) {
    // No longer processing.
    queue.isProcessing = false;
  }

  return state;
}
exports.processUpdateQueue = processUpdateQueue;

function beginUpdateQueue(
  current: Fiber | null,
  workInProgress: Fiber,
  queue: UpdateQueue<State>,
  instance: any,
  prevState: any,
  props: any,
  renderExpirationTime: ExpirationTime,
): State {
  if (current !== null && current.updateQueue === queue) {
    // We need to create a work-in-progress queue, by cloning the current queue.
    const currentQueue = queue;
    queue = workInProgress.updateQueue = {
      first: currentQueue.first,
      last: currentQueue.last,
      // These fields are no longer valid because they were already committed.
      // Reset them.
      callbackList: null,
      hasForceUpdate: false,
    };
  }

  const state = processUpdateQueue(
    queue,
    instance,
    prevState,
    props,
    renderExpirationTime,
  );

  const updatedQueue = workInProgress.updateQueue;
  if (updatedQueue !== null) {
    const callbackList = updatedQueue.callbackList;
    if (callbackList !== null) {
      workInProgress.effectTag |= CallbackEffect;
    } else if (updatedQueue.first === null && !updatedQueue.hasForceUpdate) {
      // The queue is empty. We can reset it.
      workInProgress.updateQueue = null;
    }
  }

  return state;
}
exports.beginUpdateQueue = beginUpdateQueue;
