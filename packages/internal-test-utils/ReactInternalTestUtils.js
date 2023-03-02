/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO: Move `internalAct` and other test helpers to this package, too

import * as SchedulerMock from 'scheduler/unstable_mock';
import {diff} from 'jest-diff';
import {equals} from '@jest/expect-utils';

function assertYieldsWereCleared(Scheduler) {
  const actualYields = Scheduler.unstable_clearYields();
  if (actualYields.length !== 0) {
    const error = Error(
      'The event log is not empty. Call assertLog(...) first.',
    );
    Error.captureStackTrace(error, assertYieldsWereCleared);
    throw error;
  }
}

export async function waitFor(expectedLog) {
  assertYieldsWereCleared(SchedulerMock);

  // Create the error object before doing any async work, to get a better
  // stack trace.
  const error = new Error();
  Error.captureStackTrace(error, waitFor);

  const actualLog = [];
  do {
    // Wait until end of current task/microtask.
    await null;
    if (SchedulerMock.unstable_hasPendingWork()) {
      SchedulerMock.unstable_flushNumberOfYields(
        expectedLog.length - actualLog.length,
      );
      actualLog.push(...SchedulerMock.unstable_clearYields());
      if (expectedLog.length > actualLog.length) {
        // Continue flushing until we've logged the expected number of items.
      } else {
        // Once we've reached the expected sequence, wait one more microtask to
        // flush any remaining synchronous work.
        await null;
        actualLog.push(...SchedulerMock.unstable_clearYields());
        break;
      }
    } else {
      // There's no pending work, even after a microtask.
      break;
    }
  } while (true);

  if (equals(actualLog, expectedLog)) {
    return;
  }

  error.message = `
Expected sequence of events did not occur.

${diff(expectedLog, actualLog)}
`;
  throw error;
}

export async function waitForAll(expectedLog) {
  assertYieldsWereCleared(SchedulerMock);

  // Create the error object before doing any async work, to get a better
  // stack trace.
  const error = new Error();
  Error.captureStackTrace(error, waitFor);

  do {
    // Wait until end of current task/microtask.
    await null;
    if (!SchedulerMock.unstable_hasPendingWork()) {
      // There's no pending work, even after a microtask. Stop flushing.
      break;
    }
    SchedulerMock.unstable_flushAllWithoutAsserting();
  } while (true);

  const actualLog = SchedulerMock.unstable_clearYields();
  if (equals(actualLog, expectedLog)) {
    return;
  }

  error.message = `
Expected sequence of events did not occur.

${diff(expectedLog, actualLog)}
`;
  throw error;
}

export async function waitForThrow(expectedError: mixed) {
  assertYieldsWereCleared(SchedulerMock);

  // Create the error object before doing any async work, to get a better
  // stack trace.
  const error = new Error();
  Error.captureStackTrace(error, waitFor);

  do {
    // Wait until end of current task/microtask.
    await null;
    if (!SchedulerMock.unstable_hasPendingWork()) {
      // There's no pending work, even after a microtask. Stop flushing.
      error.message = 'Expected something to throw, but nothing did.';
      throw error;
    }
    try {
      SchedulerMock.unstable_flushAllWithoutAsserting();
    } catch (x) {
      if (equals(x, expectedError)) {
        return;
      }
      if (typeof x === 'object' && x !== null && x.message === expectedError) {
        return;
      }
      error.message = `
Expected error was not thrown.

${diff(expectedError, x)}
`;
      throw error;
    }
  } while (true);
}

// TODO: This name is a bit misleading currently because it will stop as soon as
// React yields for any reason, not just for a paint. I've left it this way for
// now because that's how untable_flushUntilNextPaint already worked, but maybe
// we should split these use cases into separate APIs.
export async function waitForPaint(expectedLog) {
  assertYieldsWereCleared(SchedulerMock);

  // Create the error object before doing any async work, to get a better
  // stack trace.
  const error = new Error();
  Error.captureStackTrace(error, waitFor);

  // Wait until end of current task/microtask.
  await null;
  if (SchedulerMock.unstable_hasPendingWork()) {
    // Flush until React yields.
    SchedulerMock.unstable_flushUntilNextPaint();
    // Wait one more microtask to flush any remaining synchronous work.
    await null;
  }

  const actualLog = SchedulerMock.unstable_clearYields();
  if (equals(actualLog, expectedLog)) {
    return;
  }

  error.message = `
Expected sequence of events did not occur.

${diff(expectedLog, actualLog)}
`;
  throw error;
}

export function assertLog(expectedLog) {
  const actualLog = SchedulerMock.unstable_clearYields();
  if (equals(actualLog, expectedLog)) {
    return;
  }

  const error = new Error(`
Expected sequence of events did not occur.

${diff(expectedLog, actualLog)}
`);
  Error.captureStackTrace(error, assertLog);
  throw error;
}
