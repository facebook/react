/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {addUserTimingListener} from 'shared/ReactFeatureFlags';
import {isEnabled} from './src/events/ReactDOMEventListener';
import {getClosestInstanceFromNode} from './src/client/ReactDOMComponentTree';

import {__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED} from './src/client/ReactDOM';

// For classic WWW builds, include a few internals that are already in use.
Object.assign((__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: any), {
  ReactBrowserEventEmitter: {
    isEnabled,
  },
  ReactDOMComponentTree: {
    getClosestInstanceFromNode,
  },
  // Perf experiment
  addUserTimingListener,
});

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
  createBlockingRoot,
  unstable_discreteUpdates,
  unstable_flushDiscreteUpdates,
  unstable_flushControlled,
  unstable_scheduleHydration,
  unstable_renderSubtreeIntoContainer,
  unstable_createPortal,
} from './src/client/ReactDOM';
