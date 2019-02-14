/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import warningWithoutStack from 'shared/warningWithoutStack';

const [
  /* eslint-disable no-unused-vars */
  _getInstanceFromNode,
  _getNodeFromInstance,
  _getFiberCurrentPropsFromNode,
  _injectEventPluginsByName,
  _eventNameDispatchConfigs,
  _accumulateTwoPhaseDispatches,
  _accumulateDirectDispatches,
  _enqueueStateRestore,
  _restoreStateIfNeeded,
  _dispatchEvent,
  _runEventsInBatch,
  /* eslint-enable no-unused-vars */
  setIsActingUpdatesInDev,
] = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events;

// for .act's return value
type Thenable = {
  then(resolve: () => void, reject?: () => void): void,
  // ^ todo - maybe this should return a promise...
};

// a stub element, lazily initialized, used by act() when flushing effects
let actContainerElement = null;
// a step counter when we descend/ascend from .act calls
const actingScopeDepth = {current: 0};

export default function act(callback: () => void | Promise<void>): Thenable {
  if (actContainerElement === null) {
    // warn if we can't actually create the stub element
    if (__DEV__) {
      warningWithoutStack(
        typeof document !== 'undefined' &&
          document !== null &&
          typeof document.createElement === 'function',
        'It looks like you called TestUtils.act(...) in a non-browser environment. ' +
          "If you're using TestRenderer for your tests, you should call " +
          'TestRenderer.act(...) instead of TestUtils.act(...).',
      );
    }
    // then make it
    actContainerElement = document.createElement('div');
  }

  const previousActingScopeDepth = actingScopeDepth.current;
  actingScopeDepth.current++;
  if (previousActingScopeDepth === 0) {
    setIsActingUpdatesInDev(true);
  }

  const result = ReactDOM.unstable_batchedUpdates(callback);
  if (result && typeof result.then === 'function') {
    // the returned thenable MUST be called
    let called = false;
    setImmediate(() => {
      if (!called) {
        warningWithoutStack(
          null,
          'You called .act() without awaiting its result. ' +
            'This could lead to unexpected testing behaviour, interleaving multiple act ' +
            'calls and mixing their scopes. You should - await act(async () => ...);',
          // todo - a better warning here. open to suggestions.
        );
      }
    });
    return {
      then(fn, errorFn) {
        called = true;
        result.then(() => {
          ReactDOM.render(<div />, actContainerElement);
          if (actingScopeDepth.current - 1 > previousActingScopeDepth) {
            // if it's _less than_ previousActingScopeDepth, then we can assume the 'other' one has warned
            warningWithoutStack(
              null,
              'You seem to have interleaved multiple act() calls, this is not supported. ' +
                'Be sure to await previous sibling act calls before making a new one. ',
              // todo - a better warning here. open to suggestions.
            );
          }
          actingScopeDepth.current--;
          if (actingScopeDepth.current === 0) {
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
          'The callback passed to ReactTestUtils.act(...) function ' +
            'must return undefined, or a Promise. You returned %s',
          result,
        );
      }
    }
    ReactDOM.render(<div />, actContainerElement);
    actingScopeDepth.current--;

    if (actingScopeDepth.current === 0) {
      setIsActingUpdatesInDev(false);
    }
    return {
      then() {
        if (__DEV__) {
          warningWithoutStack(
            false,
            // todo - well... why not? maybe this would be fine.
            'Do not await the result of calling ReactTestUtils.act(...) with sync logic, it is not a Promise.',
          );
        }
      },
    };
  }
}
