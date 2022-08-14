/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Wakeable,
  Thenable,
  PendingThenable,
  FulfilledThenable,
  RejectedThenable,
} from 'shared/ReactTypes';

let suspendedThenable: Thenable<mixed> | null = null;
let adHocSuspendCount: number = 0;

const MAX_AD_HOC_SUSPEND_COUNT = 50;

export function isTrackingSuspendedThenable() {
  return suspendedThenable !== null;
}

export function suspendedThenableDidResolve() {
  if (suspendedThenable !== null) {
    const status = suspendedThenable.status;
    return status === 'fulfilled' || status === 'rejected';
  }
  return false;
}

export function trackSuspendedWakeable(wakeable: Wakeable) {
  // If this wakeable isn't already a thenable, turn it into one now. Then,
  // when we resume the work loop, we can check if its status is
  // still pending.
  // TODO: Get rid of the Wakeable type? It's superseded by UntrackedThenable.
  const thenable: Thenable<mixed> = (wakeable: any);

  adHocSuspendCount++;
  suspendedThenable = thenable;

  // We use an expando to track the status and result of a thenable so that we
  // can synchronously unwrap the value. Think of this as an extension of the
  // Promise API, or a custom interface that is a superset of Thenable.
  //
  // If the thenable doesn't have a status, set it to "pending" and attach
  // a listener that will update its status and result when it resolves.
  switch (thenable.status) {
    case 'pending':
      // Since the status is already "pending", we can assume it will be updated
      // when it resolves, either by React or something in userspace.
      break;
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

export function resetWakeableState() {
  suspendedThenable = null;
  adHocSuspendCount = 0;
}

export function throwIfInfinitePingLoopDetected() {
  if (adHocSuspendCount > MAX_AD_HOC_SUSPEND_COUNT) {
    // TODO: Guard against an infinite loop by throwing an error if the same
    // component suspends too many times in a row. This should be thrown from
    // the render phase so that it gets the component stack.
  }
}
