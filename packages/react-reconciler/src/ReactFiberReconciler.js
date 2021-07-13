/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
  updateContainer as updateContainer_old,
  batchedUpdates as batchedUpdates_old,
  deferredUpdates as deferredUpdates_old,
  discreteUpdates as discreteUpdates_old,
  flushControlled as flushControlled_old,
  flushSync as flushSync_old,
  flushSyncWithoutWarningIfAlreadyRendering as flushSyncWithoutWarningIfAlreadyRendering_old,
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
  updateContainer as updateContainer_new,
  batchedUpdates as batchedUpdates_new,
  deferredUpdates as deferredUpdates_new,
  discreteUpdates as discreteUpdates_new,
  flushControlled as flushControlled_new,
  flushSync as flushSync_new,
  flushSyncWithoutWarningIfAlreadyRendering as flushSyncWithoutWarningIfAlreadyRendering_new,
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

export const createContainer = enableNewReconciler
  ? createContainer_new
  : createContainer_old;
export const updateContainer = enableNewReconciler
  ? updateContainer_new
  : updateContainer_old;
export const batchedUpdates = enableNewReconciler
  ? batchedUpdates_new
  : batchedUpdates_old;
export const deferredUpdates = enableNewReconciler
  ? deferredUpdates_new
  : deferredUpdates_old;
export const discreteUpdates = enableNewReconciler
  ? discreteUpdates_new
  : discreteUpdates_old;
export const flushControlled = enableNewReconciler
  ? flushControlled_new
  : flushControlled_old;
export const flushSync = enableNewReconciler ? flushSync_new : flushSync_old;
export const flushSyncWithoutWarningIfAlreadyRendering = enableNewReconciler
  ? flushSyncWithoutWarningIfAlreadyRendering_new
  : flushSyncWithoutWarningIfAlreadyRendering_old;
export const flushPassiveEffects = enableNewReconciler
  ? flushPassiveEffects_new
  : flushPassiveEffects_old;
export const getPublicRootInstance = enableNewReconciler
  ? getPublicRootInstance_new
  : getPublicRootInstance_old;
export const attemptSynchronousHydration = enableNewReconciler
  ? attemptSynchronousHydration_new
  : attemptSynchronousHydration_old;
export const attemptDiscreteHydration = enableNewReconciler
  ? attemptDiscreteHydration_new
  : attemptDiscreteHydration_old;
export const attemptContinuousHydration = enableNewReconciler
  ? attemptContinuousHydration_new
  : attemptContinuousHydration_old;
export const attemptHydrationAtCurrentPriority = enableNewReconciler
  ? attemptHydrationAtCurrentPriority_new
  : attemptHydrationAtCurrentPriority_old;
export const getCurrentUpdatePriority = enableNewReconciler
  ? getCurrentUpdatePriority_new
  : getCurrentUpdatePriority_old;
export const findHostInstance = enableNewReconciler
  ? findHostInstance_new
  : findHostInstance_old;
export const findHostInstanceWithWarning = enableNewReconciler
  ? findHostInstanceWithWarning_new
  : findHostInstanceWithWarning_old;
export const findHostInstanceWithNoPortals = enableNewReconciler
  ? findHostInstanceWithNoPortals_new
  : findHostInstanceWithNoPortals_old;
export const shouldError = enableNewReconciler
  ? shouldError_new
  : shouldError_old;
export const shouldSuspend = enableNewReconciler
  ? shouldSuspend_new
  : shouldSuspend_old;
export const injectIntoDevTools = enableNewReconciler
  ? injectIntoDevTools_new
  : injectIntoDevTools_old;
export const createPortal = enableNewReconciler
  ? createPortal_new
  : createPortal_old;
export const createComponentSelector = enableNewReconciler
  ? createComponentSelector_new
  : createComponentSelector_old;

//TODO: "psuedo" is spelled "pseudo"
export const createHasPseudoClassSelector = enableNewReconciler
  ? createHasPseudoClassSelector_new
  : createHasPseudoClassSelector_old;
export const createRoleSelector = enableNewReconciler
  ? createRoleSelector_new
  : createRoleSelector_old;
export const createTextSelector = enableNewReconciler
  ? createTextSelector_new
  : createTextSelector_old;
export const createTestNameSelector = enableNewReconciler
  ? createTestNameSelector_new
  : createTestNameSelector_old;
export const getFindAllNodesFailureDescription = enableNewReconciler
  ? getFindAllNodesFailureDescription_new
  : getFindAllNodesFailureDescription_old;
export const findAllNodes = enableNewReconciler
  ? findAllNodes_new
  : findAllNodes_old;
export const findBoundingRects = enableNewReconciler
  ? findBoundingRects_new
  : findBoundingRects_old;
export const focusWithin = enableNewReconciler
  ? focusWithin_new
  : focusWithin_old;
export const observeVisibleRects = enableNewReconciler
  ? observeVisibleRects_new
  : observeVisibleRects_old;
export const registerMutableSourceForHydration = enableNewReconciler
  ? registerMutableSourceForHydration_new
  : registerMutableSourceForHydration_old;
export const runWithPriority = enableNewReconciler
  ? runWithPriority_new
  : runWithPriority_old;
