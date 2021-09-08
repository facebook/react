/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

import {__PERFORMANCE_PROFILE__} from './constants';

const supportsUserTiming =
  typeof performance !== 'undefined' &&
  typeof performance.mark === 'function' &&
  typeof performance.clearMarks === 'function';

const supportsPerformanceNow =
  typeof performance !== 'undefined' && typeof performance.now === 'function';

function mark(markName: string): void {
  if (supportsUserTiming) {
    performance.mark(markName + '-start');
  }
}

function measure(markName: string): void {
  if (supportsUserTiming) {
    performance.mark(markName + '-end');
    performance.measure(markName, markName + '-start', markName + '-end');
  }
}

function now(): number {
  if (supportsPerformanceNow) {
    return performance.now();
  }
  return Date.now();
}

export async function withAsyncPerformanceMark<TReturn>(
  markName: string,
  callback: () => Promise<TReturn>,
): Promise<TReturn> {
  if (__PERFORMANCE_PROFILE__) {
    mark(markName);
    const result = await callback();
    measure(markName);
    return result;
  }
  return callback();
}

export function withSyncPerformanceMark<TReturn>(
  markName: string,
  callback: () => TReturn,
): TReturn {
  if (__PERFORMANCE_PROFILE__) {
    mark(markName);
    const result = callback();
    measure(markName);
    return result;
  }
  return callback();
}

export function withCallbackPerformanceMark<TReturn>(
  markName: string,
  callback: (done: () => void) => TReturn,
): TReturn {
  if (__PERFORMANCE_PROFILE__) {
    mark(markName);
    const done = () => {
      measure(markName);
    };
    return callback(done);
  }
  return callback(() => {});
}

export async function measureAsyncDuration<TReturn>(
  callback: () => Promise<TReturn>,
): Promise<[number, TReturn]> {
  const start = now();
  const result = await callback();
  const duration = now() - start;
  return [duration, result];
}

export function measureSyncDuration<TReturn>(
  callback: () => TReturn,
): [number, TReturn] {
  const start = now();
  const result = callback();
  const duration = now() - start;
  return [duration, result];
}

export function measureCallbackDuration<TReturn>(
  callback: (done: () => number) => TReturn,
): TReturn {
  const start = now();
  const done = () => {
    const duration = now() - start;
    return duration;
  };
  return callback(done);
}
