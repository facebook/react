/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactVersion from 'shared/ReactVersion';
import {
  REACT_ASYNC_MODE_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_PROFILER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_PLACEHOLDER_TYPE,
} from 'shared/ReactSymbols';
import {enableSuspense} from 'shared/ReactFeatureFlags';

import {Component, PureComponent} from './ReactBaseClasses';
import {createRef} from './ReactCreateRef';
import {forEach, map, count, toArray, only} from './ReactChildren';
import {
  createElement,
  createFactory,
  cloneElement,
  isValidElement,
} from './ReactElement';
import {createContext} from './ReactContext';
import {lazy} from './ReactLazy';
import forwardRef from './forwardRef';
import {
  createElementWithValidation,
  createFactoryWithValidation,
  cloneElementWithValidation,
} from './ReactElementValidator';
import ReactSharedInternals from './ReactSharedInternals';
import {
  __interactionsRef,
  __subscriberRef,
  unstable_clear as clear,
  unstable_getCurrent as getCurrent,
  unstable_getThreadID as getThreadID,
  unstable_track as track,
  unstable_wrap as wrap,
} from 'interaction-tracking';
import {
  unstable_subscribe as subscribe,
  unstable_unsubscribe as unsubscribe,
} from 'interaction-tracking/subscriptions';

const React = {
  Children: {
    map,
    forEach,
    count,
    toArray,
    only,
  },

  createRef,
  Component,
  PureComponent,

  createContext,
  forwardRef,

  Fragment: REACT_FRAGMENT_TYPE,
  StrictMode: REACT_STRICT_MODE_TYPE,
  unstable_AsyncMode: REACT_ASYNC_MODE_TYPE,
  unstable_Profiler: REACT_PROFILER_TYPE,

  createElement: __DEV__ ? createElementWithValidation : createElement,
  cloneElement: __DEV__ ? cloneElementWithValidation : cloneElement,
  createFactory: __DEV__ ? createFactoryWithValidation : createFactory,
  isValidElement: isValidElement,

  version: ReactVersion,

  // Re-export the interaction-tracking API for UMD bundles.
  // This avoids introducing a dependency on a new UMD global in a minor update,
  // Since this would be a breaking change.
  unstable_interactions: {
    __interactionsRef,
    __subscriberRef,
    clear,
    getCurrent,
    getThreadID,
    subscribe,
    track,
    unsubscribe,
    wrap,
  },

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: ReactSharedInternals,
};

if (enableSuspense) {
  React.Placeholder = REACT_PLACEHOLDER_TYPE;
  React.lazy = lazy;
}

export default React;
