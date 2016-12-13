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

function hasPendingUpdate(queue : UpdateQueue, priorityLevel : PriorityLevel) : boolean {
  if (!queue.first) {
    return false;
  }
  // Return true if the first pending update has greater or equal priority.
  return comparePriority(queue.first.priorityLevel, priorityLevel) <= 0;
}
exports.hasPendingUpdate = hasPendingUpdate;

// Ensures that a fiber has an update queue, creating a new one if needed.
// Returns the new or existing queue.
function ensureUpdateQueue(fiber : Fiber) : UpdateQueue {
  if (fiber.updateQueue) {
    // We already have an update queue.
    return fiber.updateQueue;
  }
  const queue = {
    first: null,
    last: null,
  };
  fiber.updateQueue = queue;
  return queue;
}

// Clones an update queue from a source fiber onto its alternate.
function cloneUpdateQueue(alt : Fiber, fiber : Fiber) : UpdateQueue | null {
  const sourceQueue = fiber.updateQueue;
  if (!sourceQueue) {
    // The source fiber does not have an update queue.
    alt.updateQueue = null;
    return null;
  }
  // If the alternate already has a queue, reuse the previous object.
  const altQueue = alt.updateQueue || {};
  altQueue.first = sourceQueue.first;
  altQueue.last = sourceQueue.last;
  alt.updateQueue = altQueue;
  return altQueue;
}
exports.cloneUpdateQueue = cloneUpdateQueue;

function cloneUpdate(update : Update) : Update {
  return {
    priorityLevel: update.priorityLevel,
    partialState: update.partialState,
    callback: update.callback,
    isReplace: update.isReplace,
    isForced: update.isForced,
    next: null,
  };
}

function insertUpdateIntoQueue(queue, update, insertAfter, insertBefore) {
  if (insertAfter) {
    insertAfter.next = update;
  } else {
    // This is the first item in the queue.
    update.next = queue.first;
    queue.first = update;
  }

  if (insertBefore) {
    update.next = insertBefore;
  } else {
    // This is the last item in the queue.
    queue.last = update;
  }
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
// persistent stucture, because the update that is added to the work-in-progress
// is always added to the front of the list.
//
// However, if incoming update is inserted into the same position of both lists,
// we shouldn't make a copy.
function insertUpdate(fiber : Fiber, update : Update) : void {
  const queue1 = ensureUpdateQueue(fiber);
  const queue2 = fiber.alternate ? ensureUpdateQueue(fiber.alternate) : null;

  const priorityLevel = update.priorityLevel;

  // TODO: Fast path where last item in the queue has greater or equal priority.

  let insertAfter1 = null;
  let insertBefore1 = queue1.first;
  while (insertBefore1 && comparePriority(insertBefore1.priorityLevel, priorityLevel) <= 0) {
    insertAfter1 = insertBefore1;
    insertBefore1 = insertBefore1.next;
  }
  const update1 = update;

  let insertAfter2 = null;
  let insertBefore2 = null;
  let update2 = null;
  if (queue2) {
    insertBefore2 = queue2.first;
    while (insertBefore2 && comparePriority(insertBefore2.priorityLevel, priorityLevel) <= 0) {
      insertAfter2 = insertBefore2;
      insertBefore2 = insertBefore2.next;
    }

    if (insertBefore1 === insertBefore2) {
      // The update is inserted into the same position of both lists. There's no
      // need to clone the update.
      update2 = update1;
    } else {
      // The update is inserted into two separate positions. Make a clone of the
      // update and insert it twice. One or the other will be dropped the next
      // time we commit.
      update2 = cloneUpdate(update1);
    }
  }

  // Now we're ready to insert the updates into their queues.
  insertUpdateIntoQueue(queue1, update1, insertAfter1, insertBefore1);
  if (queue2 && update2) {
    insertUpdateIntoQueue(queue2, update2, insertAfter2, insertBefore2);
  }
}

function addUpdate(
  fiber : Fiber,
  partialState : PartialState<any, any> | null,
  priorityLevel : PriorityLevel
) : void {
  const update = {
    priorityLevel,
    partialState,
    callback: null,
    isReplace: false,
    isForced: false,
    next: null,
  };
  insertUpdate(fiber, update);
}
exports.addUpdate = addUpdate;

function addReplaceUpdate(
  fiber : Fiber,
  state : any | null,
  priorityLevel : PriorityLevel
) : void {
  const update = {
    priorityLevel,
    partialState: state,
    callback: null,
    isReplace: true,
    isForced: false,
    next: null,
  };

  // Drop all updates with equal priority
  let queue = ensureUpdateQueue(fiber);
  for (let i = 0; queue && i < 2; i++) {
    let replaceAfter = null;
    let replaceBefore = queue.first;
    let comparison = Infinity;
    while (replaceBefore &&
           (comparison = comparePriority(replaceBefore.priorityLevel, priorityLevel)) <= 0) {
      if (comparison < 0) {
        replaceAfter = replaceBefore;
      }
      replaceBefore = replaceBefore.next;
    }

    if (replaceAfter) {
      replaceAfter.next = replaceBefore;
    } else {
      queue.first = replaceBefore;
    }

    if (!replaceBefore) {
      queue.last = replaceAfter;
    }

    if (fiber.alternate) {
      queue = ensureUpdateQueue(fiber.alternate);
    } else {
      queue = null;
    }
  }

  insertUpdate(fiber, update);
}
exports.addReplaceUpdate = addReplaceUpdate;

function addForceUpdate(fiber : Fiber, priorityLevel : PriorityLevel) : void {
  const update = {
    priorityLevel,
    partialState: null,
    callback: null,
    isReplace: false,
    isForced: true,
    next: null,
  };
  insertUpdate(fiber, update);
}
exports.addForceUpdate = addForceUpdate;


function addCallback(fiber : Fiber, callback: Callback, priorityLevel : PriorityLevel) : void {
  // TODO: Fast path where last item in queue has equal priority.
  const update : Update = {
    priorityLevel,
    partialState: null,
    callback,
    isReplace: false,
    isForced: false,
    next: null,
  };
  insertUpdate(fiber, update);
}
exports.addCallback = addCallback;

function getPendingPriority(queue : UpdateQueue) : PriorityLevel {
  return queue.first ? queue.first.priorityLevel : NoWork;
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
  // a new state object.

  let state = prevState;
  let dontMutatePrevState = true;
  let isEmpty = true;
  let callbackList = null;
  let update = queue.first;
  while (update && comparePriority(update.priorityLevel, priorityLevel) <= 0) {
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
      if (callbackList && callbackList.last) {
        callbackList.last.next = update;
        callbackList.last = update;
      } else {
        callbackList = {
          first: update,
          last: update,
        };
      }
      workInProgress.effectTag |= CallbackEffect;
    }
    update = update.next;
  }

  if (isEmpty) {
    // None of the updates contained state. Use the original state object.
    state = prevState;
  }

  if (update) {
    queue.first = update;
  } else {
    // Queue is now empty
    workInProgress.updateQueue = null;
  }

  workInProgress.callbackList = callbackList;
  workInProgress.memoizedState = state;

  return state;
}
exports.beginUpdateQueue = beginUpdateQueue;

function commitCallbacks(finishedWork : Fiber, callbackList : UpdateQueue, context : mixed) {
  const stopAfter = callbackList.last;
  let update = callbackList.first;
  while (update) {
    const callback = update.callback;
    if (typeof callback === 'function') {
      callback.call(context);
    }
    if (update === stopAfter) {
      break;
    }
    update = update.next;
  }
  finishedWork.callbackList = null;
}
exports.commitCallbacks = commitCallbacks;
