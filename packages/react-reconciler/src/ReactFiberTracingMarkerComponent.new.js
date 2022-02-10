/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {ReactNodeList} from 'shared/ReactTypes';
import type {Lane, Lanes} from './ReactFiberLane.new';
import type {
  Fiber,
  FiberRoot,
  TransitionTracingCallbacks,
} from './ReactInternalTypes';
import type {StackCursor} from './ReactFiberStack.new';

import {enableTransitionTracing} from 'shared/ReactFeatureFlags';
import {getTransitionsForLanes} from './ReactFiberLane.new';
import {createCursor, push, pop} from './ReactFiberStack.new';

export type SuspenseInfo = {name: string | null};
export type PendingSuspenseBoundaries = Map<number, SuspenseInfo>;

export type TracingMarkerState = {|
  +pendingSuspenseBoundaries: PendingSuspenseBoundaries,
  +transitions: Transitions,
|};

export type TracingMarkerProps = {|
  children?: ReactNodeList,
  name: string,
|};

export type Transition = {
  name: string,
  startTime: number,
};

export type Transitions = Set<Transition> | null;
export type TracingMarkerInfo = Array<{
  transitions: Transitions,
  // Convert this from array to map because you can remove stuff here
  pendingSuspenseBoundaries: PendingSuspenseBoundaries,
}>;

export type TransitionCallbackObject = {|
  type: TransitionCallback,
  transitionName: string,
  startTime: number,
  markerName?: string,
  pendingBoundaries?: Array<SuspenseInfo>,
|};

export type TransitionCallback = 0 | 1 | 2 | 3 | 4;

export const TransitionStart = 0;
export const TransitionProgress = 1;
export const MarkerProgress = 2;
export const TransitionComplete = 3;
export const MarkerComplete = 4;

let currentTransitions: Transitions | null = null;
const transitionStack: StackCursor<Transitions | null> = createCursor(null);

let currentTracingMarkers: TracingMarkerInfo | null = null;
const tracingMarkersStack: StackCursor<TracingMarkerInfo | null> = createCursor(
  null,
);

// TODO(luna) Refactor this with cache component
// to have a joint stack
export function pushTransitionPool(
  workInProgress: Fiber,
  transitions: Set<Transition> | null,
) {
  if (!enableTransitionTracing) {
    return;
  }

  // This works becuase we only make the transition object
  // when the transition first starts
  const newTransitions = new Set();
  if (currentTransitions !== null) {
    currentTransitions.forEach(transition => {
      newTransitions.add(transition);
    });
  }
  if (transitions !== null) {
    transitions.forEach(transition => {
      newTransitions.add(transition);
    });
  }

  push(transitionStack, currentTransitions, workInProgress);
  currentTransitions = newTransitions;
}

export function popTransitionPool(workInProgress: Fiber) {
  if (!enableTransitionTracing) {
    return;
  }

  currentTransitions = transitionStack.current;
  pop(transitionStack, workInProgress);
}

export function pushRootTransitionPool(root: FiberRoot, lanes: Lane | Lanes) {
  if (!enableTransitionTracing) {
    return;
  }
  // Assuming that retries will always
  // happen in the retry lane and there will never
  // be transitions in the retry lane, so therefore
  // this will always be an empty array
  const rootTransitions = getTransitionsForLanes(root, lanes);
  if (rootTransitions != null && rootTransitions.size > 0) {
    currentTransitions = rootTransitions;
  } else {
    currentTransitions = null;
  }

  return currentTransitions;
}

export function popRootTransitionPool() {
  if (!enableTransitionTracing) {
    return;
  }
  const transitions = currentTransitions;
  currentTransitions = null;

  return transitions;
}

export function getSuspendedTransitionPool(): Transitions | null {
  if (!enableTransitionTracing) {
    return null;
  }

  if (currentTransitions === null) {
    return null;
  }

  return currentTransitions;
}

