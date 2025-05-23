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

import {getWorkInProgressRoot} from './ReactFiberWorkLoop';

import ReactSharedInternals from 'shared/ReactSharedInternals';

import noop from 'shared/noop';

opaque type ThenableStateDev = {
  didWarnAboutUncachedPromise: boolean,
  thenables: Array<Thenable<any>>,
};

opaque type ThenableStateProd = Array<Thenable<any>>;

export opaque type ThenableState = ThenableStateDev | ThenableStateProd;

function getThenablesFromState(state: ThenableState): Array<Thenable<any>> {
  if (__DEV__) {
    const devState: ThenableStateDev = (state: any);
    return devState.thenables;
  } else {
    const prodState = (state: any);
    return prodState;
  }
}

// An error that is thrown (e.g. by `use`) to trigger Suspense. If we
// detect this is caught by userspace, we'll log a warning in development.
export const SuspenseException: mixed = new Error(
  "Suspense Exception: This is not a real error! It's an implementation " +
    'detail of `use` to interrupt the current render. You must either ' +
    'rethrow it immediately, or move the `use` call outside of the ' +
    '`try/catch` block. Capturing without rethrowing will lead to ' +
    'unexpected behavior.\n\n' +
    'To handle async errors, wrap your component in an error boundary, or ' +
    "call the promise's `.catch` method and pass the result to `use`.",
);

export const SuspenseyCommitException: mixed = new Error(
  'Suspense Exception: This is not a real error, and should not leak into ' +
    "userspace. If you're seeing this, it's likely a bug in React.",
);

export const SuspenseActionException: mixed = new Error(
  "Suspense Exception: This is not a real error! It's an implementation " +
    'detail of `useActionState` to interrupt the current render. You must either ' +
    'rethrow it immediately, or move the `useActionState` call outside of the ' +
    '`try/catch` block. Capturing without rethrowing will lead to ' +
    'unexpected behavior.\n\n' +
    'To handle async errors, wrap your component in an error boundary.',
);
// This is a noop thenable that we use to trigger a fallback in throwException.
// TODO: It would be better to refactor throwException into multiple functions
// so we can trigger a fallback directly without having to check the type. But
// for now this will do.
export const noopSuspenseyCommitThenable = {
  then() {
    if (__DEV__) {
      console.error(
        'Internal React error: A listener was unexpectedly attached to a ' +
          '"noop" thenable. This is a bug in React. Please file an issue.',
      );
    }
  },
};

export function createThenableState(): ThenableState {
  // The ThenableState is created the first time a component suspends. If it
  // suspends again, we'll reuse the same state.
  if (__DEV__) {
    return {
      didWarnAboutUncachedPromise: false,
      thenables: [],
    };
  } else {
    return [];
  }
}

export function isThenableResolved(thenable: Thenable<mixed>): boolean {
  const status = thenable.status;
  return status === 'fulfilled' || status === 'rejected';
}

