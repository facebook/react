/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

import enqueueTask from 'shared/enqueueTask';

let actingUpdatesScopeDepth = 0;

export function act<T>(scope: () => Thenable<T> | T): Thenable<T> {
  if (Scheduler.unstable_flushUntilNextPaint === undefined) {
    throw Error(
      'This version of `act` requires a special mock build of Scheduler.',
    );
  }

  // $FlowFixMe: _isMockFunction doesn't exist on function
  if (setTimeout._isMockFunction !== true) {
    throw Error(
      "This version of `act` requires Jest's timer mocks " +
        '(i.e. jest.useFakeTimers).',
    );
  }

  const previousIsActEnvironment = global.IS_REACT_ACT_ENVIRONMENT;
  const previousActingUpdatesScopeDepth = actingUpdatesScopeDepth;
  actingUpdatesScopeDepth++;
  if (__DEV__ && actingUpdatesScopeDepth === 1) {
    // Because this is not the "real" `act`, we set this to `false` so React
    // knows not to fire `act` warnings.
    global.IS_REACT_ACT_ENVIRONMENT = false;
  }

  const unwind = () => {
    if (__DEV__ && actingUpdatesScopeDepth === 1) {
      global.IS_REACT_ACT_ENVIRONMENT = previousIsActEnvironment;
    }
    actingUpdatesScopeDepth--;

    if (__DEV__) {
      if (actingUpdatesScopeDepth > previousActingUpdatesScopeDepth) {
        // if it's _less than_ previousActingUpdatesScopeDepth, then we can
        // assume the 'other' one has warned
        console.error(
          'You seem to have overlapping act() calls, this is not supported. ' +
            'Be sure to await previous act() calls before making a new one. ',
        );
      }
    }
  };

  // TODO: This would be way simpler if 1) we required a promise to be
  // returned and 2) we could use async/await. Since it's only our used in
  // our test suite, we should be able to.
  try {
    const result = scope();
    if (
      typeof result === 'object' &&
      result !== null &&
      typeof result.then === 'function'
    ) {
      const thenableResult: Thenable<T> = (result: any);
      return {
        then(resolve, reject) {
          thenableResult.then(
            returnValue => {
              flushActWork(
                () => {
                  unwind();
                  resolve(returnValue);
                },
                error => {
                  unwind();
                  reject(error);
                },
              );
            },
            error => {
              unwind();
              reject(error);
            },
          );
        },
      };
    } else {
      const returnValue: T = (result: any);
      try {
        // TODO: Let's not support non-async scopes at all in our tests. Need to
        // migrate existing tests.
        let didFlushWork;
        do {
          didFlushWork = Scheduler.unstable_flushAllWithoutAsserting();
        } while (didFlushWork);
        return {
          then(resolve, reject) {
            resolve(returnValue);
          },
        };
      } finally {
        unwind();
      }
    }
  } catch (error) {
    unwind();
    throw error;
  }
}

function flushActWork(resolve, reject) {
  if (Scheduler.unstable_hasPendingWork()) {
    try {
      Scheduler.unstable_flushUntilNextPaint();
    } catch (error) {
      reject(error);
    }

    // If Scheduler yields while there's still work, it's so that we can
    // unblock the main thread (e.g. for paint or for microtasks). Yield to
    // the main thread and continue in a new task.
    enqueueTask(() => flushActWork(resolve, reject));
    return;
  }

  // Once the scheduler queue is empty, run all the timers. The purpose of this
  // is to force any pending fallbacks to commit. The public version of act does
  // this with dev-only React runtime logic, but since our internal act needs to
  // work work production builds of React, we have to cheat.
  // $FlowFixMe: Flow doesn't know about global Jest object
  jest.runOnlyPendingTimers();
  if (Scheduler.unstable_hasPendingWork()) {
    // Committing a fallback scheduled additional work. Continue flushing.
    flushActWork(resolve, reject);
    return;
  }

  resolve();
}
