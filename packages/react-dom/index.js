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
  createPortal,
  unstable_batchedUpdates,
  flushSync,
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  version,
  findDOMNode,
  hydrate,
  render,
  unmountComponentAtNode,
  createRoot,
  createRoot as unstable_createRoot,
  createBlockingRoot,
  createBlockingRoot as unstable_createBlockingRoot,
  unstable_flushControlled,
  unstable_scheduleHydration,
  unstable_renderSubtreeIntoContainer,
  unstable_createPortal,
  unstable_createEventHandle,
} from './src/client/ReactDOM';
