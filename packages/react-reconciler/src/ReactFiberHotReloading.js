/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';
import type {ReactElement} from '../../shared/ReactElementType';
import type {Instance} from './ReactFiberHostConfig';
import type {FiberRoot} from './ReactInternalTypes';
import type {ReactNodeList} from 'shared/ReactTypes';

import {enableNewReconciler} from 'shared/ReactFeatureFlags';

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

export type Family = {
  current: any,
};

export type RefreshUpdate = {
  staleFamilies: Set<Family>,
  updatedFamilies: Set<Family>,
};

// Resolves type to a family.
export type RefreshHandler = any => Family | void;

// Used by React Refresh runtime through DevTools Global Hook.
export type SetRefreshHandler = (handler: RefreshHandler | null) => void;
export type ScheduleRefresh = (root: FiberRoot, update: RefreshUpdate) => void;
export type ScheduleRoot = (root: FiberRoot, element: ReactNodeList) => void;
export type FindHostInstancesForRefresh = (
  root: FiberRoot,
  families: Array<Family>,
) => Set<Instance>;

export const setRefreshHandler: (
  handler: RefreshHandler | null,
) => void = enableNewReconciler ? setRefreshHandler_new : setRefreshHandler_old;
export const resolveFunctionForHotReloading = enableNewReconciler
  ? resolveFunctionForHotReloading_new
  : resolveFunctionForHotReloading_old;
export const resolveClassForHotReloading = enableNewReconciler
  ? resolveClassForHotReloading_new
  : resolveClassForHotReloading_old;
export const resolveForwardRefForHotReloading = enableNewReconciler
  ? resolveForwardRefForHotReloading_new
  : resolveForwardRefForHotReloading_old;
export const isCompatibleFamilyForHotReloading: (
  fiber: Fiber,
  element: ReactElement,
) => boolean = enableNewReconciler
  ? isCompatibleFamilyForHotReloading_new
  : isCompatibleFamilyForHotReloading_old;
export const markFailedErrorBoundaryForHotReloading: (
  fiber: Fiber,
) => void = enableNewReconciler
  ? markFailedErrorBoundaryForHotReloading_new
  : markFailedErrorBoundaryForHotReloading_old;
export const scheduleRefresh: ScheduleRefresh = enableNewReconciler
  ? scheduleRefresh_new
  : scheduleRefresh_old;
export const scheduleRoot: ScheduleRoot = enableNewReconciler
  ? scheduleRoot_new
  : scheduleRoot_old;
export const findHostInstancesForRefresh: FindHostInstancesForRefresh = enableNewReconciler
  ? findHostInstancesForRefresh_new
  : findHostInstancesForRefresh_old;
