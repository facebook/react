/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Dispatcher
 *
 * The Dispatcher is capable of registering callbacks and invoking them.
 * More robust implementations than this would include a way to order the
 * callbacks for dependent Stores, and to guarantee that no two stores
 * created circular dependencies.
 */

var Promise = require('es6-promise').Promise;
var merge = require('react/lib/merge');

var _callbacks = [];
var _promises = [];

var Dispatcher = function() {};
Dispatcher.prototype = merge(Dispatcher.prototype, {

  /**
   * Register a Store's callback so that it may be invoked by an action.
   * @param {function} callback The callback to be registered.
   * @return {number} The index of the callback within the _callbacks array.
   */
  register: function(callback) {
    _callbacks.push(callback);
    return _callbacks.length - 1; // index
  },

  /**
   * dispatch
   * @param  {object} payload The data from the action.
   */
  dispatch: function(payload) {
    // First create array of promises for callbacks to reference.
    var resolves = [];
    var rejects = [];
    _promises = _callbacks.map(function(_, i) {
      return new Promise(function(resolve, reject) {
        resolves[i] = resolve;
        rejects[i] = reject;
      });
    });
    // Dispatch to callbacks and resolve/reject promises.
    _callbacks.forEach(function(callback, i) {
      // Callback can return an obj, to resolve, or a promise, to chain.
      // See waitFor() for why this might be useful.
      Promise.resolve(callback(payload)).then(function() {
        resolves[i](payload);
      }, function() {
        rejects[i](new Error('Dispatcher callback unsuccessful'));
      });
    });
    _promises = [];
  },

  /**
   * Allows a store to wait for the registered callbacks of other stores
   * to get invoked before its own does.
   * This function is not used by this TodoMVC example application, but
   * it is very useful in a larger, more complex application.
   *
   * Example usage where StoreB waits for StoreA:
   *
   *   var StoreA = merge(EventEmitter.prototype, {
   *     // other methods omitted
   *
   *     dispatchIndex: Dispatcher.register(function(payload) {
   *       // switch statement with lots of cases
   *     })
   *   }
   *
   *   var StoreB = merge(EventEmitter.prototype, {
   *     // other methods omitted
   *
   *     dispatchIndex: Dispatcher.register(function(payload) {
   *       switch(payload.action.actionType) {
   *
   *         case MyConstants.FOO_ACTION:
   *           Dispatcher.waitFor([StoreA.dispatchIndex], function() {
   *             // Do stuff only after StoreA's callback returns.
   *           });
   *       }
   *     })
   *   }
   *
   * It should be noted that if StoreB waits for StoreA, and StoreA waits for
   * StoreB, a circular dependency will occur, but no error will be thrown.
   * A more robust Dispatcher would issue a warning in this scenario.
   */
  waitFor: function(/*array*/ promiseIndexes, /*function*/ callback) {
    var selectedPromises = promiseIndexes.map(function(index) {
      return _promises[index];
    });
    return Promise.all(selectedPromises).then(callback);
  }

});

module.exports = Dispatcher;
