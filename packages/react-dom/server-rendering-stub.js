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
  preinit,
} from './src/server/ReactDOMServerRenderingStub';
