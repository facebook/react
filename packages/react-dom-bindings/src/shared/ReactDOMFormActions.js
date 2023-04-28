/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Dispatcher} from 'react-reconciler/src/ReactInternalTypes';

import {enableAsyncActions, enableFormActions} from 'shared/ReactFeatureFlags';
import ReactSharedInternals from 'shared/ReactSharedInternals';

const ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;

type FormStatusNotPending = {|
  pending: false,
  data: null,
  method: null,
  action: null,
|};

type FormStatusPending = {|
  pending: true,
  data: FormData,
  method: string,
  action: string | (FormData => void | Promise<void>),
|};

export type FormStatus = FormStatusPending | FormStatusNotPending;

// Since the "not pending" value is always the same, we can reuse the
// same object across all transitions.
const sharedNotPendingObject = {
  pending: false,
  data: null,
  method: null,
  action: null,
};

export const NotPending: FormStatus = __DEV__
  ? Object.freeze(sharedNotPendingObject)
  : sharedNotPendingObject;

function resolveDispatcher() {
  // Copied from react/src/ReactHooks.js. It's the same thing but in a
  // different package.
  const dispatcher = ReactCurrentDispatcher.current;
  if (__DEV__) {
    if (dispatcher === null) {
      console.error(
        'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
          ' one of the following reasons:\n' +
          '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
          '2. You might be breaking the Rules of Hooks\n' +
          '3. You might have more than one copy of React in the same app\n' +
          'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.',
      );
    }
  }
  // Will result in a null access error if accessed outside render phase. We
  // intentionally don't throw our own error because this is in a hot path.
  // Also helps ensure this is inlined.
  return ((dispatcher: any): Dispatcher);
}

export function useFormStatus(): FormStatus {
  if (!(enableFormActions && enableAsyncActions)) {
    throw new Error('Not implemented.');
  } else {
    const dispatcher = resolveDispatcher();
    // $FlowFixMe[not-a-function] We know this exists because of the feature check above.
    return dispatcher.useHostTransitionStatus();
  }
}
