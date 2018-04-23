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
    // TODO pull this into helper method, reduce repetition.
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
    // should have ... TODO details on what we expect
    expect(cb.mock.calls[0][0].didTimeout).toBe(false);
    expect(typeof cb.mock.calls[0][0].timeRemaining()).toBe('number');
  });

  // TODO: test cIC and now
});
