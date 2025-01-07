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

import type {CapturedValue} from './ReactCapturedValue';

import {SuspenseComponent} from './ReactWorkTags';

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
  startTime: 0.003,
  detail: {
    devtools: {
      color: 'primary-light',
      track: 'Blocking',
      trackGroup: LANES_TRACK_GROUP,
    },
  },
};

const transitionLaneMarker = {
  startTime: 0.003,
  detail: {
    devtools: {
      color: 'primary-light',
      track: 'Transition',
      trackGroup: LANES_TRACK_GROUP,
    },
  },
};

const suspenseLaneMarker = {
  startTime: 0.003,
  detail: {
    devtools: {
      color: 'primary-light',
      track: 'Suspense',
      trackGroup: LANES_TRACK_GROUP,
    },
  },
};

const idleLaneMarker = {
  startTime: 0.003,
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
  wasHydrated: boolean,
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
        ? wasHydrated
          ? 'tertiary-light'
          : 'primary-light'
        : selfTime < 10
          ? wasHydrated
            ? 'tertiary'
            : 'primary'
          : selfTime < 100
            ? wasHydrated
              ? 'tertiary-dark'
              : 'primary-dark'
            : 'error';
    reusableComponentOptions.start = startTime;
    reusableComponentOptions.end = endTime;
    performance.measure(name, reusableComponentOptions);
  }
}

export function logComponentErrored(
  fiber: Fiber,
  startTime: number,
  endTime: number,
  errors: Array<CapturedValue<mixed>>,
): void {
  if (supportsUserTiming) {
    const name = getComponentNameFromFiber(fiber);
    if (name === null) {
      // Skip
      return;
    }
    const properties = [];
    if (__DEV__) {
      for (let i = 0; i < errors.length; i++) {
        const capturedValue = errors[i];
        const error = capturedValue.value;
        const message =
          typeof error === 'object' &&
          error !== null &&
          typeof error.message === 'string'
            ? // eslint-disable-next-line react-internal/safe-string-coercion
              String(error.message)
            : // eslint-disable-next-line react-internal/safe-string-coercion
              String(error);
        properties.push(['Error', message]);
      }
    }
    performance.measure(name, {
      start: startTime,
      end: endTime,
      detail: {
        devtools: {
          color: 'error',
          track: COMPONENTS_TRACK,
          tooltipText:
            fiber.tag === SuspenseComponent
              ? 'Hydration failed'
              : 'Error boundary caught an error',
          properties,
        },
      },
    });
  }
}

function logComponentEffectErrored(
  fiber: Fiber,
  startTime: number,
  endTime: number,
  errors: Array<CapturedValue<mixed>>,
): void {
  if (supportsUserTiming) {
    const name = getComponentNameFromFiber(fiber);
    if (name === null) {
      // Skip
      return;
    }
    const properties = [];
    if (__DEV__) {
      for (let i = 0; i < errors.length; i++) {
        const capturedValue = errors[i];
        const error = capturedValue.value;
        const message =
          typeof error === 'object' &&
          error !== null &&
          typeof error.message === 'string'
            ? // eslint-disable-next-line react-internal/safe-string-coercion
              String(error.message)
            : // eslint-disable-next-line react-internal/safe-string-coercion
              String(error);
        properties.push(['Error', message]);
      }
    }
    performance.measure(name, {
      start: startTime,
      end: endTime,
      detail: {
        devtools: {
          color: 'error',
          track: COMPONENTS_TRACK,
          tooltipText: 'A lifecycle or effect errored',
          properties,
        },
      },
    });
  }
}

export function logComponentEffect(
  fiber: Fiber,
  startTime: number,
  endTime: number,
  selfTime: number,
  errors: null | Array<CapturedValue<mixed>>,
): void {
  if (errors !== null) {
    logComponentEffectErrored(fiber, startTime, endTime, errors);
    return;
  }
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
  isSpawnedUpdate: boolean,
  renderStartTime: number,
  lanes: Lanes,
): void {
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.track = 'Blocking';
    // If a blocking update was spawned within render or an effect, that's considered a cascading render.
    // If you have a second blocking update within the same event, that suggests multiple flushSync or
    // setState in a microtask which is also considered a cascade.
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
      reusableLaneDevToolDetails.color = isSpawnedUpdate
        ? 'error'
        : includesOnlyHydrationOrOffscreenLanes(lanes)
          ? 'tertiary-light'
          : 'primary-light';
      reusableLaneOptions.start = updateTime;
      reusableLaneOptions.end = renderStartTime;
      performance.measure(
        isSpawnedUpdate ? 'Cascade' : 'Blocked',
        reusableLaneOptions,
      );
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

export function logRecoveredRenderPhase(
  startTime: number,
  endTime: number,
  lanes: Lanes,
  recoverableErrors: Array<CapturedValue<mixed>>,
  hydrationFailed: boolean,
): void {
  if (supportsUserTiming) {
    const properties = [];
    if (__DEV__) {
      for (let i = 0; i < recoverableErrors.length; i++) {
        const capturedValue = recoverableErrors[i];
        const error = capturedValue.value;
        const message =
          typeof error === 'object' &&
          error !== null &&
          typeof error.message === 'string'
            ? // eslint-disable-next-line react-internal/safe-string-coercion
              String(error.message)
            : // eslint-disable-next-line react-internal/safe-string-coercion
              String(error);
        properties.push(['Recoverable Error', message]);
      }
    }
    performance.measure('Recovered', {
      start: startTime,
      end: endTime,
      detail: {
        devtools: {
          color: 'primary-dark',
          track: reusableLaneDevToolDetails.track,
          trackGroup: LANES_TRACK_GROUP,
          tooltipText: hydrationFailed
            ? 'Hydration Failed'
            : 'Recovered after Error',
          properties,
        },
      },
    });
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
    performance.measure('Errored', reusableLaneOptions);
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

export function logCommitErrored(
  startTime: number,
  endTime: number,
  errors: Array<CapturedValue<mixed>>,
  passive: boolean,
): void {
  if (supportsUserTiming) {
    const properties = [];
    if (__DEV__) {
      for (let i = 0; i < errors.length; i++) {
        const capturedValue = errors[i];
        const error = capturedValue.value;
        const message =
          typeof error === 'object' &&
          error !== null &&
          typeof error.message === 'string'
            ? // eslint-disable-next-line react-internal/safe-string-coercion
              String(error.message)
            : // eslint-disable-next-line react-internal/safe-string-coercion
              String(error);
        properties.push(['Error', message]);
      }
    }
    performance.measure('Errored', {
      start: startTime,
      end: endTime,
      detail: {
        devtools: {
          color: 'error',
          track: reusableLaneDevToolDetails.track,
          trackGroup: LANES_TRACK_GROUP,
          tooltipText: passive ? 'Remaining Effects Errored' : 'Commit Errored',
          properties,
        },
      },
    });
  }
}

export function logCommitPhase(
  startTime: number,
  endTime: number,
  errors: null | Array<CapturedValue<mixed>>,
): void {
  if (errors !== null) {
    logCommitErrored(startTime, endTime, errors, false);
    return;
  }
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
  errors: null | Array<CapturedValue<mixed>>,
): void {
  if (errors !== null) {
    logCommitErrored(startTime, endTime, errors, true);
    return;
  }
  if (supportsUserTiming) {
    reusableLaneDevToolDetails.color = 'secondary-dark';
    reusableLaneOptions.start = startTime;
    reusableLaneOptions.end = endTime;
    performance.measure('Remaining Effects', reusableLaneOptions);
  }
}
