/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableNewReconciler} from 'shared/ReactFeatureFlags';

export type {
  Family,
  RefreshUpdate,
  SetRefreshHandler,
  ScheduleRefresh,
  ScheduleRoot,
  FindHostInstancesForRefresh,
} from './ReactFiberHotReloading';

import {
  setRefreshHandler as setRefreshHandler_old,
  resolveFunctionForHotReloading as resolveFunctionForHotReloading_old,
  resolveClassForHotReloading as resolveClassForHotReloading_old,
  resolveForwardRefForHotReloading as resolveForwardRefForHotReloading_old,
  isCompatibleFamilyForHotReloading as isCompatibleFamilyForHotReloading_old,
  markFailedErrorBoundaryForHotReloading as markFailedErrorBoundaryForHotReloading_old,
  scheduleRefresh as scheduleRefresh_old,
  scheduleRoot as scheduleRoot_old,
  findHostInstancesForRefresh as findHostInstancesForRefresh_old,
} from './ReactFiberHotReloading.old';

import {
  setRefreshHandler as setRefreshHandler_new,
  resolveFunctionForHotReloading as resolveFunctionForHotReloading_new,
  resolveClassForHotReloading as resolveClassForHotReloading_new,
  resolveForwardRefForHotReloading as resolveForwardRefForHotReloading_new,
  isCompatibleFamilyForHotReloading as isCompatibleFamilyForHotReloading_new,
  markFailedErrorBoundaryForHotReloading as markFailedErrorBoundaryForHotReloading_new,
  scheduleRefresh as scheduleRefresh_new,
  scheduleRoot as scheduleRoot_new,
  findHostInstancesForRefresh as findHostInstancesForRefresh_new,
} from './ReactFiberHotReloading.new';

export const setRefreshHandler = enableNewReconciler
  ? setRefreshHandler_new
  : setRefreshHandler_old;
export const resolveFunctionForHotReloading = enableNewReconciler
  ? resolveFunctionForHotReloading_new
  : resolveFunctionForHotReloading_old;
export const resolveClassForHotReloading = enableNewReconciler
  ? resolveClassForHotReloading_new
  : resolveClassForHotReloading_old;
export const resolveForwardRefForHotReloading = enableNewReconciler
  ? resolveForwardRefForHotReloading_new
  : resolveForwardRefForHotReloading_old;
export const isCompatibleFamilyForHotReloading = enableNewReconciler
  ? isCompatibleFamilyForHotReloading_new
  : isCompatibleFamilyForHotReloading_old;
export const markFailedErrorBoundaryForHotReloading = enableNewReconciler
  ? markFailedErrorBoundaryForHotReloading_new
  : markFailedErrorBoundaryForHotReloading_old;
export const scheduleRefresh = enableNewReconciler
  ? scheduleRefresh_new
  : scheduleRefresh_old;
export const scheduleRoot = enableNewReconciler
  ? scheduleRoot_new
  : scheduleRoot_old;
export const findHostInstancesForRefresh = enableNewReconciler
  ? findHostInstancesForRefresh_new
  : findHostInstancesForRefresh_old;
