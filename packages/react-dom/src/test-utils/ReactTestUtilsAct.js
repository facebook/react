/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import ReactDOM from 'react-dom';
import warningWithoutStack from 'shared/warningWithoutStack';
import createAct from 'shared/createAct';

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

const createdAct = createAct(
  'ReactTestUtils',
  setIsActingUpdatesInDev,
  () => {
    ReactDOM.render(<div />, actContainerElement);
  },
  ReactDOM.unstable_batchedUpdates,
);

export default function act(callback: () => void | Promise<void>): Thenable {
  if (actContainerElement === null) {
    // warn if we can't actually create the stub element
    if (__DEV__) {
      warningWithoutStack(
        typeof document !== 'undefined' &&
          document !== null &&
          typeof document.createElement === 'function',
        'It looks like you called ReactTestUtils.act(...) in a non-browser environment. ' +
          "If you're using TestRenderer for your tests, you should call " +
          'ReactTestRenderer.act(...) instead of TestUtils.act(...).',
      );
    }
    // then make it
    actContainerElement = document.createElement('div');
  }

  return createdAct(callback);
}

// setIsActingUpdatesInDev
// flushUpdates
// batchUpdates
