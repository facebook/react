/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable react-internal/no-production-logging */

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
  typeof console !== 'undefined' &&
  typeof console.timeStamp === 'function';

const COMPONENTS_TRACK = 'Components ⚛';
const LANES_TRACK_GROUP = 'Scheduler ⚛';

let currentTrack: string = 'Blocking'; // Lane

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
  currentTrack = getGroupNameOfHighestPriorityLane(lanes);
}

export function markAllLanesInOrder() {
  if (supportsUserTiming) {
    // Ensure we create all tracks in priority order. Currently performance.mark() are in
    // first insertion order but performance.measure() are in the reverse order. We can
    // always add the 0 time slot even if it's in the past. That's still considered for
    // ordering.
    console.timeStamp(
      'Blocking Track',
      0.003,
      0.003,
      'Blocking',
      LANES_TRACK_GROUP,
      'primary-light',
    );
    console.timeStamp(
      'Transition Track',
      0.003,
      0.003,
      'Transition',
      LANES_TRACK_GROUP,
      'primary-light',
    );
    console.timeStamp(
      'Suspense Track',
      0.003,
      0.003,
      'Suspense',
      LANES_TRACK_GROUP,
      'primary-light',
    );
    console.timeStamp(
      'Idle Track',
      0.003,
      0.003,
      'Idle',
      LANES_TRACK_GROUP,
      'primary-light',
    );
  }
}

function logComponentTrigger(
  fiber: Fiber,
  startTime: number,
  endTime: number,
  trigger: string,
) {
  if (supportsUserTiming) {
    const debugTask = fiber._debugTask;
    if (__DEV__ && debugTask) {
      debugTask.run(
        console.timeStamp.bind(
          console,
          trigger,
          startTime,
          endTime,
          COMPONENTS_TRACK,
          undefined,
          'warning',
        ),
      );
    } else {
      console.timeStamp(
        trigger,
        startTime,
        endTime,
        COMPONENTS_TRACK,
        undefined,
        'warning',
      );
    }
  }
}

export function logComponentMount(
  fiber: Fiber,
  startTime: number,
  endTime: number,
): void {
  logComponentTrigger(fiber, startTime, endTime, 'Mount');
}

export function logComponentUnmount(
  fiber: Fiber,
  startTime: number,
  endTime: number,
): void {
  logComponentTrigger(fiber, startTime, endTime, 'Unmount');
}

export function logComponentReappeared(
  fiber: Fiber,
  startTime: number,
  endTime: number,
): void {
  logComponentTrigger(fiber, startTime, endTime, 'Reconnect');
}

export function logComponentDisappeared(
  fiber: Fiber,
  startTime: number,
  endTime: number,
): void {
  logComponentTrigger(fiber, startTime, endTime, 'Disconnect');
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
    const color =
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
    const debugTask = fiber._debugTask;
    if (__DEV__ && debugTask) {
      debugTask.run(
        // $FlowFixMe[method-unbinding]
        console.timeStamp.bind(
          console,
          name,
          startTime,
          endTime,
          COMPONENTS_TRACK,
          undefined,
          color,
        ),
      );
    } else {
      console.timeStamp(
        name,
        startTime,
        endTime,
        COMPONENTS_TRACK,
        undefined,
        color,
      );
    }
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
    if (
      __DEV__ &&
      typeof performance !== 'undefined' &&
      // $FlowFixMe[method-unbinding]
      typeof performance.measure === 'function'
    ) {
      let debugTask: ?ConsoleTask = null;
      const properties = [];
      for (let i = 0; i < errors.length; i++) {
        const capturedValue = errors[i];
        if (debugTask == null && capturedValue.source !== null) {
          // If the captured value has a source Fiber, use its debugTask for
          // the stack instead of the error boundary's stack. So you can find
          // which component errored since we don't show the errored render tree.
          // TODO: Ideally we should instead, store the failed fibers and log the
          // whole subtree including the component that errored.
          debugTask = capturedValue.source._debugTask;
        }
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
      if (debugTask == null) {
        // If the captured values don't have a debug task, fallback to the
        // error boundary itself.
        debugTask = fiber._debugTask;
      }
      const options = {
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
      };
      if (__DEV__ && debugTask) {
        debugTask.run(
          // $FlowFixMe[method-unbinding]
          performance.measure.bind(performance, name, options),
        );
      } else {
        performance.measure(name, options);
      }
    } else {
      console.timeStamp(
        name,
        startTime,
        endTime,
        COMPONENTS_TRACK,
        undefined,
        'error',
      );
    }
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
    if (
      __DEV__ &&
      typeof performance !== 'undefined' &&
      // $FlowFixMe[method-unbinding]
      typeof performance.measure === 'function'
    ) {
      const properties = [];
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
      const options = {
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
      };
      const debugTask = fiber._debugTask;
      if (debugTask) {
        debugTask.run(
          // $FlowFixMe[method-unbinding]
          performance.measure.bind(performance, name, options),
        );
      } else {
        performance.measure(name, options);
      }
    } else {
      console.timeStamp(
        name,
        startTime,
        endTime,
        COMPONENTS_TRACK,
        undefined,
        'error',
      );
    }
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
    const color =
      selfTime < 1
        ? 'secondary-light'
        : selfTime < 100
          ? 'secondary'
          : selfTime < 500
            ? 'secondary-dark'
            : 'error';
    const debugTask = fiber._debugTask;
    if (__DEV__ && debugTask) {
      debugTask.run(
        // $FlowFixMe[method-unbinding]
        console.timeStamp.bind(
          console,
          name,
          startTime,
          endTime,
          COMPONENTS_TRACK,
          undefined,
          color,
        ),
      );
    } else {
      console.timeStamp(
        name,
        startTime,
        endTime,
        COMPONENTS_TRACK,
        undefined,
        color,
      );
    }
  }
}

