/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Dispatcher} from 'react-reconciler/src/ReactInternalTypes';
import type {Request} from './ReactFlightServer';
import type {ReactServerContext, Thenable, Usable} from 'shared/ReactTypes';
import type {ThenableState} from './ReactFlightThenable';
import {
  REACT_SERVER_CONTEXT_TYPE,
  REACT_MEMO_CACHE_SENTINEL,
} from 'shared/ReactSymbols';
import {readContext as readContextImpl} from './ReactFlightNewContext';
import {enableUseHook} from 'shared/ReactFeatureFlags';
import {createThenableState, trackUsedThenable} from './ReactFlightThenable';
import {isClientReference} from './ReactFlightServerConfig';

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
      if (isClientReference(context)) {
        console.error('Cannot read a Client Context from a Server Component.');
      } else {
        console.error(
          'Only createServerContext is supported in Server Components.',
        );
      }
    }
    if (currentRequest === null) {
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

export const HooksDispatcher: Dispatcher = {
  useMemo<T>(nextCreate: () => T): T {
    return nextCreate();
  },
  useCallback<T>(callback: T): T {
    return callback;
  },
  useDebugValue(): void {},
  useDeferredValue: (unsupportedHook: any),
  useTransition: (unsupportedHook: any),
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
    const data = new Array<any>(size);
    for (let i = 0; i < size; i++) {
      data[i] = REACT_MEMO_CACHE_SENTINEL;
    }
    return data;
  },
  use: enableUseHook ? use : (unsupportedHook: any),
};

function unsupportedHook(): void {
  throw new Error('This Hook is not supported in Server Components.');
}

function unsupportedRefresh(): void {
  throw new Error(
    'Refreshing the cache is not supported in Server Components.',
  );
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
  if (
    (usable !== null && typeof usable === 'object') ||
    typeof usable === 'function'
  ) {
    // $FlowFixMe[method-unbinding]
    if (typeof usable.then === 'function') {
      // This is a thenable.
      const thenable: Thenable<T> = (usable: any);

      // Track the position of the thenable within this fiber.
      const index = thenableIndexCounter;
      thenableIndexCounter += 1;

      if (thenableState === null) {
        thenableState = createThenableState();
      }
      return trackUsedThenable(thenableState, thenable, index);
    } else if (usable.$$typeof === REACT_SERVER_CONTEXT_TYPE) {
      const context: ReactServerContext<T> = (usable: any);
      return readContext(context);
    }
  }

  if (__DEV__) {
    if (isClientReference(usable)) {
      console.error('Cannot use() an already resolved Client Reference.');
    }
  }

  // eslint-disable-next-line react-internal/safe-string-coercion
  throw new Error('An unsupported type was passed to use(): ' + String(usable));
}
