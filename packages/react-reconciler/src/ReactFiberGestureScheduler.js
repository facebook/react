/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FiberRoot} from './ReactInternalTypes';
import type {
  GestureTimeline,
  RunningGestureTransition,
} from './ReactFiberConfig';

import {
  GestureLane,
  includesBlockingLane,
  includesTransitionLane,
} from './ReactFiberLane';
import {ensureRootIsScheduled} from './ReactFiberRootScheduler';
import {
  subscribeToGestureDirection,
  stopGestureTransition,
} from './ReactFiberConfig';

// This type keeps track of any scheduled or active gestures.
export type ScheduledGesture = {
  provider: GestureTimeline,
  count: number, // The number of times this same provider has been started.
  direction: boolean, // false = previous, true = next
  rangePrevious: number, // The end along the timeline where the previous state is reached.
  rangeCurrent: number, // The starting offset along the timeline.
  rangeNext: number, // The end along the timeline where the next state is reached.
  cancel: () => void, // Cancel the subscription to direction change.
  running: null | RunningGestureTransition, // Used to cancel the running transition after we're done.
  prev: null | ScheduledGesture, // The previous scheduled gesture in the queue for this root.
  next: null | ScheduledGesture, // The next scheduled gesture in the queue for this root.
};

export function scheduleGesture(
  root: FiberRoot,
  provider: GestureTimeline,
  initialDirection: boolean,
  rangePrevious: number,
  rangeCurrent: number,
  rangeNext: number,
): ScheduledGesture {
  let prev = root.pendingGestures;
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
  const isFlippedDirection = rangePrevious > rangeNext;
  // Add new instance to the end of the queue.
  const cancel = subscribeToGestureDirection(
    provider,
    rangeCurrent,
    (direction: boolean) => {
      if (isFlippedDirection) {
        direction = !direction;
      }
      if (gesture.direction !== direction) {
        gesture.direction = direction;
        if (gesture.prev === null && root.pendingGestures !== gesture) {
          // This gesture is not in the schedule, meaning it was already rendered.
          // We need to rerender in the new direction. Insert it into the first slot
          // in case other gestures are queued after the on-going one.
          const existing = root.pendingGestures;
          gesture.next = existing;
          if (existing !== null) {
            existing.prev = gesture;
          }
          root.pendingGestures = gesture;
          // Schedule the lane on the root. The Fibers will already be marked as
          // long as the gesture is active on that Hook.
          root.pendingLanes |= GestureLane;
          ensureRootIsScheduled(root);
        }
        // TODO: If we're currently rendering this gesture, we need to restart it.
      }
    },
  );
  const gesture: ScheduledGesture = {
    provider: provider,
    count: 1,
    direction: initialDirection,
    rangePrevious: rangePrevious,
    rangeCurrent: rangeCurrent,
    rangeNext: rangeNext,
    cancel: cancel,
    running: null,
    prev: prev,
    next: null,
  };
  if (prev === null) {
    root.pendingGestures = gesture;
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
    // Delete the scheduled gesture from the pending queue.
    deleteScheduledGesture(root, gesture);
    // TODO: If we're currently rendering this gesture, we need to restart the render
    // on a different gesture or cancel the render..
    // TODO: We might want to pause the View Transition at this point since you should
    // no longer be able to update the position of anything but it might be better to
    // just commit the gesture state.
    const runningTransition = gesture.running;
    if (runningTransition !== null) {
      const pendingLanesExcludingGestureLane = root.pendingLanes & ~GestureLane;
      if (
        includesBlockingLane(pendingLanesExcludingGestureLane) ||
        includesTransitionLane(pendingLanesExcludingGestureLane)
      ) {
        // If we have pending work we schedule the gesture to be stopped at the next commit.
        // This ensures that we don't snap back to the previous state until we have
        // had a chance to commit any resulting updates.
        const existing = root.stoppingGestures;
        if (existing !== null) {
          gesture.next = existing;
          existing.prev = gesture;
        }
        root.stoppingGestures = gesture;
      } else {
        gesture.running = null;
        // If there's no work scheduled so we can stop the View Transition right away.
        stopGestureTransition(runningTransition);
      }
    }
  }
}

export function deleteScheduledGesture(
  root: FiberRoot,
  gesture: ScheduledGesture,
): void {
  if (gesture.prev === null) {
    if (root.pendingGestures === gesture) {
      root.pendingGestures = gesture.next;
      if (root.pendingGestures === null) {
        // Gestures don't clear their lanes while the gesture is still active but it
        // might not be scheduled to do any more renders and so we shouldn't schedule
        // any more gesture lane work until a new gesture is scheduled.
        root.pendingLanes &= ~GestureLane;
      }
    }
    if (root.stoppingGestures === gesture) {
      // This should not really happen the way we use it now but just in case we start.
      root.stoppingGestures = gesture.next;
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

export function stopCompletedGestures(root: FiberRoot) {
  let gesture = root.stoppingGestures;
  root.stoppingGestures = null;
  while (gesture !== null) {
    if (gesture.running !== null) {
      stopGestureTransition(gesture.running);
      gesture.running = null;
    }
    const nextGesture = gesture.next;
    gesture.next = null;
    gesture.prev = null;
    gesture = nextGesture;
  }
}
