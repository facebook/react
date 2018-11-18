/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactVersion from 'shared/ReactVersion';
import {
  REACT_CONCURRENT_MODE_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_PROFILER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_TYPE,
} from 'shared/ReactSymbols';
import {enableHooks} from 'shared/ReactFeatureFlags';

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
import memo from './memo';
import {
  useCallback,
  useContext,
  useEffect,
  useImperativeMethods,
  useLayoutEffect,
  useMemo,
  useMutationEffect,
  useReducer,
  useRef,
  useState,
} from './ReactHooks';
import {
  createElementWithValidation,
  createFactoryWithValidation,
  cloneElementWithValidation,
} from './ReactElementValidator';
import ReactSharedInternals from './ReactSharedInternals';
import {enableStableConcurrentModeAPIs} from 'shared/ReactFeatureFlags';

// Please make sure that no properties are added to this object after its
// creation. This ensures the object keeps the same shape for performance reasons.
export default {
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
  lazy,
  memo,

  Fragment: REACT_FRAGMENT_TYPE,
  StrictMode: REACT_STRICT_MODE_TYPE,
  Suspense: REACT_SUSPENSE_TYPE,

  createElement: __DEV__ ? createElementWithValidation : createElement,
  cloneElement: __DEV__ ? cloneElementWithValidation : cloneElement,
  createFactory: __DEV__ ? createFactoryWithValidation : createFactory,
  isValidElement: isValidElement,

  version: ReactVersion,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: ReactSharedInternals,

  ConcurrentMode: enableStableConcurrentModeAPIs
    ? REACT_CONCURRENT_MODE_TYPE
    : null,
  Profiler: enableStableConcurrentModeAPIs ? REACT_PROFILER_TYPE : null,

  unstable_ConcurrentMode: !enableStableConcurrentModeAPIs
    ? REACT_CONCURRENT_MODE_TYPE
    : null,
  unstable_Profiler: !enableStableConcurrentModeAPIs
    ? REACT_PROFILER_TYPE
    : null,

  useCallback: enableHooks ? useCallback : null,
  useContext: enableHooks ? useContext : null,
  useEffect: enableHooks ? useEffect : null,
  useImperativeMethods: enableHooks ? useImperativeMethods : null,
  useLayoutEffect: enableHooks ? useLayoutEffect : null,
  useMemo: enableHooks ? useMemo : null,
  useMutationEffect: enableHooks ? useMutationEffect : null,
  useReducer: enableHooks ? useReducer : null,
  useRef: enableHooks ? useRef : null,
  useState: enableHooks ? useState : null,
};
