/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import invariant from 'shared/invariant';

// Renderers that don't support hydration
// can re-export everything from this module.

function shim(...args: any) {
  invariant(
    false,
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
export const hydrateInstance = shim;
export const hydrateTextInstance = shim;
export const getNextHydratableInstanceAfterSuspenseInstance = shim;
export const clearSuspenseBoundary = shim;
export const clearSuspenseBoundaryFromContainer = shim;
export const didNotMatchHydratedContainerTextInstance = shim;
export const didNotMatchHydratedTextInstance = shim;
export const didNotHydrateContainerInstance = shim;
export const didNotHydrateInstance = shim;
export const didNotFindHydratableContainerInstance = shim;
export const didNotFindHydratableContainerTextInstance = shim;
export const didNotFindHydratableContainerSuspenseInstance = shim;
export const didNotFindHydratableInstance = shim;
export const didNotFindHydratableTextInstance = shim;
export const didNotFindHydratableSuspenseInstance = shim;
export const canHydrateTouchHitTargetInstance = shim;
export const hydrateTouchHitTargetInstance = shim;
