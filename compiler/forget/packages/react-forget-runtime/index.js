/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

const {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    ReactCurrentDispatcher,
  },
  useRef,
} = React;

export const $empty = Symbol.for("react.usememocache_sentinel");

export function unstable_useMemoCache(size) {
  "use no forget";
  const $ = new Array(size);
  for (let ii = 0; ii < size; ii++) {
    $[ii] = $empty;
  }
  return useRef($).current;
}

export function $read(memoCache, index) {
  const value = memoCache[index];
  if (value === $empty) {
    throw new Error("useMemoCache: read before write");
  }
  return value;
}

const LazyGuardDispatcher = {};
[
  "readContext",
  "useCallback",
  "useContext",
  "useEffect",
  "useImperativeHandle",
  "useInsertionEffect",
  "useLayoutEffect",
  "useMemo",
  "useReducer",
  "useRef",
  "useState",
  "useDebugValue",
  "useDeferredValue",
  "useTransition",
  "useMutableSource",
  "useSyncExternalStore",
  "useId",
  "unstable_isNewReconciler",
  "getCacheSignal",
  "getCacheForType",
  "useCacheRefresh",
].forEach((name) => {
  LazyGuardDispatcher[name] = () => {
    throw new Error(`Cannot call ${name} within ReactForget lazy block.`);
  };
});

let originalDispatcher = null;

export function $startLazy() {
  if (originalDispatcher !== null) {
    throw new Error("unexpected startLazy with dispatcher set");
  }
  originalDispatcher = ReactCurrentDispatcher.current;
  ReactCurrentDispatcher.current = LazyGuardDispatcher;
}

export function $endLazy() {
  if (originalDispatcher === null) {
    throw new Error("unexpected endLazy with dispatcher not set");
  }
  ReactCurrentDispatcher.current = originalDispatcher;
  originalDispatcher = null;
}

export function $reset($) {
  for (let ii = 0; ii < $.length; ii++) {
    $[ii] = $empty;
  }
}

export function $makeReadOnly() {
  throw new Error("TODO: implement $makeReadOnly in react-forget-runtime");
}
