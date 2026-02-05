/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Renderers that don't support mutation
// can re-export everything from this module.

// Mutation (when unsupported)
export const supportsMutation = false;

export function cloneMutableInstance(...args: any): any {
  console.log('[shim] cloneMutableInstance');
}

export function cloneMutableTextInstance(...args: any): any {
  console.log('[shim] cloneMutableTextInstance');
}

export function appendChild(...args: any): any {
  console.log('[shim] appendChild');
}

export function appendChildToContainer(...args: any): any {
  console.log('[shim] appendChildToContainer');
}

export function commitTextUpdate(...args: any): any {
  console.log('[shim] commitTextUpdate');
}

export function commitMount(...args: any): any {
  console.log('[shim] commitMount');
}

export function commitUpdate(...args: any): any {
  console.log('[shim] commitUpdate');
}

export function insertBefore(...args: any): any {
  console.log('[shim] insertBefore');
}

export function insertInContainerBefore(...args: any): any {
  console.log('[shim] insertInContainerBefore');
}

export function removeChild(...args: any): any {
  console.log('[shim] removeChild');
}

export function removeChildFromContainer(...args: any): any {
  console.log('[shim] removeChildFromContainer');
}

export function resetTextContent(...args: any): any {
  console.log('[shim] resetTextContent');
}

export function hideInstance(...args: any): any {
  console.log('[shim] hideInstance');
}

export function hideTextInstance(...args: any): any {
  console.log('[shim] hideTextInstance');
}

export function unhideInstance(...args: any): any {
  console.log('[shim] unhideInstance');
}

export function unhideTextInstance(...args: any): any {
  console.log('[shim] unhideTextInstance');
}

export function clearContainer(...args: any): any {
  console.log('[shim] clearContainer');
}

export function applyViewTransitionName(...args: any): any {
  console.log('[shim] applyViewTransitionName');
}

export function restoreViewTransitionName(...args: any): any {
  console.log('[shim] restoreViewTransitionName');
}

export function cancelViewTransitionName(...args: any): any {
  console.log('[shim] cancelViewTransitionName');
}

export function cancelRootViewTransitionName(...args: any): any {
  console.log('[shim] cancelRootViewTransitionName');
}

export function restoreRootViewTransitionName(...args: any): any {
  console.log('[shim] restoreRootViewTransitionName');
}

export function cloneRootViewTransitionContainer(...args: any): any {
  console.log('[shim] cloneRootViewTransitionContainer');
}

export function removeRootViewTransitionClone(...args: any): any {
  console.log('[shim] removeRootViewTransitionClone');
}

export type InstanceMeasurement = null;

export function measureInstance(...args: any): any {
  console.log('[shim] measureInstance');
}

export function measureClonedInstance(...args: any): any {
  console.log('[shim] measureClonedInstance');
}

export function wasInstanceInViewport(...args: any): any {
  console.log('[shim] wasInstanceInViewport');
}

export function hasInstanceChanged(...args: any): any {
  console.log('[shim] hasInstanceChanged');
}

export function hasInstanceAffectedParent(...args: any): any {
  console.log('[shim] hasInstanceAffectedParent');
}

export function startViewTransition(...args: any): any {
  console.log('[shim] startViewTransition');
}

export type RunningViewTransition = null;

export function startGestureTransition(...args: any): any {
  console.log('[shim] startGestureTransition');
}

export function stopViewTransition(...args: any): any {
  console.log('[shim] stopViewTransition');
}

export function addViewTransitionFinishedListener(...args: any): any {
  console.log('[shim] addViewTransitionFinishedListener');
}

export type ViewTransitionInstance = null | {name: string, ...};

export function createViewTransitionInstance(...args: any): any {
  console.log('[shim] createViewTransitionInstance');
}

export type GestureTimeline = any;

export function getCurrentGestureOffset(...args: any): any {
  console.log('[shim] getCurrentGestureOffset');
}
