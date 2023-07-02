/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const ReactVersion = require('shared/ReactVersion');
const {
  REACT_FRAGMENT_TYPE,
  REACT_DEBUG_TRACING_MODE_TYPE,
  REACT_PROFILER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
  REACT_LEGACY_HIDDEN_TYPE,
  REACT_OFFSCREEN_TYPE,
  REACT_SCOPE_TYPE,
  REACT_CACHE_TYPE,
  REACT_TRACING_MARKER_TYPE,
} = require('shared/ReactSymbols');

const {Component, PureComponent} = require('./ReactBaseClasses');
const {createRef} = require('./ReactCreateRef');
const {forEach, map, count, toArray, only} = require('./ReactChildren');
const {
  createElement: createElementProd,
  createFactory: createFactoryProd,
  cloneElement: cloneElementProd,
  isValidElement,
} = require('./ReactElement');
const {createContext} = require('./ReactContext');
const {lazy} = require('./ReactLazy');
const {forwardRef} = require('./ReactForwardRef');
const {memo} = require('./ReactMemo');
const {cache} = require('./ReactCache');
const {
  getCacheSignal,
  getCacheForType,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useDebugValue,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useMutableSource,
  useSyncExternalStore,
  useReducer,
  useRef,
  useState,
  useTransition,
  useDeferredValue,
  useId,
  useCacheRefresh,
  use,
  useMemoCache,
  useOptimistic,
} = require('./ReactHooks');
const {
  createElementWithValidation,
  createFactoryWithValidation,
  cloneElementWithValidation,
} = require('./ReactElementValidator');
const {createServerContext} = require('./ReactServerContext');
const {createMutableSource} = require('./ReactMutableSource');
const ReactSharedInternals = require('./ReactSharedInternals');
const {startTransition} = require('./ReactStartTransition');
const {act} = require('./ReactAct');

let createElement;
let cloneElement;
let createFactory;

if (__DEV__) {
  createElement = createElementWithValidation;
  cloneElement = cloneElementWithValidation;
  createFactory = createFactoryWithValidation;
} else {
  createElement = createElementProd;
  cloneElement = cloneElementProd;
  createFactory = createFactoryProd;
}


const Children = {
  map,
  forEach,
  count,
  toArray,
  only,
};

module.exports = {
  Children,
  createMutableSource,
  createRef,
  Component,
  PureComponent,
  createContext,
  createServerContext,
  forwardRef,
  lazy,
  memo,
  cache,
  useCallback,
  useContext,
  useEffect,
  experimental_useEffectEvent: useEffectEvent,
  useImperativeHandle,
  useDebugValue,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useMutableSource,
  experimental_useOptimistic: useOptimistic,
  useSyncExternalStore,
  useReducer,
  useRef,
  useState,
  Fragment: REACT_FRAGMENT_TYPE,
  Profiler: REACT_PROFILER_TYPE,
  StrictMode: REACT_STRICT_MODE_TYPE,
  unstable_DebugTracingMode: REACT_DEBUG_TRACING_MODE_TYPE,
  Suspense: REACT_SUSPENSE_TYPE,
  createElement,
  cloneElement,
  isValidElement,
  version: ReactVersion,
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: ReactSharedInternals,
  createFactory,
  useTransition,
  startTransition,
  useDeferredValue,
  SuspenseList: REACT_SUSPENSE_LIST_TYPE,
  unstable_LegacyHidden: REACT_LEGACY_HIDDEN_TYPE,
  unstable_Offscreen: REACT_OFFSCREEN_TYPE,
  unstable_getCacheSignal: getCacheSignal,
  unstable_getCacheForType: getCacheForType,
  unstable_useCacheRefresh: useCacheRefresh,
  unstable_Cache: REACT_CACHE_TYPE,
  use,
  unstable_useMemoCache: useMemoCache,
  unstable_Scope: REACT_SCOPE_TYPE,
  unstable_TracingMarker: REACT_TRACING_MARKER_TYPE,
  useId,
  act,
};
