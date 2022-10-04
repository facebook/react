/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Corresponds to ReactFiberWakeable and ReactFizzWakeable modules. Generally,
// changes to one module should be reflected in the others.

// TODO: Rename this module and the corresponding Fiber one to "Thenable"
// instead of "Wakeable". Or some other more appropriate name.

import type {
  Wakeable,
  Thenable,
  PendingThenable,
  FulfilledThenable,
  RejectedThenable,
} from 'shared/ReactTypes';

// TODO: Sparse arrays are bad for performance.
export opaque type ThenableState = Array<Thenable<any> | void>;

export function createThenableState(): ThenableState {
  // The ThenableState is created the first time a component suspends. If it
  // suspends again, we'll reuse the same state.
  return [];
}

export function trackSuspendedWakeable(wakeable: Wakeable) {
  // If this wakeable isn't already a thenable, turn it into one now. Then,
  // when we resume the work loop, we can check if its status is
  // still pending.
  // TODO: Get rid of the Wakeable type? It's superseded by UntrackedThenable.
  const thenable: Thenable<mixed> = (wakeable: any);

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

export function trackUsedThenable<T>(
  thenableState: ThenableState,
  thenable: Thenable<T>,
  index: number,
) {
  // This is only a separate function from trackSuspendedWakeable for symmetry
  // with Fiber.
  // TODO: Disallow throwing a thenable directly. It must go through `use` (or
  // some equivalent for internal Suspense implementations). We can't do this in
  // Fiber yet because it's a breaking change but we can do it in Server
  // Components because Server Components aren't released yet.
  thenableState[index] = thenable;
}

export function getPreviouslyUsedThenableAtIndex<T>(
  thenableState: ThenableState | null,
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
