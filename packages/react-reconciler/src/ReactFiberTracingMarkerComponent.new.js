/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TransitionTracingCallbacks} from './ReactInternalTypes';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';

export type SuspenseInfo = {name: string | null};

export type Transition = {
  name: string,
  startTime: number,
};

export type BatchConfigTransition = {
  name?: string,
  startTime?: number,
  _updatedFibers?: Set<Fiber>,
};

export type Transitions = Set<Transition> | null;

export type TransitionCallbackObject = {|
  type: TransitionCallback,
  transitionName: string,
  startTime: number,
  markerName?: string,
  pendingBoundaries?: Array<SuspenseInfo>,
|};

export type TransitionCallback = 0 | 1;

export const TransitionStart = 0;
export const TransitionComplete = 1;

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
    }
  });
}
