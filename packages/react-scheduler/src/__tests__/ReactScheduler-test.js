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
    // should not have timed out and should include a timeRemaining method
    expect(cb.mock.calls[0][0].didTimeout).toBe(false);
    expect(typeof cb.mock.calls[0][0].timeRemaining()).toBe('number');
  });

  describe('with multiple callbacks', () => {
    it('flushes previous cb when new one is passed', () => {
      const {rIC} = ReactScheduler;
      const callbackLog = [];
      const callbackA = jest.fn(() => callbackLog.push('A'));
      const callbackB = jest.fn(() => callbackLog.push('B'));
      rIC(callbackA);
      // initially waits to call the callback
      expect(callbackLog.length).toBe(0);
      // when second callback is passed, flushes first one
      rIC(callbackB);
      expect(callbackLog.length).toBe(1);
      expect(callbackLog[0]).toBe('A');
      // after a delay, calls the latest callback passed
      jest.runAllTimers();
      expect(callbackLog.length).toBe(2);
      expect(callbackLog[0]).toBe('A');
      expect(callbackLog[1]).toBe('B');
      // callbackA should not have timed out and should include a timeRemaining method
      expect(callbackA.mock.calls[0][0].didTimeout).toBe(false);
      expect(typeof callbackA.mock.calls[0][0].timeRemaining()).toBe('number');
      // callbackA should not have timed out and should include a timeRemaining method
      expect(callbackB.mock.calls[0][0].didTimeout).toBe(false);
      expect(typeof callbackB.mock.calls[0][0].timeRemaining()).toBe('number');
    });

    it('schedules callbacks in correct order when a callback uses rIC before its own logic', () => {
      const {rIC} = ReactScheduler;
      const callbackLog = [];
      const callbackA = jest.fn(() => {
        callbackLog.push('A');
        rIC(callbackC);
      });
      const callbackB = jest.fn(() => {
        callbackLog.push('B');
      });
      const callbackC = jest.fn(() => {
        callbackLog.push('C');
      });

      rIC(callbackA);
      // initially waits to call the callback
      expect(callbackLog.length).toBe(0);
      // when second callback is passed, flushes first one
      // callbackA scheduled callbackC, which flushes callbackB
      rIC(callbackB);
      expect(callbackLog.length).toBe(2);
      expect(callbackLog[0]).toBe('A');
      expect(callbackLog[1]).toBe('B');
      // after a delay, calls the latest callback passed
      jest.runAllTimers();
      expect(callbackLog.length).toBe(3);
      expect(callbackLog[0]).toBe('A');
      expect(callbackLog[1]).toBe('B');
      expect(callbackLog[2]).toBe('C');
    });

    it('schedules callbacks in correct order when callbacks have many nested rIC calls', () => {
      const {rIC} = ReactScheduler;
      const callbackLog = [];
      const callbackA = jest.fn(() => {
        callbackLog.push('A');
        rIC(callbackC);
        rIC(callbackD);
      });
      const callbackB = jest.fn(() => {
        callbackLog.push('B');
        rIC(callbackE);
        rIC(callbackF);
      });
      const callbackC = jest.fn(() => {
        callbackLog.push('C');
      });
      const callbackD = jest.fn(() => {
        callbackLog.push('D');
      });
      const callbackE = jest.fn(() => {
        callbackLog.push('E');
      });
      const callbackF = jest.fn(() => {
        callbackLog.push('F');
      });

      rIC(callbackA);
      // initially waits to call the callback
      expect(callbackLog.length).toBe(0);
      // when second callback is passed, flushes first one
      // callbackA scheduled callbackC, which flushes callbackB
      rIC(callbackB);
      expect(callbackLog.length).toBe(5);
      expect(callbackLog[0]).toBe('A');
      expect(callbackLog[1]).toBe('B');
      expect(callbackLog[2]).toBe('C');
      expect(callbackLog[3]).toBe('D');
      expect(callbackLog[4]).toBe('E');
      // after a delay, calls the latest callback passed
      jest.runAllTimers();
      expect(callbackLog.length).toBe(6);
      expect(callbackLog[5]).toBe('F');
    });

    it('allows each callback finish running before flushing others', () => {
      const {rIC} = ReactScheduler;
      const callbackLog = [];
      const callbackA = jest.fn(() => {
        // rIC should wait to flush any more until this callback finishes
        rIC(callbackC);
        callbackLog.push('A');
      });
      const callbackB = jest.fn(() => callbackLog.push('B'));
      const callbackC = jest.fn(() => callbackLog.push('C'));

      rIC(callbackA);
      // initially waits to call the callback
      expect(callbackLog.length).toBe(0);
      // when second callback is passed, flushes first one
      // callbackA scheduled callbackC, which flushes callbackB
      rIC(callbackB);
      expect(callbackLog.length).toBe(2);
      expect(callbackLog[0]).toBe('A');
      expect(callbackLog[1]).toBe('B');
      // after a delay, calls the latest callback passed
      jest.runAllTimers();
      expect(callbackLog.length).toBe(3);
      expect(callbackLog[0]).toBe('A');
      expect(callbackLog[1]).toBe('B');
      expect(callbackLog[2]).toBe('C');
    });

    it('schedules callbacks in correct order when they use rIC to schedule themselves', () => {
      const {rIC} = ReactScheduler;
      const callbackLog = [];
      let callbackAIterations = 0;
      const callbackA = jest.fn(() => {
        if (callbackAIterations < 1) {
          rIC(callbackA);
        }
        callbackLog.push('A' + callbackAIterations);
        callbackAIterations++;
      });
      const callbackB = jest.fn(() => callbackLog.push('B'));

      rIC(callbackA);
      // initially waits to call the callback
      expect(callbackLog.length).toBe(0);
      // when second callback is passed, flushes first one
      // callbackA scheduled callbackA again, which flushes callbackB
      rIC(callbackB);
      expect(callbackLog.length).toBe(2);
      expect(callbackLog[0]).toBe('A0');
      expect(callbackLog[1]).toBe('B');
      // after a delay, calls the latest callback passed
      jest.runAllTimers();
      expect(callbackLog.length).toBe(3);
      expect(callbackLog[0]).toBe('A0');
      expect(callbackLog[1]).toBe('B');
      expect(callbackLog[2]).toBe('A1');
    });
  });

  // TODO: test cIC and now
});
