/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {batchedUpdates} from 'react-reconciler/src/ReactFiberReconciler';
import {
  enqueueStateRestore,
  restoreStateIfNeeded,
} from './events/ReactDOMControlledComponent';
import {
  getInstanceFromNode,
  getNodeFromInstance,
  getFiberCurrentPropsFromNode,
} from './client/ReactDOMComponentTree';

const Internals = {
  usingClientEntryPoint: false,
  // Keep in sync with ReactTestUtils.js.
  // This is an array for better minification.
  Events: [
    getInstanceFromNode,
    getNodeFromInstance,
    getFiberCurrentPropsFromNode,
    enqueueStateRestore,
    restoreStateIfNeeded,
    batchedUpdates,
  ],
};

export default Internals;
