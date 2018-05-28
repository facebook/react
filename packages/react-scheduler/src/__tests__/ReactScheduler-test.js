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
type FrameTimeoutConfigType = {
  // should only specify one or the other
  timeLeftInFrame: ?number,
  timePastFrameDeadline: ?number,
};

describe('ReactScheduler', () => {
  let rAFCallbacks = [];
  let postMessageCallback;
  let postMessageEvents = [];

  function runPostMessageCallbacks(config: FrameTimeoutConfigType) {
    let timeLeftInFrame = 0;
    if (typeof config.timeLeftInFrame === 'number') {
      timeLeftInFrame = config.timeLeftInFrame;
    } else if (typeof config.timePastFrameDeadline === 'number') {
      timeLeftInFrame = -1 * config.timePastFrameDeadline;
    }
    currentTime = startOfLatestFrame + frameSize - timeLeftInFrame;
    if (postMessageCallback) {
      while (postMessageEvents.length) {
        postMessageCallback(postMessageEvents.shift());
      }
    }
  }
  function runRAFCallbacks() {
    startOfLatestFrame += frameSize;
    currentTime = startOfLatestFrame;
    rAFCallbacks.forEach(cb => cb());
    rAFCallbacks = [];
  }
  function advanceOneFrame(config: FrameTimeoutConfigType = {}) {
    runRAFCallbacks();
    runPostMessageCallbacks(config);
  }

  let frameSize = 33;
  let startOfLatestFrame = Date.now();
  let currentTime = Date.now();

  beforeEach(() => {
    // TODO pull this into helper method, reduce repetition.
    // mock the browser APIs which are used in react-scheduler:
    // - requestAnimationFrame should pass the DOMHighResTimeStamp argument
    // - calling 'window.postMessage' should actually fire postmessage handlers
    // - Date.now should return the correct thing
    global.requestAnimationFrame = function(cb) {
      return rAFCallbacks.push(() => {
        cb(startOfLatestFrame);
      });
    };
    const originalAddEventListener = global.addEventListener;
    postMessageCallback = null;
    postMessageEvents = [];
    global.addEventListener = function(eventName, callback, useCapture) {
      if (eventName === 'message') {
        postMessageCallback = callback;
      } else {
        originalAddEventListener(eventName, callback, useCapture);
      }
    };
    global.postMessage = function(messageKey, targetOrigin) {
      const postMessageEvent = {source: window, data: messageKey};
      postMessageEvents.push(postMessageEvent);
    };
    global.Date.now = function() {
      return currentTime;
    };
    jest.resetModules();
    ReactScheduler = require('react-scheduler');
  });

  describe('scheduleWork', () => {
    it('calls the callback within the frame when not blocked', () => {
      const {scheduleWork} = ReactScheduler;
      const cb = jest.fn();
      scheduleWork(cb);
      advanceOneFrame({timeLeftInFrame: 15});
      expect(cb).toHaveBeenCalledTimes(1);
      // should not have timed out and should include a timeRemaining method
      expect(cb.mock.calls[0][0].didTimeout).toBe(false);
      expect(typeof cb.mock.calls[0][0].timeRemaining()).toBe('number');
    });

    describe('with multiple callbacks', () => {
      it('accepts multiple callbacks and calls within frame when not blocked', () => {
        const {scheduleWork} = ReactScheduler;
        const callbackLog = [];
        const callbackA = jest.fn(() => callbackLog.push('A'));
        const callbackB = jest.fn(() => callbackLog.push('B'));
        scheduleWork(callbackA);
        // initially waits to call the callback
        expect(callbackLog).toEqual([]);
        // waits while second callback is passed
        scheduleWork(callbackB);
        expect(callbackLog).toEqual([]);
        // after a delay, calls as many callbacks as it has time for
        advanceOneFrame({timeLeftInFrame: 15});
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

      it("accepts callbacks betweeen animationFrame and postMessage and doesn't stall", () => {
        const {scheduleWork} = ReactScheduler;
        const callbackLog = [];
        const callbackA = jest.fn(() => callbackLog.push('A'));
        const callbackB = jest.fn(() => callbackLog.push('B'));
        const callbackC = jest.fn(() => callbackLog.push('C'));
        scheduleWork(callbackA);
        // initially waits to call the callback
        expect(callbackLog).toEqual([]);
        runRAFCallbacks();
        // this should schedule work *after* the requestAnimationFrame but before the message handler
        scheduleWork(callbackB);
        expect(callbackLog).toEqual([]);
        // now it should drain the message queue and do all scheduled work
        runPostMessageCallbacks({timeLeftInFrame: 15});
        expect(callbackLog).toEqual(['A', 'B']);

        // advances timers, now with an empty queue of work (to ensure they don't deadlock)
        advanceOneFrame({timeLeftInFrame: 15});

        // see if more work can be done now.
        scheduleWork(callbackC);
        expect(callbackLog).toEqual(['A', 'B']);
        advanceOneFrame({timeLeftInFrame: 15});
        expect(callbackLog).toEqual(['A', 'B', 'C']);
      });

      it(
        'schedules callbacks in correct order and' +
          'keeps calling them if there is time',
        () => {
          const {scheduleWork} = ReactScheduler;
          const callbackLog = [];
          const callbackA = jest.fn(() => {
            callbackLog.push('A');
            scheduleWork(callbackC);
          });
          const callbackB = jest.fn(() => {
            callbackLog.push('B');
          });
          const callbackC = jest.fn(() => {
            callbackLog.push('C');
          });

          scheduleWork(callbackA);
          // initially waits to call the callback
          expect(callbackLog).toEqual([]);
          // continues waiting while B is scheduled
          scheduleWork(callbackB);
          expect(callbackLog).toEqual([]);
          // after a delay, calls the scheduled callbacks,
          // and also calls new callbacks scheduled by current callbacks
          advanceOneFrame({timeLeftInFrame: 15});
          expect(callbackLog).toEqual(['A', 'B', 'C']);
        },
      );

      it('schedules callbacks in correct order when callbacks have many nested scheduleWork calls', () => {
        const {scheduleWork} = ReactScheduler;
        const callbackLog = [];
        const callbackA = jest.fn(() => {
          callbackLog.push('A');
          scheduleWork(callbackC);
          scheduleWork(callbackD);
        });
        const callbackB = jest.fn(() => {
          callbackLog.push('B');
          scheduleWork(callbackE);
          scheduleWork(callbackF);
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

        scheduleWork(callbackA);
        scheduleWork(callbackB);
        // initially waits to call the callback
        expect(callbackLog).toEqual([]);
        // while flushing callbacks, calls as many as it has time for
        advanceOneFrame({timeLeftInFrame: 15});
        expect(callbackLog).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
      });

      it('schedules callbacks in correct order when they use scheduleWork to schedule themselves', () => {
        const {scheduleWork} = ReactScheduler;
        const callbackLog = [];
        let callbackAIterations = 0;
        const callbackA = jest.fn(() => {
          if (callbackAIterations < 1) {
            scheduleWork(callbackA);
          }
          callbackLog.push('A' + callbackAIterations);
          callbackAIterations++;
        });
        const callbackB = jest.fn(() => callbackLog.push('B'));

        scheduleWork(callbackA);
        // initially waits to call the callback
        expect(callbackLog).toEqual([]);
        scheduleWork(callbackB);
        expect(callbackLog).toEqual([]);
        // after a delay, calls the latest callback passed
        advanceOneFrame({timeLeftInFrame: 15});
        expect(callbackLog).toEqual(['A0', 'B', 'A1']);
      });
    });

    describe('when callbacks time out: ', () => {
      // USEFUL INFO:
      // startOfLatestFrame is a global that goes up every time rAF runs
      // currentTime defaults to startOfLatestFrame inside rAF callback
      // and currentTime defaults to 15 before next frame inside idleTick

      describe('when there is no more time left in the frame', () => {
        it('calls any callback which has timed out, waits for others', () => {
          const {scheduleWork} = ReactScheduler;
          startOfLatestFrame = 1000000000000;
          currentTime = startOfLatestFrame - 10;
          const callbackLog = [];
          // simple case of one callback which times out, another that won't.
          const callbackA = jest.fn(() => callbackLog.push('A'));
          const callbackB = jest.fn(() => callbackLog.push('B'));
          const callbackC = jest.fn(() => callbackLog.push('C'));

          scheduleWork(callbackA); // won't time out
          scheduleWork(callbackB, {timeout: 100}); // times out later
          scheduleWork(callbackC, {timeout: 2}); // will time out fast

          // push time ahead a bit so that we have no idle time
          advanceOneFrame({timePastFrameDeadline: 16});

          // callbackC should have timed out
          expect(callbackLog).toEqual(['C']);

          // push time ahead a bit so that we have no idle time
          advanceOneFrame({timePastFrameDeadline: 16});

          // callbackB should have timed out
          expect(callbackLog).toEqual(['C', 'B']);

          // let's give ourselves some idle time now
          advanceOneFrame({timeLeftInFrame: 16});

          // we should have run callbackA in the idle time
          expect(callbackLog).toEqual(['C', 'B', 'A']);
        });
      });

      describe('when there is some time left in the frame', () => {
        it('calls timed out callbacks and then any more pending callbacks, defers others if time runs out', () => {
          // TODO first call timed out callbacks
          // then any non-timed out callbacks if there is time
          const {scheduleWork} = ReactScheduler;
          startOfLatestFrame = 1000000000000;
          currentTime = startOfLatestFrame - 10;
          const callbackLog = [];
          // simple case of one callback which times out, others that won't.
          const callbackA = jest.fn(() => {
            callbackLog.push('A');
            // time passes, causing us to run out of idle time
            currentTime += 25;
          });
          const callbackB = jest.fn(() => callbackLog.push('B'));
          const callbackC = jest.fn(() => callbackLog.push('C'));
          const callbackD = jest.fn(() => callbackLog.push('D'));

          scheduleWork(callbackA); // won't time out
          scheduleWork(callbackB, {timeout: 100}); // times out later
          scheduleWork(callbackC, {timeout: 2}); // will time out fast
          scheduleWork(callbackD); // won't time out

          advanceOneFrame({timeLeftInFrame: 15}); // runs rAF and postMessage callbacks

          // callbackC should have timed out
          // we should have had time to call A also, then we run out of time
          expect(callbackLog).toEqual(['C', 'A']);

          // push time ahead a bit so that we have no idle time
          advanceOneFrame({timePastFrameDeadline: 16});

          // callbackB should have timed out
          // but we should not run callbackD because we have no idle time
          expect(callbackLog).toEqual(['C', 'A', 'B']);

          advanceOneFrame({timeLeftInFrame: 15}); // runs rAF and postMessage callbacks

          // we should have run callbackD in the idle time
          expect(callbackLog).toEqual(['C', 'A', 'B', 'D']);

          advanceOneFrame({timeLeftInFrame: 15}); // runs rAF and postMessage callbacks

          // we should not have run anything again, nothing is scheduled
          expect(callbackLog).toEqual(['C', 'A', 'B', 'D']);
        });
      });
    });
  });

  describe('cancelScheduledWork', () => {
    it('cancels the scheduled callback', () => {
      const {scheduleWork, cancelScheduledWork} = ReactScheduler;
      const cb = jest.fn();
      const callbackId = scheduleWork(cb);
      expect(cb).toHaveBeenCalledTimes(0);
      cancelScheduledWork(callbackId);
      advanceOneFrame({timeLeftInFrame: 15});
      expect(cb).toHaveBeenCalledTimes(0);
    });

    describe('with multiple callbacks', () => {
      it('when one callback cancels the next one', () => {
        const {scheduleWork, cancelScheduledWork} = ReactScheduler;
        const callbackLog = [];
        let callbackBId;
        const callbackA = jest.fn(() => {
          callbackLog.push('A');
          cancelScheduledWork(callbackBId);
        });
        const callbackB = jest.fn(() => callbackLog.push('B'));
        scheduleWork(callbackA);
        callbackBId = scheduleWork(callbackB);
        // Initially doesn't call anything
        expect(callbackLog).toEqual([]);
        advanceOneFrame({timeLeftInFrame: 15});
        // B should not get called because A cancelled B
        expect(callbackLog).toEqual(['A']);
        expect(callbackB).toHaveBeenCalledTimes(0);
      });
    });
  });

  // TODO: test 'now'
});
