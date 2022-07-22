/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Renderers that don't support resources
// can re-export everything from this module.

function shim(...args: any) {
  throw new Error(
    'The current renderer does not support Resources. ' +
      'This error is likely caused by a bug in React. ' +
      'Please file an issue.',
  );
}

// Resources (when unsupported)
export const supportsResources = false;
export const prepareToRender = shim;
export const cleanupAfterRender = shim;
export const isResource = shim;
export const reconcileHydratedResources = shim;
export const acquireResource = shim;
export const releaseResource = shim;
export const getRootResourceHost = shim;
export const insertPendingResources = shim;
export const getResourceKeyFromTypeAndProps = shim;
export const validateResourceAndProps = shim;