export function logYieldTime(startTime: number, endTime: number): void {
  if (supportsUserTiming) {
    const yieldDuration = endTime - startTime;
    if (yieldDuration < 3) {
      // Skip sub-millisecond yields. This happens all the time and is not interesting.
      return;
    }
    // Being blocked on CPU is potentially bad so we color it by how long it took.
    const color =
      yieldDuration < 5
        ? 'primary-light'
        : yieldDuration < 10
          ? 'primary'
          : yieldDuration < 100
            ? 'primary-dark'
            : 'error';
    // This get logged in the components track if we don't commit which leaves them
    // hanging by themselves without context. It's a useful indicator for why something
    // might be starving this render though.
    // TODO: Considering adding these to a queue and only logging them if we commit.
    console.timeStamp(
      'Blocked',
      startTime,
      endTime,
      COMPONENTS_TRACK,
      undefined,
      color,
    );
  }
}

export function logSuspendedYieldTime(
  startTime: number,
  endTime: number,
  suspendedFiber: Fiber,
): void {
  if (supportsUserTiming) {
    const debugTask = suspendedFiber._debugTask;
    if (__DEV__ && debugTask) {
      debugTask.run(
        // $FlowFixMe[method-unbinding]
        console.timeStamp.bind(
          console,
          'Suspended',
          startTime,
          endTime,
          COMPONENTS_TRACK,
          undefined,
          'primary-light',
        ),
      );
    } else {
      console.timeStamp(
        'Suspended',
        startTime,
        endTime,
        COMPONENTS_TRACK,
        undefined,
        'primary-light',
      );
    }
  }
}

