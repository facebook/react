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
  renderDidSuspend as renderDidSuspend_old,
  renderDidError as renderDidError_old,
  pingSuspendedRoot as pingSuspendedRoot_old,
  retryTimedOutBoundary as retryTimedOutBoundary_old,
  resolveRetryThenable as resolveRetryThenable_old,
  markLegacyErrorBoundaryAsFailed as markLegacyErrorBoundaryAsFailed_old,
  isAlreadyFailedLegacyErrorBoundary as isAlreadyFailedLegacyErrorBoundary_old,
  scheduleWork as scheduleWork_old,
  requestWork as requestWork_old,
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
  renderDidSuspend as renderDidSuspend_new,
  renderDidError as renderDidError_new,
  pingSuspendedRoot as pingSuspendedRoot_new,
  retryTimedOutBoundary as retryTimedOutBoundary_new,
  resolveRetryThenable as resolveRetryThenable_new,
  markLegacyErrorBoundaryAsFailed as markLegacyErrorBoundaryAsFailed_new,
  isAlreadyFailedLegacyErrorBoundary as isAlreadyFailedLegacyErrorBoundary_new,
  scheduleWork as scheduleWork_new,
  requestWork as requestWork_new,
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

export let requestCurrentTime = requestCurrentTime_old;
export let computeExpirationForFiber = computeExpirationForFiber_old;
export let captureCommitPhaseError = captureCommitPhaseError_old;
export let onUncaughtError = onUncaughtError_old;
export let renderDidSuspend = renderDidSuspend_old;
export let renderDidError = renderDidError_old;
export let pingSuspendedRoot = pingSuspendedRoot_old;
export let retryTimedOutBoundary = retryTimedOutBoundary_old;
export let resolveRetryThenable = resolveRetryThenable_old;
export let markLegacyErrorBoundaryAsFailed = markLegacyErrorBoundaryAsFailed_old;
export let isAlreadyFailedLegacyErrorBoundary = isAlreadyFailedLegacyErrorBoundary_old;
export let scheduleWork = scheduleWork_old;
export let requestWork = requestWork_old;
export let flushRoot = flushRoot_old;
export let batchedUpdates = batchedUpdates_old;
export let unbatchedUpdates = unbatchedUpdates_old;
export let flushSync = flushSync_old;
export let flushControlled = flushControlled_old;
export let deferredUpdates = deferredUpdates_old;
export let syncUpdates = syncUpdates_old;
export let interactiveUpdates = interactiveUpdates_old;
export let flushInteractiveUpdates = flushInteractiveUpdates_old;
export let computeUniqueAsyncExpiration = computeUniqueAsyncExpiration_old;
export let flushPassiveEffects = flushPassiveEffects_old;
export let warnIfNotCurrentlyActingUpdatesInDev = warnIfNotCurrentlyActingUpdatesInDev_old;

if (enableNewScheduler) {
  requestCurrentTime = requestCurrentTime_new;
  computeExpirationForFiber = computeExpirationForFiber_new;
  captureCommitPhaseError = captureCommitPhaseError_new;
  onUncaughtError = onUncaughtError_new;
  renderDidSuspend = renderDidSuspend_new;
  renderDidError = renderDidError_new;
  pingSuspendedRoot = pingSuspendedRoot_new;
  retryTimedOutBoundary = retryTimedOutBoundary_new;
  resolveRetryThenable = resolveRetryThenable_new;
  markLegacyErrorBoundaryAsFailed = markLegacyErrorBoundaryAsFailed_new;
  isAlreadyFailedLegacyErrorBoundary = isAlreadyFailedLegacyErrorBoundary_new;
  scheduleWork = scheduleWork_new;
  requestWork = requestWork_new;
  flushRoot = flushRoot_new;
  batchedUpdates = batchedUpdates_new;
  unbatchedUpdates = unbatchedUpdates_new;
  flushSync = flushSync_new;
  flushControlled = flushControlled_new;
  deferredUpdates = deferredUpdates_new;
  syncUpdates = syncUpdates_new;
  interactiveUpdates = interactiveUpdates_new;
  flushInteractiveUpdates = flushInteractiveUpdates_new;
  computeUniqueAsyncExpiration = computeUniqueAsyncExpiration_new;
  flushPassiveEffects = flushPassiveEffects_new;
  warnIfNotCurrentlyActingUpdatesInDev = warnIfNotCurrentlyActingUpdatesInDev_new;
}

export type Thenable = {
  then(resolve: () => mixed, reject?: () => mixed): void | Thenable,
};
