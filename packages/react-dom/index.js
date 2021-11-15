/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Export all exports so that they're available in tests.
// We can't use export * from in Flow for some reason.
export {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  createPortal,
  createRoot,
  hydrateRoot,
  findDOMNode,
  flushSync,
  hydrate,
  render,
  unmountComponentAtNode,
  unstable_batchedUpdates,
  unstable_createEventHandle,
  unstable_flushControlled,
  unstable_isNewReconciler,
  unstable_renderSubtreeIntoContainer,
  unstable_runWithPriority, // DO NOT USE: Temporarily exposed to migrate off of Scheduler.runWithPriority.
  version,
} from './src/client/ReactDOM';
