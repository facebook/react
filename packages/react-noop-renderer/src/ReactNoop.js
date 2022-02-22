/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * This is a renderer of React that doesn't have a render target output.
 * It is useful to demonstrate the internals of the reconciler in isolation
 * and for testing semantics of reconciliation separate from the host
 * environment.
 */

import ReactFiberReconciler from 'react-reconciler';
import createReactNoop from './createReactNoop';

export const {
  _Scheduler,
  getChildren,
  getPendingChildren,
  getOrCreateRootContainer,
  createRoot,
  createLegacyRoot,
  getChildrenAsJSX,
  getPendingChildrenAsJSX,
  createPortal,
  render,
  renderLegacySyncRoot,
  renderToRootWithID,
  unmountRootWithID,
  findInstance,
  flushNextYield,
  flushWithHostCounters,
  expire,
  flushExpired,
  batchedUpdates,
  deferredUpdates,
  discreteUpdates,
  idleUpdates,
  flushSync,
  flushPassiveEffects,
  act,
  dumpTree,
  getRoot,
  // TODO: Remove this after callers migrate to alternatives.
  unstable_runWithPriority,
} = createReactNoop(
  ReactFiberReconciler, // reconciler
  true, // useMutation
);
