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

import {
  addValueToProperties,
  addObjectToProperties,
} from 'shared/ReactPerformanceTrackProperties';

const supportsUserTiming =
  enableProfilerTimer &&
  typeof console !== 'undefined' &&
  typeof console.timeStamp === 'function' &&
  typeof performance !== 'undefined' &&
  // $FlowFixMe[method-unbinding]
  typeof performance.measure === 'function';

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
      const properties: Array<[string, string]> = [];
      if (componentInfo.key != null) {
        addValueToProperties('key', componentInfo.key, properties, 0, '');
      }
      if (componentInfo.props != null) {
        addObjectToProperties(componentInfo.props, properties, 0, '');
      }
      debugTask.run(
        // $FlowFixMe[method-unbinding]
        performance.measure.bind(performance, entryName, {
          start: startTime < 0 ? 0 : startTime,
          end: childrenEndTime,
          detail: {
            devtools: {
              color: color,
              track: trackNames[trackIdx],
              trackGroup: COMPONENTS_TRACK,
              properties,
            },
          },
        }),
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

export function logComponentAborted(
  componentInfo: ReactComponentInfo,
  trackIdx: number,
  startTime: number,
  endTime: number,
  childrenEndTime: number,
  rootEnv: string,
): void {
  if (supportsUserTiming) {
    const env = componentInfo.env;
    const name = componentInfo.name;
    const isPrimaryEnv = env === rootEnv;
    const entryName =
      isPrimaryEnv || env === undefined ? name : name + ' [' + env + ']';
    if (__DEV__) {
      const properties = [
        [
          'Aborted',
          'The stream was aborted before this Component finished rendering.',
        ],
      ];
      if (componentInfo.key != null) {
        addValueToProperties('key', componentInfo.key, properties, 0, '');
      }
      if (componentInfo.props != null) {
        addObjectToProperties(componentInfo.props, properties, 0, '');
      }
      performance.measure(entryName, {
        start: startTime < 0 ? 0 : startTime,
        end: childrenEndTime,
        detail: {
          devtools: {
            color: 'warning',
            track: trackNames[trackIdx],
            trackGroup: COMPONENTS_TRACK,
            tooltipText: entryName + ' Aborted',
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
        'warning',
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
    if (__DEV__) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        typeof error.message === 'string'
          ? // eslint-disable-next-line react-internal/safe-string-coercion
            String(error.message)
          : // eslint-disable-next-line react-internal/safe-string-coercion
            String(error);
      const properties = [['Error', message]];
      if (componentInfo.key != null) {
        addValueToProperties('key', componentInfo.key, properties, 0, '');
      }
      if (componentInfo.props != null) {
        addObjectToProperties(componentInfo.props, properties, 0, '');
      }
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

function getIODescription(value: any): string {
  if (!__DEV__) {
    return '';
  }
  try {
    switch (typeof value) {
      case 'object':
        // Test the object for a bunch of common property names that are useful identifiers.
        // While we only have the return value here, it should ideally be a name that
        // describes the arguments requested.
        if (value === null) {
          return '';
        } else if (value instanceof Error) {
          // eslint-disable-next-line react-internal/safe-string-coercion
          return String(value.message);
        } else if (typeof value.url === 'string') {
          return value.url;
        } else if (typeof value.command === 'string') {
          return value.command;
        } else if (
          typeof value.request === 'object' &&
          typeof value.request.url === 'string'
        ) {
          return value.request.url;
        } else if (
          typeof value.response === 'object' &&
          typeof value.response.url === 'string'
        ) {
          return value.response.url;
        } else if (
          typeof value.id === 'string' ||
          typeof value.id === 'number' ||
          typeof value.id === 'bigint'
        ) {
          // eslint-disable-next-line react-internal/safe-string-coercion
          return String(value.id);
        } else if (typeof value.name === 'string') {
          return value.name;
        } else {
          const str = value.toString();
          if (str.startWith('[object ') || str.length < 5 || str.length > 500) {
            // This is probably not a useful description.
            return '';
          }
          return str;
        }
      case 'string':
        if (value.length < 5 || value.length > 500) {
          return '';
        }
        return value;
      case 'number':
      case 'bigint':
        // eslint-disable-next-line react-internal/safe-string-coercion
        return String(value);
      default:
        // Not useful descriptors.
        return '';
    }
  } catch (x) {
    return '';
  }
}

function getIOLongName(
  ioInfo: ReactIOInfo,
  description: string,
  env: void | string,
  rootEnv: string,
): string {
  const name = ioInfo.name;
  const longName = description === '' ? name : name + ' (' + description + ')';
  const isPrimaryEnv = env === rootEnv;
  return isPrimaryEnv || env === undefined
    ? longName
    : longName + ' [' + env + ']';
}

function getIOShortName(
  ioInfo: ReactIOInfo,
  description: string,
  env: void | string,
  rootEnv: string,
): string {
  const name = ioInfo.name;
  const isPrimaryEnv = env === rootEnv;
  const envSuffix = isPrimaryEnv || env === undefined ? '' : ' [' + env + ']';
  let desc = '';
  const descMaxLength = 30 - name.length - envSuffix.length;
  if (descMaxLength > 1) {
    const l = description.length;
    if (l > 0 && l <= descMaxLength) {
      // We can fit the full description
      desc = ' (' + description + ')';
    } else if (
      description.startsWith('http://') ||
      description.startsWith('https://') ||
      description.startsWith('/')
    ) {
      // Looks like a URL. Let's see if we can extract something shorter.
      // We don't have to do a full parse so let's try something cheaper.
      let queryIdx = description.indexOf('?');
      if (queryIdx === -1) {
        queryIdx = description.length;
      }
      if (description.charCodeAt(queryIdx - 1) === 47 /* "/" */) {
        // Ends with slash. Look before that.
        queryIdx--;
      }
      const slashIdx = description.lastIndexOf('/', queryIdx - 1);
      if (queryIdx - slashIdx < descMaxLength) {
        // This may now be either the file name or the host.
        desc = ' (' + description.slice(slashIdx + 1, queryIdx) + ')';
      }
    }
  }
  return name + desc + envSuffix;
}

export function logComponentAwaitAborted(
  asyncInfo: ReactAsyncInfo,
  trackIdx: number,
  startTime: number,
  endTime: number,
  rootEnv: string,
): void {
  if (supportsUserTiming && endTime > 0) {
    const entryName =
      'await ' + getIOShortName(asyncInfo.awaited, '', asyncInfo.env, rootEnv);
    const debugTask = asyncInfo.debugTask || asyncInfo.awaited.debugTask;
    if (__DEV__ && debugTask) {
      const properties = [
        ['Aborted', 'The stream was aborted before this Promise resolved.'],
      ];
      const tooltipText =
        getIOLongName(asyncInfo.awaited, '', asyncInfo.env, rootEnv) +
        ' Aborted';
      debugTask.run(
        // $FlowFixMe[method-unbinding]
        performance.measure.bind(performance, entryName, {
          start: startTime < 0 ? 0 : startTime,
          end: endTime,
          detail: {
            devtools: {
              color: 'warning',
              track: trackNames[trackIdx],
              trackGroup: COMPONENTS_TRACK,
              properties,
              tooltipText,
            },
          },
        }),
      );
    } else {
      console.timeStamp(
        entryName,
        startTime < 0 ? 0 : startTime,
        endTime,
        trackNames[trackIdx],
        COMPONENTS_TRACK,
        'warning',
      );
    }
  }
}

export function logComponentAwaitErrored(
  asyncInfo: ReactAsyncInfo,
  trackIdx: number,
  startTime: number,
  endTime: number,
  rootEnv: string,
  error: mixed,
): void {
  if (supportsUserTiming && endTime > 0) {
    const description = getIODescription(error);
    const entryName =
      'await ' +
      getIOShortName(asyncInfo.awaited, description, asyncInfo.env, rootEnv);
    const debugTask = asyncInfo.debugTask || asyncInfo.awaited.debugTask;
    if (__DEV__ && debugTask) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        typeof error.message === 'string'
          ? // eslint-disable-next-line react-internal/safe-string-coercion
            String(error.message)
          : // eslint-disable-next-line react-internal/safe-string-coercion
            String(error);
      const properties = [['Rejected', message]];
      const tooltipText =
        getIOLongName(asyncInfo.awaited, description, asyncInfo.env, rootEnv) +
        ' Rejected';
      debugTask.run(
        // $FlowFixMe[method-unbinding]
        performance.measure.bind(performance, entryName, {
          start: startTime < 0 ? 0 : startTime,
          end: endTime,
          detail: {
            devtools: {
              color: 'error',
              track: trackNames[trackIdx],
              trackGroup: COMPONENTS_TRACK,
              properties,
              tooltipText,
            },
          },
        }),
      );
    } else {
      console.timeStamp(
        entryName,
        startTime < 0 ? 0 : startTime,
        endTime,
        trackNames[trackIdx],
        COMPONENTS_TRACK,
        'error',
      );
    }
  }
}

export function logComponentAwait(
  asyncInfo: ReactAsyncInfo,
  trackIdx: number,
  startTime: number,
  endTime: number,
  rootEnv: string,
  value: mixed,
): void {
  if (supportsUserTiming && endTime > 0) {
    const description = getIODescription(value);
    const name = getIOShortName(
      asyncInfo.awaited,
      description,
      asyncInfo.env,
      rootEnv,
    );
    const entryName = 'await ' + name;
    const color = getIOColor(name);
    const debugTask = asyncInfo.debugTask || asyncInfo.awaited.debugTask;
    if (__DEV__ && debugTask) {
      const properties: Array<[string, string]> = [];
      if (typeof value === 'object' && value !== null) {
        addObjectToProperties(value, properties, 0, '');
      } else if (value !== undefined) {
        addValueToProperties('Resolved', value, properties, 0, '');
      }
      const tooltipText = getIOLongName(
        asyncInfo.awaited,
        description,
        asyncInfo.env,
        rootEnv,
      );
      debugTask.run(
        // $FlowFixMe[method-unbinding]
        performance.measure.bind(performance, entryName, {
          start: startTime < 0 ? 0 : startTime,
          end: endTime,
          detail: {
            devtools: {
              color: color,
              track: trackNames[trackIdx],
              trackGroup: COMPONENTS_TRACK,
              properties,
              tooltipText,
            },
          },
        }),
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

export function logIOInfoErrored(
  ioInfo: ReactIOInfo,
  rootEnv: string,
  error: mixed,
): void {
  const startTime = ioInfo.start;
  const endTime = ioInfo.end;
  if (supportsUserTiming && endTime >= 0) {
    const description = getIODescription(error);
    const entryName = getIOShortName(ioInfo, description, ioInfo.env, rootEnv);
    const debugTask = ioInfo.debugTask;
    if (__DEV__ && debugTask) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        typeof error.message === 'string'
          ? // eslint-disable-next-line react-internal/safe-string-coercion
            String(error.message)
          : // eslint-disable-next-line react-internal/safe-string-coercion
            String(error);
      const properties = [['Rejected', message]];
      const tooltipText =
        getIOLongName(ioInfo, description, ioInfo.env, rootEnv) + ' Rejected';
      debugTask.run(
        // $FlowFixMe[method-unbinding]
        performance.measure.bind(performance, entryName, {
          start: startTime < 0 ? 0 : startTime,
          end: endTime,
          detail: {
            devtools: {
              color: 'error',
              track: IO_TRACK,
              properties,
              tooltipText,
            },
          },
        }),
      );
    } else {
      console.timeStamp(
        entryName,
        startTime < 0 ? 0 : startTime,
        endTime,
        IO_TRACK,
        undefined,
        'error',
      );
    }
  }
}

export function logIOInfo(
  ioInfo: ReactIOInfo,
  rootEnv: string,
  value: mixed,
): void {
  const startTime = ioInfo.start;
  const endTime = ioInfo.end;
  if (supportsUserTiming && endTime >= 0) {
    const description = getIODescription(value);
    const entryName = getIOShortName(ioInfo, description, ioInfo.env, rootEnv);
    const color = getIOColor(entryName);
    const debugTask = ioInfo.debugTask;
    if (__DEV__ && debugTask) {
      const properties: Array<[string, string]> = [];
      if (typeof value === 'object' && value !== null) {
        addObjectToProperties(value, properties, 0, '');
      } else if (value !== undefined) {
        addValueToProperties('Resolved', value, properties, 0, '');
      }
      const tooltipText = getIOLongName(
        ioInfo,
        description,
        ioInfo.env,
        rootEnv,
      );
      debugTask.run(
        // $FlowFixMe[method-unbinding]
        performance.measure.bind(performance, entryName, {
          start: startTime < 0 ? 0 : startTime,
          end: endTime,
          detail: {
            devtools: {
              color: color,
              track: IO_TRACK,
              properties,
              tooltipText,
            },
          },
        }),
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
