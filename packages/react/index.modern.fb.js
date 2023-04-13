/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  act as unstable_act,
  Children,
  Component,
  Fragment,
  Profiler,
  PureComponent,
  StrictMode,
  Suspense,
  SuspenseList,
  SuspenseList as unstable_SuspenseList, // TODO: Remove once call sights updated to SuspenseList
  cloneElement,
  createContext,
  createElement,
  createMutableSource,
  createMutableSource as unstable_createMutableSource,
  createRef,
  createServerContext,
  use,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  cache,
  startTransition,
  startTransition as unstable_startTransition, // TODO: Remove once call sights updated to startTransition
  unstable_Cache,
  unstable_DebugTracingMode,
  unstable_LegacyHidden,
  unstable_Offscreen,
  unstable_Scope,
  unstable_getCacheSignal,
  unstable_getCacheForType,
  unstable_useCacheRefresh,
  unstable_useMemoCache,
  useId,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useDeferredValue as unstable_useDeferredValue, // TODO: Remove once call sights updated to useDeferredValue
  useEffect,
  experimental_useEffectEvent,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useMutableSource,
  useMutableSource as unstable_useMutableSource,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  useTransition as unstable_useTransition, // TODO: Remove once call sights updated to useTransition
  version,
} from './src/React';
export {jsx, jsxs, jsxDEV} from './src/jsx/ReactJSX';
