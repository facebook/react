/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import warningWithoutStack from 'shared/warningWithoutStack';

// for .act's return value
type Thenable = {
  then(resolve: () => void, reject?: () => void): void,
  // ^ todo - maybe this should return a promise...
};

// a step counter when we descend/ascend from .act calls
let actingScopeDepth = 0;

export default function createAct(
  name: string,
  setIsActingUpdatesInDev: boolean => void,
  flushEffects: () => void,
  batchedUpdates: *, // todo
) {
  return function act(callback: () => void | Promise<void>): Thenable {
    const previousActingScopeDepth = actingScopeDepth;
    actingScopeDepth++;
    if (previousActingScopeDepth === 0) {
      setIsActingUpdatesInDev(true);
    }

    const result = batchedUpdates(callback);
    if (result && typeof result.then === 'function') {
      // the returned thenable MUST be called
      let called = false;
      setImmediate(() => {
        if (!called) {
          warningWithoutStack(
            null,
            'You called %s.act() without awaiting its result. ' +
              'This could lead to unexpected testing behaviour, interleaving multiple act ' +
              'calls and mixing their scopes. You should - await act(async () => ...);',
            name,
            // todo - a better warning here. open to suggestions.
          );
        }
      });
      return {
        then(fn, errorFn) {
          called = true;
          result.then(() => {
            flushEffects();
            if (actingScopeDepth - 1 > previousActingScopeDepth) {
              // if it's _less than_ previousActingScopeDepth, then we can assume the 'other' one has warned
              warningWithoutStack(
                null,
                'You seem to have interleaved multiple act() calls, this is not supported. ' +
                  'Be sure to await previous sibling act calls before making a new one. ',
                // todo - a better warning here. open to suggestions.
              );
            }
            actingScopeDepth--;
            if (actingScopeDepth === 0) {
              setIsActingUpdatesInDev(false);
            }
            fn();
          }, errorFn);
        },
      };
    } else {
      if (__DEV__) {
        if (result !== undefined) {
          warningWithoutStack(
            false,
            'The callback passed to %s.act(...) function ' +
              'must return undefined, or a Promise. You returned %s',
            name,
            result,
          );
        }
      }
      flushEffects();
      actingScopeDepth--;

      if (actingScopeDepth === 0) {
        setIsActingUpdatesInDev(false);
      }
      return {
        then() {
          if (__DEV__) {
            warningWithoutStack(
              false,
              // todo - well... why not? maybe this would be fine.
              'Do not await the result of calling %s.act(...) with sync logic, it is not a Promise.',
              name,
            );
          }
        },
      };
    }
  };
}
