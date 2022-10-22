/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Thenable,
  PendingThenable,
  FulfilledThenable,
  RejectedThenable,
} from 'shared/ReactTypes';

import ReactSharedInternals from 'shared/ReactSharedInternals';
const {ReactCurrentActQueue} = ReactSharedInternals;

// TODO: Sparse arrays are bad for performance.
export opaque type ThenableState = Array<Thenable<any> | void>;

let thenableState: ThenableState | null = null;

export function createThenableState(): ThenableState {
  // The ThenableState is created the first time a component suspends. If it
  // suspends again, we'll reuse the same state.
  return [];
}

export function prepareThenableState(prevThenableState: ThenableState | null) {
  // This function is called before every function that might suspend
  // with `use`. Right now, that's only Hooks, but in the future we'll use the
  // same mechanism for unwrapping promises during reconciliation.
  thenableState = prevThenableState;
}

export function getThenableStateAfterSuspending(): ThenableState | null {
  // Called by the work loop so it can stash the thenable state. It will use
  // the state to replay the component when the promise resolves.
  if (
    thenableState !== null &&
    // If we only `use`-ed resolved promises, then there is no suspended state
    // TODO: The only reason we do this is to distinguish between throwing a
    // promise (old Suspense pattern) versus `use`-ing one. A better solution is
    // for `use` to throw a special, opaque value instead of a promise.
    !isThenableStateResolved(thenableState)
  ) {
    const state = thenableState;
    thenableState = null;
    return state;
  }
  return null;
}

export function isThenableStateResolved(thenables: ThenableState): boolean {
  const lastThenable = thenables[thenables.length - 1];
  if (lastThenable !== undefined) {
    const status = lastThenable.status;
    return status === 'fulfilled' || status === 'rejected';
  }
  return true;
}

export function trackUsedThenable<T>(thenable: Thenable<T>, index: number) {
  if (__DEV__ && ReactCurrentActQueue.current !== null) {
    ReactCurrentActQueue.didUsePromise = true;
  }

  if (thenableState === null) {
    thenableState = [thenable];
  } else {
    thenableState[index] = thenable;
  }

  // We use an expando to track the status and result of a thenable so that we
  // can synchronously unwrap the value. Think of this as an extension of the
  // Promise API, or a custom interface that is a superset of Thenable.
  //
  // If the thenable doesn't have a status, set it to "pending" and attach
  // a listener that will update its status and result when it resolves.
  switch (thenable.status) {
    case 'fulfilled':
    case 'rejected':
      // A thenable that already resolved shouldn't have been thrown, so this is
      // unexpected. Suggests a mistake in a userspace data library. Don't track
      // this thenable, because if we keep trying it will likely infinite loop
      // without ever resolving.
      // TODO: Log a warning?
      break;
    default: {
      if (typeof thenable.status === 'string') {
        // Only instrument the thenable if the status if not defined. If
        // it's defined, but an unknown value, assume it's been instrumented by
        // some custom userspace implementation. We treat it as "pending".
        break;
      }
      const pendingThenable: PendingThenable<mixed> = (thenable: any);
      pendingThenable.status = 'pending';
      pendingThenable.then(
        fulfilledValue => {
          if (thenable.status === 'pending') {
            const fulfilledThenable: FulfilledThenable<mixed> = (thenable: any);
            fulfilledThenable.status = 'fulfilled';
            fulfilledThenable.value = fulfilledValue;
          }
        },
        (error: mixed) => {
          if (thenable.status === 'pending') {
            const rejectedThenable: RejectedThenable<mixed> = (thenable: any);
            rejectedThenable.status = 'rejected';
            rejectedThenable.reason = error;
          }
        },
      );
      break;
    }
  }
}

export function getPreviouslyUsedThenableAtIndex<T>(
  index: number,
): Thenable<T> | null {
  if (thenableState !== null) {
    const thenable = thenableState[index];
    if (thenable !== undefined) {
      return thenable;
    }
  }
  return null;
}
