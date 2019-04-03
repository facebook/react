/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableNewScheduler} from 'shared/ReactFeatureFlags';

import {
  requestCurrentTime as requestCurrentTime_old,
  computeExpirationForFiber as computeExpirationForFiber_old,
  captureCommitPhaseError as captureCommitPhaseError_old,
  onUncaughtError as onUncaughtError_old,
  markRenderEventTime as markRenderEventTime_old,
  renderDidSuspend as renderDidSuspend_old,
  renderDidError as renderDidError_old,
  pingSuspendedRoot as pingSuspendedRoot_old,
  retryTimedOutBoundary as retryTimedOutBoundary_old,
  resolveRetryThenable as resolveRetryThenable_old,
  markLegacyErrorBoundaryAsFailed as markLegacyErrorBoundaryAsFailed_old,
  isAlreadyFailedLegacyErrorBoundary as isAlreadyFailedLegacyErrorBoundary_old,
  scheduleWork as scheduleWork_old,
  flushRoot as flushRoot_old,
  batchedUpdates as batchedUpdates_old,
  unbatchedUpdates as unbatchedUpdates_old,
  flushSync as flushSync_old,
  flushControlled as flushControlled_old,
  deferredUpdates as deferredUpdates_old,
  syncUpdates as syncUpdates_old,
  interactiveUpdates as interactiveUpdates_old,
  flushInteractiveUpdates as flushInteractiveUpdates_old,
  computeUniqueAsyncExpiration as computeUniqueAsyncExpiration_old,
  flushPassiveEffects as flushPassiveEffects_old,
  warnIfNotCurrentlyActingUpdatesInDev as warnIfNotCurrentlyActingUpdatesInDev_old,
} from './ReactFiberScheduler.old';

import {
  requestCurrentTime as requestCurrentTime_new,
  computeExpirationForFiber as computeExpirationForFiber_new,
  captureCommitPhaseError as captureCommitPhaseError_new,
  onUncaughtError as onUncaughtError_new,
  markRenderEventTime as markRenderEventTime_new,
  renderDidSuspend as renderDidSuspend_new,
  renderDidError as renderDidError_new,
  pingSuspendedRoot as pingSuspendedRoot_new,
  retryTimedOutBoundary as retryTimedOutBoundary_new,
  resolveRetryThenable as resolveRetryThenable_new,
  markLegacyErrorBoundaryAsFailed as markLegacyErrorBoundaryAsFailed_new,
  isAlreadyFailedLegacyErrorBoundary as isAlreadyFailedLegacyErrorBoundary_new,
  scheduleWork as scheduleWork_new,
  flushRoot as flushRoot_new,
  batchedUpdates as batchedUpdates_new,
  unbatchedUpdates as unbatchedUpdates_new,
  flushSync as flushSync_new,
  flushControlled as flushControlled_new,
  deferredUpdates as deferredUpdates_new,
  syncUpdates as syncUpdates_new,
  interactiveUpdates as interactiveUpdates_new,
  flushInteractiveUpdates as flushInteractiveUpdates_new,
  computeUniqueAsyncExpiration as computeUniqueAsyncExpiration_new,
  flushPassiveEffects as flushPassiveEffects_new,
  warnIfNotCurrentlyActingUpdatesInDev as warnIfNotCurrentlyActingUpdatesInDev_new,
} from './ReactFiberScheduler.new';

export const requestCurrentTime = enableNewScheduler
  ? requestCurrentTime_new
  : requestCurrentTime_old;
export const computeExpirationForFiber = enableNewScheduler
  ? computeExpirationForFiber_new
  : computeExpirationForFiber_old;
export const captureCommitPhaseError = enableNewScheduler
  ? captureCommitPhaseError_new
  : captureCommitPhaseError_old;
export const onUncaughtError = enableNewScheduler
  ? onUncaughtError_new
  : onUncaughtError_old;
export const markRenderEventTime = enableNewScheduler
  ? markRenderEventTime_new
  : markRenderEventTime_old;
export const renderDidSuspend = enableNewScheduler
  ? renderDidSuspend_new
  : renderDidSuspend_old;
export const renderDidError = enableNewScheduler
  ? renderDidError_new
  : renderDidError_old;
export const pingSuspendedRoot = enableNewScheduler
  ? pingSuspendedRoot_new
  : pingSuspendedRoot_old;
export const retryTimedOutBoundary = enableNewScheduler
  ? retryTimedOutBoundary_new
  : retryTimedOutBoundary_old;
export const resolveRetryThenable = enableNewScheduler
  ? resolveRetryThenable_new
  : resolveRetryThenable_old;
export const markLegacyErrorBoundaryAsFailed = enableNewScheduler
  ? markLegacyErrorBoundaryAsFailed_new
  : markLegacyErrorBoundaryAsFailed_old;
export const isAlreadyFailedLegacyErrorBoundary = enableNewScheduler
  ? isAlreadyFailedLegacyErrorBoundary_new
  : isAlreadyFailedLegacyErrorBoundary_old;
export const scheduleWork = enableNewScheduler
  ? scheduleWork_new
  : scheduleWork_old;
export const flushRoot = enableNewScheduler ? flushRoot_new : flushRoot_old;
export const batchedUpdates = enableNewScheduler
  ? batchedUpdates_new
  : batchedUpdates_old;
export const unbatchedUpdates = enableNewScheduler
  ? unbatchedUpdates_new
  : unbatchedUpdates_old;
export const flushSync = enableNewScheduler ? flushSync_new : flushSync_old;
export const flushControlled = enableNewScheduler
  ? flushControlled_new
  : flushControlled_old;
export const deferredUpdates = enableNewScheduler
  ? deferredUpdates_new
  : deferredUpdates_old;
export const syncUpdates = enableNewScheduler
  ? syncUpdates_new
  : syncUpdates_old;
export const interactiveUpdates = enableNewScheduler
  ? interactiveUpdates_new
  : interactiveUpdates_old;
export const flushInteractiveUpdates = enableNewScheduler
  ? flushInteractiveUpdates_new
  : flushInteractiveUpdates_old;
export const computeUniqueAsyncExpiration = enableNewScheduler
  ? computeUniqueAsyncExpiration_new
  : computeUniqueAsyncExpiration_old;
export const flushPassiveEffects = enableNewScheduler
  ? flushPassiveEffects_new
  : flushPassiveEffects_old;
export const warnIfNotCurrentlyActingUpdatesInDev = enableNewScheduler
  ? warnIfNotCurrentlyActingUpdatesInDev_new
  : warnIfNotCurrentlyActingUpdatesInDev_old;

export type Thenable = {
  then(resolve: () => mixed, reject?: () => mixed): void | Thenable,
};
