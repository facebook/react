/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {SchedulingEvent} from '../types';

import prettyMilliseconds from 'pretty-ms';

export function formatTimestamp(ms: number): string {
  return (
    ms.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + 'ms'
  );
}

export function formatDuration(ms: number): string {
  return prettyMilliseconds(ms, {millisecondsDecimalDigits: 1});
}

export function trimString(string: string, length: number): string {
  if (string.length > length) {
    return `${string.slice(0, length - 1)}…`;
  }
  return string;
}

export function getSchedulingEventLabel(event: SchedulingEvent): string | null {
  switch (event.type) {
    case 'schedule-render':
      return 'render scheduled';
    case 'schedule-state-update':
      return 'state update scheduled';
    case 'schedule-force-update':
      return 'force update scheduled';
    default:
      return null;
  }
}
