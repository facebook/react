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

import {enableTransitionTracing} from 'shared/ReactFeatureFlags';

export type SuspenseInfo = {name: string | null};

export type TransitionObject = {
  transitionName: string,
  startTime: number,
};

export type PendingTransitionCallbacks = {
  transitionStart: Array<TransitionObject> | null,
  transitionComplete: Array<TransitionObject> | null,
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
