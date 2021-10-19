/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Renderers that don't support hydration
// can re-export everything from this module.

function shim(...args: any) {
  throw new Error(
    'The current renderer does not support hydration. ' +
      'This error is likely caused by a bug in React. ' +
      'Please file an issue.',
  );
}

// Hydration (when unsupported)
export type SuspenseInstance = mixed;
export const supportsHydration = false;
export const canHydrateInstance = shim;
export const canHydrateTextInstance = shim;
export const canHydrateSuspenseInstance = shim;
export const isSuspenseInstancePending = shim;
export const isSuspenseInstanceFallback = shim;
export const registerSuspenseInstanceRetry = shim;
export const getNextHydratableSibling = shim;
export const getFirstHydratableChild = shim;
export const getFirstHydratableChildWithinContainer = shim;
export const getFirstHydratableChildWithinSuspenseInstance = shim;
export const hydrateInstance = shim;
export const hydrateTextInstance = shim;
export const hydrateSuspenseInstance = shim;
export const getNextHydratableInstanceAfterSuspenseInstance = shim;
export const commitHydratedContainer = shim;
export const commitHydratedSuspenseInstance = shim;
export const clearSuspenseBoundary = shim;
export const clearSuspenseBoundaryFromContainer = shim;
export const shouldDeleteUnhydratedTailInstances = shim;
export const didNotMatchHydratedContainerTextInstance = shim;
export const didNotMatchHydratedTextInstance = shim;
export const didNotHydrateInstanceWithinContainer = shim;
export const didNotHydrateInstanceWithinSuspenseInstance = shim;
export const didNotHydrateInstance = shim;
export const didNotFindHydratableInstanceWithinContainer = shim;
export const didNotFindHydratableTextInstanceWithinContainer = shim;
export const didNotFindHydratableSuspenseInstanceWithinContainer = shim;
export const didNotFindHydratableInstanceWithinSuspenseInstance = shim;
export const didNotFindHydratableTextInstanceWithinSuspenseInstance = shim;
export const didNotFindHydratableSuspenseInstanceWithinSuspenseInstance = shim;
export const didNotFindHydratableInstance = shim;
export const didNotFindHydratableTextInstance = shim;
export const didNotFindHydratableSuspenseInstance = shim;
export const errorHydratingContainer = shim;
