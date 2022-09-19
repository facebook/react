/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Dispatcher as DispatcherType} from 'react-reconciler/src/ReactInternalTypes';
import type {Request} from './ReactFlightServer';
import type {ReactServerContext, Thenable, Usable} from 'shared/ReactTypes';
import type {ThenableState} from './ReactFlightWakeable';
import {REACT_SERVER_CONTEXT_TYPE} from 'shared/ReactSymbols';
import {readContext as readContextImpl} from './ReactFlightNewContext';
import {enableUseHook} from 'shared/ReactFeatureFlags';
import {
  getPreviouslyUsedThenableAtIndex,
  createThenableState,
  trackUsedThenable,
} from './ReactFlightWakeable';

let currentRequest = null;
let thenableIndexCounter = 0;
let thenableState = null;

export function prepareToUseHooksForRequest(request: Request) {
  currentRequest = request;
}

export function resetHooksForRequest() {
  currentRequest = null;
}

export function prepareToUseHooksForComponent(
  prevThenableState: ThenableState | null,
) {
  thenableIndexCounter = 0;
  thenableState = prevThenableState;
}

export function getThenableStateAfterSuspending(): null | ThenableState {
  const state = thenableState;
  thenableState = null;
  return state;
}

function readContext<T>(context: ReactServerContext<T>): T {
  if (__DEV__) {
    if (context.$$typeof !== REACT_SERVER_CONTEXT_TYPE) {
      console.error(
        'Only createServerContext is supported in Server Components.',
      );
    }
    if (currentCache === null) {
      console.error(
        'Context can only be read while React is rendering. ' +
          'In classes, you can read it in the render method or getDerivedStateFromProps. ' +
          'In function components, you can read it directly in the function body, but not ' +
          'inside Hooks like useReducer() or useMemo().',
      );
    }
  }
  return readContextImpl(context);
}

export const Dispatcher: DispatcherType = {
  useMemo<T>(nextCreate: () => T): T {
    return nextCreate();
  },
  useCallback<T>(callback: T): T {
    return callback;
  },
  useDebugValue(): void {},
  useDeferredValue: (unsupportedHook: any),
  useTransition: (unsupportedHook: any),
  getCacheForType<T>(resourceType: () => T): T {
    if (!currentCache) {
      throw new Error('Reading the cache is only supported while rendering.');
    }

    let entry: T | void = (currentCache.get(resourceType): any);
    if (entry === undefined) {
      entry = resourceType();
      // TODO: Warn if undefined?
      currentCache.set(resourceType, entry);
    }
    return entry;
  },
  readContext,
  useContext: readContext,
  useReducer: (unsupportedHook: any),
  useRef: (unsupportedHook: any),
  useState: (unsupportedHook: any),
  useInsertionEffect: (unsupportedHook: any),
  useLayoutEffect: (unsupportedHook: any),
  useImperativeHandle: (unsupportedHook: any),
  useEffect: (unsupportedHook: any),
  useId,
  useMutableSource: (unsupportedHook: any),
  useSyncExternalStore: (unsupportedHook: any),
  useCacheRefresh(): <T>(?() => T, ?T) => void {
    return unsupportedRefresh;
  },
  useMemoCache(size: number): Array<any> {
    return new Array(size);
  },
  use: enableUseHook ? use : (unsupportedHook: any),
};

function unsupportedHook(): void {
  throw new Error('This Hook is not supported in Server Components.');
}

function unsupportedRefresh(): void {
  if (!currentCache) {
    throw new Error(
      'Refreshing the cache is not supported in Server Components.',
    );
  }
}

let currentCache: Map<Function, mixed> | null = null;

export function setCurrentCache(cache: Map<Function, mixed> | null) {
  currentCache = cache;
  return currentCache;
}

export function getCurrentCache() {
  return currentCache;
}

function useId(): string {
  if (currentRequest === null) {
    throw new Error('useId can only be used while React is rendering');
  }
  const id = currentRequest.identifierCount++;
  // use 'S' for Flight components to distinguish from 'R' and 'r' in Fizz/Client
  return ':' + currentRequest.identifierPrefix + 'S' + id.toString(32) + ':';
}

function use<T>(usable: Usable<T>): T {
  if (usable !== null && typeof usable === 'object') {
    if (typeof usable.then === 'function') {
      // This is a thenable.
      const thenable: Thenable<T> = (usable: any);

      // Track the position of the thenable within this fiber.
      const index = thenableIndexCounter;
      thenableIndexCounter += 1;

      switch (thenable.status) {
        case 'fulfilled': {
          const fulfilledValue: T = thenable.value;
          return fulfilledValue;
        }
        case 'rejected': {
          const rejectedError = thenable.reason;
          throw rejectedError;
        }
        default: {
          const prevThenableAtIndex: Thenable<T> | null = getPreviouslyUsedThenableAtIndex(
            thenableState,
            index,
          );
          if (prevThenableAtIndex !== null) {
            switch (prevThenableAtIndex.status) {
              case 'fulfilled': {
                const fulfilledValue: T = prevThenableAtIndex.value;
                return fulfilledValue;
              }
              case 'rejected': {
                const rejectedError: mixed = prevThenableAtIndex.reason;
                throw rejectedError;
              }
              default: {
                // The thenable still hasn't resolved. Suspend with the same
                // thenable as last time to avoid redundant listeners.
                throw prevThenableAtIndex;
              }
            }
          } else {
            // This is the first time something has been used at this index.
            // Stash the thenable at the current index so we can reuse it during
            // the next attempt.
            if (thenableState === null) {
              thenableState = createThenableState();
            }
            trackUsedThenable(thenableState, thenable, index);

            // Suspend.
            // TODO: Throwing here is an implementation detail that allows us to
            // unwind the call stack. But we shouldn't allow it to leak into
            // userspace. Throw an opaque placeholder value instead of the
            // actual thenable. If it doesn't get captured by the work loop, log
            // a warning, because that means something in userspace must have
            // caught it.
            throw thenable;
          }
        }
      }
    } else if (usable.$$typeof === REACT_SERVER_CONTEXT_TYPE) {
      const context: ReactServerContext<T> = (usable: any);
      return readContext(context);
    }
  }

  // eslint-disable-next-line react-internal/safe-string-coercion
  throw new Error('An unsupported type was passed to use(): ' + String(usable));
}
