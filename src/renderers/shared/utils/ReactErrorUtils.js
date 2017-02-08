/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactErrorUtils
 * @flow
 */

'use strict';

var caughtError = null;

/**
 * Call a function while guarding against errors that happens within it.
 * Returns an error if it throws, otherwise null.
 *
 * @param {String} name of the guard to use for logging or debugging
 * @param {Function} func The function to invoke
 * @param {*} context The context to use when calling the function
 * @param {...*} args Arguments for function
 */
function invokeGuardedCallback<A, B, C, D, E, F, Context>(
  name: string | null,
  func: (A, B, C, D, E, F) => void,
  context: Context,
  a: A,
  b: B,
  c: C,
  d: D,
  e: E,
  f: F,
): Error | null {
  const funcArgs = Array.prototype.slice.call(arguments, 3);
  try {
    func.apply(context, funcArgs);
  } catch (error) {
    return error;
  }
  return null;
}

var ReactErrorUtils = {
  invokeGuardedCallback,
  invokeGuardedCallbackProd: invokeGuardedCallback,

  /**
   * Same as invokeGuardedCallback, but instead of returning an error, it stores
   * it in a global so it can be rethrown by `rethrowCaughtError` later.
   *
   * @param {String} name of the guard to use for logging or debugging
   * @param {Function} func The function to invoke
   * @param {*} context The context to use when calling the function
   * @param {...*} args Arguments for function
   */
  invokeGuardedCallbackAndCatchFirstError: function<A, B, C, D, E, F, Context>(
    name: string | null,
    func: (A, B, C, D, E, F) => void,
    context: Context,
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
  ): void {
    const error = ReactErrorUtils.invokeGuardedCallback.apply(this, arguments);
    if (error !== null && caughtError === null) {
      caughtError = error;
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
      typeof document !== 'undefined' &&
      typeof document.createEvent === 'function') {

    const fakeNode = document.createElement('react');
    let fakeEventError = null;
    const onFakeEventError = function(event) {
      fakeEventError = event.error;
    };

    ReactErrorUtils.invokeGuardedCallback = function(
      name,
      func,
      context,
      a,
      b,
      c,
      d,
      e,
      f
    ) {
      const funcArgs = Array.prototype.slice.call(arguments, 3);
      const boundFunc = function() {
        func.apply(context, funcArgs);
      };
      const evtType = 'react-' + (name ? name : 'invokeguardedcallback');
      window.addEventListener('error', onFakeEventError);
      fakeNode.addEventListener(evtType, boundFunc, false);
      const evt = document.createEvent('Event');
      evt.initEvent(evtType, false, false);
      fakeNode.dispatchEvent(evt);
      fakeNode.removeEventListener(evtType, boundFunc, false);
      window.removeEventListener('error', onFakeEventError);
      const returnVal = fakeEventError;
      fakeEventError = null;
      return returnVal;
    };
  }
}

module.exports = ReactErrorUtils;
