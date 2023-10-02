/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactCurrentDispatcher from './ReactCurrentDispatcher';
import ReactCurrentCache from './ReactCurrentCache';
import {
  TaintRegistryObjects,
  TaintRegistryValues,
  TaintRegistryByteLengths,
  TaintRegistryPendingRequests,
} from './ReactTaintRegistry';

import {enableTaint} from 'shared/ReactFeatureFlags';

const ReactServerSharedInternals = {
  ReactCurrentDispatcher,
  ReactCurrentCache,
};

if (enableTaint) {
  ReactServerSharedInternals.TaintRegistryObjects = TaintRegistryObjects;
  ReactServerSharedInternals.TaintRegistryValues = TaintRegistryValues;
  ReactServerSharedInternals.TaintRegistryByteLengths =
    TaintRegistryByteLengths;
  ReactServerSharedInternals.TaintRegistryPendingRequests =
    TaintRegistryPendingRequests;
}

export default ReactServerSharedInternals;
