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
import type {StackCursor} from './ReactFiberStack.new';

import {enableTransitionTracing} from 'shared/ReactFeatureFlags';
import {createCursor, push, pop} from './ReactFiberStack.new';
import {getWorkInProgressTransitions} from './ReactFiberWorkLoop.new';

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
const markerInstanceStack: StackCursor<Array<TracingMarkerInstance> | null> = createCursor(
  null,
);

export function pushRootMarkerInstance(workInProgress: Fiber): void {
  if (enableTransitionTracing) {
    const transitions = getWorkInProgressTransitions();
    const root = workInProgress.stateNode;
    let incompleteTransitions = root.incompleteTransitions;
    if (transitions !== null) {
      if (incompleteTransitions === null) {
        root.incompleteTransitions = incompleteTransitions = new Map();
      }

      transitions.forEach(transition => {
        incompleteTransitions.set(transition, new Map());
      });
    }

    if (incompleteTransitions === null) {
      push(markerInstanceStack, null, workInProgress);
    } else {
      const markerInstances = [];
      incompleteTransitions.forEach((pendingSuspenseBoundaries, transition) => {
        markerInstances.push({
          transitions: new Set([transition]),
          pendingSuspenseBoundaries,
        });
      });
      push(markerInstanceStack, markerInstances, workInProgress);
    }
  }
}

export function popRootMarkerInstance(workInProgress: Fiber) {
  if (enableTransitionTracing) {
    pop(markerInstanceStack, workInProgress);
  }
}

export function pushMarkerInstance(
  workInProgress: Fiber,
  transitions: Set<Transition> | null,
  pendingSuspenseBoundaries: PendingSuspenseBoundaries | null,
): void {
  if (enableTransitionTracing) {
    const markerInstance = {transitions, pendingSuspenseBoundaries};

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
