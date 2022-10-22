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

let suspendedThenable: Thenable<any> | null = null;
let usedThenables: Array<Thenable<any> | void> | null = null;

export function isTrackingSuspendedThenable(): boolean {
  return suspendedThenable !== null;
}

export function suspendedThenableDidResolve(): boolean {
  if (suspendedThenable !== null) {
    const status = suspendedThenable.status;
    return status === 'fulfilled' || status === 'rejected';
  }
  return false;
}

export function trackUsedThenable<T>(thenable: Thenable<T>, index: number) {
  if (__DEV__ && ReactCurrentActQueue.current !== null) {
    ReactCurrentActQueue.didUsePromise = true;
  }

  if (usedThenables === null) {
    usedThenables = [thenable];
  } else {
    usedThenables[index] = thenable;
  }

  suspendedThenable = thenable;

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
      suspendedThenable = null;
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

export function resetWakeableStateAfterEachAttempt() {
  suspendedThenable = null;
}

export function resetThenableStateOnCompletion() {
  usedThenables = null;
}

export function getPreviouslyUsedThenableAtIndex<T>(
  index: number,
): Thenable<T> | null {
  if (usedThenables !== null) {
    const thenable = usedThenables[index];
    if (thenable !== undefined) {
      return thenable;
    }
  }
  return null;
}
