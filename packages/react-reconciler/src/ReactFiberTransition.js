/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactSharedInternals from 'shared/ReactSharedInternals';

// Deprecated
export type SuspenseConfig = {|
  timeoutMs: number,
  busyDelayMs?: number,
  busyMinDurationMs?: number,
|};

// Deprecated
export type TimeoutConfig = {|
  timeoutMs: number,
|};

const {ReactCurrentBatchConfig} = ReactSharedInternals;

export const NoTransition = 0;

export function requestCurrentTransition(): number {
  return ReactCurrentBatchConfig.transition;
}
