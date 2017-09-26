/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactServerRenderingTransaction
 */

'use strict';

var PooledClass = require('PooledClass');
var Transaction = require('Transaction');
var ReactInstrumentation = require('ReactInstrumentation');
var ReactServerUpdateQueue = require('ReactServerUpdateQueue');

/**
 * Executed within the scope of the `Transaction` instance. Consider these as
 * being member methods, but with an implied ordering while being isolated from
 * each other.
 */
var TRANSACTION_WRAPPERS = [];

if (__DEV__) {
  TRANSACTION_WRAPPERS.push({
    initialize: ReactInstrumentation.debugTool.onBeginFlush,
    close: ReactInstrumentation.debugTool.onEndFlush,
  });
}

var noopCallbackQueue = {
  enqueue: function() {},
};

/**
 * @class ReactServerRenderingTransaction
 * @param {boolean} renderToStaticMarkup
 */
function ReactServerRenderingTransaction(renderToStaticMarkup) {
  this.reinitializeTransaction();
  this.renderToStaticMarkup = renderToStaticMarkup;
  this.useCreateElement = false;
  this.updateQueue = new ReactServerUpdateQueue(this);
}

var Mixin = {
  /**
   * @see Transaction
   * @abstract
   * @final
   * @return {array} Empty list of operation wrap procedures.
   */
  getTransactionWrappers: function() {
    return TRANSACTION_WRAPPERS;
  },

  /**
   * @return {object} The queue to collect `onDOMReady` callbacks with.
   */
  getReactMountReady: function() {
    return noopCallbackQueue;
  },

  /**
   * @return {object} The queue to collect React async events.
   */
  getUpdateQueue: function() {
    return this.updateQueue;
  },

  /**
   * `PooledClass` looks for this, and will invoke this before allowing this
   * instance to be reused.
   */
  destructor: function() {},

  checkpoint: function() {},

  rollback: function() {},
};

Object.assign(ReactServerRenderingTransaction.prototype, Transaction, Mixin);

PooledClass.addPoolingTo(ReactServerRenderingTransaction);

module.exports = ReactServerRenderingTransaction;
