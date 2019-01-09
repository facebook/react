/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {findCurrentFiberUsingSlowPath} from 'react-reconciler/reflection';
import {get as getInstance} from 'shared/ReactInstanceMap';
import {addUserTimingListener} from 'shared/ReactFeatureFlags';

import ReactDOM from './ReactFire';
import {isEventsEnabled} from './events/ReactFireEvents';
import {getClosestFiberFromDOMNode} from './ReactFireMaps';

Object.assign(
  (ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: any),
  {
    // These are real internal dependencies that are trickier to remove:
    ReactBrowserEventEmitter: {
      isEnabled: isEventsEnabled,
    },
    ReactFiberTreeReflection: {
      findCurrentFiberUsingSlowPath,
    },
    ReactDOMComponentTree: {
      getClosestInstanceFromNode: getClosestFiberFromDOMNode,
    },
    ReactInstanceMap: {
      get: getInstance,
    },
    // Perf experiment
    addUserTimingListener,
  },
);

export default ReactDOM;
