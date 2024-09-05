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
  cache,
  Children,
  cloneElement,
  Component,
  createContext,
  createElement,
  createRef,
  experimental_useEffectEvent,
  forwardRef,
  Fragment,
  isValidElement,
  lazy,
  memo,
  Profiler,
  PureComponent,
  startTransition,
  StrictMode,
  Suspense,
  unstable_Activity,
  unstable_DebugTracingMode,
  unstable_getCacheForType,
  unstable_LegacyHidden,
  unstable_Scope,
  unstable_SuspenseList,
  unstable_TracingMarker,
  unstable_useCacheRefresh,
  use,
  useActionState,
  useCallback,
  unstable_useContextWithBailout,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useId,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useOptimistic,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  version,
} from './src/ReactClient';

export {jsx, jsxs, jsxDEV} from './src/jsx/ReactJSX';

// export for backwards compatibility during upgrade
export {useMemoCache as unstable_useMemoCache} from './src/ReactHooks';

// export to match the name of the OSS function typically exported from
// react/compiler-runtime
export {useMemoCache as c} from './src/ReactHooks';
