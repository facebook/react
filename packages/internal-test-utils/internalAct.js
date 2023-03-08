/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

// This version of `act` is only used by our tests. Unlike the public version
// of `act`, it's designed to work identically in both production and
// development. It may have slightly different behavior from the public
// version, too, since our constraints in our test suite are not the same as
// those of developers using React — we're testing React itself, as opposed to
// building an app with React.

import type {Thenable} from 'shared/ReactTypes';

import * as Scheduler from 'scheduler/unstable_mock';

import enqueueTask from './enqueueTask';

let actingUpdatesScopeDepth: number = 0;

async function waitForMicrotasks() {
  return new Promise(resolve => {
    enqueueTask(() => resolve());
  });
}

export async function act<T>(scope: () => Thenable<T>): Thenable<T> {
  if (Scheduler.unstable_flushUntilNextPaint === undefined) {
    throw Error(
      'This version of `act` requires a special mock build of Scheduler.',
    );
  }

  // $FlowFixMe: Flow doesn't know about global Jest object
  if (!jest.isMockFunction(setTimeout)) {
    throw Error(
      "This version of `act` requires Jest's timer mocks " +
        '(i.e. jest.useFakeTimers).',
    );
  }

  const previousIsActEnvironment = global.IS_REACT_ACT_ENVIRONMENT;
  const previousActingUpdatesScopeDepth = actingUpdatesScopeDepth;
  actingUpdatesScopeDepth++;
  if (actingUpdatesScopeDepth === 1) {
    // Because this is not the "real" `act`, we set this to `false` so React
    // knows not to fire `act` warnings.
    global.IS_REACT_ACT_ENVIRONMENT = false;
  }

  // Create the error object before doing any async work, to get a better
  // stack trace.
  const error = new Error();
  Error.captureStackTrace(error, act);

  // Call the provided scope function after an async gap. This is an extra
  // precaution to ensure that our tests do not accidentally rely on the act
  // scope adding work to the queue synchronously. We don't do this in the
  // public version of `act`, though we maybe should in the future.
  await waitForMicrotasks();

  try {
    const result = await scope();

    do {
      // Wait until end of current task/microtask.
      await waitForMicrotasks();

      // $FlowFixMe: Flow doesn't know about global Jest object
      if (jest.isEnvironmentTornDown()) {
        error.message =
          'The Jest environment was torn down before `act` completed. This ' +
          'probably means you forgot to `await` an `act` call.';
        throw error;
      }

      if (!Scheduler.unstable_hasPendingWork()) {
        // $FlowFixMe: Flow doesn't know about global Jest object
        jest.runOnlyPendingTimers();
        if (Scheduler.unstable_hasPendingWork()) {
          // Committing a fallback scheduled additional work. Continue flushing.
        } else {
          // There's no pending work, even after both the microtask queue
          // and the timer queue are empty. Stop flushing.
          break;
        }
      }
      // flushUntilNextPaint stops when React yields execution. Allow microtasks
      // queue to flush before continuing.
      Scheduler.unstable_flushUntilNextPaint();
    } while (true);

    return result;
  } finally {
    const depth = actingUpdatesScopeDepth;
    if (depth === 1) {
      global.IS_REACT_ACT_ENVIRONMENT = previousIsActEnvironment;
    }
    actingUpdatesScopeDepth = depth - 1;

    if (actingUpdatesScopeDepth !== previousActingUpdatesScopeDepth) {
      // if it's _less than_ previousActingUpdatesScopeDepth, then we can
      // assume the 'other' one has warned
      Scheduler.unstable_clearLog();
      error.message =
        'You seem to have overlapping act() calls, this is not supported. ' +
        'Be sure to await previous act() calls before making a new one. ';
      throw error;
    }
  }
}
