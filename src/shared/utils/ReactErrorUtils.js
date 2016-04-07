/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactErrorUtils
 */

'use strict';

var SyntheticDragEvent = require('SyntheticDragEvent');

var caughtError = null;

/**
 * Call a function while guarding against errors that happens within it.
 *
 * @param {?String} name of the guard to use for logging or debugging
 * @param {Function} func The function to invoke
 * @param {*} a First argument
 * @param {*} b Second argument
 */
function invokeGuardedCallback(name, func, a, b) {
  try {
    return func(a, b);
  } catch (x) {
    if (caughtError === null) {
      caughtError = x;
    }
    return undefined;
  }
}

var ReactErrorUtils = {
  invokeGuardedCallback: invokeGuardedCallback,

  /**
   * Invoked by ReactTestUtils.Simulate so that any errors thrown by the event
   * handler are sure to be rethrown by rethrowCaughtError.
   */
  invokeGuardedCallbackWithCatch: invokeGuardedCallback,

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
    var fakeNode = document.createElement('react');
    ReactErrorUtils.invokeGuardedCallback = function(name, func, a, b) {
      if (!canWrapEvent(a)) {
        invokeGuardedCallback(name, func, a, b);
        return;
      }

      var boundFunc = func.bind(null, a, b);
      var evtType = `react-${name}`;
      fakeNode.addEventListener(evtType, boundFunc, false);
      var evt = document.createEvent('Event');
      evt.initEvent(evtType, false, false);
      fakeNode.dispatchEvent(evt);
      fakeNode.removeEventListener(evtType, boundFunc, false);
    };
  }

  var cacheCanWrapEvent = null;

  /**
   * IE and Edge don't allow access to the DataTransfer.dropEffect property when
   * it's wrapped in another event. This function detects whether we're in an
   * environment that behaves this way.
   *
   * @param {*} ev Event that is being tested
   */
  function canWrapEvent(ev) {
    if (!(ev instanceof SyntheticDragEvent)) {
      return true;
    } else if (cacheCanWrapEvent !== null) {
      return cacheCanWrapEvent;
    }

    var canAccessDropEffect = false;
    function handleWrappedEvent() {
      try {
        ev.dataTransfer.dropEffect; // eslint-disable-line no-unused-expressions
        canAccessDropEffect = true;
      } catch (e) {}
    }

    var wrappedEventName = 'react-wrappeddragevent';
    var wrappedEvent = document.createEvent('Event');
    wrappedEvent.initEvent(wrappedEventName, false, false);
    fakeNode.addEventListener(wrappedEventName, handleWrappedEvent, false);
    fakeNode.dispatchEvent(wrappedEvent);
    fakeNode.removeEventListener(wrappedEventName, handleWrappedEvent, false);

    cacheCanWrapEvent = canAccessDropEffect;
    return canAccessDropEffect;
  }
}

module.exports = ReactErrorUtils;
