/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableNewReconciler} from 'shared/ReactFeatureFlags';

// The entry file imports either the old or new version of the reconciler.
// During build and testing, this indirection is always shimmed with the actual
// modules, otherwise both reconcilers would be initialized. So this is really
// only here for Flow purposes.

import {
  createContainer as createContainer_old,
  createHydrationContainer as createHydrationContainer_old,
  updateContainer as updateContainer_old,
  batchedUpdates as batchedUpdates_old,
  deferredUpdates as deferredUpdates_old,
  discreteUpdates as discreteUpdates_old,
  flushControlled as flushControlled_old,
  flushSync as flushSync_old,
  isAlreadyRendering as isAlreadyRendering_old,
  flushPassiveEffects as flushPassiveEffects_old,
  getPublicRootInstance as getPublicRootInstance_old,
  attemptSynchronousHydration as attemptSynchronousHydration_old,
  attemptDiscreteHydration as attemptDiscreteHydration_old,
  attemptContinuousHydration as attemptContinuousHydration_old,
  attemptHydrationAtCurrentPriority as attemptHydrationAtCurrentPriority_old,
  findHostInstance as findHostInstance_old,
  findHostInstanceWithWarning as findHostInstanceWithWarning_old,
  findHostInstanceWithNoPortals as findHostInstanceWithNoPortals_old,
  shouldError as shouldError_old,
  shouldSuspend as shouldSuspend_old,
  injectIntoDevTools as injectIntoDevTools_old,
  createPortal as createPortal_old,
  createComponentSelector as createComponentSelector_old,
  createHasPseudoClassSelector as createHasPseudoClassSelector_old,
  createRoleSelector as createRoleSelector_old,
  createTestNameSelector as createTestNameSelector_old,
  createTextSelector as createTextSelector_old,
  getFindAllNodesFailureDescription as getFindAllNodesFailureDescription_old,
  findAllNodes as findAllNodes_old,
  findBoundingRects as findBoundingRects_old,
  focusWithin as focusWithin_old,
  observeVisibleRects as observeVisibleRects_old,
  registerMutableSourceForHydration as registerMutableSourceForHydration_old,
  runWithPriority as runWithPriority_old,
  getCurrentUpdatePriority as getCurrentUpdatePriority_old,
} from './ReactFiberReconciler.old';

import {
  createContainer as createContainer_new,
  createHydrationContainer as createHydrationContainer_new,
  updateContainer as updateContainer_new,
  batchedUpdates as batchedUpdates_new,
  deferredUpdates as deferredUpdates_new,
  discreteUpdates as discreteUpdates_new,
  flushControlled as flushControlled_new,
  flushSync as flushSync_new,
  isAlreadyRendering as isAlreadyRendering_new,
  flushPassiveEffects as flushPassiveEffects_new,
  getPublicRootInstance as getPublicRootInstance_new,
  attemptSynchronousHydration as attemptSynchronousHydration_new,
  attemptDiscreteHydration as attemptDiscreteHydration_new,
  attemptContinuousHydration as attemptContinuousHydration_new,
  attemptHydrationAtCurrentPriority as attemptHydrationAtCurrentPriority_new,
  findHostInstance as findHostInstance_new,
  findHostInstanceWithWarning as findHostInstanceWithWarning_new,
  findHostInstanceWithNoPortals as findHostInstanceWithNoPortals_new,
  shouldError as shouldError_new,
  shouldSuspend as shouldSuspend_new,
  injectIntoDevTools as injectIntoDevTools_new,
  createPortal as createPortal_new,
  createComponentSelector as createComponentSelector_new,
  createHasPseudoClassSelector as createHasPseudoClassSelector_new,
  createRoleSelector as createRoleSelector_new,
  createTestNameSelector as createTestNameSelector_new,
  createTextSelector as createTextSelector_new,
  getFindAllNodesFailureDescription as getFindAllNodesFailureDescription_new,
  findAllNodes as findAllNodes_new,
  findBoundingRects as findBoundingRects_new,
  focusWithin as focusWithin_new,
  observeVisibleRects as observeVisibleRects_new,
  registerMutableSourceForHydration as registerMutableSourceForHydration_new,
  runWithPriority as runWithPriority_new,
  getCurrentUpdatePriority as getCurrentUpdatePriority_new,
} from './ReactFiberReconciler.new';

export const createContainer: typeof createContainer_new = enableNewReconciler
  ? createContainer_new
  : createContainer_old;
export const createHydrationContainer: typeof createHydrationContainer_new = enableNewReconciler
  ? createHydrationContainer_new
  : createHydrationContainer_old;
export const updateContainer: typeof updateContainer_new = enableNewReconciler
  ? updateContainer_new
  : updateContainer_old;
export const batchedUpdates: typeof batchedUpdates_new = enableNewReconciler
  ? batchedUpdates_new
  : batchedUpdates_old;
export const deferredUpdates: typeof deferredUpdates_new = enableNewReconciler
  ? deferredUpdates_new
  : deferredUpdates_old;
