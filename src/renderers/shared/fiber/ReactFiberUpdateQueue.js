/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberUpdateQueue
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';
import type { PriorityLevel } from 'ReactPriorityLevel';

const {
  ForceUpdate,
  Callback: CallbackEffect,
} = require('ReactTypeOfSideEffect');

const {
  NoWork,
  SynchronousPriority,
  TaskPriority,
} = require('ReactPriorityLevel');

type PartialState<State, Props> =
  $Subtype<State> |
  (prevState: State, props: Props) => $Subtype<State>;

type Callback = () => void;

type Update = {
  priorityLevel: PriorityLevel,
  partialState: PartialState<any, any>,
  callback: Callback | null,
  isReplace: boolean,
  isForced: boolean,
  next: Update | null,
};

// Linked-list of updates
//
// - A "pending" update is one that has been scheduled but not yet used
// for reconciliation.
// - A "progressed" update is an update that was used for reconciliation, but
// has not yet been flushed.
//
// The queue maintains a pointer to the last progressed update in the list.
// Updates that come after that pointer are pending. The pointer is set to the
// end of the list during reconciliation.
//
// Pending updates are sorted by priority then insertion. Progressed updates
// are sorted by the order in which they were applied during reconciliation,
// which may not be by priority: if a component bails out before the updates are
// committed, in the next render, the progressed updates are applied in the same
// order that they were previously, even if a higher priority update comes in.
//
// Once a progressed update is flushed/committed, it's removed from the queue.
export type UpdateQueue = {
  first: Update | null,
  // A pointer to the last progressed update in the queue. This may be null
  // even in a non-empty queue, if all the updates are pending.
  lastProgressedUpdate: Update | null,
  last: Update | null,
};

function comparePriority(a : PriorityLevel, b : PriorityLevel) : number {
  // When comparing update priorities, treat sync and Task work as equal.
  // TODO: Could we avoid the need for this by always coercing sync priority
  // to Task when scheduling an update?
  if ((a === TaskPriority || a === SynchronousPriority) &&
      (b === TaskPriority || b === SynchronousPriority)) {
    return 0;
  }
  if (a === NoWork && b !== NoWork) {
    return -Infinity;
  }
  if (a !== NoWork && b === NoWork) {
    return Infinity;
  }
  return a - b;
}

function getFirstPendingUpdate(queue : UpdateQueue) : Update | null {
  if (queue.lastProgressedUpdate) {
    return queue.lastProgressedUpdate.next;
  }
  return queue.first;
}

function getFirstProgressedUpdate(queue : UpdateQueue) : Update | null {
  if (queue.lastProgressedUpdate) {
    return queue.first;
  }
  return null;
}

function hasPendingUpdate(queue : UpdateQueue, priorityLevel : PriorityLevel) : boolean {
  const firstPendingUpdate = getFirstPendingUpdate(queue);
  if (!firstPendingUpdate) {
    return false;
  }
  // Return true if the first pending update has greater or equal priority.
  return comparePriority(firstPendingUpdate.priorityLevel, priorityLevel) <= 0;
}
exports.hasPendingUpdate = hasPendingUpdate;

// Ensures that a fiber and its alternate have an update queue, creating a new
// one if needed. Returns the new or existing queue.
function ensureUpdateQueue(fiber : Fiber) : UpdateQueue {
  if (fiber.updateQueue) {
    // We already have an update queue.
    return fiber.updateQueue;
  }
  const queue : UpdateQueue = {
    first: null,
    lastProgressedUpdate: null,
    last: null,
  };
  fiber.updateQueue = queue;
  // Add queue to the alternate as well, because when we call setState we don't
  // know which tree is current.
  if (fiber.alternate) {
    fiber.alternate.updateQueue = queue;
  }
  return queue;
}
exports.ensureUpdateQueue = ensureUpdateQueue;

