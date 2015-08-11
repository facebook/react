/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactErrorUtils
 * @typechecks
 */

'use strict';

var caughtError = null;

var ReactErrorUtils = {
  /**
   * Call a function while guarding against errors that happens within it.
   *
   * @param name (?String) name of the guard to use for logging or debugging
   * @param func (Function) function to invoke
   * @param a (*) a First argument
   * @param b (*) b Second argument
   */
  invokeGuardedCallback: function(name, func, a, b) {
    try {
      return func(a, b);
    } catch(x) {
      if (caughtError === null) {
        caughtError = x;
      }
      return undefined;
    }
  },

  /**
   * During execution of guarded functions we will capture the first error which
   * we will rethrow to be handled by the top level error handler.
   */
  rethrowCaughtError: function() {
    if (caughtError) {
      var error = caughtError;
      caughtError = null;
      throw error;
    }
  },
};

if (__DEV__) {
  /**
   * To help development we can get better devtools integration by simulating a
   * real browser event.
   */
  if (typeof window !== 'undefined' &&
      typeof window.dispatchEvent === 'function' &&
      typeof Event === 'function') {
    var fakeNode = document.createElement('react');
    ReactErrorUtils.invokeGuardedCallback = function(name, func, a, b) {
      var boundFunc = func.bind(null, a, b);
      fakeNode.addEventListener(name, boundFunc, false);
      fakeNode.dispatchEvent(new Event(name));
      fakeNode.removeEventListener(name, boundFunc, false);
    };
  }
}

module.exports = ReactErrorUtils;
