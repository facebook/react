/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Reference,
  TaintEntry,
  RequestCleanupQueue,
} from './ReactTaintRegistry';

import {
  TaintRegistryObjects,
  TaintRegistryValues,
  TaintRegistryByteLengths,
  TaintRegistryPendingRequests,
} from './ReactTaintRegistry';

import {enableTaint} from 'shared/ReactFeatureFlags';

export type ServerSharedState = {
  // Taint
  TaintRegistryObjects: WeakMap<Reference, string>,
  TaintRegistryValues: Map<string | bigint, TaintEntry>,
  TaintRegistryByteLengths: Set<number>,
  TaintRegistryPendingRequests: Set<RequestCleanupQueue>,
};

const ReactServerSharedInternals: ServerSharedState = ({}: any);

if (enableTaint) {
  ReactServerSharedInternals.TaintRegistryObjects = TaintRegistryObjects;
  ReactServerSharedInternals.TaintRegistryValues = TaintRegistryValues;
  ReactServerSharedInternals.TaintRegistryByteLengths =
    TaintRegistryByteLengths;
  ReactServerSharedInternals.TaintRegistryPendingRequests =
    TaintRegistryPendingRequests;
}

export default ReactServerSharedInternals;
