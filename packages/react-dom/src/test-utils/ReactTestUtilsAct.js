/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'react-reconciler/src/ReactFiberScheduler';

import warningWithoutStack from 'shared/warningWithoutStack';
import React from 'react';
import ReactDOM from 'react-dom';

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
] = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events;

const RendererHelpers = {
  flushPassiveEffects,
  batchedUpdates: ReactDOM.unstable_batchedUpdates,
};

const {
  isActingUpdates,
} = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

// the rest of this file should be exactly the same in ReactTestUtilsAct.js,
// ReactTestRendererAct.js, ReactNoopAct.js, ReactNoopPersistentAct.js

let actingUpdatesScopeDepth = 0;

function incrementActingScopeDepth() {
  actingUpdatesScopeDepth++;
  isActingUpdates[0] = true;
}

function decrementActingScopeDepth() {
  actingUpdatesScopeDepth--;
  if (actingUpdatesScopeDepth === 0) {
    isActingUpdates[0] = false;
  }
}

let didWarnAboutMessageChannel = false;

let enqueueTask;
try {
  // assuming we're in node, let's try to get node's
  // version of setImmediate, bypassing fake timers if any
  let r = require; // trick packagers not to bundle this stuff.
  enqueueTask = r('timers').setImmediate;
} catch (_err) {
  // we're in a browser
  // we can't use regular timers because they may still be faked
  // so we try MessageChannel+postMessage instead
  enqueueTask = function(callback) {
    if (__DEV__) {
      if (didWarnAboutMessageChannel === false) {
        didWarnAboutMessageChannel = true;
        warningWithoutStack(
          typeof MessageChannel !== 'undefined',
          'This browser does not have a MessageChannel implementation, ' +
            'so enqueuing tasks via await act(async () => ...) will fail. ' +
            'Please file an issue at https://github.com/facebook/react/issues ' +
            'if you encounter this warning.',
        );
      }
    }
    const channel = new MessageChannel();
    channel.port1.onmessage = callback;
    channel.port2.postMessage(undefined);
  };
}

function createActedUpdatesScope(callback: (onDone: (?Error) => void) => void) {
  let previousActingUpdatesScopeDepth;
  if (__DEV__) {
    previousActingUpdatesScopeDepth = actingUpdatesScopeDepth;
    incrementActingScopeDepth();
  }

  function warnIfScopeDepthMismatch() {
    if (__DEV__) {
      if (actingUpdatesScopeDepth > previousActingUpdatesScopeDepth) {
        // if it's _less than_ previousActingUpdatesScopeDepth, then we can assume the 'other' one has warned
        warningWithoutStack(
          null,
          'You seem to have overlapping act() calls, this is not supported. ' +
            'Be sure to await previous act() calls before making a new one. ',
        );
      }
    }
  }

  callback(() => {
    if (__DEV__) {
      decrementActingScopeDepth();
      warnIfScopeDepthMismatch();
    }
  });
}

function flushEffectsAndMicroTasks(onDone: (err: ?Error) => void) {
  try {
    RendererHelpers.flushPassiveEffects();
    enqueueTask(() => {
      if (RendererHelpers.flushPassiveEffects()) {
        flushEffectsAndMicroTasks(onDone);
      } else {
        onDone();
      }
    });
  } catch (err) {
    onDone(err);
  }
}

export default function act(callback: () => Thenable) {
  let thenable;
  createActedUpdatesScope(onDone => {
    const result = RendererHelpers.batchedUpdates(callback);
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
                warningWithoutStack(
                  null,
                  'You called act(async () => ...) without await. ' +
                    'This could lead to unexpected testing behaviour, interleaving multiple act ' +
                    'calls and mixing their scopes. You should - await act(async () => ...);',
                );
              }
            });
        }
      }

      // in this case, the returned thenable runs the callback, flushes
      // effects and  microtasks in a loop until flushPassiveEffects() === false,
      // and cleans up
      thenable = {
        then(successFn, errorFn) {
          called = true;
          result.then(
            () => {
              flushEffectsAndMicroTasks(() => {
                onDone();
                successFn();
              });
            },
            err => {
              onDone();
              errorFn(err);
            },
          );
        },
      };
    } else {
      // in the sync case, the returned thenable only warns *if* await-ed
      thenable = {
        then(successFn) {
          if (__DEV__) {
            warningWithoutStack(
              false,
              'Do not await the result of calling act(...) with sync logic, it is not a Promise.',
            );
          }
          successFn();
        },
      };

      if (__DEV__) {
        warningWithoutStack(
          result === undefined,
          'The callback passed to act(...) function ' +
            'must return undefined, or a Promise. You returned %s',
          result,
        );
      }

      // flush effects until none remain, and cleanup
      try {
        while (RendererHelpers.flushPassiveEffects()) {}
        onDone();
      } catch (err) {
        onDone(err);
        throw err;
      }
    }
  });
  return thenable;
}
