/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const ReactDOMSharedInternals = require('./src/ReactDOMSharedInternals');
const ReactDOM = require('./src/client/ReactDOM');

module.exports = {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: ReactDOMSharedInternals.default,
  createPortal: ReactDOM.createPortal,
  createRoot: ReactDOM.createRoot,
  hydrateRoot: ReactDOM.hydrateRoot,
  findDOMNode: ReactDOM.findDOMNode,
  flushSync: ReactDOM.flushSync,
  hydrate: ReactDOM.hydrate,
  render: ReactDOM.render,
  unmountComponentAtNode: ReactDOM.unmountComponentAtNode,
  unstable_batchedUpdates: ReactDOM.unstable_batchedUpdates,
  unstable_createEventHandle: ReactDOM.unstable_createEventHandle,
  unstable_renderSubtreeIntoContainer: ReactDOM.unstable_renderSubtreeIntoContainer,
  unstable_runWithPriority: ReactDOM.unstable_runWithPriority,
  experimental_useFormStatus: ReactDOM.useFormStatus,
  prefetchDNS: ReactDOM.prefetchDNS,
  preconnect: ReactDOM.preconnect,
  preload: ReactDOM.preload,
  preinit: ReactDOM.preinit,
  version: ReactDOM.version,
};
