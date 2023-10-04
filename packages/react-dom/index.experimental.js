/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
  findDOMNode,
  flushSync,
  hydrate,
  render,
  unmountComponentAtNode,
  unstable_batchedUpdates,
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

import type {FormStatus} from 'react-dom-bindings/src/shared/ReactDOMFormActions';
import {useFormStatus, useFormState} from './src/client/ReactDOM';

export function experimental_useFormStatus(): FormStatus {
  if (__DEV__) {
    console.error(
      'useFormStatus is now in canary. Remove the experimental_ prefix. ' +
        'The prefixed alias will be removed in an upcoming release.',
    );
  }
  return useFormStatus();
}

export function experimental_useFormState<S, P>(
  action: (S, P) => Promise<S>,
  initialState: S,
  permalink?: string,
): [S, (P) => void] {
  if (__DEV__) {
    console.error(
      'useFormState is now in canary. Remove the experimental_ prefix. ' +
        'The prefixed alias will be removed in an upcoming release.',
    );
  }
  return useFormState(action, initialState, permalink);
}
