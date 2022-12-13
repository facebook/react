/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactVersion from 'shared/ReactVersion';
import {
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
} from 'shared/ReactSymbols';

import {Component, PureComponent} from './ReactBaseClasses';
import {createRef} from './ReactCreateRef';
import {forEach, map, count, toArray, only} from './ReactChildren';
import {
  createElement as createElementProd,
  createFactory as createFactoryProd,
  cloneElement as cloneElementProd,
  isValidElement,
} from './ReactElement';
import {createContext} from './ReactContext';
import {lazy} from './ReactLazy';
import {forwardRef} from './ReactForwardRef';
import {memo} from './ReactMemo';
import {cache} from './ReactCache';
import {
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
} from './ReactHooks';
import {
  createElementWithValidation,
  createFactoryWithValidation,
  cloneElementWithValidation,
} from './ReactElementValidator';
import {createServerContext} from './ReactServerContext';
import {createMutableSource} from './ReactMutableSource';
import ReactSharedInternals from './ReactSharedInternals';
import {startTransition} from './ReactStartTransition';
import {act} from './ReactAct';

// TODO: Move this branching into the other module instead and just re-export.
const createElement: any = __DEV__
  ? createElementWithValidation
  : createElementProd;
const cloneElement: any = __DEV__
  ? cloneElementWithValidation
  : cloneElementProd;
const createFactory: any = __DEV__
  ? createFactoryWithValidation
  : createFactoryProd;

const Children = {
  map,
  forEach,
  count,
  toArray,
  only,
};

export {
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
  useEffectEvent as experimental_useEffectEvent,
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
  REACT_FRAGMENT_TYPE as Fragment,
  REACT_PROFILER_TYPE as Profiler,
  REACT_STRICT_MODE_TYPE as StrictMode,
  REACT_DEBUG_TRACING_MODE_TYPE as unstable_DebugTracingMode,
  REACT_SUSPENSE_TYPE as Suspense,
  createElement,
  cloneElement,
  isValidElement,
  ReactVersion as version,
  ReactSharedInternals as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  // Deprecated behind disableCreateFactory
  createFactory,
  // Concurrent Mode
  useTransition,
  startTransition,
  useDeferredValue,
  REACT_SUSPENSE_LIST_TYPE as SuspenseList,
  REACT_LEGACY_HIDDEN_TYPE as unstable_LegacyHidden,
  REACT_OFFSCREEN_TYPE as unstable_Offscreen,
  getCacheSignal as unstable_getCacheSignal,
  getCacheForType as unstable_getCacheForType,
  useCacheRefresh as unstable_useCacheRefresh,
  REACT_CACHE_TYPE as unstable_Cache,
  use,
  useMemoCache as unstable_useMemoCache,
  // enableScopeAPI
  REACT_SCOPE_TYPE as unstable_Scope,
  // enableTransitionTracing
  REACT_TRACING_MARKER_TYPE as unstable_TracingMarker,
  useId,
  act,
};
