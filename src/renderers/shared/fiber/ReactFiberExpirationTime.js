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
const Sync = 1;
const Task = 2;
const Never = Number.MAX_SAFE_INTEGER;

const UNIT_SIZE = 10;
const MAGIC_NUMBER_OFFSET = 10;

exports.Done = Done;
exports.Never = Never;

// 1 unit of expiration time represents 10ms.
function msToExpirationTime(ms: number): ExpirationTime {
  // Always add an offset so that we don't clash with the magic number for Done.
  return Math.round(ms / UNIT_SIZE) + MAGIC_NUMBER_OFFSET;
}
exports.msToExpirationTime = msToExpirationTime;

function ceiling(num: number, precision: number): number {
  return Math.ceil(Math.ceil(num * precision) / precision);
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
      return Done;
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
    case Done:
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
