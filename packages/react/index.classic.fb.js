/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export {
  __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
  act,
  Children,
  Component,
  Fragment,
  Profiler,
  PureComponent,
  StrictMode,
  Suspense,
  cloneElement,
  createContext,
  createElement,
  createRef,
  use,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  cache,
  startTransition,
  unstable_Activity,
  unstable_TracingMarker,
  unstable_DebugTracingMode,
  unstable_LegacyHidden,
  unstable_Scope,
  unstable_SuspenseList,
  unstable_getCacheForType,
  unstable_useCacheRefresh,
  useId,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  experimental_useEffectEvent,
  useImperativeHandle,
  useLayoutEffect,
  useInsertionEffect,
  useMemo,
  useOptimistic,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  useActionState,
  version,
} from './src/ReactClient';

export {jsx, jsxs, jsxDEV} from './src/jsx/ReactJSX';

// export for backwards compatibility during upgrade
export {useMemoCache as unstable_useMemoCache} from './src/ReactHooks';

// export to match the name of the OSS function typically exported from
// react/compiler-runtime
export {useMemoCache as c} from './src/ReactHooks';
