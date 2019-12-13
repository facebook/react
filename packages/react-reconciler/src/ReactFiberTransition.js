/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type SuspenseConfig = {|
  timeoutMs: number,
  busyDelayMs?: number,
  busyMinDurationMs?: number,
|};

let currentSuspenseConfig: SuspenseConfig | null = null;

export function setCurrentSuspenseConfig(config: SuspenseConfig | null): void {
  currentSuspenseConfig = config;
}

export function getCurrentSuspenseConfig(): SuspenseConfig | null {
  return currentSuspenseConfig;
}
