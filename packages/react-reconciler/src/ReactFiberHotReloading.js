/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FiberRoot} from './ReactInternalTypes';
import type {Instance} from './ReactFiberHostConfig';
import type {ReactNodeList} from 'shared/ReactTypes';

export {
  setRefreshHandler,
  resolveFunctionForHotReloading,
  resolveClassForHotReloading,
  resolveForwardRefForHotReloading,
  isCompatibleFamilyForHotReloading,
  markFailedErrorBoundaryForHotReloading,
  scheduleRefresh,
  scheduleRoot,
  findHostInstancesForRefresh,
} from './ReactFiberHotReloading.old';

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
