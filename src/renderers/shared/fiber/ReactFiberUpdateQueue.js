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

const {Callback: CallbackEffect} = require('ReactTypeOfSideEffect');

const {
  NoWork,
  SynchronousPriority,
  TaskPriority,
} = require('ReactPriorityLevel');

const {ClassComponent, HostRoot} = require('ReactTypeOfWork');

const invariant = require('fbjs/lib/invariant');
if (__DEV__) {
  var warning = require('fbjs/lib/warning');
}

type PartialState<State, Props> =
  | $Subtype<State>
  | ((prevState: State, props: Props) => $Subtype<State>);

// Callbacks are not validated until invocation
type Callback = mixed;

type Update = {
  priorityLevel: PriorityLevel,
  partialState: PartialState<any, any>,
  callback: Callback | null,
  isReplace: boolean,
  isForced: boolean,
  isTopLevelUnmount: boolean,
  next: Update | null,
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
export type UpdateQueue = {
  first: Update | null,
  last: Update | null,
  hasForceUpdate: boolean,
  callbackList: null | Array<Callback>,

  // Dev only
  isProcessing?: boolean,
};

let _queue1;
let _queue2;

function comparePriority(a: PriorityLevel, b: PriorityLevel): number {
  // When comparing update priorities, treat sync and Task work as equal.
  // TODO: Could we avoid the need for this by always coercing sync priority
  // to Task when scheduling an update?
  if (
    (a === TaskPriority || a === SynchronousPriority) &&
    (b === TaskPriority || b === SynchronousPriority)
  ) {
    return 0;
  }
  if (a === NoWork && b !== NoWork) {
    return -255;
  }
  if (a !== NoWork && b === NoWork) {
    return 255;
  }
  return a - b;
}

function createUpdateQueue(): UpdateQueue {
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

function cloneUpdate(update: Update): Update {
  return {
    priorityLevel: update.priorityLevel,
    partialState: update.partialState,
    callback: update.callback,
    isReplace: update.isReplace,
    isForced: update.isForced,
    isTopLevelUnmount: update.isTopLevelUnmount,
    next: null,
  };
}

function insertUpdateIntoQueue(
  queue: UpdateQueue,
  update: Update,
  insertAfter: Update | null,
  insertBefore: Update | null,
) {
  if (insertAfter !== null) {
    insertAfter.next = update;
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
function findInsertionPosition(queue, update): Update | null {
  const priorityLevel = update.priorityLevel;
  let insertAfter = null;
  let insertBefore = null;
  if (
    queue.last !== null &&
    comparePriority(queue.last.priorityLevel, priorityLevel) <= 0
  ) {
    // Fast path for the common case where the update should be inserted at
    // the end of the queue.
    insertAfter = queue.last;
  } else {
    insertBefore = queue.first;
    while (
      insertBefore !== null &&
      comparePriority(insertBefore.priorityLevel, priorityLevel) <= 0
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
function insertUpdate(fiber: Fiber, update: Update): Update | null {
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
    insertUpdateIntoQueue(queue1, update, insertAfter1, insertBefore1);
    return null;
  }

  // If there is an alternate queue, find the insertion position.
  const insertAfter2 = findInsertionPosition(queue2, update);
  const insertBefore2 = insertAfter2 !== null
    ? insertAfter2.next
    : queue2.first;

  // Now we can insert into the first queue. This must come after finding both
  // insertion positions because it mutates the list.
  insertUpdateIntoQueue(queue1, update, insertAfter1, insertBefore1);

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
    insertUpdateIntoQueue(queue2, update2, insertAfter2, insertBefore2);
    return update2;
  }
}

function addUpdate(
  fiber: Fiber,
  partialState: PartialState<any, any> | null,
  callback: mixed,
  priorityLevel: PriorityLevel,
): void {
  const update = {
    priorityLevel,
    partialState,
    callback,
    isReplace: false,
    isForced: false,
    isTopLevelUnmount: false,
    next: null,
  };
  insertUpdate(fiber, update);
}
exports.addUpdate = addUpdate;

function addReplaceUpdate(
  fiber: Fiber,
  state: any | null,
  callback: Callback | null,
  priorityLevel: PriorityLevel,
): void {
  const update = {
    priorityLevel,
    partialState: state,
    callback,
    isReplace: true,
    isForced: false,
    isTopLevelUnmount: false,
    next: null,
  };
  insertUpdate(fiber, update);
}
exports.addReplaceUpdate = addReplaceUpdate;

function addForceUpdate(
  fiber: Fiber,
  callback: Callback | null,
  priorityLevel: PriorityLevel,
): void {
  const update = {
    priorityLevel,
    partialState: null,
    callback,
    isReplace: false,
    isForced: true,
    isTopLevelUnmount: false,
    next: null,
  };
  insertUpdate(fiber, update);
}
exports.addForceUpdate = addForceUpdate;

function getUpdatePriority(fiber: Fiber): PriorityLevel {
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) {
    return NoWork;
  }
  if (fiber.tag !== ClassComponent && fiber.tag !== HostRoot) {
    return NoWork;
  }
  return updateQueue.first !== null ? updateQueue.first.priorityLevel : NoWork;
}
exports.getUpdatePriority = getUpdatePriority;

function addTopLevelUpdate(
  fiber: Fiber,
  partialState: PartialState<any, any>,
  callback: Callback | null,
  priorityLevel: PriorityLevel,
): void {
  const isTopLevelUnmount = partialState.element === null;

  const update = {
    priorityLevel,
    partialState,
    callback,
    isReplace: false,
    isForced: false,
    isTopLevelUnmount,
    next: null,
  };
  const update2 = insertUpdate(fiber, update);

  if (isTopLevelUnmount) {
    // TODO: Redesign the top-level mount/update/unmount API to avoid this
    // special case.
    const queue1 = _queue1;
    const queue2 = _queue2;

    // Drop all updates that are lower-priority, so that the tree is not
    // remounted. We need to do this for both queues.
    if (queue1 !== null && update.next !== null) {
      update.next = null;
      queue1.last = update;
    }
    if (queue2 !== null && update2 !== null && update2.next !== null) {
      update2.next = null;
      queue2.last = update;
    }
  }
}
exports.addTopLevelUpdate = addTopLevelUpdate;

function getStateFromUpdate(update, instance, prevState, props) {
  const partialState = update.partialState;
  if (typeof partialState === 'function') {
    const updateFn = partialState;
    return updateFn.call(instance, prevState, props);
  } else {
    return partialState;
  }
}

function beginUpdateQueue(
  current: Fiber | null,
  workInProgress: Fiber,
  queue: UpdateQueue,
  instance: any,
  prevState: any,
  props: any,
  priorityLevel: PriorityLevel,
): any {
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
  while (
    update !== null &&
    comparePriority(update.priorityLevel, priorityLevel) <= 0
  ) {
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
      workInProgress.effectTag |= CallbackEffect;
    }
    update = update.next;
  }

  queue.callbackList = callbackList;
  queue.hasForceUpdate = hasForceUpdate;

  if (queue.first === null && callbackList === null && !hasForceUpdate) {
    // The queue is empty and there are no callbacks. We can reset it.
    workInProgress.updateQueue = null;
  }

  if (__DEV__) {
    // No longer processing.
    queue.isProcessing = false;
  }

  return state;
}
exports.beginUpdateQueue = beginUpdateQueue;

function commitCallbacks(
  finishedWork: Fiber,
  queue: UpdateQueue,
  context: mixed,
) {
  const callbackList = queue.callbackList;
  if (callbackList === null) {
    return;
  }

  // Set the list to null to make sure they don't get called more than once.
  queue.callbackList = null;

  for (let i = 0; i < callbackList.length; i++) {
    const callback = callbackList[i];
    invariant(
      typeof callback === 'function',
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: %s',
      callback,
    );
    callback.call(context);
  }
}
exports.commitCallbacks = commitCallbacks;
