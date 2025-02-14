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
import {subscribeToGestureDirection} from './ReactFiberConfig';

// This type keeps track of any scheduled or active gestures.
export type ScheduledGesture = {
  provider: GestureProvider,
  count: number, // The number of times this same provider has been started.
  direction: boolean, // false = previous, true = next
  cancel: () => void, // Cancel the subscription to direction change.
  prev: null | ScheduledGesture, // The previous scheduled gesture in the queue for this root.
  next: null | ScheduledGesture, // The next scheduled gesture in the queue for this root.
};

export function scheduleGesture(
  root: FiberRoot,
  provider: GestureProvider,
  initialDirection: boolean,
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
  const cancel = subscribeToGestureDirection(provider, (direction: boolean) => {
    if (gesture.direction !== direction) {
      gesture.direction = direction;
      if (gesture.prev === null && root.gestures !== gesture) {
        // This gesture is not in the schedule, meaning it was already rendered.
        // We need to rerender in the new direction. Insert it into the first slot
        // in case other gestures are queued after the on-going one.
        const existing = root.gestures;
        gesture.next = existing;
        if (existing !== null) {
          existing.prev = gesture;
        }
        root.gestures = gesture;
        // Schedule the lane on the root. The Fibers will already be marked as
        // long as the gesture is active on that Hook.
        root.pendingLanes |= GestureLane;
        ensureRootIsScheduled(root);
      }
      // TODO: If we're currently rendering this gesture, we need to restart it.
    }
  });
  const gesture: ScheduledGesture = {
    provider: provider,
    count: 1,
    direction: initialDirection,
    cancel: cancel,
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
    const cancelDirectionSubscription = gesture.cancel;
    cancelDirectionSubscription();
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
