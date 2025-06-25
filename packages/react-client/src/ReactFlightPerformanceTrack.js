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

import {OMITTED_PROP_ERROR} from './ReactFlightPropertyAccess';

import hasOwnProperty from 'shared/hasOwnProperty';
import isArray from 'shared/isArray';

const supportsUserTiming =
  enableProfilerTimer &&
  typeof console !== 'undefined' &&
  typeof console.timeStamp === 'function' &&
  typeof performance !== 'undefined' &&
  // $FlowFixMe[method-unbinding]
  typeof performance.measure === 'function';

const IO_TRACK = 'Server Requests ⚛';
const COMPONENTS_TRACK = 'Server Components ⚛';

const EMPTY_ARRAY = 0;
const COMPLEX_ARRAY = 1;
const PRIMITIVE_ARRAY = 2; // Primitive values only
const ENTRIES_ARRAY = 3; // Tuple arrays of string and value (like Headers, Map, etc)
function getArrayKind(array: Object): 0 | 1 | 2 | 3 {
  let kind = EMPTY_ARRAY;
  for (let i = 0; i < array.length; i++) {
    const value = array[i];
    if (typeof value === 'object' && value !== null) {
      if (
        isArray(value) &&
        value.length === 2 &&
        typeof value[0] === 'string'
      ) {
        // Key value tuple
        if (kind !== EMPTY_ARRAY && kind !== ENTRIES_ARRAY) {
          return COMPLEX_ARRAY;
        }
        kind = ENTRIES_ARRAY;
      } else {
        return COMPLEX_ARRAY;
      }
    } else if (typeof value === 'function') {
      return COMPLEX_ARRAY;
    } else if (typeof value === 'string' && value.length > 50) {
      return COMPLEX_ARRAY;
    } else if (kind !== EMPTY_ARRAY && kind !== PRIMITIVE_ARRAY) {
      return COMPLEX_ARRAY;
    } else {
      kind = PRIMITIVE_ARRAY;
    }
  }
  return kind;
}

function addObjectToProperties(
  object: Object,
  properties: Array<[string, string]>,
  indent: number,
): void {
  for (const key in object) {
    if (hasOwnProperty.call(object, key) && key[0] !== '_') {
      const value = object[key];
      addValueToProperties(key, value, properties, indent);
    }
  }
}

function addValueToProperties(
  propertyName: string,
  value: mixed,
  properties: Array<[string, string]>,
  indent: number,
): void {
  let desc;
  switch (typeof value) {
    case 'object':
      if (value === null) {
        desc = 'null';
        break;
      } else {
        // $FlowFixMe[method-unbinding]
        const objectToString = Object.prototype.toString.call(value);
        let objectName = objectToString.slice(8, objectToString.length - 1);
        if (objectName === 'Array') {
          const array: Array<any> = (value: any);
          const kind = getArrayKind(array);
          if (kind === PRIMITIVE_ARRAY || kind === EMPTY_ARRAY) {
            desc = JSON.stringify(array);
            break;
          } else if (kind === ENTRIES_ARRAY) {
            properties.push(['\xa0\xa0'.repeat(indent) + propertyName, '']);
            for (let i = 0; i < array.length; i++) {
              const entry = array[i];
              addValueToProperties(entry[0], entry[1], properties, indent + 1);
            }
            return;
          }
        }
        if (objectName === 'Object') {
          const proto: any = Object.getPrototypeOf(value);
          if (proto && typeof proto.constructor === 'function') {
            objectName = proto.constructor.name;
          }
        }
        properties.push([
          '\xa0\xa0'.repeat(indent) + propertyName,
          objectName === 'Object' ? '' : objectName,
        ]);
        if (indent < 3) {
          addObjectToProperties(value, properties, indent + 1);
        }
        return;
      }
    case 'function':
      if (value.name === '') {
        desc = '() => {}';
      } else {
        desc = value.name + '() {}';
      }
      break;
    case 'string':
      if (value === OMITTED_PROP_ERROR) {
        desc = '...';
      } else {
        desc = JSON.stringify(value);
      }
      break;
    case 'undefined':
      desc = 'undefined';
      break;
    case 'boolean':
      desc = value ? 'true' : 'false';
      break;
    default:
      // eslint-disable-next-line react-internal/safe-string-coercion
      desc = String(value);
  }
  properties.push(['\xa0\xa0'.repeat(indent) + propertyName, desc]);
}

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

export function logComponentAwaitAborted(
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
    const entryName =
      'await ' +
      (isPrimaryEnv || env === undefined ? name : name + ' [' + env + ']');
    const debugTask = asyncInfo.debugTask || asyncInfo.awaited.debugTask;
    if (__DEV__ && debugTask) {
      const properties = [
        ['Aborted', 'The stream was aborted before this Promise resolved.'],
      ];
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
              tooltipText: entryName + ' Aborted',
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
    const env = asyncInfo.env;
    const name = asyncInfo.awaited.name;
    const isPrimaryEnv = env === rootEnv;
    const entryName =
      'await ' +
      (isPrimaryEnv || env === undefined ? name : name + ' [' + env + ']');
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
              tooltipText: entryName + ' Rejected',
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
    const env = asyncInfo.env;
    const name = asyncInfo.awaited.name;
    const isPrimaryEnv = env === rootEnv;
    const color = getIOColor(name);
    const entryName =
      'await ' +
      (isPrimaryEnv || env === undefined ? name : name + ' [' + env + ']');
    const debugTask = asyncInfo.debugTask || asyncInfo.awaited.debugTask;
    if (__DEV__ && debugTask) {
      const properties: Array<[string, string]> = [];
      if (typeof value === 'object' && value !== null) {
        addObjectToProperties(value, properties, 0);
      } else if (value !== undefined) {
        addValueToProperties('Resolved', value, properties, 0);
      }
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
    const name = ioInfo.name;
    const env = ioInfo.env;
    const isPrimaryEnv = env === rootEnv;
    const entryName =
      isPrimaryEnv || env === undefined ? name : name + ' [' + env + ']';
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
              tooltipText: entryName + ' Rejected',
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
    const name = ioInfo.name;
    const env = ioInfo.env;
    const isPrimaryEnv = env === rootEnv;
    const entryName =
      isPrimaryEnv || env === undefined ? name : name + ' [' + env + ']';
    const debugTask = ioInfo.debugTask;
    const color = getIOColor(name);
    if (__DEV__ && debugTask) {
      const properties: Array<[string, string]> = [];
      if (typeof value === 'object' && value !== null) {
        addObjectToProperties(value, properties, 0);
      } else if (value !== undefined) {
        addValueToProperties('Resolved', value, properties, 0);
      }
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