export function trackUsedThenable<T>(
  thenableState: ThenableState,
  thenable: Thenable<T>,
  index: number,
): T {
  if (__DEV__ && ReactSharedInternals.actQueue !== null) {
    ReactSharedInternals.didUsePromise = true;
  }
  const trackedThenables = getThenablesFromState(thenableState);
  const previous = trackedThenables[index];
  if (previous === undefined) {
    trackedThenables.push(thenable);
  } else {
    if (previous !== thenable) {
      // Reuse the previous thenable, and drop the new one. We can assume
      // they represent the same value, because components are idempotent.

      if (__DEV__) {
        const thenableStateDev: ThenableStateDev = (thenableState: any);
        if (!thenableStateDev.didWarnAboutUncachedPromise) {
          // We should only warn the first time an uncached thenable is
          // discovered per component, because if there are multiple, the
          // subsequent ones are likely derived from the first.
          //
          // We track this on the thenableState instead of deduping using the
          // component name like we usually do, because in the case of a
          // promise-as-React-node, the owner component is likely different from
          // the parent that's currently being reconciled. We'd have to track
          // the owner using state, which we're trying to move away from. Though
          // since this is dev-only, maybe that'd be OK.
          //
          // However, another benefit of doing it this way is we might
          // eventually have a thenableState per memo/Forget boundary instead
          // of per component, so this would allow us to have more
          // granular warnings.
          thenableStateDev.didWarnAboutUncachedPromise = true;

          // TODO: This warning should link to a corresponding docs page.
          console.error(
            'A component was suspended by an uncached promise. Creating ' +
              'promises inside a Client Component or hook is not yet ' +
              'supported, except via a Suspense-compatible library or framework.',
          );
        }
      }

      // Avoid an unhandled rejection errors for the Promises that we'll
      // intentionally ignore.
      thenable.then(noop, noop);
      thenable = previous;
    }
  }

  // We use an expando to track the status and result of a thenable so that we
  // can synchronously unwrap the value. Think of this as an extension of the
  // Promise API, or a custom interface that is a superset of Thenable.
  //
  // If the thenable doesn't have a status, set it to "pending" and attach
  // a listener that will update its status and result when it resolves.
  switch (thenable.status) {
    case 'fulfilled': {
      const fulfilledValue: T = thenable.value;
      return fulfilledValue;
    }
    case 'rejected': {
      const rejectedError = thenable.reason;
      checkIfUseWrappedInAsyncCatch(rejectedError);
      throw rejectedError;
    }
    default: {
      if (typeof thenable.status === 'string') {
        // Only instrument the thenable if the status if not defined. If
        // it's defined, but an unknown value, assume it's been instrumented by
        // some custom userspace implementation. We treat it as "pending".
        // Attach a dummy listener, to ensure that any lazy initialization can
        // happen. Flight lazily parses JSON when the value is actually awaited.
        thenable.then(noop, noop);
      } else {
        // This is an uncached thenable that we haven't seen before.

        // Detect infinite ping loops caused by uncached promises.
        const root = getWorkInProgressRoot();
        if (root !== null && root.shellSuspendCounter > 100) {
          // This root has suspended repeatedly in the shell without making any
          // progress (i.e. committing something). This is highly suggestive of
          // an infinite ping loop, often caused by an accidental Async Client
          // Component.
          //
          // During a transition, we can suspend the work loop until the promise
          // to resolve, but this is a sync render, so that's not an option. We
          // also can't show a fallback, because none was provided. So our last
          // resort is to throw an error.
          //
          // TODO: Remove this error in a future release. Other ways of handling
          // this case include forcing a concurrent render, or putting the whole
          // root into offscreen mode.
          throw new Error(
            'An unknown Component is an async Client Component. ' +
              'Only Server Components can be async at the moment. ' +
              'This error is often caused by accidentally ' +
              "adding `'use client'` to a module that was originally written " +
              'for the server.',
          );
        }

        const pendingThenable: PendingThenable<T> = (thenable: any);
        pendingThenable.status = 'pending';
        pendingThenable.then(
          fulfilledValue => {
            if (thenable.status === 'pending') {
              const fulfilledThenable: FulfilledThenable<T> = (thenable: any);
              fulfilledThenable.status = 'fulfilled';
              fulfilledThenable.value = fulfilledValue;
            }
          },
          (error: mixed) => {
            if (thenable.status === 'pending') {
              const rejectedThenable: RejectedThenable<T> = (thenable: any);
              rejectedThenable.status = 'rejected';
              rejectedThenable.reason = error;
            }
          },
        );
      }

      // Check one more time in case the thenable resolved synchronously.
      switch ((thenable: Thenable<T>).status) {
        case 'fulfilled': {
          const fulfilledThenable: FulfilledThenable<T> = (thenable: any);
          return fulfilledThenable.value;
        }
        case 'rejected': {
          const rejectedThenable: RejectedThenable<T> = (thenable: any);
          const rejectedError = rejectedThenable.reason;
          checkIfUseWrappedInAsyncCatch(rejectedError);
          throw rejectedError;
        }
      }

      // Suspend.
      //
      // Throwing here is an implementation detail that allows us to unwind the
      // call stack. But we shouldn't allow it to leak into userspace. Throw an
      // opaque placeholder value instead of the actual thenable. If it doesn't
      // get captured by the work loop, log a warning, because that means
      // something in userspace must have caught it.
      suspendedThenable = thenable;
      if (__DEV__) {
        needsToResetSuspendedThenableDEV = true;
      }
      throw SuspenseException;
    }
  }
}

export function suspendCommit(): void {
  // This extra indirection only exists so it can handle passing
  // noopSuspenseyCommitThenable through to throwException.
  // TODO: Factor the thenable check out of throwException
  suspendedThenable = noopSuspenseyCommitThenable;
  throw SuspenseyCommitException;
}

// This is used to track the actual thenable that suspended so it can be
// passed to the rest of the Suspense implementation — which, for historical
// reasons, expects to receive a thenable.
let suspendedThenable: Thenable<any> | null = null;
let needsToResetSuspendedThenableDEV = false;
export function getSuspendedThenable(): Thenable<mixed> {
  // This is called right after `use` suspends by throwing an exception. `use`
  // throws an opaque value instead of the thenable itself so that it can't be
  // caught in userspace. Then the work loop accesses the actual thenable using
  // this function.
  if (suspendedThenable === null) {
    throw new Error(
      'Expected a suspended thenable. This is a bug in React. Please file ' +
        'an issue.',
    );
  }
  const thenable = suspendedThenable;
  suspendedThenable = null;
  if (__DEV__) {
    needsToResetSuspendedThenableDEV = false;
  }
  return thenable;
}

export function checkIfUseWrappedInTryCatch(): boolean {
  if (__DEV__) {
    // This was set right before SuspenseException was thrown, and it should
    // have been cleared when the exception was handled. If it wasn't,
    // it must have been caught by userspace.
    if (needsToResetSuspendedThenableDEV) {
      needsToResetSuspendedThenableDEV = false;
      return true;
    }
  }
  return false;
}

export function checkIfUseWrappedInAsyncCatch(rejectedReason: any) {
  // This check runs in prod, too, because it prevents a more confusing
  // downstream error, where SuspenseException is caught by a promise and
  // thrown asynchronously.
  // TODO: Another way to prevent SuspenseException from leaking into an async
  // execution context is to check the dispatcher every time `use` is called,
  // or some equivalent. That might be preferable for other reasons, too, since
  // it matches how we prevent similar mistakes for other hooks.
  if (
    rejectedReason === SuspenseException ||
    rejectedReason === SuspenseActionException
  ) {
    throw new Error(
      'Hooks are not supported inside an async component. This ' +
        "error is often caused by accidentally adding `'use client'` " +
        'to a module that was originally written for the server.',
    );
  }
}
