/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableAsyncActions, enableFormActions} from 'shared/ReactFeatureFlags';

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

const NotPending: FormStatus = __DEV__
  ? Object.freeze(sharedNotPendingObject)
  : sharedNotPendingObject;

export function useFormStatus(): FormStatus {
  if (!(enableFormActions && enableAsyncActions)) {
    throw new Error('Not implemented.');
  } else {
    // TODO: This isn't fully implemented yet but we return a correctly typed
    // value so we can test that the API is exposed and gated correctly. The
    // real implementation will access the status via the dispatcher.
    return NotPending;
  }
}
