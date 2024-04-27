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

import {enableTaint} from 'shared/ReactFeatureFlags';

export type SharedStateServer = {
  H: null | Dispatcher, // ReactCurrentDispatcher for Hooks
  A: null | AsyncDispatcher, // ReactCurrentCache for Cache

  // enableTaint
  TaintRegistryObjects: WeakMap<Reference, string>,
  TaintRegistryValues: Map<string | bigint, TaintEntry>,
  TaintRegistryByteLengths: Set<number>,
  TaintRegistryPendingRequests: Set<RequestCleanupQueue>,

  // DEV-only

  // ReactDebugCurrentFrame
  setExtraStackFrame: (stack: null | string) => void,
  getCurrentStack: null | (() => string),
  getStackAddendum: () => string,
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

if (__DEV__) {
  let currentExtraStackFrame = (null: null | string);
  ReactSharedInternals.setExtraStackFrame = function (stack: null | string) {
    currentExtraStackFrame = stack;
  };
  // Stack implementation injected by the current renderer.
  ReactSharedInternals.getCurrentStack = (null: null | (() => string));

  ReactSharedInternals.getStackAddendum = function (): string {
    let stack = '';

    // Add an extra top frame while an element is being validated
    if (currentExtraStackFrame) {
      stack += currentExtraStackFrame;
    }

    // Delegate to the injected renderer-specific implementation
    const impl = ReactSharedInternals.getCurrentStack;
    if (impl) {
      stack += impl() || '';
    }

    return stack;
  };
}

export default ReactSharedInternals;
