/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import assign from 'object-assign';
import ReactVersion from 'shared/ReactVersion';
import {
  REACT_ASYNC_MODE_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_PROFILER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_TIMEOUT_TYPE,
} from 'shared/ReactSymbols';
import {enableSuspense} from 'shared/ReactFeatureFlags';

import {Component, PureComponent} from './ReactBaseClasses';
import {createRef} from './ReactCreateRef';
import {forEach, map, count, toArray, only} from './ReactChildren';
import ReactCurrentOwner from './ReactCurrentOwner';
import {
  createElement as createElementNormal,
  createFactory as createFactoryNormal,
  cloneElement as cloneElementNormal,
  isValidElement,
} from './ReactElement';
import {createContext} from './ReactContext';
import forwardRef from './forwardRef';
import {
  createElementWithValidation,
  createFactoryWithValidation,
  cloneElementWithValidation,
} from './ReactElementValidator';
import ReactDebugCurrentFrame from './ReactDebugCurrentFrame';

export const Children = {
  map,
  forEach,
  count,
  toArray,
  only,
};

export {
  createRef,
  Component,
  PureComponent,
  createContext,
  forwardRef,
  isValidElement,
};

export const Fragment = REACT_FRAGMENT_TYPE;
export const StrictMode = REACT_STRICT_MODE_TYPE;
export const unstable_AsyncMode = REACT_ASYNC_MODE_TYPE;
export const unstable_Profiler = REACT_PROFILER_TYPE;

export const createElement = __DEV__
  ? createElementWithValidation
  : createElementNormal;
export const cloneElement = __DEV__
  ? cloneElementWithValidation
  : cloneElementNormal;
export const createFactory = __DEV__
  ? createFactoryWithValidation
  : createFactoryNormal;

export const version = ReactVersion;

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  ReactCurrentOwner,
  // Used by renderers to avoid bundling object-assign twice in UMD bundles:
  assign,
  // These should not be included in production.
  ReactDebugCurrentFrame: __DEV__ ? ReactDebugCurrentFrame : null,
  // Shim for React DOM 16.0.0 which still destructured (but not used) this.
  // TODO: remove in React 17.0.
  ReactComponentTreeHook: __DEV__ ? {} : null,
};

export const Timeout = enableSuspense ? REACT_TIMEOUT_TYPE : null;
