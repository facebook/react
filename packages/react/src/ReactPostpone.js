/**
 * Copyright (c) Meta Platforms, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {REACT_POSTPONE_TYPE} from 'shared/ReactSymbols';

export type Postpone = {
  $$typeof: symbol,
  message: string,
  stack: string,
  ...
};

export function postpone(reason: string): void {
  // eslint-disable-next-line react-internal/prod-error-codes
  const error = new Error(reason);
  (error: any).$$typeof = REACT_POSTPONE_TYPE;
  throw error;
}