function insertUpdateIntoQueue(queue : UpdateQueue, update : Update) : void {
  // Add a pending update to the end of the queue.
  if (!queue.last) {
    // The queue is empty.
    queue.first = queue.last = update;
    return;
  }
  // The queue is not empty. Insert the new update into the queue, sorted by
  // priority then insertion order.
  const firstPendingUpdate = getFirstPendingUpdate(queue);
  if (!firstPendingUpdate && queue.last) {
    // This is the first pending update. Add it to the end of the queue.
    queue.last.next = update;
    queue.last = update;
    return;
  }

  const priorityLevel = update.priorityLevel;
  const lastPendingUpdate = queue.last;

  let insertAfter;
  let insertBefore;
  if (queue.last && comparePriority(queue.last.priorityLevel, priorityLevel) <= 0) {
    // Fast path where the incoming update has equal or lower priority than the
    // last pending update. We can just append it to the end of the queue.
    insertAfter = lastPendingUpdate;
    insertBefore = null;
  } else {
    // Loop through the pending updates to find the first one with lower
    // priority than the incoming update. Insert the incoming update before
    // that one.
    insertAfter = queue.lastProgressedUpdate;
    insertBefore = firstPendingUpdate;
    while (
      insertBefore &&
      comparePriority(insertBefore.priorityLevel, priorityLevel) <= 0
    ) {
      insertAfter = insertBefore;
      insertBefore = insertBefore.next;
    }
  }

  if (insertAfter) {
    insertAfter.next = update;
  } else {
    // This is the first item in the queue.
    queue.first = update;
  }

  if (insertBefore) {
    update.next = insertBefore;
  } else {
    // This is the last item in the queue.
    queue.last = update;
  }
}

function addUpdate(
  queue : UpdateQueue,
  partialState : PartialState<any, any> | null,
  priorityLevel : PriorityLevel
) : void {
  const update : Update = {
    priorityLevel,
    partialState,
    callback: null,
    isReplace: false,
    isForced: false,
    next: null,
  };
  insertUpdateIntoQueue(queue, update);
}
exports.addUpdate = addUpdate;

function addReplaceUpdate(
  queue : UpdateQueue,
  state : any | null,
  priorityLevel : PriorityLevel
) : void {
  const update : Update = {
    priorityLevel,
    partialState: state,
    callback: null,
    isReplace: true,
    isForced: false,
    next: null,
  };
  // Add a pending update to the end of the queue.
  if (!queue.last) {
    // The queue is empty.
    queue.first = queue.last = update;
    return;
  }
  // The queue is not empty. Insert the new update into the queue, sorted by
  // priority then insertion order. Since this is a replace, drop all pending
  // updates with equal priority. We can't drop updates with higher priority,
  // because they might be flushed in an earlier commit. We'll drop them during
  // the commit phase if necessary.
  const firstPendingUpdate = getFirstPendingUpdate(queue);
  if (!firstPendingUpdate && queue.last) {
    // This is the first pending update. Add it to the end of the queue.
    queue.last.next = update;
    queue.last = update;
    return;
  }

  // Find the last pending update with equal priority.
  let replaceAfter = queue.lastProgressedUpdate;
  let replaceBefore = firstPendingUpdate;
  if (replaceBefore) {
    let comparison = Infinity;
    while (replaceBefore &&
           (comparison = comparePriority(replaceBefore.priorityLevel, priorityLevel)) <= 0) {
      if (comparison < 0) {
        replaceAfter = replaceBefore;
      }
      replaceBefore = replaceBefore.next;
    }
  }

  if (replaceAfter) {
    replaceAfter.next = update;
  } else {
    // This is the first item in the queue.
    queue.first = update;
  }

  if (replaceBefore) {
    update.next = replaceBefore;
  } else {
    // This is the last item in the queue.
    queue.last = update;
  }
}
exports.addReplaceUpdate = addReplaceUpdate;

function addForceUpdate(queue : UpdateQueue, priorityLevel : PriorityLevel) : void {
  const update : Update = {
    priorityLevel,
    partialState: null,
    callback: null,
    isReplace: false,
    isForced: true,
    next: null,
  };
  insertUpdateIntoQueue(queue, update);
}
exports.addForceUpdate = addForceUpdate;


