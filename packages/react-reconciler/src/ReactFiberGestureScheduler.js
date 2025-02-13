/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FiberRoot} from './ReactInternalTypes';
import type {GestureProvider} from 'shared/ReactTypes';

import {GestureLane} from './ReactFiberLane';
import {ensureRootIsScheduled} from './ReactFiberRootScheduler';

// This type keeps track of any scheduled or active gestures.
export type ScheduledGesture = {
  provider: GestureProvider,
  count: number, // The number of times this same provider has been started.
  prev: null | ScheduledGesture, // The previous scheduled gesture in the queue for this root.
  next: null | ScheduledGesture, // The next scheduled gesture in the queue for this root.
};

export function scheduleGesture(
  root: FiberRoot,
  provider: GestureProvider,
): ScheduledGesture {
  let prev = root.gestures;
  while (prev !== null) {
    if (prev.provider === provider) {
      // Existing instance found.
      prev.count++;
      return prev;
    }
    const next = prev.next;
    if (next === null) {
      break;
    }
    prev = next;
  }
  // Add new instance to the end of the queue.
  const gesture: ScheduledGesture = {
    provider: provider,
    count: 1,
    prev: prev,
    next: null,
  };
  if (prev === null) {
    root.gestures = gesture;
  } else {
    prev.next = gesture;
  }
  ensureRootIsScheduled(root);
  return gesture;
}

export function cancelScheduledGesture(
  root: FiberRoot,
  gesture: ScheduledGesture,
): void {
  gesture.count--;
  if (gesture.count === 0) {
    // Delete the scheduled gesture from the queue.
    deleteScheduledGesture(root, gesture);
  }
}

export function deleteScheduledGesture(
  root: FiberRoot,
  gesture: ScheduledGesture,
): void {
  if (gesture.prev === null) {
    if (root.gestures === gesture) {
      root.gestures = gesture.next;
      if (root.gestures === null) {
        // Gestures don't clear their lanes while the gesture is still active but it
        // might not be scheduled to do any more renders and so we shouldn't schedule
        // any more gesture lane work until a new gesture is scheduled.
        root.pendingLanes &= ~GestureLane;
      }
    }
  } else {
    gesture.prev.next = gesture.next;
    if (gesture.next !== null) {
      gesture.next.prev = gesture.prev;
    }
    gesture.prev = null;
    gesture.next = null;
  }
}
