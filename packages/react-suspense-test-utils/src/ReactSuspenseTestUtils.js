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
import invariant from 'shared/invariant';

const ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;

function unsupported() {
  invariant(false, 'This feature is not supported by ReactSuspenseTestUtils.');
}

export async function waitForSuspense<T>(fn: () => T): Promise<T> {
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
    useLayoutEffect: unsupported,
    useCallback: unsupported,
    useImperativeHandle: unsupported,
    useEffect: unsupported,
    useDebugValue: unsupported,
    useDeferredValue: unsupported,
    useTransition: unsupported,
    useOpaqueIdentifier: unsupported,
    useMutableSource: unsupported,
  };
  while (true) {
    const prevDispatcher = ReactCurrentDispatcher.current;
    ReactCurrentDispatcher.current = testDispatcher;
    try {
      return fn();
    } catch (promise) {
      if (typeof promise.then === 'function') {
        await promise;
      } else {
        throw promise;
      }
    } finally {
      ReactCurrentDispatcher.current = prevDispatcher;
    }
  }
  // eslint-disable-next-line no-unreachable
  return (undefined: any);
}
