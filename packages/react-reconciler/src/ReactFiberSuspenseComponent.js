/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {ExpirationTime} from './ReactFiberExpirationTime';

export type SuspenseState = {|
  // Whether a component in the child subtree already suspended. If true,
  // subsequent suspends should bubble up to the next boundary.
  alreadyCaptured: boolean,
  // Whether the boundary renders the primary or fallback children. This is
  // separate from `alreadyCaptured` because outside of strict mode, when a
  // boundary times out, the first commit renders the primary children in an
  // incomplete state, then performs a second commit to switch the fallback.
  // In that first commit, `alreadyCaptured` is false and `didTimeout` is true.
  didTimeout: boolean,
  // The time at which the boundary timed out. This is separate from
  // `didTimeout` because it's not set unless the boundary actually commits.
  timedOutAt: ExpirationTime,
|};

export function shouldCaptureSuspense(
  current: Fiber | null,
  workInProgress: Fiber,
): boolean {
  // In order to capture, the Suspense component must have a fallback prop.
  if (workInProgress.memoizedProps.fallback === undefined) {
    return false;
  }
  // If it was the primary children that just suspended, capture and render the
  // fallback. Otherwise, don't capture and bubble to the next boundary.
  const nextState: SuspenseState | null = workInProgress.memoizedState;
  return nextState === null || !nextState.didTimeout;
}
