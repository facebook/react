/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export {
  createContainer,
  createHydrationContainer,
  updateContainer,
  batchedUpdates,
  deferredUpdates,
  discreteUpdates,
  flushControlled,
  flushSync,
  isAlreadyRendering,
  flushPassiveEffects,
  getPublicRootInstance,
  attemptSynchronousHydration,
  attemptDiscreteHydration,
  attemptContinuousHydration,
  attemptHydrationAtCurrentPriority,
  findHostInstance,
  findHostInstanceWithWarning,
  findHostInstanceWithNoPortals,
  shouldError,
  shouldSuspend,
  injectIntoDevTools,
  createPortal,
  createComponentSelector,
  createHasPseudoClassSelector,
  createRoleSelector,
  createTestNameSelector,
  createTextSelector,
  getFindAllNodesFailureDescription,
  findAllNodes,
  findBoundingRects,
  focusWithin,
  observeVisibleRects,
  registerMutableSourceForHydration,
  runWithPriority,
  getCurrentUpdatePriority,
} from './ReactFiberReconciler.old';