export function pushRootTracingMarkersPool(rootFiber: Fiber) {
  if (!enableTransitionTracing) {
    return;
  }

  const state = rootFiber.memoizedState;

  currentTracingMarkers = [
    {
      pendingSuspenseBoundaries: state.pendingSuspenseBoundaries,
      transitions: state.transitions,
    },
  ];
}

export function popRootTracingMarkersPool() {
  if (!enableTransitionTracing) {
    return;
  }

  currentTracingMarkers = null;
}

export function pushTracingMarkersPool(tracingMarker: Fiber) {
  if (!enableTransitionTracing) {
    return;
  }

  let tracingMarkersArray;
  if (currentTracingMarkers === null) {
    tracingMarkersArray = [];
  } else {
    tracingMarkersArray = Array.from(currentTracingMarkers);
  }

  const state = tracingMarker.memoizedState;

  const tracingMarkerData = {
    pendingSuspenseBoundaries: state.pendingSuspenseBoundaries,
    transitions: state.transitions,
  };
  tracingMarkersArray.push(tracingMarkerData);

  push(tracingMarkersStack, currentTracingMarkers, tracingMarker);
  currentTracingMarkers = tracingMarkersArray;
}

export function popTracingMarkersPool(workInProgress: Fiber) {
  if (!enableTransitionTracing) {
    return;
  }

  currentTracingMarkers = tracingMarkersStack.current;
  pop(transitionStack, workInProgress);
}

export function getSuspendedTracingMarkersPool(): TracingMarkerInfo | null {
  if (!enableTransitionTracing) {
    return null;
  }

  if (currentTracingMarkers == null) {
    return null;
  } else {
    return currentTracingMarkers;
  }
}

export function processTransitionCallbacks(
  pendingTransitions: Array<TransitionCallbackObject>,
  endTime: number,
  callbacks: TransitionTracingCallbacks,
): void {
  pendingTransitions.forEach(transition => {
    switch (transition.type) {
      case TransitionStart: {
        if (callbacks.onTransitionStart != null) {
          callbacks.onTransitionStart(
            transition.transitionName,
            transition.startTime,
          );
        }
        break;
      }
      case TransitionComplete: {
        if (callbacks.onTransitionComplete != null) {
          callbacks.onTransitionComplete(
            transition.transitionName,
            transition.startTime,
            endTime,
          );
        }
        break;
      }
      case MarkerComplete: {
        if (callbacks.onMarkerComplete != null) {
          if (transition.markerName != null) {
            callbacks.onMarkerComplete(
              transition.transitionName,
              transition.markerName,
              transition.startTime,
              endTime,
            );
          } else {
            console.error(
              'React bug: Calling onMarkerComplete transition tracing callback' +
                'but markerName is null',
            );
          }
        }
        break;
      }
      case TransitionProgress: {
        if (callbacks.onTransitionProgress != null) {
          if (transition.pendingBoundaries != null) {
            callbacks.onTransitionProgress(
              transition.transitionName,
              transition.startTime,
              endTime,
              transition.pendingBoundaries,
            );
          } else {
            console.error(
              'React bug: Calling onTransitionProgress transition tracing callback' +
                'but pendingBoundaries is null',
            );
          }
        }

        break;
      }
      case MarkerProgress: {
        if (callbacks.onMarkerProgress != null) {
          if (
            transition.markerName != null &&
            transition.pendingBoundaries != null
          ) {
            callbacks.onMarkerProgress(
              transition.transitionName,
              transition.markerName,
              transition.startTime,
              endTime,
              transition.pendingBoundaries,
            );
          } else {
            console.error(
              'React bug: Calling onTransitionProgress transition tracing callback' +
                'but either markerName or pendingBoundaries is null: pendingBoundaries - ',
              transition.pendingBoundaries,
              ' markerName: ',
              transition.markerName,
            );
          }
        }
        break;
      }
    }
  });
}
