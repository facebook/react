/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes';
import ReactCurrentActQueue from './ReactCurrentActQueue';
import invariant from 'shared/invariant';
import enqueueTask from 'shared/enqueueTask';

let actScopeDepth = 0;
let didWarnNoAwaitAct = false;

export function act(callback: () => Thenable<mixed>): Thenable<void> {
  if (__DEV__) {
    // `act` calls can be nested, so we track the depth. This represents the
    // number of `act` scopes on the stack.
    const prevActScopeDepth = actScopeDepth;
    actScopeDepth++;

    if (ReactCurrentActQueue.current === null) {
      // This is the outermost `act` scope. Initialize the queue. The reconciler
      // will detect the queue and use it instead of Scheduler.
      ReactCurrentActQueue.current = [];
    }

    let result;
    try {
      result = callback();
    } catch (error) {
      popActScope(prevActScopeDepth);
      throw error;
    }

    if (
      result !== null &&
      typeof result === 'object' &&
      typeof result.then === 'function'
    ) {
      // The callback is an async function (i.e. returned a promise). Wait
      // for it to resolve before exiting the current scope.
      let wasAwaited = false;
      const thenable = {
        then(resolve, reject) {
          wasAwaited = true;
          result.then(
            () => {
              popActScope(prevActScopeDepth);
              if (actScopeDepth === 0) {
                // We've exited the outermost act scope. Recursively flush the
                // queue until there's no remaining work.
                recursivelyFlushAsyncActWork(resolve, reject);
              } else {
                resolve();
              }
            },
            error => {
              // The callback threw an error.
              popActScope(prevActScopeDepth);
              reject(error);
            },
          );
        },
      };

      if (__DEV__) {
        if (!didWarnNoAwaitAct && typeof Promise !== 'undefined') {
          // eslint-disable-next-line no-undef
          Promise.resolve()
            .then(() => {})
            .then(() => {
              if (!wasAwaited) {
                didWarnNoAwaitAct = true;
                console.error(
                  'You called act(async () => ...) without await. ' +
                    'This could lead to unexpected testing behaviour, ' +
                    'interleaving multiple act calls and mixing their ' +
                    'scopes. ' +
                    'You should - await act(async () => ...);',
                );
              }
            });
        }
      }
      return thenable;
    } else {
      // The callback is not an async function. Exit the current scope
      // immediately, without awaiting.
      popActScope(prevActScopeDepth);
      if (actScopeDepth === 0) {
        // Exiting the outermost act scope. Flush the queue.
        const queue = ReactCurrentActQueue.current;
        if (queue !== null) {
          flushActQueue(queue);
          ReactCurrentActQueue.current = null;
        }
        // Return a thenable. If the user awaits it, we'll flush again in
        // case additional work was scheduled by a microtask.
        return {
          then(resolve, reject) {
            // Confirm we haven't re-entered another `act` scope, in case
            // the user does something weird like await the thenable
            // multiple times.
            if (ReactCurrentActQueue.current === null) {
              // Recursively flush the queue until there's no remaining work.
              ReactCurrentActQueue.current = [];
              recursivelyFlushAsyncActWork(resolve, reject);
            }
          },
        };
      } else {
        // Since we're inside a nested `act` scope, the returned thenable
        // immediately resolves. The outer scope will flush the queue.
        return {
          then(resolve, reject) {
            resolve();
          },
        };
      }
    }
  } else {
    invariant(
      false,
      'act(...) is not supported in production builds of React.',
    );
  }
}

function popActScope(prevActScopeDepth) {
  if (__DEV__) {
    if (prevActScopeDepth !== actScopeDepth - 1) {
      console.error(
        'You seem to have overlapping act() calls, this is not supported. ' +
          'Be sure to await previous act() calls before making a new one. ',
      );
    }
    actScopeDepth = prevActScopeDepth;
  }
}

function recursivelyFlushAsyncActWork(resolve, reject) {
  if (__DEV__) {
    const queue = ReactCurrentActQueue.current;
    if (queue !== null) {
      try {
        flushActQueue(queue);
        enqueueTask(() => {
          if (queue.length === 0) {
            // No additional work was scheduled. Finish.
            ReactCurrentActQueue.current = null;
            resolve();
          } else {
            // Keep flushing work until there's none left.
            recursivelyFlushAsyncActWork(resolve, reject);
          }
        });
      } catch (error) {
        reject(error);
      }
    } else {
      resolve();
    }
  }
}

let isFlushing = false;
function flushActQueue(queue) {
  if (__DEV__) {
    if (!isFlushing) {
      // Prevent re-entrancy.
      isFlushing = true;
      let i = 0;
      try {
        for (; i < queue.length; i++) {
          let callback = queue[i];
          do {
            callback = callback(true);
          } while (callback !== null);
        }
        queue.length = 0;
      } catch (error) {
        // If something throws, leave the remaining callbacks on the queue.
        queue = queue.slice(i + 1);
        throw error;
      } finally {
        isFlushing = false;
      }
    }
  }
}
