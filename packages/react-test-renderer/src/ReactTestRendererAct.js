/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {Thenable} from 'react-reconciler/src/ReactFiberScheduler';

import {
  batchedUpdates,
  flushPassiveEffects,
} from 'react-reconciler/inline.test';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import warningWithoutStack from 'shared/warningWithoutStack';
import enqueueTask from 'shared/enqueueTask';

const {ReactActingRendererSigil} = ReactSharedInternals;

// this implementation should be exactly the same in
// ReactTestUtilsAct.js, ReactTestRendererAct.js, createReactNoop.js

// we track the 'depth' of the act() calls with this counter,
// so we can tell if any async act() calls try to run in parallel.
let actingUpdatesScopeDepth = 0;

function flushEffectsAndMicroTasks(onDone: (err: ?Error) => void) {
  try {
    flushPassiveEffects();
    enqueueTask(() => {
      if (flushPassiveEffects()) {
        flushEffectsAndMicroTasks(onDone);
      } else {
        onDone();
      }
    });
  } catch (err) {
    onDone(err);
  }
}

function act(callback: () => Thenable) {
  let previousActingUpdatesScopeDepth;
  let previousActingUpdatesSigil;
  if (__DEV__) {
    previousActingUpdatesScopeDepth = actingUpdatesScopeDepth;
    previousActingUpdatesSigil = ReactActingRendererSigil.current;
    actingUpdatesScopeDepth++;
    // we use the function flushPassiveEffects directly as the sigil,
    // since it's unique to a renderer
    ReactActingRendererSigil.current = flushPassiveEffects;
  }

  function onDone() {
    if (__DEV__) {
      actingUpdatesScopeDepth--;
      ReactActingRendererSigil.current = previousActingUpdatesSigil;
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

  const result = batchedUpdates(callback);
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
                'You called act(async () => ...) without awaiting its result. ' +
                  'This could lead to unexpected testing behaviour, interleaving multiple act ' +
                  'calls and mixing their scopes. You should await asynchronous act() calls:\n' +
                  'await act(async () => ...);\n',
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
            flushEffectsAndMicroTasks((err: ?Error) => {
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
      warningWithoutStack(
        result === undefined,
        'The callback passed to act(...) function ' +
          'must return undefined or a Promise. You returned %s',
        result,
      );
    }

    // flush effects until none remain, and cleanup
    try {
      while (flushPassiveEffects()) {}
      onDone();
    } catch (err) {
      onDone();
      throw err;
    }

    // in the sync case, the returned thenable only warns *if* await-ed
    return {
      then(resolve: () => void) {
        if (__DEV__) {
          warningWithoutStack(
            false,
            'Do not await the result of calling a synchronous act(...), it is not a Promise. \n' +
              'Remove the `await` statement before this act() call.',
          );
        }
        resolve();
      },
    };
  }
}

export default act;
