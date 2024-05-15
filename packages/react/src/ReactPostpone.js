/**
 * Copyright (c) Meta Platforms, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {REACT_POSTPONE_TYPE} from 'shared/ReactSymbols';

declare class Postpone extends Error {
  $$typeof: symbol;
}

export type {Postpone};

export function postpone(reason: string): void {
  // eslint-disable-next-line react-internal/prod-error-codes
  const postponeInstance: Postpone = (new Error(reason): any);
  postponeInstance.$$typeof = REACT_POSTPONE_TYPE;
  throw postponeInstance;
}
