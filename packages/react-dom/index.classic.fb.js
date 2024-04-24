/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {isEnabled} from 'react-dom-bindings/src/events/ReactDOMEventListener';

import Internals from './src/ReactDOMSharedInternalsFB';

// For classic WWW builds, include a few internals that are already in use.
Object.assign((Internals: any), {
  ReactBrowserEventEmitter: {
    isEnabled,
  },
});

export {
  createPortal,
  flushSync,
  unstable_createEventHandle,
  unstable_runWithPriority, // DO NOT USE: Temporarily exposed to migrate off of Scheduler.runWithPriority.
  useFormStatus,
  useFormState,
  requestFormReset,
  prefetchDNS,
  preconnect,
  preload,
  preloadModule,
  preinit,
  preinitModule,
  version,
} from './src/client/ReactDOMFB';

export {
  createRoot,
  hydrateRoot,
  render,
  unstable_batchedUpdates,
  findDOMNode,
  unstable_renderSubtreeIntoContainer,
  unmountComponentAtNode,
} from './src/client/ReactDOMRootFB';

export {Internals as __DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE};
