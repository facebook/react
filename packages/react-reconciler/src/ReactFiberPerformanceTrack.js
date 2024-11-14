/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

import getComponentNameFromFiber from './getComponentNameFromFiber';

import {getGroupNameOfHighestPriorityLane} from './ReactFiberLane';

import {enableProfilerTimer} from 'shared/ReactFeatureFlags';

const supportsUserTiming =
  enableProfilerTimer &&
  typeof performance !== 'undefined' &&
  // $FlowFixMe[method-unbinding]
  typeof performance.measure === 'function';

const COMPONENTS_TRACK = 'Components ⚛';

// Reused to avoid thrashing the GC.
const reusableComponentDevToolDetails = {
  dataType: 'track-entry',
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

const LANES_TRACK_GROUP = 'Scheduler ⚛';

const reusableLaneDevToolDetails = {
  dataType: 'track-entry',
  color: 'primary',
  track: 'Blocking', // Lane
  trackGroup: LANES_TRACK_GROUP,
};
const reusableLaneOptions = {
  start: -0,
  end: -0,
  detail: {
    devtools: reusableLaneDevToolDetails,
  },
};

export function setCurrentTrackFromLanes(lanes: number): void {
  reusableLaneDevToolDetails.track = getGroupNameOfHighestPriorityLane(lanes);
}

export function logComponentRender(
  fiber: Fiber,
  startTime: number,
  endTime: number,
): void {
  const name = getComponentNameFromFiber(fiber);
  if (name === null) {
    // Skip
    return;
  }
  if (supportsUserTiming) {
    let selfTime: number = (fiber.actualDuration: any);
    if (fiber.alternate === null || fiber.alternate.child !== fiber.child) {
      for (let child = fiber.child; child !== null; child = child.sibling) {
        selfTime -= (child.actualDuration: any);
      }
    }
    reusableComponentDevToolDetails.color =
      selfTime < 0.5
        ? 'primary-light'
        : selfTime < 10
          ? 'primary'
          : selfTime < 100
            ? 'primary-dark'
            : 'error';
    reusableComponentOptions.start = startTime;
    reusableComponentOptions.end = endTime;
    performance.measure(name, reusableComponentOptions);
  }
}

export function logComponentEffect(
  fiber: Fiber,
  startTime: number,
  endTime: number,
  selfTime: number,
): void {
  const name = getComponentNameFromFiber(fiber);
  if (name === null) {
    // Skip
    return;
  }
  if (supportsUserTiming) {
    reusableComponentDevToolDetails.color =
      selfTime < 1
        ? 'secondary-light'
        : selfTime < 100
          ? 'secondary'
          : selfTime < 500
            ? 'secondary-dark'
            : 'error';
    reusableComponentOptions.start = startTime;
    reusableComponentOptions.end = endTime;
    performance.measure(name, reusableComponentOptions);
  }
}

export function logBlockingStart(
  updateTime: number,
  eventTime: number,
  eventType: null | string,
  renderStartTime: number,
): void {
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.track = 'Blocking';
    if (eventTime > 0 && eventType !== null) {
      // Log the time from the event timeStamp until we called setState.
      reusableLaneDevToolDetails.color = 'secondary-dark';
      reusableLaneOptions.start = eventTime;
      reusableLaneOptions.end = updateTime > 0 ? updateTime : renderStartTime;
      performance.measure(eventType, reusableLaneOptions);
    }
    if (updateTime > 0) {
      // Log the time from when we called setState until we started rendering.
      reusableLaneDevToolDetails.color = 'primary-light';
      reusableLaneOptions.start = updateTime;
      reusableLaneOptions.end = renderStartTime;
      performance.measure('Blocked', reusableLaneOptions);
    }
  }
}

export function logTransitionStart(
  startTime: number,
  updateTime: number,
  eventTime: number,
  eventType: null | string,
  renderStartTime: number,
): void {
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.track = 'Transition';
    if (eventTime > 0 && eventType !== null) {
      // Log the time from the event timeStamp until we started a transition.
      reusableLaneDevToolDetails.color = 'secondary-dark';
      reusableLaneOptions.start = eventTime;
      reusableLaneOptions.end =
        startTime > 0
          ? startTime
          : updateTime > 0
            ? updateTime
            : renderStartTime;
      performance.measure(eventType, reusableLaneOptions);
    }
    if (startTime > 0) {
      // Log the time from when we started an async transition until we called setState or started rendering.
      reusableLaneDevToolDetails.color = 'primary-dark';
      reusableLaneOptions.start = startTime;
      reusableLaneOptions.end = updateTime > 0 ? updateTime : renderStartTime;
      performance.measure('Action', reusableLaneOptions);
    }
    if (updateTime > 0) {
      // Log the time from when we called setState until we started rendering.
      reusableLaneDevToolDetails.color = 'primary-light';
      reusableLaneOptions.start = updateTime;
      reusableLaneOptions.end = renderStartTime;
      performance.measure('Blocked', reusableLaneOptions);
    }
  }
}

export function logRenderPhase(startTime: number, endTime: number): void {
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.color = 'primary-dark';
    reusableLaneOptions.start = startTime;
    reusableLaneOptions.end = endTime;
    performance.measure('Render', reusableLaneOptions);
  }
}

export function logSuspenseThrottlePhase(
  startTime: number,
  endTime: number,
): void {
  // This was inside a throttled Suspense boundary commit.
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.color = 'secondary-light';
    reusableLaneOptions.start = startTime;
    reusableLaneOptions.end = endTime;
    performance.measure('Throttled', reusableLaneOptions);
  }
}

export function logSuspendedCommitPhase(
  startTime: number,
  endTime: number,
): void {
  // This means the commit was suspended on CSS or images.
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.color = 'secondary-light';
    reusableLaneOptions.start = startTime;
    reusableLaneOptions.end = endTime;
    performance.measure('Suspended', reusableLaneOptions);
  }
}

export function logCommitPhase(startTime: number, endTime: number): void {
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.color = 'secondary-dark';
    reusableLaneOptions.start = startTime;
    reusableLaneOptions.end = endTime;
    performance.measure('Commit', reusableLaneOptions);
  }
}

export function logPaintYieldPhase(
  startTime: number,
  endTime: number,
  delayedUntilPaint: boolean,
): void {
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.color = 'secondary-light';
    reusableLaneOptions.start = startTime;
    reusableLaneOptions.end = endTime;
    performance.measure(
      delayedUntilPaint ? 'Waiting for Paint' : '',
      reusableLaneOptions,
    );
  }
}

export function logPassiveCommitPhase(
  startTime: number,
  endTime: number,
): void {
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.color = 'secondary-dark';
    reusableLaneOptions.start = startTime;
    reusableLaneOptions.end = endTime;
    performance.measure('Remaining Effects', reusableLaneOptions);
  }
}
