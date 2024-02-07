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
import type {Thenable, Usable} from 'shared/ReactTypes';
import type {ThenableState} from './ReactFlightThenable';
import {
  REACT_MEMO_CACHE_SENTINEL,
  REACT_CONTEXT_TYPE,
} from 'shared/ReactSymbols';
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
  readContext: (unsupportedContext: any),
  useContext: (unsupportedContext: any),
  useReducer: (unsupportedHook: any),
  useRef: (unsupportedHook: any),
  useState: (unsupportedHook: any),
  useInsertionEffect: (unsupportedHook: any),
  useLayoutEffect: (unsupportedHook: any),
  useImperativeHandle: (unsupportedHook: any),
  useEffect: (unsupportedHook: any),
  useId,
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
  use,
};

function unsupportedHook(): void {
  throw new Error('This Hook is not supported in Server Components.');
}

function unsupportedRefresh(): void {
  throw new Error(
    'Refreshing the cache is not supported in Server Components.',
  );
}

function unsupportedContext(): void {
  throw new Error('Cannot read a Client Context from a Server Component.');
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
    } else if (usable.$$typeof === REACT_CONTEXT_TYPE) {
      unsupportedContext();
    }
  }

  if (isClientReference(usable)) {
    if (usable.value != null && usable.value.$$typeof === REACT_CONTEXT_TYPE) {
      // Show a more specific message since it's a common mistake.
      throw new Error('Cannot read a Client Context from a Server Component.');
    } else {
      throw new Error('Cannot use() an already resolved Client Reference.');
    }
  } else {
    throw new Error(
      // eslint-disable-next-line react-internal/safe-string-coercion
      'An unsupported type was passed to use(): ' + String(usable),
    );
  }
}