export function logActionYieldTime(
  startTime: number,
  endTime: number,
  suspendedFiber: Fiber,
): void {
  if (supportsUserTiming) {
    const debugTask = suspendedFiber._debugTask;
    if (__DEV__ && debugTask) {
      debugTask.run(
        // $FlowFixMe[method-unbinding]
        console.timeStamp.bind(
          console,
          'Action',
          startTime,
          endTime,
          COMPONENTS_TRACK,
          undefined,
          'primary-light',
        ),
      );
    } else {
      console.timeStamp(
        'Action',
        startTime,
        endTime,
        COMPONENTS_TRACK,
        undefined,
        'primary-light',
      );
    }
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
  debugTask: null | ConsoleTask, // DEV-only
): void {
  if (supportsUserTiming) {
    currentTrack = 'Blocking';
    // If a blocking update was spawned within render or an effect, that's considered a cascading render.
    // If you have a second blocking update within the same event, that suggests multiple flushSync or
    // setState in a microtask which is also considered a cascade.
    if (eventTime > 0 && eventType !== null) {
      // Log the time from the event timeStamp until we called setState.
      const color = eventIsRepeat ? 'secondary-light' : 'warning';
      if (__DEV__ && debugTask) {
        debugTask.run(
          // $FlowFixMe[method-unbinding]
          console.timeStamp.bind(
            console,
            eventIsRepeat ? '' : 'Event: ' + eventType,
            eventTime,
            updateTime > 0 ? updateTime : renderStartTime,
            currentTrack,
            LANES_TRACK_GROUP,
            color,
          ),
        );
      } else {
        console.timeStamp(
          eventIsRepeat ? '' : 'Event: ' + eventType,
          eventTime,
          updateTime > 0 ? updateTime : renderStartTime,
          currentTrack,
          LANES_TRACK_GROUP,
          color,
        );
      }
    }
    if (updateTime > 0) {
      // Log the time from when we called setState until we started rendering.
      const color = isSpawnedUpdate
        ? 'error'
        : includesOnlyHydrationOrOffscreenLanes(lanes)
          ? 'tertiary-light'
          : 'primary-light';
      if (__DEV__ && debugTask) {
        debugTask.run(
          // $FlowFixMe[method-unbinding]
          console.timeStamp.bind(
            console,
            isSpawnedUpdate
              ? 'Cascading Update'
              : renderStartTime - updateTime > 5
                ? 'Update Blocked'
                : 'Update',
            updateTime,
            renderStartTime,
            currentTrack,
            LANES_TRACK_GROUP,
            color,
          ),
        );
      } else {
        console.timeStamp(
          isSpawnedUpdate
            ? 'Cascading Update'
            : renderStartTime - updateTime > 5
              ? 'Update Blocked'
              : 'Update',
          updateTime,
          renderStartTime,
          currentTrack,
          LANES_TRACK_GROUP,
          color,
        );
      }
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
  debugTask: null | ConsoleTask, // DEV-only
): void {
  if (supportsUserTiming) {
    currentTrack = 'Transition';
    if (eventTime > 0 && eventType !== null) {
      // Log the time from the event timeStamp until we started a transition.
      const color = eventIsRepeat ? 'secondary-light' : 'warning';
      const endTime =
        startTime > 0
          ? startTime
          : updateTime > 0
            ? updateTime
            : renderStartTime;
      if (__DEV__ && debugTask) {
        debugTask.run(
          // $FlowFixMe[method-unbinding]
          console.timeStamp.bind(
            console,
            eventIsRepeat ? '' : 'Event: ' + eventType,
            eventTime,
            endTime,
            currentTrack,
            LANES_TRACK_GROUP,
            color,
          ),
        );
      } else {
        console.timeStamp(
          eventIsRepeat ? '' : 'Event: ' + eventType,
          eventTime,
          endTime,
          currentTrack,
          LANES_TRACK_GROUP,
          color,
        );
      }
    }
    if (startTime > 0) {
      // Log the time from when we started an async transition until we called setState or started rendering.
      // TODO: Ideally this would use the debugTask of the startTransition call perhaps.
      if (__DEV__ && debugTask) {
        debugTask.run(
          // $FlowFixMe[method-unbinding]
          console.timeStamp.bind(
            console,
            'Action',
            startTime,
            updateTime > 0 ? updateTime : renderStartTime,
            currentTrack,
            LANES_TRACK_GROUP,
            'primary-dark',
          ),
        );
      } else {
        console.timeStamp(
          'Action',
          startTime,
          updateTime > 0 ? updateTime : renderStartTime,
          currentTrack,
          LANES_TRACK_GROUP,
          'primary-dark',
        );
      }
    }
    if (updateTime > 0) {
      // Log the time from when we called setState until we started rendering.
      if (__DEV__ && debugTask) {
        debugTask.run(
          // $FlowFixMe[method-unbinding]
          console.timeStamp.bind(
            console,
            renderStartTime - updateTime > 5 ? 'Update Blocked' : 'Update',
            updateTime,
            renderStartTime,
            currentTrack,
            LANES_TRACK_GROUP,
            'primary-light',
          ),
        );
      } else {
        console.timeStamp(
          renderStartTime - updateTime > 5 ? 'Update Blocked' : 'Update',
          updateTime,
          renderStartTime,
          currentTrack,
          LANES_TRACK_GROUP,
          'primary-light',
        );
      }
    }
  }
}

export function logRenderPhase(
  startTime: number,
  endTime: number,
  lanes: Lanes,
): void {
  if (supportsUserTiming) {
    const color = includesOnlyHydrationOrOffscreenLanes(lanes)
      ? 'tertiary-dark'
      : 'primary-dark';
    console.timeStamp(
      includesOnlyOffscreenLanes(lanes)
        ? 'Prepared'
        : includesOnlyHydrationLanes(lanes)
          ? 'Hydrated'
          : 'Render',
      startTime,
      endTime,
      currentTrack,
      LANES_TRACK_GROUP,
      color,
    );
  }
}

export function logInterruptedRenderPhase(
  startTime: number,
  endTime: number,
  lanes: Lanes,
): void {
  if (supportsUserTiming) {
    const color = includesOnlyHydrationOrOffscreenLanes(lanes)
      ? 'tertiary-dark'
      : 'primary-dark';
    console.timeStamp(
      includesOnlyOffscreenLanes(lanes)
        ? 'Prewarm'
        : includesOnlyHydrationLanes(lanes)
          ? 'Interrupted Hydration'
          : 'Interrupted Render',
      startTime,
      endTime,
      currentTrack,
      LANES_TRACK_GROUP,
      color,
    );
  }
}

export function logSuspendedRenderPhase(
  startTime: number,
  endTime: number,
  lanes: Lanes,
): void {
  if (supportsUserTiming) {
    const color = includesOnlyHydrationOrOffscreenLanes(lanes)
      ? 'tertiary-dark'
      : 'primary-dark';
    console.timeStamp(
      'Prewarm',
      startTime,
      endTime,
      currentTrack,
      LANES_TRACK_GROUP,
      color,
    );
  }
}

export function logSuspendedWithDelayPhase(
  startTime: number,
  endTime: number,
  lanes: Lanes,
): void {
  // This means the render was suspended and cannot commit until it gets unblocked.
  if (supportsUserTiming) {
    const color = includesOnlyHydrationOrOffscreenLanes(lanes)
      ? 'tertiary-dark'
      : 'primary-dark';
    console.timeStamp(
      'Suspended',
      startTime,
      endTime,
      currentTrack,
      LANES_TRACK_GROUP,
      color,
    );
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
    if (
      __DEV__ &&
      typeof performance !== 'undefined' &&
      // $FlowFixMe[method-unbinding]
      typeof performance.measure === 'function'
    ) {
      const properties = [];
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
      performance.measure('Recovered', {
        start: startTime,
        end: endTime,
        detail: {
          devtools: {
            color: 'primary-dark',
            track: currentTrack,
            trackGroup: LANES_TRACK_GROUP,
            tooltipText: hydrationFailed
              ? 'Hydration Failed'
              : 'Recovered after Error',
            properties,
          },
        },
      });
    } else {
      console.timeStamp(
        'Recovered',
        startTime,
        endTime,
        currentTrack,
        LANES_TRACK_GROUP,
        'error',
      );
    }
  }
}

export function logErroredRenderPhase(
  startTime: number,
  endTime: number,
  lanes: Lanes,
): void {
  if (supportsUserTiming) {
    console.timeStamp(
      'Errored',
      startTime,
      endTime,
      currentTrack,
      LANES_TRACK_GROUP,
      'error',
    );
  }
}

export function logInconsistentRender(
  startTime: number,
  endTime: number,
): void {
  if (supportsUserTiming) {
    console.timeStamp(
      'Teared Render',
      startTime,
      endTime,
      currentTrack,
      LANES_TRACK_GROUP,
      'error',
    );
  }
}

export function logSuspenseThrottlePhase(
  startTime: number,
  endTime: number,
): void {
  // This was inside a throttled Suspense boundary commit.
  if (supportsUserTiming) {
    console.timeStamp(
      'Throttled',
      startTime,
      endTime,
      currentTrack,
      LANES_TRACK_GROUP,
      'secondary-light',
    );
  }
}

export function logSuspendedCommitPhase(
  startTime: number,
  endTime: number,
): void {
  // This means the commit was suspended on CSS or images.
  if (supportsUserTiming) {
    // TODO: Include the exact reason and URLs of what resources suspended.
    // TODO: This might also be Suspended while waiting on a View Transition.
    console.timeStamp(
      'Suspended on CSS or Images',
      startTime,
      endTime,
      currentTrack,
      LANES_TRACK_GROUP,
      'secondary-light',
    );
  }
}

export function logCommitErrored(
  startTime: number,
  endTime: number,
  errors: Array<CapturedValue<mixed>>,
  passive: boolean,
): void {
  if (supportsUserTiming) {
    if (
      __DEV__ &&
      typeof performance !== 'undefined' &&
      // $FlowFixMe[method-unbinding]
      typeof performance.measure === 'function'
    ) {
      const properties = [];
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
      performance.measure('Errored', {
        start: startTime,
        end: endTime,
        detail: {
          devtools: {
            color: 'error',
            track: currentTrack,
            trackGroup: LANES_TRACK_GROUP,
            tooltipText: passive
              ? 'Remaining Effects Errored'
              : 'Commit Errored',
            properties,
          },
        },
      });
    } else {
      console.timeStamp(
        'Errored',
        startTime,
        endTime,
        currentTrack,
        LANES_TRACK_GROUP,
        'error',
      );
    }
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
    reusableLaneOptions.start = startTime;
    reusableLaneOptions.end = endTime;
    console.timeStamp(
      'Commit',
      startTime,
      endTime,
      currentTrack,
      LANES_TRACK_GROUP,
      'secondary-dark',
    );
  }
}

export function logPaintYieldPhase(
  startTime: number,
  endTime: number,
  delayedUntilPaint: boolean,
): void {
  if (supportsUserTiming) {
    console.timeStamp(
      delayedUntilPaint ? 'Waiting for Paint' : '',
      startTime,
      endTime,
      currentTrack,
      LANES_TRACK_GROUP,
      'secondary-light',
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
    console.timeStamp(
      'Remaining Effects',
      startTime,
      endTime,
      currentTrack,
      LANES_TRACK_GROUP,
      'secondary-dark',
    );
  }
}
