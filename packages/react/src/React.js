/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactVersion from 'shared/ReactVersion';
import ReactSharedInternals from './ReactSharedInternals';
import {forEach, map, count, toArray, only} from './ReactChildren';
import {
  createElement as createElementProd,
  createFactory as createFactoryProd,
  cloneElement as cloneElementProd,
} from './ReactElement';
import {
  createElementWithValidation,
  createFactoryWithValidation,
  cloneElementWithValidation,
} from './ReactElementValidator';

export {
  REACT_FRAGMENT_TYPE as Fragment,
  REACT_DEBUG_TRACING_MODE_TYPE as unstable_DebugTracingMode,
  REACT_PROFILER_TYPE as Profiler,
  REACT_STRICT_MODE_TYPE as StrictMode,
  REACT_SUSPENSE_TYPE as Suspense,
  REACT_SUSPENSE_LIST_TYPE as SuspenseList,
  REACT_LEGACY_HIDDEN_TYPE as unstable_LegacyHidden,
  REACT_OFFSCREEN_TYPE as unstable_Offscreen,
  // enableScopeAPI
  REACT_SCOPE_TYPE as unstable_Scope,
  REACT_CACHE_TYPE as unstable_Cache,
  // enableTransitionTracing
  REACT_TRACING_MARKER_TYPE as unstable_TracingMarker,
} from 'shared/ReactSymbols';

export {Component, PureComponent} from './ReactBaseClasses';
export {createRef} from './ReactCreateRef';
export {isValidElement} from './ReactElement';
export {createContext} from './ReactContext';
export {lazy} from './ReactLazy';
export {forwardRef} from './ReactForwardRef';
export {memo} from './ReactMemo';
export {cache} from './ReactCache';
export {
  getCacheSignal as unstable_getCacheSignal,
  getCacheForType as unstable_getCacheForType,
  useCacheRefresh as unstable_useCacheRefresh,
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
  // Concurrent Mode
  useTransition,
  useDeferredValue,
  useId,
  use,
  useMemoCache as unstable_useMemoCache,
} from './ReactHooks';

export {createServerContext} from './ReactServerContext';
export {createMutableSource} from './ReactMutableSource';
export {startTransition} from './ReactStartTransition';
export {act} from './ReactAct';

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
  ReactVersion as version,
  ReactSharedInternals as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  createElement,
  cloneElement,
  // Deprecated behind disableCreateFactory
  createFactory,
};
