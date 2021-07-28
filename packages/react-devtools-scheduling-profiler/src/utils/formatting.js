/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import prettyMilliseconds from 'pretty-ms';

export function formatTimestamp(ms: number) {
  return (
    ms.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + 'ms'
  );
}

export function formatDuration(ms: number) {
  return prettyMilliseconds(ms, {millisecondsDecimalDigits: 1});
}

export function trimString(string: string, length: number): string {
  if (string.length > length) {
    return `${string.substr(0, length - 1)}…`;
  }
  return string;
}
