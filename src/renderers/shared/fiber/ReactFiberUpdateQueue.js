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

const invariant = require('invariant');
if (__DEV__) {
  var warning = require('warning');
}

type PartialState<State, Props> =
  $Subtype<State> |
  (prevState: State, props: Props) => $Subtype<State>;

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
      callbackList: null,
      isProcessing: false,
    };
  } else {
    queue = {
      first: null,
      last: null,
      hasForceUpdate: false,
      callbackList: null,
    };
  }

  fiber.updateQueue = queue;
  return queue;
}

// Clones an update queue from a source fiber onto its alternate.
function cloneUpdateQueue(current : Fiber, workInProgress : Fiber) : UpdateQueue | null {
  const currentQueue = current.updateQueue;
  if (!currentQueue) {
    // The source fiber does not have an update queue.
    workInProgress.updateQueue = null;
    return null;
  }
  // If the alternate already has a queue, reuse the previous object.
  const altQueue = workInProgress.updateQueue || {};
  altQueue.first = currentQueue.first;
  altQueue.last = currentQueue.last;

  // These fields are invalid by the time we clone from current. Reset them.
  altQueue.hasForceUpdate = false;
  altQueue.callbackList = null;
  altQueue.isProcessing = false;

  workInProgress.updateQueue = altQueue;

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
    isTopLevelUnmount: update.isTopLevelUnmount,
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
//
// If the update is cloned, it returns the cloned update.
function insertUpdate(fiber : Fiber, update : Update, methodName : string) : Update | null {
  const queue1 = ensureUpdateQueue(fiber);
  const queue2 = fiber.alternate ? ensureUpdateQueue(fiber.alternate) : null;

  // Warn if an update is scheduled from inside an updater function.
  if (__DEV__) {
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
    return null;
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
    return update2;
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

  return null;
}

function addUpdate(
  fiber : Fiber,
  partialState : PartialState<any, any> | null,
  callback : mixed,
  priorityLevel : PriorityLevel
) : void {
  const update = {
    priorityLevel,
    partialState,
    callback,
    isReplace: false,
    isForced: false,
    isTopLevelUnmount: false,
    next: null,
  };
  insertUpdate(fiber, update, 'setState');
}
exports.addUpdate = addUpdate;

function addReplaceUpdate(
  fiber : Fiber,
  state : any | null,
  callback : Callback | null,
  priorityLevel : PriorityLevel
) : void {
  const update = {
    priorityLevel,
    partialState: state,
    callback,
    isReplace: true,
    isForced: false,
    isTopLevelUnmount: false,
    next: null,
  };
  insertUpdate(fiber, update, 'replaceState');
}
exports.addReplaceUpdate = addReplaceUpdate;

function addForceUpdate(
  fiber : Fiber,
  callback : Callback | null,
  priorityLevel : PriorityLevel
) : void {
  const update = {
    priorityLevel,
    partialState: null,
    callback,
    isReplace: false,
    isForced: true,
    isTopLevelUnmount: false,
    next: null,
  };
  insertUpdate(fiber, update, 'forceUpdate');
}
exports.addForceUpdate = addForceUpdate;

function getPendingPriority(queue : UpdateQueue) : PriorityLevel {
  return queue.first ? queue.first.priorityLevel : NoWork;
}
exports.getPendingPriority = getPendingPriority;

function addTopLevelUpdate(
  fiber : Fiber,
  partialState : PartialState<any, any>,
  callback : Callback | null,
  priorityLevel : PriorityLevel
) : void {
  const isTopLevelUnmount = Boolean(
    partialState &&
    partialState.element === null
  );

  const update = {
    priorityLevel,
    partialState,
    callback,
    isReplace: false,
    isForced: false,
    isTopLevelUnmount,
    next: null,
  };
  const update2 = insertUpdate(fiber, update, 'render');

  if (isTopLevelUnmount) {
    // Drop all updates that are lower-priority, so that the tree is not
    // remounted. We need to do this for both queues.
    const queue1 = fiber.updateQueue;
    const queue2 = fiber.alternate && fiber.alternate.updateQueue;

    if (queue1 && update.next) {
      update.next = null;
      queue1.last = update;
    }
    if (queue2 && update2 && update2.next) {
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
    // Second condition ignores top-level unmount callbacks if they are not the
    // last update in the queue, since a subsequent update will cause a remount.
    if (update.callback !== null && !(update.isTopLevelUnmount && update.next !== null)) {
      callbackList = callbackList || [];
      callbackList.push(update.callback);
      workInProgress.effectTag |= CallbackEffect;
    }
    update = update.next;
  }

  queue.callbackList = callbackList;

  if (!queue.first && !callbackList && !queue.hasForceUpdate) {
    // The queue is empty and there are no callbacks. We can reset it.
    workInProgress.updateQueue = null;
  }

  if (__DEV__) {
    queue.isProcessing = false;
  }

  return state;
}
exports.beginUpdateQueue = beginUpdateQueue;

function commitCallbacks(finishedWork : Fiber, queue : UpdateQueue, context : mixed) {
  const callbackList = queue.callbackList;
  if (!callbackList) {
    return;
  }
  for (let i = 0; i < callbackList.length; i++) {
    const callback = callbackList[i];
    invariant(
      typeof callback === 'function',
      'Invalid argument passed as callback. Expected a function. Instead ' +
      'received: %s',
      String(callback)
    );
    callback.call(context);
  }
}
exports.commitCallbacks = commitCallbacks;