function addCallback(queue : UpdateQueue, callback: Callback, priorityLevel : PriorityLevel) : void {
  if (getFirstPendingUpdate(queue) &&
      queue.last &&
      (queue.last.priorityLevel === priorityLevel) &&
      !queue.last.callback) {
    // If pending updates already exist, and the last pending update does not
    // have a callback, and the priority levels are equal, we can add the
    // incoming callback to that update to avoid an extra allocation.
    queue.last.callback = callback;
    return;
  }

  const update : Update = {
    priorityLevel,
    partialState: null,
    callback,
    isReplace: false,
    isForced: false,
    next: null,
  };
  insertUpdateIntoQueue(queue, update);
}
exports.addCallback = addCallback;

function getPendingPriority(queue : UpdateQueue) : PriorityLevel {
  const firstPendingUpdate = getFirstPendingUpdate(queue);
  return firstPendingUpdate ? firstPendingUpdate.priorityLevel : NoWork;
}
exports.getPendingPriority = getPendingPriority;

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
  workInProgress : Fiber,
  queue : UpdateQueue,
  instance : any,
  prevState : any,
  props : any,
  priorityLevel : PriorityLevel
) : any {
  // Applies updates with matching priority to the previous state to create
  // a new state object. If an update was used previously but never flushed
  // due to a bail out, it's used again regardless of its priority.

  // Reset these flags. We'll update them while looping through the queue.
  workInProgress.effectTag &= ~ForceUpdate;
  workInProgress.effectTag &= ~CallbackEffect;

  const prevLastProgressedUpdate = queue.lastProgressedUpdate;
  let state = prevState;
  let dontMutatePrevState = true;
  let isEmpty = true;
  let alreadyProgressedUpdate = Boolean(prevLastProgressedUpdate);
  let lastProgressedUpdate = null;
  let update : Update | null = queue.first;
  while (update && (
    alreadyProgressedUpdate ||
    comparePriority(update.priorityLevel, priorityLevel) <= 0
  )) {
    let partialState;
    if (update.isReplace) {
      // A replace should drop all previous updates in the queue, so
      // use the original `prevState`, not the accumulated `state`
      state = getStateFromUpdate(update, instance, prevState, props);
      dontMutatePrevState = true;
      isEmpty = false;
    } else {
      partialState = getStateFromUpdate(update, instance, state, props);
      if (partialState) {
        if (dontMutatePrevState) {
          state = Object.assign({}, state, partialState);
        } else {
          state = Object.assign(state, partialState);
        }
        dontMutatePrevState = false;
        isEmpty = false;
      }
    }
    if (update.isForced) {
      workInProgress.effectTag |= ForceUpdate;
    }
    if (update.callback) {
      workInProgress.effectTag |= CallbackEffect;
    }
    if (update === prevLastProgressedUpdate) {
      alreadyProgressedUpdate = false;
    }
    lastProgressedUpdate = update;
    update = update.next;
  }


  // Mark the point in the queue where we stopped applying updates
  queue.lastProgressedUpdate = lastProgressedUpdate;

  if (isEmpty) {
    // None of the updates contained state. Return the original state object.
    return prevState;
  }

  return state;
}
exports.beginUpdateQueue = beginUpdateQueue;

function commitUpdateQueue(finishedWork : Fiber, queue : UpdateQueue, context : mixed) {

  if (finishedWork.effectTag & CallbackEffect) {
    // Call the callbacks on all the non-pending updates.
    let update = getFirstProgressedUpdate(queue);
    while (update && update !== getFirstPendingUpdate(queue)) {
      const callback = update.callback;
      if (typeof callback === 'function') {
        callback.call(context);
      }
      update = update.next;
    }
  }

  // Drop all comitted updates, leaving only the pending updates.
  queue.first = getFirstPendingUpdate(queue);
  queue.lastProgressedUpdate = null;
  if (!queue.first) {
    queue.last = queue.lastProgressedUpdate = null;

    // If the list is now empty, we can remove it from the finished work
    finishedWork.updateQueue = null;
    if (finishedWork.alternate) {
      // Normally we don't mutate the current tree, but we do for updates.
      // The queue on the work in progress is always the same as the queue
      // on the current.
      finishedWork.alternate.updateQueue = null;
    }
  }
}
exports.commitUpdateQueue = commitUpdateQueue;
