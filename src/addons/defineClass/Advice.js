/**
 * Copyright 2013 Facebook, Inc.
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
 * @providesModule Advice
 */

'use strict';

var Advice = {
  /**
   * Creates a function which invokes the callback before the base function.
   * The callback is invoked with the same context and arguments as the wrapper
   * function. The return value is the same as it would have been otherwise.
   *
   * @param {function} base Function to be wrapped
   * @param {function} callback Function to be invoked before base
   * @return {function} Wrapped function
   */
  before: function wrappedBefore(base, callback) {
    return function() {
      callback.apply(this, arguments);
      return base.apply(this, arguments);
    };
  },

  /**
   * Creates a function which invokes the callback after the base function.
   * The callback is invoked with the same context and arguments as the wrapper
   * function. The return value is the same as it would have been otherwise.
   *
   * @param {function} base Function to be wrapped
   * @param {function} callback Function to be invoked after base
   * @return {function} Wrapped function
   */
  after: function(base, callback) {
    return function wrappedAfter() {
      var result = base.apply(this, arguments);
      callback.apply(this, arguments);
      return result;
    };
  },

  /**
   * Creates a function which invokes the callback with the base function
   * unshifted onto its arguments. The remaining arguments and context are
   * callback are preserved, but the return value is replaced with the return
   * value of the callback.
   *
   * @param {function} base Function to be wrapped
   * @param {function} callback Function to be invoked with base as first arg
   * @return {function} Wrapped function
   */
  around: function(base, callback) {
    return function wrappedAround() {
      var args = [];
      args.push(base.bind(this));
      for (var i = 0, l = arguments.length; i < l; i++) {
        args.push(arguments[i]);
      }
      return callback.apply(this, args);
    };
  },

  /**
   * Creates a function which takes a predicate, evaluates the predicate with
   * the same arguments and context as the base, and turns the function into a
   * no-op if the predicate evaluates to false.
   *
   * @param {function} base Function to be wrapped
   * @param {function(): boolean} predicate A predicate function
   * @return {function} Wrapped function
   */
  filter: function(base, predicate) {
    return function wrappedFiltered() {
      if (predicate.apply(this, arguments)) {
        return base.apply(this, arguments);
      }
    };
  }
};

module.exports = Advice;
