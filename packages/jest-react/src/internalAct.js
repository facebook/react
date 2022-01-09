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

export function act(scope: () => Thenable<mixed> | void) {
  if (Scheduler.unstable_flushAllWithoutAsserting === undefined) {
    throw Error(
      'This version of `act` requires a special mock build of Scheduler.',
    );
  }
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
    const thenable = scope();
    if (
      typeof thenable === 'object' &&
      thenable !== null &&
      typeof thenable.then === 'function'
    ) {
      return {
        then(resolve: () => void, reject: (error: mixed) => void) {
          thenable.then(
            () => {
              flushActWork(
                () => {
                  unwind();
                  resolve();
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
      try {
        // TODO: Let's not support non-async scopes at all in our tests. Need to
        // migrate existing tests.
        let didFlushWork;
        do {
          didFlushWork = Scheduler.unstable_flushAllWithoutAsserting();
        } while (didFlushWork);
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
  // Flush suspended fallbacks
  // $FlowFixMe: Flow doesn't know about global Jest object
  jest.runOnlyPendingTimers();
  enqueueTask(() => {
    try {
      const didFlushWork = Scheduler.unstable_flushAllWithoutAsserting();
      if (didFlushWork) {
        flushActWork(resolve, reject);
      } else {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
}
