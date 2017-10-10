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

import type {PriorityLevel} from 'ReactPriorityLevel';
const {
  NoWork: NoWorkPriority,
  SynchronousPriority,
  TaskPriority,
  HighPriority,
  LowPriority,
  OffscreenPriority,
} = require('ReactPriorityLevel');

const invariant = require('fbjs/lib/invariant');

// TODO: Use an opaque type once ESLint et al support the syntax
export type ExpirationTime = number;

const NoWork = 0;
const Sync = 1;
const Task = 2;
const Never = 2147483647; // Max int32: Math.pow(2, 31) - 1

const UNIT_SIZE = 10;
const MAGIC_NUMBER_OFFSET = 3;

exports.NoWork = NoWork;
exports.Never = Never;

// 1 unit of expiration time represents 10ms.
function msToExpirationTime(ms: number): ExpirationTime {
  // Always add an offset so that we don't clash with the magic number for NoWork.
  return ((ms / UNIT_SIZE) | 0) + MAGIC_NUMBER_OFFSET;
}
exports.msToExpirationTime = msToExpirationTime;

function ceiling(num: number, precision: number): number {
  return (((((num * precision) | 0) + 1) / precision) | 0) + 1;
}

function bucket(
  currentTime: ExpirationTime,
  expirationInMs: number,
  precisionInMs: number,
): ExpirationTime {
  return ceiling(
    currentTime + expirationInMs / UNIT_SIZE,
    precisionInMs / UNIT_SIZE,
  );
}

// Given the current clock time and a priority level, returns an expiration time
// that represents a point in the future by which some work should complete.
// The lower the priority, the further out the expiration time. We use rounding
// to batch like updates together. The further out the expiration time, the
// more we want to batch, so we use a larger precision when rounding.
function priorityToExpirationTime(
  currentTime: ExpirationTime,
  priorityLevel: PriorityLevel,
): ExpirationTime {
  switch (priorityLevel) {
    case NoWork:
      return NoWorkPriority;
    case SynchronousPriority:
      return Sync;
    case TaskPriority:
      return Task;
    case HighPriority: {
      // Should complete within ~100ms. 120ms max.
      return bucket(currentTime, 100, 20);
    }
    case LowPriority: {
      // Should complete within ~1000ms. 1200ms max.
      return bucket(currentTime, 1000, 200);
    }
    case OffscreenPriority:
      return Never;
    default:
      invariant(
        false,
        'Switch statement should be exhuastive. ' +
          'This error is likely caused by a bug in React. Please file an issue.',
      );
  }
}
exports.priorityToExpirationTime = priorityToExpirationTime;

// Given the current clock time and an expiration time, returns the
// corresponding priority level. The more time has advanced, the higher the
// priority level.
function expirationTimeToPriorityLevel(
  currentTime: ExpirationTime,
  expirationTime: ExpirationTime,
): PriorityLevel {
  // First check for magic values
  switch (expirationTime) {
    case NoWorkPriority:
      return NoWork;
    case Sync:
      return SynchronousPriority;
    case Task:
      return TaskPriority;
    case Never:
      return OffscreenPriority;
    default:
      break;
  }
  if (expirationTime <= currentTime) {
    return TaskPriority;
  }
  // TODO: We don't currently distinguish between high and low priority.
  return LowPriority;
}
exports.expirationTimeToPriorityLevel = expirationTimeToPriorityLevel;
