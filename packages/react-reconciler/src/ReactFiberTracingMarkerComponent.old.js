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

export type SuspenseInfo = {name: string | null};

export type TransitionObject = {
  transitionName: string,
  startTime: number,
};

export type MarkerTransitionObject = TransitionObject & {markerName: string};
export type PendingTransitionCallbacks = {
  transitionStart: Array<TransitionObject> | null,
  transitionComplete: Array<TransitionObject> | null,
  markerComplete: Array<MarkerTransitionObject> | null,
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
  pendingSuspenseBoundaries: PendingSuspenseBoundaries | null,
  transitions: Set<Transition> | null,
|} | null;

export type PendingSuspenseBoundaries = Map<OffscreenInstance, SuspenseInfo>;

export function processTransitionCallbacks(
  pendingTransitions: PendingTransitionCallbacks,
  endTime: number,
  callbacks: TransitionTracingCallbacks,
): void {
  if (enableTransitionTracing) {
    if (pendingTransitions !== null) {
      const transitionStart = pendingTransitions.transitionStart;
      if (transitionStart !== null) {
        transitionStart.forEach(transition => {
          if (callbacks.onTransitionStart != null) {
            callbacks.onTransitionStart(
              transition.transitionName,
              transition.startTime,
            );
          }
        });
      }

      const markerComplete = pendingTransitions.markerComplete;
      if (markerComplete !== null) {
        markerComplete.forEach(transition => {
          if (callbacks.onMarkerComplete != null) {
            callbacks.onMarkerComplete(
              transition.transitionName,
              transition.markerName,
              transition.startTime,
              endTime,
            );
          }
        });
      }

      const transitionComplete = pendingTransitions.transitionComplete;
      if (transitionComplete !== null) {
        transitionComplete.forEach(transition => {
          if (callbacks.onTransitionComplete != null) {
            callbacks.onTransitionComplete(
              transition.transitionName,
              transition.startTime,
              endTime,
            );
          }
        });
      }
    }
  }
}

// For every tracing marker, store a pointer to it. We will later access it
// to get the set of suspense boundaries that need to resolve before the
// tracing marker can be logged as complete
// This code lives separate from the ReactFiberTransition code because
// we push and pop on the tracing marker, not the suspense boundary
const tracingMarkerStack: StackCursor<Array<Fiber> | null> = createCursor(null);

export function pushTracingMarker(workInProgress: Fiber): void {
  if (enableTransitionTracing) {
    if (tracingMarkerStack.current === null) {
      push(tracingMarkerStack, [workInProgress], workInProgress);
    } else {
      push(
        tracingMarkerStack,
        tracingMarkerStack.current.concat(workInProgress),
        workInProgress,
      );
    }
  }
}

export function popTracingMarker(workInProgress: Fiber): void {
  if (enableTransitionTracing) {
    pop(tracingMarkerStack, workInProgress);
  }
}

export function getTracingMarkers(): Array<Fiber> | null {
  if (enableTransitionTracing) {
    return tracingMarkerStack.current;
  }
  return null;
}
