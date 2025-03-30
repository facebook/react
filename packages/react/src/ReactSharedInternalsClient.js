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
import type {Transition} from './ReactStartTransition';
import type {TransitionTypes} from './ReactTransitionType';
import type {GestureProvider, GestureOptions} from 'shared/ReactTypes';

import {
  enableViewTransition,
  enableGestureTransition,
} from 'shared/ReactFeatureFlags';

export type SharedStateClient = {
  H: null | Dispatcher, // ReactCurrentDispatcher for Hooks
  A: null | AsyncDispatcher, // ReactCurrentCache for Cache
  T: null | Transition, // ReactCurrentBatchConfig for Transitions
  S: null | ((Transition, mixed) => void), // onStartTransitionFinish
  G:
    | null
    | ((
        Transition,
        GestureProvider,
        ?GestureOptions,
        transitionTypes: null | TransitionTypes,
      ) => () => void), // onStartGestureTransitionFinish
  V: null | TransitionTypes, // Pending Transition Types for the Next Transition

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
  getCurrentStack: null | (() => string),

  // ReactOwnerStackReset
  recentlyCreatedOwnerStacks: 0,
};

export type RendererTask = boolean => RendererTask | null;

const ReactSharedInternals: SharedStateClient = ({
  H: null,
  A: null,
  T: null,
  S: null,
}: any);
if (enableGestureTransition) {
  ReactSharedInternals.G = null;
}
if (enableViewTransition) {
  ReactSharedInternals.V = null;
}

if (__DEV__) {
  ReactSharedInternals.actQueue = null;
  ReactSharedInternals.isBatchingLegacy = false;
  ReactSharedInternals.didScheduleLegacyUpdate = false;
  ReactSharedInternals.didUsePromise = false;
  ReactSharedInternals.thrownErrors = [];
  // Stack implementation injected by the current renderer.
  ReactSharedInternals.getCurrentStack = (null: null | (() => string));
  ReactSharedInternals.recentlyCreatedOwnerStacks = 0;
}

export default ReactSharedInternals;
