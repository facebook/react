/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This is the subset of APIs that can be accessed from Server Component modules
export {default as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED} from './ReactDOMSharedInternals';
export {
  prefetchDNS,
  preconnect,
  preload,
  preloadModule,
  preinit,
  preinitModule,
} from './shared/ReactDOMFloat';
