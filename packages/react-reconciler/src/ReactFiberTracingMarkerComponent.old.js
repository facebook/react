/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TransitionTracingCallbacks, Fiber} from './ReactInternalTypes';
import type {OffscreenInstance} from './ReactFiberOffscreenComponent';
import type {StackCursor} from './ReactFiberStack.old';

import {enableTransitionTracing} from 'shared/ReactFeatureFlags';
import {createCursor, push, pop} from './ReactFiberStack.old';
import {getWorkInProgressTransitions} from './ReactFiberWorkLoop.old';

export type SuspenseInfo = {name: string | null};

export type PendingTransitionCallbacks = {
  transitionStart: Array<Transition> | null,
  transitionProgress: Map<Transition, PendingBoundaries> | null,
  transitionComplete: Array<Transition> | null,
  markerProgress: Map<string, TracingMarkerInstance> | null,
  markerComplete: Map<string, Set<Transition>> | null,
};

export type Transition = {
  name: string,
  startTime: number,
};

export type BatchConfigTransition = {
  name?: string,
  startTime?: number,
  _updatedFibers?: Set<Fiber>,
};

export type TracingMarkerInstance = {|
  pendingBoundaries: PendingBoundaries | null,
  transitions: Set<Transition> | null,
  name?: string,
|};

export type PendingBoundaries = Map<OffscreenInstance, SuspenseInfo>;

export function processTransitionCallbacks(
  pendingTransitions: PendingTransitionCallbacks,
  endTime: number,
  callbacks: TransitionTracingCallbacks,
): void {
  if (enableTransitionTracing) {
    if (pendingTransitions !== null) {
      const transitionStart = pendingTransitions.transitionStart;
      const onTransitionStart = callbacks.onTransitionStart;
      if (transitionStart !== null && onTransitionStart != null) {
        transitionStart.forEach(transition =>
          onTransitionStart(transition.name, transition.startTime),
        );
      }

      const markerProgress = pendingTransitions.markerProgress;
      const onMarkerProgress = callbacks.onMarkerProgress;
      if (onMarkerProgress != null && markerProgress !== null) {
        markerProgress.forEach((markerInstance, markerName) => {
          if (markerInstance.transitions !== null) {
            const pending =
              markerInstance.pendingBoundaries !== null
                ? Array.from(markerInstance.pendingBoundaries.values())
                : [];
            markerInstance.transitions.forEach(transition => {
              onMarkerProgress(
                transition.name,
                markerName,
                transition.startTime,
                endTime,
                pending,
              );
            });
          }
        });
      }

      const markerComplete = pendingTransitions.markerComplete;
      const onMarkerComplete = callbacks.onMarkerComplete;
      if (markerComplete !== null && onMarkerComplete != null) {
        markerComplete.forEach((transitions, markerName) => {
          transitions.forEach(transition => {
            onMarkerComplete(
              transition.name,
              markerName,
              transition.startTime,
              endTime,
            );
          });
        });
      }

      const transitionProgress = pendingTransitions.transitionProgress;
      const onTransitionProgress = callbacks.onTransitionProgress;
      if (onTransitionProgress != null && transitionProgress !== null) {
        transitionProgress.forEach((pending, transition) => {
          onTransitionProgress(
            transition.name,
            transition.startTime,
            endTime,
            Array.from(pending.values()),
          );
        });
      }

      const transitionComplete = pendingTransitions.transitionComplete;
      const onTransitionComplete = callbacks.onTransitionComplete;
      if (transitionComplete !== null && onTransitionComplete != null) {
        transitionComplete.forEach(transition =>
          onTransitionComplete(transition.name, transition.startTime, endTime),
        );
      }
    }
  }
}

// For every tracing marker, store a pointer to it. We will later access it
// to get the set of suspense boundaries that need to resolve before the
// tracing marker can be logged as complete
// This code lives separate from the ReactFiberTransition code because
// we push and pop on the tracing marker, not the suspense boundary
const markerInstanceStack: StackCursor<Array<TracingMarkerInstance> | null> = createCursor(
  null,
);

export function pushRootMarkerInstance(workInProgress: Fiber): void {
  if (enableTransitionTracing) {
    // On the root, every transition gets mapped to it's own map of
    // suspense boundaries. The transition is marked as complete when
    // the suspense boundaries map is empty. We do this because every
    // transition completes at different times and depends on different
    // suspense boundaries to complete. We store all the transitions
    // along with its map of suspense boundaries in the root incomplete
    // transitions map. Each entry in this map functions like a tracing
    // marker does, so we can push it onto the marker instance stack
    const transitions = getWorkInProgressTransitions();
    const root = workInProgress.stateNode;

    if (transitions !== null) {
      transitions.forEach(transition => {
        if (!root.incompleteTransitions.has(transition)) {
          const markerInstance: TracingMarkerInstance = {
            transitions: new Set([transition]),
            pendingBoundaries: null,
          };
          root.incompleteTransitions.set(transition, markerInstance);
        }
      });
    }

    const markerInstances = [];
    // For ever transition on the suspense boundary, we push the transition
    // along with its map of pending suspense boundaries onto the marker
    // instance stack.
    root.incompleteTransitions.forEach(markerInstance => {
      markerInstances.push(markerInstance);
    });
    push(markerInstanceStack, markerInstances, workInProgress);
  }
}

export function popRootMarkerInstance(workInProgress: Fiber) {
  if (enableTransitionTracing) {
    pop(markerInstanceStack, workInProgress);
  }
}

export function pushMarkerInstance(
  workInProgress: Fiber,
  markerInstance: TracingMarkerInstance,
): void {
  if (enableTransitionTracing) {
    if (markerInstanceStack.current === null) {
      push(markerInstanceStack, [markerInstance], workInProgress);
    } else {
      push(
        markerInstanceStack,
        markerInstanceStack.current.concat(markerInstance),
        workInProgress,
      );
    }
  }
}

export function popMarkerInstance(workInProgress: Fiber): void {
  if (enableTransitionTracing) {
    pop(markerInstanceStack, workInProgress);
  }
}

export function getMarkerInstances(): Array<TracingMarkerInstance> | null {
  if (enableTransitionTracing) {
    return markerInstanceStack.current;
  }
  return null;
}
