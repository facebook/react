/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

import type {Lanes} from './ReactFiberLane';

import getComponentNameFromFiber from './getComponentNameFromFiber';

import {
  getGroupNameOfHighestPriorityLane,
  includesOnlyHydrationLanes,
  includesOnlyOffscreenLanes,
  includesOnlyHydrationOrOffscreenLanes,
} from './ReactFiberLane';

import {enableProfilerTimer} from 'shared/ReactFeatureFlags';

const supportsUserTiming =
  enableProfilerTimer &&
  typeof performance !== 'undefined' &&
  // $FlowFixMe[method-unbinding]
  typeof performance.measure === 'function';

const COMPONENTS_TRACK = 'Components ⚛';

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

const LANES_TRACK_GROUP = 'Scheduler ⚛';

const reusableLaneDevToolDetails = {
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

export function setCurrentTrackFromLanes(lanes: Lanes): void {
  reusableLaneDevToolDetails.track = getGroupNameOfHighestPriorityLane(lanes);
}

const blockingLaneMarker = {
  startTime: 0,
  detail: {
    devtools: {
      color: 'primary-light',
      track: 'Blocking',
      trackGroup: LANES_TRACK_GROUP,
    },
  },
};

const transitionLaneMarker = {
  startTime: 0,
  detail: {
    devtools: {
      color: 'primary-light',
      track: 'Transition',
      trackGroup: LANES_TRACK_GROUP,
    },
  },
};

const suspenseLaneMarker = {
  startTime: 0,
  detail: {
    devtools: {
      color: 'primary-light',
      track: 'Suspense',
      trackGroup: LANES_TRACK_GROUP,
    },
  },
};

const idleLaneMarker = {
  startTime: 0,
  detail: {
    devtools: {
      color: 'primary-light',
      track: 'Idle',
      trackGroup: LANES_TRACK_GROUP,
    },
  },
};

export function markAllLanesInOrder() {
  if (supportsUserTiming) {
    // Ensure we create all tracks in priority order. Currently performance.mark() are in
    // first insertion order but performance.measure() are in the reverse order. We can
    // always add the 0 time slot even if it's in the past. That's still considered for
    // ordering.
    performance.mark('Blocking Track', blockingLaneMarker);
    performance.mark('Transition Track', transitionLaneMarker);
    performance.mark('Suspense Track', suspenseLaneMarker);
    performance.mark('Idle Track', idleLaneMarker);
  }
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

export function logYieldTime(startTime: number, endTime: number): void {
  if (supportsUserTiming) {
    const yieldDuration = endTime - startTime;
    if (yieldDuration < 1) {
      // Skip sub-millisecond yields. This happens all the time and is not interesting.
      return;
    }
    // Being blocked on CPU is potentially bad so we color it by how long it took.
    reusableComponentDevToolDetails.color =
      yieldDuration < 5
        ? 'primary-light'
        : yieldDuration < 10
          ? 'primary'
          : yieldDuration < 100
            ? 'primary-dark'
            : 'error';
    reusableComponentOptions.start = startTime;
    reusableComponentOptions.end = endTime;
    performance.measure('Blocked', reusableComponentOptions);
  }
}

export function logSuspendedYieldTime(
  startTime: number,
  endTime: number,
  suspendedFiber: Fiber,
): void {
  if (supportsUserTiming) {
    reusableComponentDevToolDetails.color = 'primary-light';
    reusableComponentOptions.start = startTime;
    reusableComponentOptions.end = endTime;
    performance.measure('Suspended', reusableComponentOptions);
  }
}

export function logActionYieldTime(
  startTime: number,
  endTime: number,
  suspendedFiber: Fiber,
): void {
  if (supportsUserTiming) {
    reusableComponentDevToolDetails.color = 'primary-light';
    reusableComponentOptions.start = startTime;
    reusableComponentOptions.end = endTime;
    performance.measure('Action', reusableComponentOptions);
  }
}

export function logBlockingStart(
  updateTime: number,
  eventTime: number,
  eventType: null | string,
  eventIsRepeat: boolean,
  renderStartTime: number,
  lanes: Lanes,
): void {
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.track = 'Blocking';
    if (eventTime > 0 && eventType !== null) {
      // Log the time from the event timeStamp until we called setState.
      reusableLaneDevToolDetails.color = eventIsRepeat
        ? 'secondary-light'
        : 'warning';
      reusableLaneOptions.start = eventTime;
      reusableLaneOptions.end = updateTime > 0 ? updateTime : renderStartTime;
      performance.measure(
        eventIsRepeat ? '' : 'Event: ' + eventType,
        reusableLaneOptions,
      );
    }
    if (updateTime > 0) {
      // Log the time from when we called setState until we started rendering.
      reusableLaneDevToolDetails.color = includesOnlyHydrationOrOffscreenLanes(
        lanes,
      )
        ? 'tertiary-light'
        : 'primary-light';
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
  eventIsRepeat: boolean,
  renderStartTime: number,
): void {
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.track = 'Transition';
    if (eventTime > 0 && eventType !== null) {
      // Log the time from the event timeStamp until we started a transition.
      reusableLaneDevToolDetails.color = eventIsRepeat
        ? 'secondary-light'
        : 'warning';
      reusableLaneOptions.start = eventTime;
      reusableLaneOptions.end =
        startTime > 0
          ? startTime
          : updateTime > 0
            ? updateTime
            : renderStartTime;
      performance.measure(
        eventIsRepeat ? '' : 'Event: ' + eventType,
        reusableLaneOptions,
      );
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

export function logRenderPhase(
  startTime: number,
  endTime: number,
  lanes: Lanes,
): void {
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.color = includesOnlyHydrationOrOffscreenLanes(
      lanes,
    )
      ? 'tertiary-dark'
      : 'primary-dark';
    reusableLaneOptions.start = startTime;
    reusableLaneOptions.end = endTime;
    performance.measure(
      includesOnlyOffscreenLanes(lanes)
        ? 'Prepared'
        : includesOnlyHydrationLanes(lanes)
          ? 'Hydrated'
          : 'Render',
      reusableLaneOptions,
    );
  }
}

export function logInterruptedRenderPhase(
  startTime: number,
  endTime: number,
  lanes: Lanes,
): void {
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.color = includesOnlyHydrationOrOffscreenLanes(
      lanes,
    )
      ? 'tertiary-dark'
      : 'primary-dark';
    reusableLaneOptions.start = startTime;
    reusableLaneOptions.end = endTime;
    performance.measure(
      includesOnlyOffscreenLanes(lanes)
        ? 'Prewarm'
        : includesOnlyHydrationLanes(lanes)
          ? 'Interrupted Hydration'
          : 'Interrupted Render',
      reusableLaneOptions,
    );
  }
}

export function logSuspendedRenderPhase(
  startTime: number,
  endTime: number,
  lanes: Lanes,
): void {
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.color = includesOnlyHydrationOrOffscreenLanes(
      lanes,
    )
      ? 'tertiary-dark'
      : 'primary-dark';
    reusableLaneOptions.start = startTime;
    reusableLaneOptions.end = endTime;
    performance.measure('Prewarm', reusableLaneOptions);
  }
}

export function logSuspendedWithDelayPhase(
  startTime: number,
  endTime: number,
  lanes: Lanes,
): void {
  // This means the render was suspended and cannot commit until it gets unblocked.
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.color = includesOnlyHydrationOrOffscreenLanes(
      lanes,
    )
      ? 'tertiary-dark'
      : 'primary-dark';
    reusableLaneOptions.start = startTime;
    reusableLaneOptions.end = endTime;
    performance.measure('Suspended', reusableLaneOptions);
  }
}

export function logErroredRenderPhase(
  startTime: number,
  endTime: number,
  lanes: Lanes,
): void {
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.color = 'error';
    reusableLaneOptions.start = startTime;
    reusableLaneOptions.end = endTime;
    performance.measure('Errored Render', reusableLaneOptions);
  }
}

export function logInconsistentRender(
  startTime: number,
  endTime: number,
): void {
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.color = 'error';
    reusableLaneOptions.start = startTime;
    reusableLaneOptions.end = endTime;
    performance.measure('Teared Render', reusableLaneOptions);
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
