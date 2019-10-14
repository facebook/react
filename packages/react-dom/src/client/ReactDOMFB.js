/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {findCurrentFiberUsingSlowPath} from 'react-reconciler/reflection';
import {getIsHydrating} from 'react-reconciler/src/ReactFiberHydrationContext';
import {get as getInstance} from 'shared/ReactInstanceMap';
import {addUserTimingListener} from 'shared/ReactFeatureFlags';

import ReactDOM, {createRoot, createSyncRoot} from './ReactDOM';
import {isEnabled} from '../events/ReactBrowserEventEmitter';
import {getClosestInstanceFromNode} from './ReactDOMComponentTree';
import {queueExplicitHydrationTarget} from '../events/ReactDOMEventReplaying';

import {
  discreteUpdates,
  flushDiscreteUpdates,
  flushControlled,
} from 'react-reconciler/inline.dom';

// TODO remove this legacy method, unstable_discreteUpdates replaces it
ReactDOM.unstable_interactiveUpdates = (fn, a, b, c) => {
  flushDiscreteUpdates();
  return discreteUpdates(fn, a, b, c);
};

ReactDOM.unstable_discreteUpdates = discreteUpdates;
ReactDOM.unstable_flushDiscreteUpdates = flushDiscreteUpdates;
ReactDOM.unstable_flushControlled = flushControlled;

ReactDOM.unstable_createRoot = createRoot;
ReactDOM.unstable_createSyncRoot = createSyncRoot;

ReactDOM.unstable_scheduleHydration = target => {
  if (target) {
    queueExplicitHydrationTarget(target);
  }
};

Object.assign(
  (ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: any),
  {
    // These are real internal dependencies that are trickier to remove:
    ReactBrowserEventEmitter: {
      isEnabled,
    },
    ReactFiberTreeReflection: {
      findCurrentFiberUsingSlowPath,
    },
    ReactDOMComponentTree: {
      getClosestInstanceFromNode,
    },
    ReactInstanceMap: {
      get: getInstance,
    },
    // Perf experiment
    addUserTimingListener,

    getIsHydrating,
  },
);

export default ReactDOM;
