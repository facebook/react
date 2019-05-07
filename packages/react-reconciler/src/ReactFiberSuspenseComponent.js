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
  fallbackExpirationTime: ExpirationTime,
|};

export function shouldCaptureSuspense(
  workInProgress: Fiber,
  hasInvisibleParent: boolean,
): boolean {
  // If it was the primary children that just suspended, capture and render the
  // fallback. Otherwise, don't capture and bubble to the next boundary.
  const nextState: SuspenseState | null = workInProgress.memoizedState;
  if (nextState !== null) {
    return false;
  }
  const props = workInProgress.memoizedProps;
  // In order to capture, the Suspense component must have a fallback prop.
  if (props.fallback === undefined) {
    return false;
  }
  // Regular boundaries always capture.
  if (props.unstable_avoidThisFallback !== true) {
    return true;
  }
  // If it's a boundary we should avoid, then we prefer to bubble up to the
  // parent boundary if it is currently invisible.
  if (hasInvisibleParent) {
    return false;
  }
  // If the parent is not able to handle it, we must handle it.
  return true;
}
