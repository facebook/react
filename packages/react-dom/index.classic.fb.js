/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {isEnabled} from 'react-dom-bindings/src/events/ReactDOMEventListener';

import Internals from './src/ReactDOMSharedInternals';

// For classic WWW builds, include a few internals that are already in use.
Object.assign((Internals: any), {
  ReactBrowserEventEmitter: {
    isEnabled,
  },
});

export {
  createPortal,
  findDOMNode,
  flushSync,
  unmountComponentAtNode,
  unstable_createEventHandle,
  unstable_renderSubtreeIntoContainer,
  unstable_runWithPriority, // DO NOT USE: Temporarily exposed to migrate off of Scheduler.runWithPriority.
  useFormStatus,
  useFormState,
  prefetchDNS,
  preconnect,
  preload,
  preloadModule,
  preinit,
  preinitModule,
  version,
} from './src/client/ReactDOM';

export {
  createRoot,
  hydrateRoot,
  render,
  unstable_batchedUpdates,
} from './src/client/ReactDOMRootFB';

export {Internals as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED};
