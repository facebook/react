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
  Callback: CallbackEffect,
} = require('ReactTypeOfSideEffect');

const {
  NoWork,
  SynchronousPriority,
  TaskPriority,
} = require('ReactPriorityLevel');

const warning = require('warning');

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
  hasForceUpdate: boolean,

  // Dev only
  isProcessing?: boolean,
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
    return -255;
  }
  if (a !== NoWork && b === NoWork) {
    return 255;
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

  let queue;
  if (__DEV__) {
    queue = {
      first: null,
      last: null,
      hasForceUpdate: false,
      isProcessing: false,
    };
  } else {
    queue = {
      first: null,
      last: null,
      hasForceUpdate: false,
    };
  }

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
  altQueue.hasForceUpdate = sourceQueue.hasForceUpdate;
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

// Returns the update after which the incoming update should be inserted into
// the queue, or null if it should be inserted at beginning.
function findInsertionPosition(queue, update) : Update | null {
  const priorityLevel = update.priorityLevel;
  let insertAfter = null;
  let insertBefore = null;
  if (queue.last && comparePriority(queue.last.priorityLevel, priorityLevel) <= 0) {
    // Fast path for the common case where the update should be inserted at
    // the end of the queue.
    insertAfter = queue.last;
  } else {
    insertBefore = queue.first;
    while (insertBefore && comparePriority(insertBefore.priorityLevel, priorityLevel) <= 0) {
      insertAfter = insertBefore;
      insertBefore = insertBefore.next;
    }
  }
  return insertAfter;
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
function insertUpdate(fiber : Fiber, update : Update, methodName : ?string) : void {
  const queue1 = ensureUpdateQueue(fiber);
  const queue2 = fiber.alternate ? ensureUpdateQueue(fiber.alternate) : null;

  // Warn if an update is scheduled from inside an updater function.
  if (__DEV__ && typeof methodName === 'string') {
    if (queue1.isProcessing || (queue2 && queue2.isProcessing)) {
      if (methodName === 'setState') {
        warning(
          false,
          'setState was called from inside the updater function of another' +
          'setState. A function passed as the first argument of setState ' +
          'should not contain any side-effects. Return a partial state ' +
          'object instead of calling setState again. Example: ' +
          'this.setState(function(state) { return { count: state.count + 1 }; })'
        );
      } else {
        warning(
          false,
          '%s was called from inside the updater function of setState. A ' +
          'function passed as the first argument of setState ' +
          'should not contain any side-effects.',
          methodName
        );
      }
    }
  }

  // Find the insertion position in the first queue.
  const insertAfter1 = findInsertionPosition(queue1, update);
  const insertBefore1 = insertAfter1 ? insertAfter1.next : queue1.first;

  if (!queue2) {
    // If there's no alternate queue, there's nothing else to do but insert.
    insertUpdateIntoQueue(queue1, update, insertAfter1, insertBefore1);
    return;
  }

  // If there is an alternate queue, find the insertion position.
  const insertAfter2 = findInsertionPosition(queue2, update);
  const insertBefore2 = insertAfter2 ? insertAfter2.next : queue2.first;

  // Now we can insert into the first queue. This must come after finding both
  // insertion positions because it mutates the list.
  insertUpdateIntoQueue(queue1, update, insertAfter1, insertBefore1);

  if (insertBefore1 !== insertBefore2) {
    // The insertion positions are different, so we need to clone the update and
    // insert the clone into the alternate queue.
    const update2 = cloneUpdate(update);
    insertUpdateIntoQueue(queue2, update2, insertAfter2, insertBefore2);
  } else {
    // The insertion positions are the same, so when we inserted into the first
    // queue, it also inserted into the alternate. All we need to do is update
    // the alternate queue's `first` and `last` pointers, in case they
    // have changed.
    if (!insertAfter2) {
      queue2.first = update;
    }
    if (!insertBefore2) {
      queue2.last = null;
    }
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
  if (__DEV__) {
    insertUpdate(fiber, update, 'setState');
  } else {
    insertUpdate(fiber, update);
  }
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

  if (__DEV__) {
    insertUpdate(fiber, update, 'replaceState');
  } else {
    insertUpdate(fiber, update);
  }
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
  if (__DEV__) {
    insertUpdate(fiber, update, 'forceUpdate');
  } else {
    insertUpdate(fiber, update);
  }
}
exports.addForceUpdate = addForceUpdate;


function addCallback(fiber : Fiber, callback: Callback, priorityLevel : PriorityLevel) : void {
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
  if (__DEV__) {
    // Set this flag so we can warn if setState is called inside the update
    // function of another setState.
    queue.isProcessing = true;
  }

  queue.hasForceUpdate = false;

  // Applies updates with matching priority to the previous state to create
  // a new state object.
  let state = prevState;
  let dontMutatePrevState = true;
  let callbackList = null;
  let update = queue.first;
  while (update && comparePriority(update.priorityLevel, priorityLevel) <= 0) {
    // Remove each update from the queue right before it is processed. That way
    // if setState is called from inside an updater function, the new update
    // will be inserted in the correct position.
    queue.first = update.next;
    if (!queue.first) {
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
      queue.hasForceUpdate = true;
    }
    if (update.callback) {
      if (callbackList && callbackList.last) {
        callbackList.last.next = update;
        callbackList.last = update;
      } else {
        const callbackUpdate = cloneUpdate(update);
        callbackList = {
          first: callbackUpdate,
          last: callbackUpdate,
          hasForceUpdate: false,
        };
      }
      workInProgress.effectTag |= CallbackEffect;
    }
    update = update.next;
  }

  if (!queue.first && !queue.hasForceUpdate) {
    // Queue is now empty
    workInProgress.updateQueue = null;
  }

  workInProgress.callbackList = callbackList;

  if (__DEV__) {
    queue.isProcessing = false;
  }

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
