/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Dispatcher} from 'react-reconciler/src/ReactInternalTypes';
import type {AsyncDispatcher} from 'react-reconciler/src/ReactInternalTypes';

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

import {
  SERVER_CONTEXT_STORAGE,
  getServerContextValue,
  setServerContextValue,
} from './ReactContextRegistryServer';

import {enableTaint} from 'shared/ReactFeatureFlags';

export type SharedStateServer = {
  H: null | Dispatcher, // ReactCurrentDispatcher for Hooks
  A: null | AsyncDispatcher, // ReactCurrentCache for Cache

  // enableTaint
  TaintRegistryObjects: WeakMap<Reference, string>,
  TaintRegistryValues: Map<string | bigint, TaintEntry>,
  TaintRegistryByteLengths: Set<number>,
  TaintRegistryPendingRequests: Set<RequestCleanupQueue>,

  // Server Context
  SERVER_CONTEXT_STORAGE: AsyncLocalStorage<any>,
  getServerContextValue: typeof getServerContextValue,
  setServerContextValue: typeof setServerContextValue,

  // DEV-only

  // ReactDebugCurrentFrame
  getCurrentStack: null | (() => string),

  // ReactOwnerStackReset
  recentlyCreatedOwnerStacks: 0,
};

export type RendererTask = boolean => RendererTask | null;

const ReactSharedInternals: SharedStateServer = ({
  H: null,
  A: null,
}: any);

if (enableTaint) {
  ReactSharedInternals.TaintRegistryObjects = TaintRegistryObjects;
  ReactSharedInternals.TaintRegistryValues = TaintRegistryValues;
  ReactSharedInternals.TaintRegistryByteLengths = TaintRegistryByteLengths;
  ReactSharedInternals.TaintRegistryPendingRequests =
    TaintRegistryPendingRequests;
}

// Server Context Registry
ReactSharedInternals.SERVER_CONTEXT_STORAGE = SERVER_CONTEXT_STORAGE;
ReactSharedInternals.getServerContextValue = getServerContextValue;
ReactSharedInternals.setServerContextValue = setServerContextValue;

if (__DEV__) {
  // Stack implementation injected by the current renderer.
  ReactSharedInternals.getCurrentStack = (null: null | (() => string));
  ReactSharedInternals.recentlyCreatedOwnerStacks = 0;
}

export default ReactSharedInternals;
