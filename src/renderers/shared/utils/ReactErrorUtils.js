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

let caughtError = null;

function catchFirstError(error) {
  if (error !== null && caughtError === null) {
    caughtError = error;
  }
}

/**
 * Call a function while guarding against errors that happens within it.
 * Returns an error if it throws, otherwise null.
 *
 * @param {String} name of the guard to use for logging or debugging
 * @param {Function} func The function to invoke
 * @param {*} context The context to use when calling the function
 * @param {Function} onError Callback to fire on error
 * @param {...*} args Arguments for function
 */
const ReactErrorUtils = {
  invokeGuardedCallback: function<A, B, C, D, E, F, Context>(
    name: string | null,
    func: (a: A, b: B, c: C, d: D, e: E, f: F) => void,
    context: Context,
    onError: (error: any) => mixed,
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
  ): void {
    const funcArgs = Array.prototype.slice.call(arguments, 4);
    try {
      func.apply(context, funcArgs);
    } catch (error) {
      onError(error);
    }
  },

  /**
   * Same as invokeGuardedCallback, but instead of returning an error, it stores
   * it in a global so it can be rethrown by `rethrowCaughtError` later.
   *
   * @param {String} name of the guard to use for logging or debugging
   * @param {Function} func The function to invoke
   * @param {*} context The context to use when calling the function
   * @param {Function} onError Callback to fire on error
   * @param {...*} args Arguments for function
   */
  invokeGuardedCallbackAndCatchFirstError: function<A, B, C, D, E, F, Context>(
    name: string | null,
    func: (a: A, b: B, c: C, d: D, e: E, f: F) => void,
    context: Context,
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
  ): void {
    const funcArgs = Array.prototype.slice.call(arguments, 3);
    ReactErrorUtils.invokeGuardedCallback.call(
      this,
      name,
      func,
      context,
      catchFirstError,
      ...funcArgs,
    );
  },

  /**
   * During execution of guarded functions we will capture the first error which
   * we will rethrow to be handled by the top level error handler.
   */
  rethrowCaughtError: function() {
    if (caughtError) {
      const error = caughtError;
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
  if (
    typeof window !== 'undefined' &&
    typeof window.dispatchEvent === 'function' &&
    typeof document !== 'undefined' &&
    typeof document.createEvent === 'function'
  ) {
    const fakeNode = document.createElement('react');
    let depth = 0;

    ReactErrorUtils.invokeGuardedCallback = function(
      name,
      func,
      context,
      onError,
      a,
      b,
      c,
      d,
      e,
      f,
    ) {
      depth++;

      const thisDepth = depth;
      const funcArgs = Array.prototype.slice.call(arguments, 4);
      const boundFunc = function() {
        func.apply(context, funcArgs);
      };

      let didCaptureError = false;
      let fakeEventError;
      const onFakeEventError = function(event) {
        // Don't capture nested errors
        if (depth === thisDepth) {
          didCaptureError = true;
          fakeEventError = event.error;
        }
      };

      const evtType = `react-${name ? name : 'invokeguardedcallback'}-${depth}`;
      window.addEventListener('error', onFakeEventError);
      fakeNode.addEventListener(evtType, boundFunc, false);
      const evt = document.createEvent('Event');
      evt.initEvent(evtType, false, false);
      fakeNode.dispatchEvent(evt);
      fakeNode.removeEventListener(evtType, boundFunc, false);
      window.removeEventListener('error', onFakeEventError);

      depth--;

      if (didCaptureError) {
        onError(fakeEventError);
      }
    };
  }
}

module.exports = ReactErrorUtils;
