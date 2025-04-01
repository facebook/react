/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FiberRoot} from './ReactInternalTypes';
import type {GestureOptions} from 'shared/ReactTypes';
import type {GestureTimeline, RunningViewTransition} from './ReactFiberConfig';

import {
  GestureLane,
  includesBlockingLane,
  includesTransitionLane,
} from './ReactFiberLane';
import {ensureRootIsScheduled} from './ReactFiberRootScheduler';
import {getCurrentGestureOffset, stopViewTransition} from './ReactFiberConfig';

// This type keeps track of any scheduled or active gestures.
export type ScheduledGesture = {
  provider: GestureTimeline,
  count: number, // The number of times this same provider has been started.
  direction: boolean, // false = previous, true = next
  rangePrevious: number, // The end along the timeline where the previous state is reached.
  rangeCurrent: number, // The starting offset along the timeline.
  rangeNext: number, // The end along the timeline where the next state is reached.
  running: null | RunningViewTransition, // Used to cancel the running transition after we're done.
  prev: null | ScheduledGesture, // The previous scheduled gesture in the queue for this root.
  next: null | ScheduledGesture, // The next scheduled gesture in the queue for this root.
};

export function scheduleGesture(
  root: FiberRoot,
  provider: GestureTimeline,
): ScheduledGesture {
  let prev = root.pendingGestures;
  while (prev !== null) {
    if (prev.provider === provider) {
      // Existing instance found.
      return prev;
    }
    const next = prev.next;
    if (next === null) {
      break;
    }
    prev = next;
  }
  const gesture: ScheduledGesture = {
    provider: provider,
    count: 0,
    direction: false,
    rangePrevious: -1,
    rangeCurrent: -1,
    rangeNext: -1,
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

export function startScheduledGesture(
  root: FiberRoot,
  gestureTimeline: GestureTimeline,
  gestureOptions: ?GestureOptions,
): null | ScheduledGesture {
  const currentOffset = getCurrentGestureOffset(gestureTimeline);
  const range = gestureOptions && gestureOptions.range;
  const rangePrevious: number = range ? range[0] : 0; // If no range is provider we assume it's the starting point of the range.
  const rangeCurrent: number = range ? range[1] : currentOffset;
  const rangeNext: number = range ? range[2] : 100; // If no range is provider we assume it's the starting point of the range.
  if (__DEV__) {
    if (
      (rangePrevious > rangeCurrent && rangeNext > rangeCurrent) ||
      (rangePrevious < rangeCurrent && rangeNext < rangeCurrent)
    ) {
      console.error(
        'The range of a gesture needs "previous" and "next" to be on either side of ' +
          'the "current" offset. Both cannot be above current and both cannot be below current.',
      );
    }
  }
  const isFlippedDirection = rangePrevious > rangeNext;
  const initialDirection =
    // If a range is specified we can imply initial direction if it's not the current
    // value such as if the gesture starts after it has already moved.
    currentOffset < rangeCurrent
      ? isFlippedDirection
      : currentOffset > rangeCurrent
        ? !isFlippedDirection
        : // Otherwise, look for an explicit option.
          gestureOptions
          ? gestureOptions.direction === 'next'
          : false;

  let prev = root.pendingGestures;
  while (prev !== null) {
    if (prev.provider === gestureTimeline) {
      // Existing instance found.
      prev.count++;
      // Update the options.
      prev.direction = initialDirection;
      prev.rangePrevious = rangePrevious;
      prev.rangeCurrent = rangeCurrent;
      prev.rangeNext = rangeNext;
      return prev;
    }
    const next = prev.next;
    if (next === null) {
      break;
    }
    prev = next;
  }
  // No scheduled gestures. It must mean nothing for this renderer updated but
  // some other renderer might have updated.
  return null;
}

export function cancelScheduledGesture(
  root: FiberRoot,
  gesture: ScheduledGesture,
): void {
  gesture.count--;
  if (gesture.count === 0) {
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
        stopViewTransition(runningTransition);
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
      stopViewTransition(gesture.running);
      gesture.running = null;
    }
    const nextGesture = gesture.next;
    gesture.next = null;
    gesture.prev = null;
    gesture = nextGesture;
  }
}
