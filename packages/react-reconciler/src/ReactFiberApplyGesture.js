/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber, FiberRoot} from './ReactInternalTypes';

import {
  cancelRootViewTransitionName,
  restoreRootViewTransitionName,
} from './ReactFiberConfig';

// Apply mutations to enter the destination state of a gesture render.
// These will be reverted in later phases.
export function applyDestinationMutations(
  root: FiberRoot,
  finishedWork: Fiber,
): void {
  // TODO
}

// Measure where boundaries should end up in the destination state.
// This doesn't do any mutations itself and needs to run after all
// other mutations have been applied.
export function measureDestinationLayout(
  root: FiberRoot,
  finishedWork: Fiber,
): void {
  // TODO
}

// Revert mutations applied earlier but keep insertions outside the viewport.
export function revertDestinationMutations(
  root: FiberRoot,
  finishedWork: Fiber,
): void {
  // TODO
}

// Revert insertions and apply view transition names to the "new" (current) state.
export function applyDepartureTransitions(
  root: FiberRoot,
  finishedWork: Fiber,
): void {
  // TODO
  cancelRootViewTransitionName(root.containerInfo);
}

// Revert transition names and start/adjust animations on the started View Transition.
export function startGestureAnimations(
  root: FiberRoot,
  finishedWork: Fiber,
): void {
  // TODO
  restoreRootViewTransitionName(root.containerInfo);
}
