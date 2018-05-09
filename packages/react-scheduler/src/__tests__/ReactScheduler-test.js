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

  describe('scheduleCallback', () => {
    it('calls the callback within the frame when not blocked', () => {
      const {scheduleCallback} = ReactScheduler;
      const cb = jest.fn();
      scheduleCallback(cb);
      jest.runAllTimers();
      expect(cb.mock.calls.length).toBe(1);
      // should not have timed out and should include a timeRemaining method
      expect(cb.mock.calls[0][0].didTimeout).toBe(false);
      expect(typeof cb.mock.calls[0][0].timeRemaining()).toBe('number');
    });

    describe('with multiple callbacks', () => {
      it('accepts multiple callbacks and calls within frame when not blocked', () => {
        const {scheduleCallback} = ReactScheduler;
        const callbackLog = [];
        const callbackA = jest.fn(() => callbackLog.push('A'));
        const callbackB = jest.fn(() => callbackLog.push('B'));
        scheduleCallback(callbackA);
        // initially waits to call the callback
        expect(callbackLog).toEqual([]);
        // waits while second callback is passed
        scheduleCallback(callbackB);
        expect(callbackLog).toEqual([]);
        // after a delay, calls as many callbacks as it has time for
        jest.runAllTimers();
        expect(callbackLog).toEqual(['A', 'B']);
        // callbackA should not have timed out and should include a timeRemaining method
        expect(callbackA.mock.calls[0][0].didTimeout).toBe(false);
        expect(typeof callbackA.mock.calls[0][0].timeRemaining()).toBe(
          'number',
        );
        // callbackA should not have timed out and should include a timeRemaining method
        expect(callbackB.mock.calls[0][0].didTimeout).toBe(false);
        expect(typeof callbackB.mock.calls[0][0].timeRemaining()).toBe(
          'number',
        );
      });

      it(
        'schedules callbacks in correct order and' +
          'keeps calling them if there is time',
        () => {
          const {scheduleCallback} = ReactScheduler;
          const callbackLog = [];
          const callbackA = jest.fn(() => {
            callbackLog.push('A');
            scheduleCallback(callbackC);
          });
          const callbackB = jest.fn(() => {
            callbackLog.push('B');
          });
          const callbackC = jest.fn(() => {
            callbackLog.push('C');
          });

          scheduleCallback(callbackA);
          // initially waits to call the callback
          expect(callbackLog).toEqual([]);
          // continues waiting while B is scheduled
          scheduleCallback(callbackB);
          expect(callbackLog).toEqual([]);
          // after a delay, calls the scheduled callbacks,
          // and also calls new callbacks scheduled by current callbacks
          jest.runAllTimers();
          expect(callbackLog).toEqual(['A', 'B', 'C']);
        },
      );

      it('schedules callbacks in correct order when callbacks have many nested scheduleCallback calls', () => {
        const {scheduleCallback} = ReactScheduler;
        const callbackLog = [];
        const callbackA = jest.fn(() => {
          callbackLog.push('A');
          scheduleCallback(callbackC);
          scheduleCallback(callbackD);
        });
        const callbackB = jest.fn(() => {
          callbackLog.push('B');
          scheduleCallback(callbackE);
          scheduleCallback(callbackF);
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

        scheduleCallback(callbackA);
        scheduleCallback(callbackB);
        // initially waits to call the callback
        expect(callbackLog).toEqual([]);
        // while flushing callbacks, calls as many as it has time for
        jest.runAllTimers();
        expect(callbackLog).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
      });

      it('schedules callbacks in correct order when they use scheduleCallback to schedule themselves', () => {
        const {scheduleCallback} = ReactScheduler;
        const callbackLog = [];
        let callbackAIterations = 0;
        const callbackA = jest.fn(() => {
          if (callbackAIterations < 1) {
            scheduleCallback(callbackA);
          }
          callbackLog.push('A' + callbackAIterations);
          callbackAIterations++;
        });
        const callbackB = jest.fn(() => callbackLog.push('B'));

        scheduleCallback(callbackA);
        // initially waits to call the callback
        expect(callbackLog).toEqual([]);
        scheduleCallback(callbackB);
        expect(callbackLog).toEqual([]);
        // after a delay, calls the latest callback passed
        jest.runAllTimers();
        expect(callbackLog).toEqual(['A0', 'B', 'A1']);
      });
    });
  });

  describe('cancelScheduledCallback', () => {
    it('cancels the scheduled callback', () => {
      const {scheduleCallback, cancelScheduledCallback} = ReactScheduler;
      const cb = jest.fn();
      const callbackId = scheduleCallback(cb);
      expect(cb.mock.calls.length).toBe(0);
      cancelScheduledCallback(callbackId);
      jest.runAllTimers();
      expect(cb.mock.calls.length).toBe(0);
    });

    describe('with multiple callbacks', () => {
      it('when one callback cancels the next one', () => {
        const {scheduleCallback, cancelScheduledCallback} = ReactScheduler;
        const callbackLog = [];
        let callbackBId;
        const callbackA = jest.fn(() => {
          callbackLog.push('A');
          cancelScheduledCallback(callbackBId);
        });
        const callbackB = jest.fn(() => callbackLog.push('B'));
        scheduleCallback(callbackA);
        callbackBId = scheduleCallback(callbackB);
        // Initially doesn't call anything
        expect(callbackLog).toEqual([]);
        jest.runAllTimers();
        // B should not get called because A cancelled B
        expect(callbackLog).toEqual(['A']);
        expect(callbackB.mock.calls.length).toBe(0);
      });
    });
  });

  // TODO: test 'now'
});
