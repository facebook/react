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
  return nextState === null;
}
