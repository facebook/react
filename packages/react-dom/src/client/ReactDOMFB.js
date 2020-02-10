/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {getIsHydrating} from 'react-reconciler/src/ReactFiberHydrationContext';
import {addUserTimingListener} from 'shared/ReactFeatureFlags';

import ReactDOM from './ReactDOM';
import {isEnabled} from '../events/ReactBrowserEventEmitter';
import {getClosestInstanceFromNode} from './ReactDOMComponentTree';

Object.assign(
  (ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: any),
  {
    // These are real internal dependencies that are trickier to remove:
    ReactBrowserEventEmitter: {
      isEnabled,
    },
    ReactDOMComponentTree: {
      getClosestInstanceFromNode,
    },
    // Perf experiment
    addUserTimingListener,

    getIsHydrating,
  },
);

export default ReactDOM;
