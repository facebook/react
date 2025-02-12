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

import {scheduleMicrotask} from './ReactFiberConfig';

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
  // Schedule a microtask to perform the work. This lets us batch multiple starts into
  // one transition. This must be a microtask though because it can be important to
  // synchronously perform the work in this event depending on the caller.
  scheduleMicrotask(performWorkOnScheduledGestures.bind(null, root));
  return gesture;
}

export function cancelScheduledGesture(
  root: FiberRoot,
  gesture: ScheduledGesture,
) {
  gesture.count--;
  if (gesture.count === 0) {
    // Delete the scheduled gesture from the queue.
    if (gesture.prev === null) {
      if (root.gestures === gesture) {
        root.gestures = gesture.next;
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
}

function performWorkOnScheduledGestures(root: FiberRoot) {
  // TODO
}
