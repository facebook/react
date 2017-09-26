/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactServerUpdateQueue
 * @flow
 */

'use strict';

var ReactUpdateQueue = require('ReactUpdateQueue');

var warning = require('fbjs/lib/warning');

import type {Transaction} from 'Transaction';

function warnNoop(
  publicInstance: React$Component<any, any>,
  callerName: string,
) {
  if (__DEV__) {
    var constructor = publicInstance.constructor;
    warning(
      false,
      '%s(...): Can only update a mounting component. ' +
        'This usually means you called %s() outside componentWillMount() on the server. ' +
        'This is a no-op.\n\nPlease check the code for the %s component.',
      callerName,
      callerName,
      (constructor && (constructor.displayName || constructor.name)) ||
        'ReactClass',
    );
  }
}

/**
 * This is the update queue used for server rendering.
 * It delegates to ReactUpdateQueue while server rendering is in progress and
 * switches to ReactNoopUpdateQueue after the transaction has completed.
 * @class ReactServerUpdateQueue
 * @param {Transaction} transaction
 */
class ReactServerUpdateQueue {
  transaction: Transaction;

  constructor(transaction: Transaction) {
    this.transaction = transaction;
  }

  /**
   * Checks whether or not this composite component is mounted.
   * @param {ReactClass} publicInstance The instance we want to test.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
  isMounted(publicInstance: React$Component<any, any>): boolean {
    return false;
  }

  /**
   * Forces an update. This should only be invoked when it is known with
   * certainty that we are **not** in a DOM transaction.
   *
   * You may want to call this when you know that some deeper aspect of the
   * component's state has changed but `setState` was not called.
   *
   * This will not invoke `shouldComponentUpdate`, but it will invoke
   * `componentWillUpdate` and `componentDidUpdate`.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {?function} callback Called after component is updated.
   * @param {?string} callerName Name of the calling function in the public API.
   * @internal
   */
  enqueueForceUpdate(
    publicInstance: React$Component<any, any>,
    callback?: Function,
    callerName?: string,
  ) {
    if (this.transaction.isInTransaction()) {
      ReactUpdateQueue.enqueueForceUpdate(publicInstance, callback, callerName);
    } else {
      warnNoop(publicInstance, 'forceUpdate');
    }
  }

  /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object|function} completeState Next state.
   * @param {?function} callback Called after component is updated.
   * @param {?string} Name of the calling function in the public API.
   * @internal
   */
  enqueueReplaceState(
    publicInstance: React$Component<any, any>,
    completeState: Object | Function,
    callback?: Function,
    callerName?: string,
  ) {
    if (this.transaction.isInTransaction()) {
      ReactUpdateQueue.enqueueReplaceState(
        publicInstance,
        completeState,
        callback,
        callerName,
      );
    } else {
      warnNoop(publicInstance, 'replaceState');
    }
  }

  /**
   * Sets a subset of the state. This only exists because _pendingState is
   * internal. This provides a merging strategy that is not available to deep
   * properties which is confusing. TODO: Expose pendingState or don't use it
   * during the merge.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object|function} partialState Next partial state to be merged with state.
   * @internal
   */
  enqueueSetState(
    publicInstance: React$Component<any, any>,
    partialState: Object | Function,
    callback?: Function,
    callerName?: string,
  ) {
    if (this.transaction.isInTransaction()) {
      ReactUpdateQueue.enqueueSetState(
        publicInstance,
        partialState,
        callback,
        callerName,
      );
    } else {
      warnNoop(publicInstance, 'setState');
    }
  }
}

module.exports = ReactServerUpdateQueue;
