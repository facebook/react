/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {addUserTimingListener} from 'shared/ReactFeatureFlags';

import ReactDOM from './ReactDOM';
import {isEnabled} from '../events/ReactBrowserEventEmitter';
import {getClosestInstanceFromNode} from './ReactDOMComponentTree';

if (__EXPERIMENTAL__) {
  // This is a modern WWW build.
  // It should be the same as open source. Don't add new things here.
} else {
  // For classic WWW builds, include a few internals that are already in use.
  Object.assign(
    (ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: any),
    {
      ReactBrowserEventEmitter: {
        isEnabled,
      },
      ReactDOMComponentTree: {
        getClosestInstanceFromNode,
      },
      // Perf experiment
      addUserTimingListener,
    },
  );
}

export default ReactDOM;
