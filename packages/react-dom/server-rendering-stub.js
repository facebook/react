/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Export all exports so that they're available in tests.
// We can't use export * from in Flow for some reason.

import ReactVersion from 'shared/ReactVersion';
export {ReactVersion as version};

export {default as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED} from './src/ReactDOMSharedInternals';

export {
  createPortal,
  flushSync,
  prefetchDNS,
  preconnect,
  preload,
  preloadModule,
  preinit,
  preinitModule,
  useFormStatus,
  useFormState,
  unstable_batchedUpdates,
} from './src/server/ReactDOMServerRenderingStub';

import type {FormStatus} from 'react-dom-bindings/src/shared/ReactDOMFormActions';
import {
  useFormStatus,
  useFormState,
} from './src/server/ReactDOMServerRenderingStub';
import type {Awaited} from 'shared/ReactTypes';

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
  action: (Awaited<S>, P) => S,
  initialState: Awaited<S>,
  permalink?: string,
): [Awaited<S>, (P) => void, boolean] {
  if (__DEV__) {
    console.error(
      'useFormState is now in canary. Remove the experimental_ prefix. ' +
        'The prefixed alias will be removed in an upcoming release.',
    );
  }
  return useFormState(action, initialState, permalink);
}
