/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule CallbackQueue
 * @flow
 */

'use strict';

var PooledClass = require('PooledClass');

var invariant = require('fbjs/lib/invariant');
var validateCallback = require('validateCallback');

/**
 * A specialized pseudo-event module to help keep track of components waiting to
 * be notified when their DOM representations are available for use.
 *
 * This implements `PooledClass`, so you should never need to instantiate this.
 * Instead, use `CallbackQueue.getPooled()`.
 *
 * @class CallbackQueue
 * @implements PooledClass
 * @internal
 */
class CallbackQueue<T> {
  _callbacks: ?Array<() => void>;
  _contexts: ?Array<T>;

  constructor() {
    this._callbacks = null;
    this._contexts = null;
  }

  /**
   * Enqueues a callback to be invoked when `notifyAll` is invoked.
   *
   * @param {function} callback Invoked when `notifyAll` is invoked.
   * @param {?object} context Context to call `callback` with.
   * @internal
   */
  enqueue(callback: () => void, context: T) {
    this._callbacks = this._callbacks || [];
    this._callbacks.push(callback);
    this._contexts = this._contexts || [];
    this._contexts.push(context);
  }

  /**
   * Invokes all enqueued callbacks and clears the queue. This is invoked after
   * the DOM representation of a component has been created or updated.
   *
   * @internal
   */
  notifyAll() {
    var callbacks = this._callbacks;
    var contexts = this._contexts;
    if (callbacks && contexts) {
      invariant(
        callbacks.length === contexts.length,
        'Mismatched list of contexts in callback queue',
      );
      this._callbacks = null;
      this._contexts = null;
      for (var i = 0; i < callbacks.length; i++) {
        validateCallback(callbacks[i]);
        callbacks[i].call(contexts[i]);
      }
      callbacks.length = 0;
      contexts.length = 0;
    }
  }

  checkpoint() {
    return this._callbacks ? this._callbacks.length : 0;
  }

  rollback(len: number) {
    if (this._callbacks && this._contexts) {
      this._callbacks.length = len;
      this._contexts.length = len;
    }
  }

  /**
   * Resets the internal queue.
   *
   * @internal
   */
  reset() {
    this._callbacks = null;
    this._contexts = null;
  }

  /**
   * `PooledClass` looks for this.
   */
  destructor() {
    this.reset();
  }
}

module.exports = PooledClass.addPoolingTo(CallbackQueue);
