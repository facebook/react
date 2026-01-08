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
import type {TransitionTypes} from 'react/src/ReactTransitionType';

import {GestureLane, markRootFinished, NoLane, NoLanes} from './ReactFiberLane';
import {ensureRootIsScheduled} from './ReactFiberRootScheduler';
import {getCurrentGestureOffset, stopViewTransition} from './ReactFiberConfig';

// This type keeps track of any scheduled or active gestures.
export type ScheduledGesture = {
  provider: GestureTimeline,
  count: number, // The number of times this same provider has been started.
  rangeStart: number, // The percentage along the timeline where the "current" state starts.
  rangeEnd: number, // The percentage along the timeline where the "destination" state is reached.
  types: null | TransitionTypes, // Any addTransitionType call made during startGestureTransition.
  running: null | RunningViewTransition, // Used to cancel the running transition after we're done.
  committing: boolean, // If the gesture was released in a committed state and should actually commit.
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
    rangeStart: 0, // Uninitialized
    rangeEnd: 100, // Uninitialized
    types: null,
    running: null,
    committing: false,
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
  transitionTypes: null | TransitionTypes,
): null | ScheduledGesture {
  const rangeStart =
    gestureOptions && gestureOptions.rangeStart != null
      ? gestureOptions.rangeStart
      : getCurrentGestureOffset(gestureTimeline);
  const rangeEnd =
    gestureOptions && gestureOptions.rangeEnd != null
      ? gestureOptions.rangeEnd
      : rangeStart < 50
        ? 100
        : 0;
  let prev = root.pendingGestures;
  while (prev !== null) {
    if (prev.provider === gestureTimeline) {
      // Existing instance found.
      prev.count++;
      // Update the options.
      prev.rangeStart = rangeStart;
      prev.rangeEnd = rangeEnd;
      if (transitionTypes !== null) {
        let scheduledTypes = prev.types;
        if (scheduledTypes === null) {
          scheduledTypes = prev.types = [];
        }
        for (let i = 0; i < transitionTypes.length; i++) {
          const transitionType = transitionTypes[i];
          if (scheduledTypes.indexOf(transitionType) === -1) {
            scheduledTypes.push(transitionType);
          }
        }
      }
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
  const shouldCommit = false; // TODO: Determine if this was released to snap back or commit forward.
  gesture.count--;
  if (gesture.count === 0) {
    // TODO: If we're currently rendering this gesture, we need to restart the render
    // on a different gesture or cancel the render..
    // TODO: We might want to pause the View Transition at this point since you should
    // no longer be able to update the position of anything but it might be better to
    // just commit the gesture state.
    const runningTransition = gesture.running;
    if (runningTransition !== null) {
      if (shouldCommit) {
        // If we are going to commit this gesture in its to state, we need to wait to
        // stop it until it commits. We should now schedule a render at the gesture
        // lane to actually commit it.
        gesture.committing = true;
        // TODO: Treat this the same as pinging a Transition.
      } else {
        // If we're not going to commit this gesture we can stop the View Transition
        // right away and delete the scheduled gesture from the pending queue.
        markRootFinished(
          root,
          GestureLane,
          root.pendingLanes,
          NoLane,
          NoLane,
          NoLanes,
        );
        deleteScheduledGesture(root, gesture);
        gesture.running = null;
        stopViewTransition(runningTransition);
        // If we have any more gestures to pick up after this, make sure they're scheduled.
        if (root.pendingGestures !== null) {
          ensureRootIsScheduled(root);
        }
      }
    }
  }
}

function deleteScheduledGesture(
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
  } else {
    gesture.prev.next = gesture.next;
    if (gesture.next !== null) {
      gesture.next.prev = gesture.prev;
    }
    gesture.prev = null;
    gesture.next = null;
  }
}

export function stopCommittedGesture(root: FiberRoot) {
  // The top was just committed. We can delete it from the queue
  // and stop its View Transition now.
  const committedGesture = root.pendingGestures;
  if (committedGesture !== null) {
    const nextGesture = committedGesture.next;
    if (nextGesture === null) {
      // Gestures don't clear their lanes while the gesture is still active but it
      // might not be scheduled to do any more renders and so we shouldn't schedule
      // any more gesture lane work until a new gesture is scheduled.
      root.pendingLanes &= ~GestureLane;
    } else {
      nextGesture.prev = null;
    }
    root.pendingGestures = nextGesture;
    const runningTransition = committedGesture.running;
    if (runningTransition !== null) {
      committedGesture.running = null;
      stopViewTransition(runningTransition);
    }
  }
}
