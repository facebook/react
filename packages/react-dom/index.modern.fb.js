/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export {default as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED} from './src/ReactDOMSharedInternals';
export {
  createPortal,
  createRoot,
  hydrateRoot,
  flushSync,
  unstable_batchedUpdates,
  unstable_createEventHandle,
  unstable_flushControlled,
  unstable_isNewReconciler,
  unstable_runWithPriority, // DO NOT USE: Temporarily exposed to migrate off of Scheduler.runWithPriority.
  version,
} from './src/client/ReactDOM';
