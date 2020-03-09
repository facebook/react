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
  batchedEventUpdates as batchedEventUpdates_old,
  batchedUpdates as batchedUpdates_old,
  unbatchedUpdates as unbatchedUpdates_old,
  deferredUpdates as deferredUpdates_old,
  syncUpdates as syncUpdates_old,
  discreteUpdates as discreteUpdates_old,
  flushDiscreteUpdates as flushDiscreteUpdates_old,
  flushControlled as flushControlled_old,
  flushSync as flushSync_old,
  flushPassiveEffects as flushPassiveEffects_old,
  IsThisRendererActing as IsThisRendererActing_old,
  getPublicRootInstance as getPublicRootInstance_old,
  attemptSynchronousHydration as attemptSynchronousHydration_old,
  attemptUserBlockingHydration as attemptUserBlockingHydration_old,
  attemptContinuousHydration as attemptContinuousHydration_old,
  attemptHydrationAtCurrentPriority as attemptHydrationAtCurrentPriority_old,
  findHostInstance as findHostInstance_old,
  findHostInstanceWithWarning as findHostInstanceWithWarning_old,
  findHostInstanceWithNoPortals as findHostInstanceWithNoPortals_old,
  shouldSuspend as shouldSuspend_old,
  injectIntoDevTools as injectIntoDevTools_old,
  act as act_old,
} from './ReactFiberReconciler.old';

// TODO: Update these to point to the fork.
import {
  createContainer as createContainer_new,
  updateContainer as updateContainer_new,
  batchedEventUpdates as batchedEventUpdates_new,
  batchedUpdates as batchedUpdates_new,
  unbatchedUpdates as unbatchedUpdates_new,
  deferredUpdates as deferredUpdates_new,
  syncUpdates as syncUpdates_new,
  discreteUpdates as discreteUpdates_new,
  flushDiscreteUpdates as flushDiscreteUpdates_new,
  flushControlled as flushControlled_new,
  flushSync as flushSync_new,
  flushPassiveEffects as flushPassiveEffects_new,
  IsThisRendererActing as IsThisRendererActing_new,
  getPublicRootInstance as getPublicRootInstance_new,
  attemptSynchronousHydration as attemptSynchronousHydration_new,
  attemptUserBlockingHydration as attemptUserBlockingHydration_new,
  attemptContinuousHydration as attemptContinuousHydration_new,
  attemptHydrationAtCurrentPriority as attemptHydrationAtCurrentPriority_new,
  findHostInstance as findHostInstance_new,
  findHostInstanceWithWarning as findHostInstanceWithWarning_new,
  findHostInstanceWithNoPortals as findHostInstanceWithNoPortals_new,
  shouldSuspend as shouldSuspend_new,
  injectIntoDevTools as injectIntoDevTools_new,
  act as act_new,
} from './ReactFiberReconciler.old';

export const createContainer = enableNewReconciler
  ? createContainer_new
  : createContainer_old;
export const updateContainer = enableNewReconciler
  ? updateContainer_new
  : updateContainer_old;
export const batchedEventUpdates = enableNewReconciler
  ? batchedEventUpdates_new
  : batchedEventUpdates_old;
export const batchedUpdates = enableNewReconciler
  ? batchedUpdates_new
  : batchedUpdates_old;
export const unbatchedUpdates = enableNewReconciler
  ? unbatchedUpdates_new
  : unbatchedUpdates_old;
export const deferredUpdates = enableNewReconciler
  ? deferredUpdates_new
  : deferredUpdates_old;
export const syncUpdates = enableNewReconciler
  ? syncUpdates_new
  : syncUpdates_old;
export const discreteUpdates = enableNewReconciler
  ? discreteUpdates_new
  : discreteUpdates_old;
export const flushDiscreteUpdates = enableNewReconciler
  ? flushDiscreteUpdates_new
  : flushDiscreteUpdates_old;
export const flushControlled = enableNewReconciler
  ? flushControlled_new
  : flushControlled_old;
export const flushSync = enableNewReconciler ? flushSync_new : flushSync_old;
export const flushPassiveEffects = enableNewReconciler
  ? flushPassiveEffects_new
  : flushPassiveEffects_old;
export const IsThisRendererActing = enableNewReconciler
  ? IsThisRendererActing_new
  : IsThisRendererActing_old;
export const getPublicRootInstance = enableNewReconciler
  ? getPublicRootInstance_new
  : getPublicRootInstance_old;
export const attemptSynchronousHydration = enableNewReconciler
  ? attemptSynchronousHydration_new
  : attemptSynchronousHydration_old;
export const attemptUserBlockingHydration = enableNewReconciler
  ? attemptUserBlockingHydration_new
  : attemptUserBlockingHydration_old;
export const attemptContinuousHydration = enableNewReconciler
  ? attemptContinuousHydration_new
  : attemptContinuousHydration_old;
export const attemptHydrationAtCurrentPriority = enableNewReconciler
  ? attemptHydrationAtCurrentPriority_new
  : attemptHydrationAtCurrentPriority_old;
export const findHostInstance = enableNewReconciler
  ? findHostInstance_new
  : findHostInstance_old;
export const findHostInstanceWithWarning = enableNewReconciler
  ? findHostInstanceWithWarning_new
  : findHostInstanceWithWarning_old;
export const findHostInstanceWithNoPortals = enableNewReconciler
  ? findHostInstanceWithNoPortals_new
  : findHostInstanceWithNoPortals_old;
export const shouldSuspend = enableNewReconciler
  ? shouldSuspend_new
  : shouldSuspend_old;
export const injectIntoDevTools = enableNewReconciler
  ? injectIntoDevTools_new
  : injectIntoDevTools_old;
export const act = enableNewReconciler ? act_new : act_old;
