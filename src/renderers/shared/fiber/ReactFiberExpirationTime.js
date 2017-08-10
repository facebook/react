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
  NoWork,
  SynchronousPriority,
  TaskPriority,
  HighPriority,
  LowPriority,
  OffscreenPriority,
} = require('ReactPriorityLevel');

const invariant = require('fbjs/lib/invariant');

// TODO: Use an opaque type once ESLint et al support the syntax
export type ExpirationTime = number;

const Done = 0;
exports.Done = Done;

const MAGIC_NUMBER_OFFSET = 2;

const Never = Number.MAX_SAFE_INTEGER;
exports.Never = Never;

// 1 unit of expiration time represents 10ms.
function msToExpirationTime(ms: number): ExpirationTime {
  // Always add an offset so that we don't clash with the magic number for Done.
  return Math.round(ms / 10) + MAGIC_NUMBER_OFFSET;
}
exports.msToExpirationTime = msToExpirationTime;

function ceiling(time: ExpirationTime, precision: number): ExpirationTime {
  return Math.ceil(Math.ceil(time * precision) / precision);
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
      return Done;
    case SynchronousPriority:
      // Return a number lower than the current time, but higher than Done.
      return MAGIC_NUMBER_OFFSET - 1;
    case TaskPriority:
      // Return the current time, so that this work completes in this batch.
      return currentTime;
    case HighPriority:
      // Should complete within ~100ms. 120ms max.
      return msToExpirationTime(ceiling(100, 20));
    case LowPriority:
      // Should complete within ~1000ms. 1200ms max.
      return msToExpirationTime(ceiling(1000, 200));
    case OffscreenPriority:
      return Never;
    default:
      console.log(priorityLevel);
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
  if (expirationTime === Done) {
    return NoWork;
  }
  if (expirationTime === Never) {
    return OffscreenPriority;
  }
  if (expirationTime < currentTime) {
    return SynchronousPriority;
  }
  if (expirationTime === currentTime) {
    return TaskPriority;
  }
  // TODO: We don't currently distinguish between high and low priority.
  return LowPriority;
}
exports.expirationTimeToPriorityLevel = expirationTimeToPriorityLevel;

function earlierExpirationTime(
  t1: ExpirationTime,
  t2: ExpirationTime,
): ExpirationTime {
  return t1 !== Done && (t2 === Done || t2 > t1) ? t1 : t2;
}
exports.earlierExpirationTime = earlierExpirationTime;
