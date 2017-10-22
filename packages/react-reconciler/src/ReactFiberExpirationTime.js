/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactFiberExpirationTime
 * @flow
 */

'use strict';

// TODO: Use an opaque type once ESLint et al support the syntax
export type ExpirationTime = number;

const NoWork = 0;
const Sync = 1;
const Task = 2;
const Never = 2147483647; // Max int32: Math.pow(2, 31) - 1

const UNIT_SIZE = 10;
const MAGIC_NUMBER_OFFSET = 3;

exports.Sync = Sync;
exports.Task = Task;
exports.NoWork = NoWork;
exports.Never = Never;

// 1 unit of expiration time represents 10ms.
function msToExpirationTime(ms: number): ExpirationTime {
  // Always add an offset so that we don't clash with the magic number for NoWork.
  return ((ms / UNIT_SIZE) | 0) + MAGIC_NUMBER_OFFSET;
}
exports.msToExpirationTime = msToExpirationTime;

function ceiling(num: number, precision: number): number {
  return (((num / precision) | 0) + 1) * precision;
}

function computeExpirationBucket(
  currentTime: ExpirationTime,
  expirationInMs: number,
  bucketSizeMs: number,
): ExpirationTime {
  return ceiling(
    currentTime + expirationInMs / UNIT_SIZE,
    bucketSizeMs / UNIT_SIZE,
  );
}
exports.computeExpirationBucket = computeExpirationBucket;
