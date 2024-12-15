/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactComponentInfo} from 'shared/ReactTypes';

import {enableProfilerTimer} from 'shared/ReactFeatureFlags';

const supportsUserTiming =
  enableProfilerTimer &&
  typeof performance !== 'undefined' &&
  // $FlowFixMe[method-unbinding]
  typeof performance.measure === 'function';

const COMPONENTS_TRACK = 'Server Components ⚛';

// Reused to avoid thrashing the GC.
const reusableComponentDevToolDetails = {
  color: 'primary',
  track: COMPONENTS_TRACK,
};
const reusableComponentOptions = {
  start: -0,
  end: -0,
  detail: {
    devtools: reusableComponentDevToolDetails,
  },
};

export function logComponentRender(
  componentInfo: ReactComponentInfo,
  startTime: number,
  endTime: number,
  childrenEndTime: number,
): void {
  if (supportsUserTiming && childrenEndTime >= 0) {
    const name = componentInfo.name;
    const selfTime = endTime - startTime;
    reusableComponentDevToolDetails.color =
      selfTime < 0.5
        ? 'primary-light'
        : selfTime < 50
          ? 'primary'
          : selfTime < 500
            ? 'primary-dark'
            : 'error';
    reusableComponentOptions.start = startTime < 0 ? 0 : startTime;
    reusableComponentOptions.end = childrenEndTime;
    performance.measure(name, reusableComponentOptions);
  }
}
