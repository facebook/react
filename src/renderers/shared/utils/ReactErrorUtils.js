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

const invariant = require('fbjs/lib/invariant');

const ReactErrorUtils = {
  // Used by Fiber to simulate a try-catch.
  _caughtError: null,
  _hasCaughtError: false,

  // Used by event system to capture/rethrow the first error.
  _rethrowError: null,
  _hasRethrowError: false,

  injection: {
    injectErrorUtils(injectedErrorUtils: Object) {
      invariant(
        typeof injectedErrorUtils.invokeGuardedCallback === 'function',
        'Injected invokeGuardedCallback() must be a function.',
      );
      invokeGuardedCallback = injectedErrorUtils.invokeGuardedCallback;
    },
  },

  /**
   * Call a function while guarding against errors that happens within it.
   * Returns an error if it throws, otherwise null.
   *
   * @param {String} name of the guard to use for logging or debugging
   * @param {Function} func The function to invoke
   * @param {*} context The context to use when calling the function
   * @param {...*} args Arguments for function
   */
  invokeGuardedCallback: function<A, B, C, D, E, F, Context>(
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
    invokeGuardedCallback.apply(ReactErrorUtils, arguments);
  },

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
    func: (a: A, b: B, c: C, d: D, e: E, f: F) => void,
    context: Context,
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
  ): void {
    ReactErrorUtils.invokeGuardedCallback.apply(this, arguments);
    if (ReactErrorUtils.hasCaughtError()) {
      const error = ReactErrorUtils.clearCaughtError();
      if (!ReactErrorUtils._hasRethrowError) {
        ReactErrorUtils._hasRethrowError = true;
        ReactErrorUtils._rethrowError = error;
      }
    }
  },

  /**
   * During execution of guarded functions we will capture the first error which
   * we will rethrow to be handled by the top level error handler.
   */
  rethrowCaughtError: function() {
    return rethrowCaughtError.apply(ReactErrorUtils, arguments);
  },

  hasCaughtError: function() {
    return ReactErrorUtils._hasCaughtError;
  },

  clearCaughtError: function() {
    if (ReactErrorUtils._hasCaughtError) {
      const error = ReactErrorUtils._caughtError;
      ReactErrorUtils._caughtError = null;
      ReactErrorUtils._hasCaughtError = false;
      return error;
    } else {
      invariant(
        false,
        'clearCaughtError was called but no error was captured. This error ' +
          'is likely caused by a bug in React. Please file an issue.',
      );
    }
  },
};

let invokeGuardedCallback = function(name, func, context, a, b, c, d, e, f) {
  ReactErrorUtils._hasCaughtError = false;
  ReactErrorUtils._caughtError = null;
  const funcArgs = Array.prototype.slice.call(arguments, 3);
  try {
    func.apply(context, funcArgs);
  } catch (error) {
    ReactErrorUtils._caughtError = error;
    ReactErrorUtils._hasCaughtError = true;
  }
};

if (__DEV__) {
  const ReactFeatureFlags = require('ReactFeatureFlags');

  if (
    typeof window !== 'undefined' &&
    typeof window.dispatchEvent === 'function' &&
    typeof document !== 'undefined' &&
    typeof document.createEvent === 'function'
  ) {
    let preventDefault = true;

    /**
     * To help development we can get better devtools integration by simulating a
     * real browser event.
     */
    const fakeNode = document.createElement('react');
    let depth = 0;

    const invokeGuardedCallbackDev = function(
      name,
      func,
      context,
      a,
      b,
      c,
      d,
      e,
      f,
    ) {
      ReactErrorUtils._hasCaughtError = false;
      ReactErrorUtils._caughtError = null;

      depth++;
      const thisDepth = depth;
      const funcArgs = Array.prototype.slice.call(arguments, 3);
      const boundFunc = function() {
        func.apply(context, funcArgs);
      };
      const onFakeEventError = function(event) {
        // Don't capture nested errors
        if (depth === thisDepth) {
          ReactErrorUtils._caughtError = event.error;
          ReactErrorUtils._hasCaughtError = true;
        }
        if (preventDefault) {
          event.preventDefault();
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
    };

    // Feature test the development version of invokeGuardedCallback
    // before enabling.
    let useInvokeGuardedCallbackDev;
    if (ReactFeatureFlags.forceInvokeGuardedCallbackDev) {
      // jsdom doesn't handle throwing null correctly (it fails when attempting
      // to access the 'message' property) but we need the ability to test it.
      // We use a feature flag to override the default feature test.
      useInvokeGuardedCallbackDev = true;
    } else {
      try {
        const err = new Error('test');
        invokeGuardedCallbackDev(
          null,
          () => {
            throw err;
          },
          null,
        );
        const A = ReactErrorUtils.clearCaughtError();

        invokeGuardedCallbackDev(
          null,
          () => {
            throw null;
          },
          null,
        );
        const B = ReactErrorUtils.clearCaughtError();

        if (A === err && B === null) {
          useInvokeGuardedCallbackDev = true;
        }
      } catch (e) {
        useInvokeGuardedCallbackDev = false;
      }
    }

    if (useInvokeGuardedCallbackDev) {
      invokeGuardedCallback = invokeGuardedCallbackDev;
      preventDefault = false;
    }
  }
}

let rethrowCaughtError = function() {
  if (ReactErrorUtils._hasRethrowError) {
    const error = ReactErrorUtils._rethrowError;
    ReactErrorUtils._rethrowError = null;
    ReactErrorUtils._hasRethrowError = false;
    throw error;
  }
};

module.exports = ReactErrorUtils;
