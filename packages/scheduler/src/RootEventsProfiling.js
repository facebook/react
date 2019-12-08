/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableRootEventMarks} from 'shared/ReactFeatureFlags';

const supportsUserTiming =
  typeof performance !== 'undefined' &&
  typeof performance.mark === 'function' &&
  typeof performance.clearMarks === 'function' &&
  typeof performance.measure === 'function' &&
  typeof performance.clearMeasures === 'function';

export type PriorityLabel = 'high' | 'normal' | 'low';
export type WorkType = 'render' | 'state-update';

export function schedulerStarted(priorityLabel: PriorityLabel): void {
  if (enableRootEventMarks) {
    if (supportsUserTiming) {
      performance.mark(`--scheduler-start-${priorityLabel}`);
    }
  }
}

export function schedulerStopped(priorityLabel: PriorityLabel): void {
  if (enableRootEventMarks) {
    if (supportsUserTiming) {
      performance.mark(`--scheduler-stop-${priorityLabel}`);
    }
  }
}