export const discreteUpdates: typeof discreteUpdates_new = enableNewReconciler
  ? discreteUpdates_new
  : discreteUpdates_old;
export const flushControlled: typeof flushControlled_new = enableNewReconciler
  ? flushControlled_new
  : flushControlled_old;
export const flushSync: typeof flushSync_new = enableNewReconciler
  ? flushSync_new
  : flushSync_old;
export const isAlreadyRendering: typeof isAlreadyRendering_new = enableNewReconciler
  ? isAlreadyRendering_new
  : isAlreadyRendering_old;
export const flushPassiveEffects: typeof flushPassiveEffects_new = enableNewReconciler
  ? flushPassiveEffects_new
  : flushPassiveEffects_old;
export const getPublicRootInstance: typeof getPublicRootInstance_new = enableNewReconciler
  ? getPublicRootInstance_new
  : getPublicRootInstance_old;
export const attemptSynchronousHydration: typeof attemptSynchronousHydration_new = enableNewReconciler
  ? attemptSynchronousHydration_new
  : attemptSynchronousHydration_old;
export const attemptDiscreteHydration: typeof attemptDiscreteHydration_new = enableNewReconciler
  ? attemptDiscreteHydration_new
  : attemptDiscreteHydration_old;
export const attemptContinuousHydration: typeof attemptContinuousHydration_new = enableNewReconciler
  ? attemptContinuousHydration_new
  : attemptContinuousHydration_old;
export const attemptHydrationAtCurrentPriority: typeof attemptHydrationAtCurrentPriority_new = enableNewReconciler
  ? attemptHydrationAtCurrentPriority_new
  : attemptHydrationAtCurrentPriority_old;
export const getCurrentUpdatePriority: typeof getCurrentUpdatePriority_new = enableNewReconciler
  ? getCurrentUpdatePriority_new
  : /* $FlowFixMe[incompatible-type] opaque types EventPriority from new and old
     * are incompatible. */
    getCurrentUpdatePriority_old;
export const findHostInstance: typeof findHostInstance_new = enableNewReconciler
  ? findHostInstance_new
  : findHostInstance_old;
export const findHostInstanceWithWarning: typeof findHostInstanceWithWarning_new = enableNewReconciler
  ? findHostInstanceWithWarning_new
  : findHostInstanceWithWarning_old;
export const findHostInstanceWithNoPortals: typeof findHostInstanceWithNoPortals_new = enableNewReconciler
  ? findHostInstanceWithNoPortals_new
  : findHostInstanceWithNoPortals_old;
export const shouldError: typeof shouldError_new = enableNewReconciler
  ? shouldError_new
  : shouldError_old;
export const shouldSuspend: typeof shouldSuspend_new = enableNewReconciler
  ? shouldSuspend_new
  : shouldSuspend_old;
export const injectIntoDevTools: typeof injectIntoDevTools_new = enableNewReconciler
  ? injectIntoDevTools_new
  : injectIntoDevTools_old;
export const createPortal: typeof createPortal_new = enableNewReconciler
  ? createPortal_new
  : createPortal_old;
export const createComponentSelector: typeof createComponentSelector_new = enableNewReconciler
  ? createComponentSelector_new
  : createComponentSelector_old;

export const createHasPseudoClassSelector: typeof createHasPseudoClassSelector_new = enableNewReconciler
  ? createHasPseudoClassSelector_new
  : createHasPseudoClassSelector_old;
export const createRoleSelector: typeof createRoleSelector_new = enableNewReconciler
  ? createRoleSelector_new
  : createRoleSelector_old;
export const createTextSelector: typeof createTextSelector_new = enableNewReconciler
  ? createTextSelector_new
  : createTextSelector_old;
export const createTestNameSelector: typeof createTestNameSelector_new = enableNewReconciler
  ? createTestNameSelector_new
  : createTestNameSelector_old;
export const getFindAllNodesFailureDescription: typeof getFindAllNodesFailureDescription_new = enableNewReconciler
  ? getFindAllNodesFailureDescription_new
  : getFindAllNodesFailureDescription_old;
export const findAllNodes: typeof findAllNodes_new = enableNewReconciler
  ? findAllNodes_new
  : findAllNodes_old;
export const findBoundingRects: typeof findBoundingRects_new = enableNewReconciler
  ? findBoundingRects_new
  : findBoundingRects_old;
export const focusWithin: typeof focusWithin_new = enableNewReconciler
  ? focusWithin_new
  : focusWithin_old;
export const observeVisibleRects: typeof observeVisibleRects_new = enableNewReconciler
  ? observeVisibleRects_new
  : observeVisibleRects_old;
export const registerMutableSourceForHydration: typeof registerMutableSourceForHydration_new = enableNewReconciler
  ? registerMutableSourceForHydration_new
  : registerMutableSourceForHydration_old;
/* $FlowFixMe[incompatible-type] opaque types EventPriority from new and old
 * are incompatible. */
export const runWithPriority: typeof runWithPriority_new = enableNewReconciler
  ? runWithPriority_new
  : runWithPriority_old;
