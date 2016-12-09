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

const {
  ForceUpdate,
  Callback: CallbackEffect,
} = require('ReactTypeOfSideEffect');

type PartialState<State, Props> =
  $Subtype<State> |
  (prevState: State, props: Props) => $Subtype<State>;

type Callback = () => void;

type Update = {
  partialState: PartialState<any, any>,
  callback: Callback | null,
  isReplace: boolean,
  isForced: boolean,
  next: Update | null,
};

export type UpdateQueue = {
  // Points to the first (oldest) update.
  first: Update | null,
  // Points to the first pending update. A pending update is one that is not
  // part of the progressed work. This could be null even in a non-empty queue,
  // when none of the updates are empty.
  firstPendingUpdate: Update | null,
  // Points to the last (newest) update.
  last: Update | null,
};

exports.createUpdateQueue = function() : UpdateQueue {
  return {
    first: null,
    firstPendingUpdate: null,
    last: null,
  };
};

function insertUpdateIntoQueue(queue : UpdateQueue, update : Update) : void {
  // Add a pending update to the end of the queue.
  // TODO: Once updates have priorities, they should be inserted in the
  // correct order. Addtionally, replaceState should remove any pending updates
  // that have lower priority from queue.
  if (!queue.last) {
    // The queue is empty.
    queue.first = queue.last = queue.firstPendingUpdate = update;
  } else {
    // The queue is not empty. Append the update to the end.
    queue.last.next = update;
    queue.last = update;

    if (!queue.firstPendingUpdate) {
      // This is the first pending update. Update the pointer.
      queue.firstPendingUpdate = update;
    }
  }
}

exports.addUpdate = function(queue : UpdateQueue, partialState : PartialState<any, any> | null) : void {
  const update = {
    partialState,
    callback: null,
    isReplace: false,
    isForced: false,
    next: null,
  };
  insertUpdateIntoQueue(queue, update);
};

exports.addReplaceUpdate = function(queue : UpdateQueue, state : any | null) : void {
  const replaceUpdate = {
    partialState: state,
    callback: null,
    isReplace: true,
    isForced: false,
    next: null,
  };


  if (!queue.last) {
    // The queue is empty.
    queue.first = queue.last = queue.firstPendingUpdate = replaceUpdate;
  } else {
    // The queue is not empty.

    // Drop all existing pending updates.
    // TODO: Only drop updates with matching priority.
    let lastMergedUpdate = null;
    if (queue.firstPendingUpdate) {
      let node = queue.first;
      while (node && node.next !== queue.firstPendingUpdate) {
        node = node.next;
      }
      lastMergedUpdate = node;
    } else {
      lastMergedUpdate = queue.last;
    }

    if (lastMergedUpdate) {
      // Append the new update to the end of the list.
      // $FlowFixMe: Union bug (I think? Getting "object literal - This type incompatible with null")
      lastMergedUpdate.next = replaceUpdate;
      queue.firstPendingUpdate = replaceUpdate;
      queue.last = replaceUpdate;
    } else {
      // Drop everything
      queue.first = queue.firstPendingUpdate = queue.last = replaceUpdate;
    }
  }

};

exports.addForceUpdate = function(queue : UpdateQueue) : void {
  const update = {
    partialState: null,
    callback: null,
    isReplace: false,
    isForced: true,
    next: null,
  };
  insertUpdateIntoQueue(queue, update);
};


exports.addCallback = function(queue : UpdateQueue, callback: Callback) : void {
  if (queue.firstPendingUpdate && queue.last && !queue.last.callback) {
    // If pending updates already exist, and the last pending update does not
    // have a callback, we can add the new callback to that update.
    // TODO: Add an additional check to ensure the priority matches.
    queue.last.callback = callback;
    return;
  }

  const update = {
    partialState: null,
    callback,
    isReplace: false,
    isForced: false,
    next: null,
  };
  insertUpdateIntoQueue(queue, update);
};

exports.hasPendingUpdate = function(queue : UpdateQueue) : boolean {
  // TODO: Check priority level
  return queue.firstPendingUpdate !== null;
};

function getStateFromUpdate(update, instance, prevState, props) {
  const partialState = update.partialState;
  if (typeof partialState === 'function') {
    const updateFn = partialState;
    return updateFn.call(instance, prevState, props);
  } else {
    return partialState;
  }
}

exports.beginUpdateQueue = function(workInProgress : Fiber, queue : UpdateQueue, instance : any, prevState : any, props : any) : any {
  // This merges the entire update queue into a single object, not just the
  // pending updates, because the previous state and props may have changed.
  // TODO: Would memoization be worth it?

  // Reset these flags. We'll update them while looping through the queue.
  workInProgress.effectTag &= ~ForceUpdate;
  workInProgress.effectTag &= ~CallbackEffect;

  let state = prevState;
  let dontMutatePrevState = true;
  let update : Update | null = queue.first;
  let isEmpty = true;

  // TODO: Stop merging once we reach an update whose priority doesn't match.
  // Should this also apply to updates that were previous merged but bailed out?
  while (update) {
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
    update = update.next;
  }

  // The next pending update is the one that we exited on in the loop above.
  // Until priorities are implemented, this is always null.
  queue.firstPendingUpdate = update;

  if (isEmpty) {
    // None of the updates contained state. Return the original state object.
    return prevState;
  }

  return state;
};

exports.commitUpdateQueue = function(finishedWork : Fiber, queue : UpdateQueue, context : mixed) {
  if (finishedWork.effectTag & CallbackEffect) {
    // Call the callbacks on all the non-pending updates.
    let update = queue.first;
    while (update && update !== queue.firstPendingUpdate) {
      const callback = update.callback;
      if (typeof callback === 'function') {
        callback.call(context);
      }
      update = update.next;
    }
  }

  // Drop all completed updates, leaving only the pending updates.
  queue.first = queue.firstPendingUpdate;
  if (!queue.first) {
    // If the list is now empty, we can remove it from the finished work
    finishedWork.updateQueue = null;
    if (finishedWork.alternate) {
      // Normally we don't mutate the current tree, but we do for updates.
      // The queue on the work in progress is always the same as the queue
      // on the current.
      finishedWork.alternate.updateQueue = null;
    }
  }
};
