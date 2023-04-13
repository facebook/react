/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// $FlowFixMe[missing-this-annot]
function invokeGuardedCallbackProd<Args: Array<mixed>, Context>(
  name: string | null,
  func: (...Args) => mixed,
  context: Context,
): void {
  // $FlowFixMe[method-unbinding]
  const funcArgs = Array.prototype.slice.call(arguments, 3);
  try {
    // $FlowFixMe[incompatible-call] Flow doesn't understand the arguments splicing.
    func.apply(context, funcArgs);
  } catch (error) {
    this.onError(error);
  }
}

let invokeGuardedCallbackImpl: <Args: Array<mixed>, Context>(
  name: string | null,
  func: (...Args) => mixed,
  context: Context,
) => void = invokeGuardedCallbackProd;

if (__DEV__) {
  // In DEV mode, we swap out invokeGuardedCallback for a special version
  // that plays more nicely with the browser's DevTools. The idea is to preserve
  // "Pause on exceptions" behavior. Because React wraps all user-provided
  // functions in invokeGuardedCallback, and the production version of
  // invokeGuardedCallback uses a try-catch, all user exceptions are treated
  // like caught exceptions, and the DevTools won't pause unless the developer
  // takes the extra step of enabling pause on caught exceptions. This is
  // unintuitive, though, because even though React has caught the error, from
  // the developer's perspective, the error is uncaught.
  //
  // To preserve the expected "Pause on exceptions" behavior, we don't use a
  // try-catch in DEV. Instead, we synchronously dispatch a fake event to a fake
  // DOM node, and call the user-provided callback from inside an event handler
  // for that fake event. If the callback throws, the error is "captured" using
  // a global event handler. But because the error happens in a different
  // event loop context, it does not interrupt the normal program flow.
  // Effectively, this gives us try-catch behavior without actually using
  // try-catch. Neat!

  // Check that the browser supports the APIs we need to implement our special
  // DEV version of invokeGuardedCallback
  if (
    typeof window !== 'undefined' &&
    typeof window.dispatchEvent === 'function' &&
    typeof document !== 'undefined' &&
    // $FlowFixMe[method-unbinding]
    typeof document.createEvent === 'function'
  ) {
    const fakeNode = document.createElement('react');

    invokeGuardedCallbackImpl = function invokeGuardedCallbackDev<
      Args: Array<mixed>,
      Context,
      // $FlowFixMe[missing-this-annot]
    >(name: string | null, func: (...Args) => mixed, context: Context): void {
      // If document doesn't exist we know for sure we will crash in this method
      // when we call document.createEvent(). However this can cause confusing
      // errors: https://github.com/facebook/create-react-app/issues/3482
      // So we preemptively throw with a better message instead.
      if (typeof document === 'undefined' || document === null) {
        throw new Error(
          'The `document` global was defined when React was initialized, but is not ' +
            'defined anymore. This can happen in a test environment if a component ' +
            'schedules an update from an asynchronous callback, but the test has already ' +
            'finished running. To solve this, you can either unmount the component at ' +
            'the end of your test (and ensure that any asynchronous operations get ' +
            'canceled in `componentWillUnmount`), or you can change the test itself ' +
            'to be asynchronous.',
        );
      }

      const evt = document.createEvent('Event');

      let didCall = false;
      // Keeps track of whether the user-provided callback threw an error. We
      // set this to true at the beginning, then set it to false right after
      // calling the function. If the function errors, `didError` will never be
      // set to false. This strategy works even if the browser is flaky and
      // fails to call our global error handler, because it doesn't rely on
      // the error event at all.
      let didError = true;

      // Keeps track of the value of window.event so that we can reset it
      // during the callback to let user code access window.event in the
      // browsers that support it.
      const windowEvent = window.event;

      // Keeps track of the descriptor of window.event to restore it after event
      // dispatching: https://github.com/facebook/react/issues/13688
      const windowEventDescriptor = Object.getOwnPropertyDescriptor(
        window,
        'event',
      );

      function restoreAfterDispatch() {
        // We immediately remove the callback from event listeners so that
        // nested `invokeGuardedCallback` calls do not clash. Otherwise, a
        // nested call would trigger the fake event handlers of any call higher
        // in the stack.
        fakeNode.removeEventListener(evtType, callCallback, false);

        // We check for window.hasOwnProperty('event') to prevent the
        // window.event assignment in both IE <= 10 as they throw an error
        // "Member not found" in strict mode, and in Firefox which does not
        // support window.event.
        if (
          typeof window.event !== 'undefined' &&
          window.hasOwnProperty('event')
        ) {
          window.event = windowEvent;
        }
      }

      // Create an event handler for our fake event. We will synchronously
      // dispatch our fake event using `dispatchEvent`. Inside the handler, we
      // call the user-provided callback.
      // $FlowFixMe[method-unbinding]
      const funcArgs = Array.prototype.slice.call(arguments, 3);
      function callCallback() {
        didCall = true;
        restoreAfterDispatch();
        // $FlowFixMe[incompatible-call] Flow doesn't understand the arguments splicing.
        func.apply(context, funcArgs);
        didError = false;
      }

      // Create a global error event handler. We use this to capture the value
      // that was thrown. It's possible that this error handler will fire more
      // than once; for example, if non-React code also calls `dispatchEvent`
      // and a handler for that event throws. We should be resilient to most of
      // those cases. Even if our error event handler fires more than once, the
      // last error event is always used. If the callback actually does error,
      // we know that the last error event is the correct one, because it's not
      // possible for anything else to have happened in between our callback
      // erroring and the code that follows the `dispatchEvent` call below. If
      // the callback doesn't error, but the error event was fired, we know to
      // ignore it because `didError` will be false, as described above.
      let error;
      // Use this to track whether the error event is ever called.
      let didSetError = false;
      let isCrossOriginError = false;

      // $FlowFixMe[missing-local-annot]
      function handleWindowError(event) {
        error = event.error;
        didSetError = true;
        if (error === null && event.colno === 0 && event.lineno === 0) {
          isCrossOriginError = true;
        }
        if (event.defaultPrevented) {
          // Some other error handler has prevented default.
          // Browsers silence the error report if this happens.
          // We'll remember this to later decide whether to log it or not.
          if (error != null && typeof error === 'object') {
            try {
              error._suppressLogging = true;
            } catch (inner) {
              // Ignore.
            }
          }
        }
      }

      // Create a fake event type.
      const evtType = `react-${name ? name : 'invokeguardedcallback'}`;

      // Attach our event handlers
      window.addEventListener('error', handleWindowError);
      fakeNode.addEventListener(evtType, callCallback, false);

      // Synchronously dispatch our fake event. If the user-provided function
      // errors, it will trigger our global error handler.
      evt.initEvent(evtType, false, false);
      fakeNode.dispatchEvent(evt);

      if (windowEventDescriptor) {
        Object.defineProperty(window, 'event', windowEventDescriptor);
      }

      if (didCall && didError) {
        if (!didSetError) {
          // The callback errored, but the error event never fired.
          // eslint-disable-next-line react-internal/prod-error-codes
          error = new Error(
            'An error was thrown inside one of your components, but React ' +
              "doesn't know what it was. This is likely due to browser " +
              'flakiness. React does its best to preserve the "Pause on ' +
              'exceptions" behavior of the DevTools, which requires some ' +
              "DEV-mode only tricks. It's possible that these don't work in " +
              'your browser. Try triggering the error in production mode, ' +
              'or switching to a modern browser. If you suspect that this is ' +
              'actually an issue with React, please file an issue.',
          );
        } else if (isCrossOriginError) {
          // eslint-disable-next-line react-internal/prod-error-codes
          error = new Error(
            "A cross-origin error was thrown. React doesn't have access to " +
              'the actual error object in development. ' +
              'See https://reactjs.org/link/crossorigin-error for more information.',
          );
        }
        this.onError(error);
      }

      // Remove our event listeners
      window.removeEventListener('error', handleWindowError);

      if (!didCall) {
        // Something went really wrong, and our event was not dispatched.
        // https://github.com/facebook/react/issues/16734
        // https://github.com/facebook/react/issues/16585
        // Fall back to the production implementation.
        restoreAfterDispatch();
        return invokeGuardedCallbackProd.apply(this, arguments);
      }
    };
  }
}

export default invokeGuardedCallbackImpl;
