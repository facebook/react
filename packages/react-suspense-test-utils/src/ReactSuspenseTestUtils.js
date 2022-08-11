/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Dispatcher} from 'react-reconciler/src/ReactInternalTypes';
import ReactSharedInternals from 'shared/ReactSharedInternals';

const ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;

function unsupported() {
  throw new Error('This feature is not supported by ReactSuspenseTestUtils.');
}

export function waitForSuspense<T>(fn: () => T): Promise<T> {
  const cache: Map<Function, mixed> = new Map();
  const testDispatcher: Dispatcher = {
    getCacheForType<R>(resourceType: () => R): R {
      let entry: R | void = (cache.get(resourceType): any);
      if (entry === undefined) {
        entry = resourceType();
        // TODO: Warn if undefined?
        cache.set(resourceType, entry);
      }
      return entry;
    },
    readContext: unsupported,
    useContext: unsupported,
    useMemo: unsupported,
    useReducer: unsupported,
    useRef: unsupported,
    useState: unsupported,
    useInsertionEffect: unsupported,
    useLayoutEffect: unsupported,
    useCallback: unsupported,
    useImperativeHandle: unsupported,
    useEffect: unsupported,
    useDebugValue: unsupported,
    useDeferredValue: unsupported,
    useTransition: unsupported,
    useId: unsupported,
    useMutableSource: unsupported,
    useSyncExternalStore: unsupported,
    useCacheRefresh: unsupported,
    useMemoCache: unsupported,
  };
  // Not using async/await because we don't compile it.
  return new Promise((resolve, reject) => {
    function retry() {
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = testDispatcher;
      try {
        const result = fn();
        resolve(result);
      } catch (thrownValue) {
        if (typeof thrownValue.then === 'function') {
          thrownValue.then(retry, retry);
        } else {
          reject(thrownValue);
        }
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    }
    retry();
  });
}
