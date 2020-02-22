/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'react-reconciler/src/ReactFiberWorkLoop';

import * as ReactDOM from 'react-dom';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import enqueueTask from 'shared/enqueueTask';
import * as Scheduler from 'scheduler';

// Keep in sync with ReactDOMUnstableNativeDependencies.js
// ReactDOM.js, and ReactTestUtils.js:
const [
  /* eslint-disable no-unused-vars */
  getInstanceFromNode,
  getNodeFromInstance,
  getFiberCurrentPropsFromNode,
  injectEventPluginsByName,
  eventNameDispatchConfigs,
  accumulateTwoPhaseDispatches,
  accumulateDirectDispatches,
  enqueueStateRestore,
  restoreStateIfNeeded,
  dispatchEvent,
  runEventsInBatch,
  /* eslint-enable no-unused-vars */
  flushPassiveEffects,
  IsThisRendererActing,
] = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events;

const batchedUpdates = ReactDOM.unstable_batchedUpdates;

const {IsSomeRendererActing} = ReactSharedInternals;

// this implementation should be exactly the same in
// ReactTestUtilsAct.js, ReactTestRendererAct.js, createReactNoop.js

const isSchedulerMocked =
  typeof Scheduler.unstable_flushAllWithoutAsserting === 'function';
const flushWork =
  Scheduler.unstable_flushAllWithoutAsserting ||
  function() {
    let didFlushWork = false;
    while (flushPassiveEffects()) {
      didFlushWork = true;
    }

    return didFlushWork;
  };

function flushWorkAndMicroTasks(onDone: (err: ?Error) => void) {
  try {
    flushWork();
    enqueueTask(() => {
      if (flushWork()) {
        flushWorkAndMicroTasks(onDone);
      } else {
        onDone();
      }
    });
  } catch (err) {
    onDone(err);
  }
}

// we track the 'depth' of the act() calls with this counter,
// so we can tell if any async act() calls try to run in parallel.

let actingUpdatesScopeDepth = 0;
let didWarnAboutUsingActInProd = false;

function act(callback: () => Thenable) {
  if (!__DEV__) {
    if (didWarnAboutUsingActInProd === false) {
      didWarnAboutUsingActInProd = true;
      // eslint-disable-next-line react-internal/no-production-logging
      console.error(
        'act(...) is not supported in production builds of React, and might not behave as expected.',
      );
    }
  }
  let previousActingUpdatesScopeDepth = actingUpdatesScopeDepth;
  let previousIsSomeRendererActing;
  let previousIsThisRendererActing;
  actingUpdatesScopeDepth++;

  previousIsSomeRendererActing = IsSomeRendererActing.current;
  previousIsThisRendererActing = IsThisRendererActing.current;
  IsSomeRendererActing.current = true;
  IsThisRendererActing.current = true;

  function onDone() {
    actingUpdatesScopeDepth--;
    IsSomeRendererActing.current = previousIsSomeRendererActing;
    IsThisRendererActing.current = previousIsThisRendererActing;
    if (__DEV__) {
      if (actingUpdatesScopeDepth > previousActingUpdatesScopeDepth) {
        // if it's _less than_ previousActingUpdatesScopeDepth, then we can assume the 'other' one has warned
        console.error(
          'You seem to have overlapping act() calls, this is not supported. ' +
            'Be sure to await previous act() calls before making a new one. ',
        );
      }
    }
  }

  let result;
  try {
    result = batchedUpdates(callback);
  } catch (error) {
    // on sync errors, we still want to 'cleanup' and decrement actingUpdatesScopeDepth
    onDone();
    throw error;
  }

  if (
    result !== null &&
    typeof result === 'object' &&
    typeof result.then === 'function'
  ) {
    // setup a boolean that gets set to true only
    // once this act() call is await-ed
    let called = false;
    if (__DEV__) {
      if (typeof Promise !== 'undefined') {
        //eslint-disable-next-line no-undef
        Promise.resolve()
          .then(() => {})
          .then(() => {
            if (called === false) {
              console.error(
                'You called act(async () => ...) without await. ' +
                  'This could lead to unexpected testing behaviour, interleaving multiple act ' +
                  'calls and mixing their scopes. You should - await act(async () => ...);',
              );
            }
          });
      }
    }

    // in the async case, the returned thenable runs the callback, flushes
    // effects and  microtasks in a loop until flushPassiveEffects() === false,
    // and cleans up
    return {
      then(resolve: () => void, reject: (?Error) => void) {
        called = true;
        result.then(
          () => {
            if (
              actingUpdatesScopeDepth > 1 ||
              (isSchedulerMocked === true &&
                previousIsSomeRendererActing === true)
            ) {
              onDone();
              resolve();
              return;
            }
            // we're about to exit the act() scope,
            // now's the time to flush tasks/effects
            flushWorkAndMicroTasks((err: ?Error) => {
              onDone();
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          },
          err => {
            onDone();
            reject(err);
          },
        );
      },
    };
  } else {
    if (__DEV__) {
      if (result !== undefined) {
        console.error(
          'The callback passed to act(...) function ' +
            'must return undefined, or a Promise. You returned %s',
          result,
        );
      }
    }

    // flush effects until none remain, and cleanup
    try {
      if (
        actingUpdatesScopeDepth === 1 &&
        (isSchedulerMocked === false || previousIsSomeRendererActing === false)
      ) {
        // we're about to exit the act() scope,
        // now's the time to flush effects
        flushWork();
      }
      onDone();
    } catch (err) {
      onDone();
      throw err;
    }

    // in the sync case, the returned thenable only warns *if* await-ed
    return {
      then(resolve: () => void) {
        if (__DEV__) {
          console.error(
            'Do not await the result of calling act(...) with sync logic, it is not a Promise.',
          );
        }
        resolve();
      },
    };
  }
}

export default act;
