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
} from 'react-dom-bindings/src/events/ReactDOMControlledComponent';
import {
  getInstanceFromNode,
  getNodeFromInstance,
  getFiberCurrentPropsFromNode,
} from 'react-dom-bindings/src/client/ReactDOMComponentTree';
import Dispatcher from 'react-dom-bindings/src/shared/ReactDOMDispatcher';
import {ReactDOMClientDispatcher} from 'react-dom-bindings/src/client/ReactDOMFloatClient';

const Internals = {
  usingClientEntryPoint: false,
  Events: [
    getInstanceFromNode,
    getNodeFromInstance,
    getFiberCurrentPropsFromNode,
    enqueueStateRestore,
    restoreStateIfNeeded,
    batchedUpdates,
  ],
  Dispatcher,
};

// Set the default dispatcher to the Client dispatcher
Dispatcher.current = ReactDOMClientDispatcher;

export default Internals;
