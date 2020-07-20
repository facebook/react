/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

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
  unstable_renderSubtreeIntoContainer,
  // Temporary alias since we already shipped React 16 RC with it.
  // TODO: remove in React 18.
  unstable_createPortal,
} from './src/client/ReactDOM';
