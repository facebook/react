/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable react-internal/no-production-logging */

import type {
  ReactComponentInfo,
  ReactIOInfo,
  ReactAsyncInfo,
} from 'shared/ReactTypes';

import {enableProfilerTimer} from 'shared/ReactFeatureFlags';

const supportsUserTiming =
  enableProfilerTimer &&
  typeof console !== 'undefined' &&
  typeof console.timeStamp === 'function';

const IO_TRACK = 'Server Requests ⚛';
const COMPONENTS_TRACK = 'Server Components ⚛';

export function markAllTracksInOrder() {
  if (supportsUserTiming) {
    // Ensure we create the Server Component track groups earlier than the Client Scheduler
    // and Client Components. We can always add the 0 time slot even if it's in the past.
    // That's still considered for ordering.
    console.timeStamp(
      'Server Requests Track',
      0.001,
      0.001,
      IO_TRACK,
      undefined,
      'primary-light',
    );
    console.timeStamp(
      'Server Components Track',
      0.001,
      0.001,
      'Primary',
      COMPONENTS_TRACK,
      'primary-light',
    );
  }
}

const trackNames = [
  'Primary',
  'Parallel',
  'Parallel\u200b', // Padded with zero-width space to give each track a unique name.
  'Parallel\u200b\u200b',
  'Parallel\u200b\u200b\u200b',
  'Parallel\u200b\u200b\u200b\u200b',
  'Parallel\u200b\u200b\u200b\u200b\u200b',
  'Parallel\u200b\u200b\u200b\u200b\u200b\u200b',
  'Parallel\u200b\u200b\u200b\u200b\u200b\u200b\u200b',
  'Parallel\u200b\u200b\u200b\u200b\u200b\u200b\u200b\u200b',
];

export function logComponentRender(
  componentInfo: ReactComponentInfo,
  trackIdx: number,
  startTime: number,
  endTime: number,
  childrenEndTime: number,
  rootEnv: string,
): void {
  if (supportsUserTiming && childrenEndTime >= 0 && trackIdx < 10) {
    const env = componentInfo.env;
    const name = componentInfo.name;
    const isPrimaryEnv = env === rootEnv;
    const selfTime = endTime - startTime;
    const color =
      selfTime < 0.5
        ? isPrimaryEnv
          ? 'primary-light'
          : 'secondary-light'
        : selfTime < 50
          ? isPrimaryEnv
            ? 'primary'
            : 'secondary'
          : selfTime < 500
            ? isPrimaryEnv
              ? 'primary-dark'
              : 'secondary-dark'
            : 'error';
    const entryName =
      isPrimaryEnv || env === undefined ? name : name + ' [' + env + ']';
    const debugTask = componentInfo.debugTask;
    if (__DEV__ && debugTask) {
      debugTask.run(
        // $FlowFixMe[method-unbinding]
        console.timeStamp.bind(
          console,
          entryName,
          startTime < 0 ? 0 : startTime,
          childrenEndTime,
          trackNames[trackIdx],
          COMPONENTS_TRACK,
          color,
        ),
      );
    } else {
      console.timeStamp(
        entryName,
        startTime < 0 ? 0 : startTime,
        childrenEndTime,
        trackNames[trackIdx],
        COMPONENTS_TRACK,
        color,
      );
    }
  }
}

export function logComponentErrored(
  componentInfo: ReactComponentInfo,
  trackIdx: number,
  startTime: number,
  endTime: number,
  childrenEndTime: number,
  rootEnv: string,
  error: mixed,
): void {
  if (supportsUserTiming) {
    const env = componentInfo.env;
    const name = componentInfo.name;
    const isPrimaryEnv = env === rootEnv;
    const entryName =
      isPrimaryEnv || env === undefined ? name : name + ' [' + env + ']';
    if (
      __DEV__ &&
      typeof performance !== 'undefined' &&
      // $FlowFixMe[method-unbinding]
      typeof performance.measure === 'function'
    ) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        typeof error.message === 'string'
          ? // eslint-disable-next-line react-internal/safe-string-coercion
            String(error.message)
          : // eslint-disable-next-line react-internal/safe-string-coercion
            String(error);
      const properties = [['Error', message]];
      performance.measure(entryName, {
        start: startTime < 0 ? 0 : startTime,
        end: childrenEndTime,
        detail: {
          devtools: {
            color: 'error',
            track: trackNames[trackIdx],
            trackGroup: COMPONENTS_TRACK,
            tooltipText: entryName + ' Errored',
            properties,
          },
        },
      });
    } else {
      console.timeStamp(
        entryName,
        startTime < 0 ? 0 : startTime,
        childrenEndTime,
        trackNames[trackIdx],
        COMPONENTS_TRACK,
        'error',
      );
    }
  }
}

