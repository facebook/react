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
import type {BatchConfigTransition} from 'react-reconciler/src/ReactFiberTracingMarkerComponent';

export type SharedStateClient = {
  H: null | Dispatcher, // ReactCurrentDispatcher for Hooks
  A: null | AsyncDispatcher, // ReactCurrentCache for Cache
  T: null | BatchConfigTransition, // ReactCurrentBatchConfig for Transitions

  // DEV-only

  // ReactCurrentActQueue
  actQueue: null | Array<RendererTask>,

  // Used to reproduce behavior of `batchedUpdates` in legacy mode.
  isBatchingLegacy: boolean,
  didScheduleLegacyUpdate: boolean,

  // Tracks whether something called `use` during the current batch of work.
  // Determines whether we should yield to microtasks to unwrap already resolved
  // promises without suspending.
  didUsePromise: boolean,

  // Track first uncaught error within this act
  thrownErrors: Array<mixed>,

  // ReactDebugCurrentFrame
  setExtraStackFrame: (stack: null | string) => void,
  getCurrentStack: null | (() => string),
  getStackAddendum: () => string,
};

export type RendererTask = boolean => RendererTask | null;

const ReactSharedInternals: SharedStateClient = ({
  H: null,
  A: null,
  T: null,
}: any);

if (__DEV__) {
  ReactSharedInternals.actQueue = null;
  ReactSharedInternals.isBatchingLegacy = false;
  ReactSharedInternals.didScheduleLegacyUpdate = false;
  ReactSharedInternals.didUsePromise = false;
  ReactSharedInternals.thrownErrors = [];

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
