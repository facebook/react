/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {UpdateQueue as HookQueue} from './ReactFiberHooks.old';
import type {SharedQueue as ClassQueue} from './ReactFiberClassUpdateQueue.old';

// An array of all update queues that received updates during the current
// render. When this render exits, either because it finishes or because it is
// interrupted, the interleaved updates will be transferred onto the main part
// of the queue.
let concurrentQueues: Array<
  HookQueue<any, any> | ClassQueue<any>,
> | null = null;

export function pushConcurrentUpdateQueue(
  queue: HookQueue<any, any> | ClassQueue<any>,
) {
  if (concurrentQueues === null) {
    concurrentQueues = [queue];
  } else {
    concurrentQueues.push(queue);
  }
}

export function finishQueueingConcurrentUpdates() {
  // Transfer the interleaved updates onto the main queue. Each queue has a
  // `pending` field and an `interleaved` field. When they are not null, they
  // point to the last node in a circular linked list. We need to append the
  // interleaved list to the end of the pending list by joining them into a
  // single, circular list.
  if (concurrentQueues !== null) {
    for (let i = 0; i < concurrentQueues.length; i++) {
      const queue = concurrentQueues[i];
      const lastInterleavedUpdate = queue.interleaved;
      if (lastInterleavedUpdate !== null) {
        queue.interleaved = null;
        const firstInterleavedUpdate = lastInterleavedUpdate.next;
        const lastPendingUpdate = queue.pending;
        if (lastPendingUpdate !== null) {
          const firstPendingUpdate = lastPendingUpdate.next;
          lastPendingUpdate.next = (firstInterleavedUpdate: any);
          lastInterleavedUpdate.next = (firstPendingUpdate: any);
        }
        queue.pending = (lastInterleavedUpdate: any);
      }
    }
    concurrentQueues = null;
  }
}
