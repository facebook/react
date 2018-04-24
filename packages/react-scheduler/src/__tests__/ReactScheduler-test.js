/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let ReactScheduler;

describe('ReactScheduler', () => {
  beforeEach(() => {
    // mock the browser APIs which are used in react-scheduler:
    // - requestAnimationFrame should pass the DOMHighResTimeStamp argument
    // - calling 'window.postMessage' should actually fire postmessage handlers
    global.requestAnimationFrame = function(cb) {
      return setTimeout(() => {
        cb(Date.now());
      });
    };
    const originalAddEventListener = global.addEventListener;
    let postMessageCallback;
    global.addEventListener = function(eventName, callback, useCapture) {
      if (eventName === 'message') {
        postMessageCallback = callback;
      } else {
        originalAddEventListener(eventName, callback, useCapture);
      }
    };
    global.postMessage = function(messageKey, targetOrigin) {
      const postMessageEvent = {source: window, data: messageKey};
      if (postMessageCallback) {
        postMessageCallback(postMessageEvent);
      }
    };
    jest.resetModules();
    ReactScheduler = require('react-scheduler');
  });

  it('rIC calls the callback within the frame when not blocked', () => {
    const {rIC} = ReactScheduler;
    const cb = jest.fn();
    rIC(cb);
    jest.runAllTimers();
    expect(cb.mock.calls.length).toBe(1);
    // should not have timed out and should include a timeRemaining method
    expect(cb.mock.calls[0][0].didTimeout).toBe(false);
    expect(typeof cb.mock.calls[0][0].timeRemaining()).toBe('number');
  });

  it('rIC with multiple callbacks flushes previous cb when new one is passed', () => {
    const {rIC} = ReactScheduler;
    const callbackA = jest.fn();
    const callbackB = jest.fn();
    rIC(callbackA);
    // initially waits to call the callback
    expect(callbackA.mock.calls.length).toBe(0);
    // when second callback is passed, flushes first one
    rIC(callbackB);
    expect(callbackA.mock.calls.length).toBe(1);
    expect(callbackB.mock.calls.length).toBe(0);
    // after a delay, calls the latest callback passed
    jest.runAllTimers();
    expect(callbackA.mock.calls.length).toBe(1);
    expect(callbackB.mock.calls.length).toBe(1);
    // callbackA should not have timed out and should include a timeRemaining method
    expect(callbackA.mock.calls[0][0].didTimeout).toBe(false);
    expect(typeof callbackA.mock.calls[0][0].timeRemaining()).toBe('number');
    // callbackA should not have timed out and should include a timeRemaining method
    expect(callbackB.mock.calls[0][0].didTimeout).toBe(false);
    expect(typeof callbackB.mock.calls[0][0].timeRemaining()).toBe('number');
  });
  // TODO: test cIC and now
});
