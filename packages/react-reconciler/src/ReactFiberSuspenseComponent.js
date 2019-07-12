/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import {SuspenseComponent, SuspenseListComponent} from 'shared/ReactWorkTags';
import {NoEffect, DidCapture} from 'shared/ReactSideEffectTags';

// TODO: This is now an empty object. Should we switch this to a boolean?
// Alternatively we can make this use an effect tag similar to SuspenseList.
export type SuspenseState = {||};

export type SuspenseListTailMode = 'collapsed' | 'hidden' | void;

export type SuspenseListRenderState = {|
  isBackwards: boolean,
  // The currently rendering tail row.
  rendering: null | Fiber,
  // The last of the already rendered children.
  last: null | Fiber,
  // Remaining rows on the tail of the list.
  tail: null | Fiber,
  // The absolute time in ms that we'll expire the tail rendering.
  tailExpiration: number,
  // Tail insertions setting.
  tailMode: SuspenseListTailMode,
  // Last Effect before we rendered the "rendering" item.
  // Used to remove new effects added by the rendered item.
  lastEffect: null | Fiber,
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

export function findFirstSuspended(row: Fiber): null | Fiber {
  let node = row;
  while (node !== null) {
    if (node.tag === SuspenseComponent) {
      const state: SuspenseState | null = node.memoizedState;
      if (state !== null) {
        return node;
      }
    } else if (
      node.tag === SuspenseListComponent &&
      // revealOrder undefined can't be trusted because it don't
      // keep track of whether it suspended or not.
      node.memoizedProps.revealOrder !== undefined
    ) {
      let didSuspend = (node.effectTag & DidCapture) !== NoEffect;
      if (didSuspend) {
        return node;
      }
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === row) {
      return null;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === row) {
        return null;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
  return null;
}