export function logDedupedComponentRender(
  componentInfo: ReactComponentInfo,
  trackIdx: number,
  startTime: number,
  endTime: number,
  rootEnv: string,
): void {
  if (supportsUserTiming && endTime >= 0 && trackIdx < 10) {
    const env = componentInfo.env;
    const name = componentInfo.name;
    const isPrimaryEnv = env === rootEnv;
    const color = isPrimaryEnv ? 'primary-light' : 'secondary-light';
    const entryName = name + ' [deduped]';
    const debugTask = componentInfo.debugTask;
    if (__DEV__ && debugTask) {
      debugTask.run(
        // $FlowFixMe[method-unbinding]
        console.timeStamp.bind(
          console,
          entryName,
          startTime < 0 ? 0 : startTime,
          endTime,
          trackNames[trackIdx],
          COMPONENTS_TRACK,
          color,
        ),
      );
    } else {
      console.timeStamp(
        entryName,
        startTime < 0 ? 0 : startTime,
        endTime,
        trackNames[trackIdx],
        COMPONENTS_TRACK,
        color,
      );
    }
  }
}

function getIOColor(
  functionName: string,
): 'tertiary-light' | 'tertiary' | 'tertiary-dark' {
  // Add some color variation to be able to distinguish various sources.
  switch (functionName.charCodeAt(0) % 3) {
    case 0:
      return 'tertiary-light';
    case 1:
      return 'tertiary';
    default:
      return 'tertiary-dark';
  }
}

export function logComponentAwait(
  asyncInfo: ReactAsyncInfo,
  trackIdx: number,
  startTime: number,
  endTime: number,
  rootEnv: string,
): void {
  if (supportsUserTiming && endTime > 0) {
    const env = asyncInfo.env;
    const name = asyncInfo.awaited.name;
    const isPrimaryEnv = env === rootEnv;
    const color = getIOColor(name);
    const entryName =
      'await ' +
      (isPrimaryEnv || env === undefined ? name : name + ' [' + env + ']');
    const debugTask = asyncInfo.debugTask;
    if (__DEV__ && debugTask) {
      debugTask.run(
        // $FlowFixMe[method-unbinding]
        console.timeStamp.bind(
          console,
          entryName,
          startTime < 0 ? 0 : startTime,
          endTime,
          trackNames[trackIdx],
          COMPONENTS_TRACK,
          color,
        ),
      );
    } else {
      console.timeStamp(
        entryName,
        startTime < 0 ? 0 : startTime,
        endTime,
        trackNames[trackIdx],
        COMPONENTS_TRACK,
        color,
      );
    }
  }
}

export function logIOInfo(ioInfo: ReactIOInfo, rootEnv: string): void {
  const startTime = ioInfo.start;
  const endTime = ioInfo.end;
  if (supportsUserTiming && endTime >= 0) {
    const name = ioInfo.name;
    const env = ioInfo.env;
    const isPrimaryEnv = env === rootEnv;
    const entryName =
      isPrimaryEnv || env === undefined ? name : name + ' [' + env + ']';
    const debugTask = ioInfo.debugTask;
    const color = getIOColor(name);
    if (__DEV__ && debugTask) {
      debugTask.run(
        // $FlowFixMe[method-unbinding]
        console.timeStamp.bind(
          console,
          entryName,
          startTime < 0 ? 0 : startTime,
          endTime,
          IO_TRACK,
          undefined,
          color,
        ),
      );
    } else {
      console.timeStamp(
        entryName,
        startTime < 0 ? 0 : startTime,
        endTime,
        IO_TRACK,
        undefined,
        color,
      );
    }
  }
}
