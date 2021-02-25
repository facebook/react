/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes';

import * as ReactDOM from 'react-dom';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import enqueueTask from 'shared/enqueueTask';
import * as Scheduler from 'scheduler';

// Keep in sync with ReactDOM.js, and ReactTestUtils.js:
const EventInternals =
  ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events;
// const getInstanceFromNode = EventInternals[0];
// const getNodeFromInstance = EventInternals[1];
// const getFiberCurrentPropsFromNode = EventInternals[2];
// const enqueueStateRestore = EventInternals[3];
// const restoreStateIfNeeded = EventInternals[4];
const flushPassiveEffects = EventInternals[5];
const IsThisRendererActing = EventInternals[6];

const batchedUpdates = ReactDOM.unstable_batchedUpdates;

const {IsSomeRendererActing} = ReactSharedInternals;

// This is the public version of `ReactTestUtils.act`. It is implemented in
// "userspace" (i.e. not the reconciler), so that it doesn't add to the
// production bundle size.
// TODO: Remove this implementation of `act` in favor of the one exported by
// the reconciler. To do this, we must first drop support for `act` in
// production mode.

// TODO: Remove support for the mock scheduler build, which was only added for
// the purposes of internal testing. Internal tests should use
// `unstable_concurrentAct` instead.
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

// Returns a stack object/array
// TODO: add tsx notations
// TODO: confirm that this is the best solution for react
const getStackTrace = function() {
  const obj = {};
  Error.captureStackTrace(obj, getStackTrace);
  return obj.stack;
};

// Returns a unique non-clashing uuid
// Note: unashamedly yoinked from stackoverflow and have done almost zero vetting
//       https://stackoverflow.com/a/47475081/13929637
// TODO: this probably already exists in react somewhere, and probably
//       better/faster/stronger
function uuid4(): string {
  // define a hacky getRandomValues as `crypto` may not be present
  // FIXME: there muc=st be a better way, cross-platform
  function getRandomValues(array: Uint8Array) {
    return array.map(() => Math.floor(Math.random() * 256));
  }

  function hex(s, b) {
    return (
      s +
      (b >>> 4).toString(16) + // high nibble
      (b & 0b1111).toString(16)
    ); // low nibble
  }

  const r = getRandomValues(new Uint8Array(16));

  r[6] = (r[6] >>> 4) | 0b01000000; // Set type 4: 0100
  r[8] = (r[8] >>> 3) | 0b10000000; // Set variant: 100

  return (
    r.slice(0, 4).reduce(hex, '') +
    r.slice(4, 6).reduce(hex, '-') +
    r.slice(6, 8).reduce(hex, '-') +
    r.slice(8, 10).reduce(hex, '-') +
    r.slice(10, 16).reduce(hex, '-')
  );
}

// Ronseal global variable. Stores the call-stacks/traces invoked for each
// act() call currently active
const activeActStacks = {};

// Track the call-stack at invocation, returning a uuid lookup-key of that trace
// The intent here is that the returned id can be used in scope to later remove
// the stack off the heap when the act() has completed.
function captureScope(): string {
  const stackString = getStackTrace();
  const uuid = uuid4(); // can be used later to delete the stack when done
  activeActStacks[uuid] = stackString;
  return uuid;
}

// Returns a string that can be read to determine where the overlapping act()
// calls were invoked from
// TODO: return a tidied callstack, removing node_modules etc. as appropriate
// TODO: profile and optmise
function stringifyActiveActStacks(): string {
  let ret = "";
  const keys = Object.keys(activeActStacks);
  for (let i = 0; i < keys.length; i += 1) {
    const stackPrefix = `\nstack ${i} | `;
    const stackString = `${activeActStacks[keys[i]]}`
      .replace('\n', stackPrefix)
      .replace('\r', stackPrefix);
    ret += `\n${stackPrefix}${stackString}\n`;
  }
  return ret;
}

// we track the 'depth' of the act() calls with this counter,
// so we can tell if any async act() calls try to run in parallel.

let actingUpdatesScopeDepth = 0;
let didWarnAboutUsingActInProd = false;

export function act(callback: () => Thenable<mixed>): Thenable<void> {
  if (!__DEV__) {
    if (didWarnAboutUsingActInProd === false) {
      didWarnAboutUsingActInProd = true;
      // eslint-disable-next-line react-internal/no-production-logging
      console.error(
        'act(...) is not supported in production builds of React, and might not behave as expected.',
      );
    }
  }
  const previousActingUpdatesScopeDepth = actingUpdatesScopeDepth;
  actingUpdatesScopeDepth++;

  let scopeUUID = null;
  if (__DEV__) {
    // the scopeUUID is only used to remove scopes that have completed so that
    // we can debug-log the 'active' scopes in the onDone function
    // TODO: profile this.
    // TODO: if slow, optimise or add a cli-option to enable/disable this
    scopeUUID = captureScope();
  }

  const previousIsSomeRendererActing = IsSomeRendererActing.current;
  const previousIsThisRendererActing = IsThisRendererActing.current;
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
            'Be sure to await previous act() calls before making a new one. %s',
          stringifyActiveActStacks(),
        );
      }

      // Always try to remove the current act() scopes from the stack-db, if added.
      if (scopeUUID !== null) {
        delete activeActStacks[scopeUUID];
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
      then(resolve, reject) {
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
      then(resolve) {
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
