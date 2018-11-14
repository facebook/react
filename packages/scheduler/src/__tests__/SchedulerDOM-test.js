/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let Scheduler;
type FrameTimeoutConfigType = {
  // should only specify one or the other
  timeLeftInFrame: ?number,
  timePastFrameDeadline: ?number,
};

describe('SchedulerDOM', () => {
  let rAFCallbacks = [];
  let postMessageCallback;
  let postMessageEvents = [];
  let postMessageErrors = [];
  let catchPostMessageErrors = false;

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
        if (catchPostMessageErrors) {
          // catch errors for testing error handling
          try {
            postMessageCallback(postMessageEvents.shift());
          } catch (e) {
            postMessageErrors.push(e);
          }
        } else {
          // we are not expecting errors
          postMessageCallback(postMessageEvents.shift());
        }
      }
    }
  }
  function runRAFCallbacks() {
    startOfLatestFrame += frameSize;
    currentTime = startOfLatestFrame;
    const cbs = rAFCallbacks;
    rAFCallbacks = [];
    cbs.forEach(cb => cb());
  }
  function advanceOneFrame(config: FrameTimeoutConfigType = {}) {
    runRAFCallbacks();
    runPostMessageCallbacks(config);
  }

  let frameSize = 33;
  let startOfLatestFrame = 0;
  let currentTime = 0;

  beforeEach(() => {
    delete global.performance;
    global.requestAnimationFrame = function(cb) {
      return rAFCallbacks.push(() => {
        cb(startOfLatestFrame);
      });
    };
    postMessageEvents = [];
    postMessageErrors = [];
    const port1 = {};
    const port2 = {
      postMessage(messageKey) {
        const postMessageEvent = {source: port2, data: messageKey};
        postMessageEvents.push(postMessageEvent);
      },
    };
    global.MessageChannel = function MessageChannel() {
      this.port1 = port1;
      this.port2 = port2;
    };
    postMessageCallback = () => port1.onmessage();
    global.Date.now = function() {
      return currentTime;
    };
    jest.resetModules();
    Scheduler = require('scheduler');
  });

  describe('scheduleCallback', () => {
    it('calls the callback within the frame when not blocked', () => {
      const {unstable_scheduleCallback: scheduleCallback} = Scheduler;
      const cb = jest.fn();
      scheduleCallback(cb);
      advanceOneFrame({timeLeftInFrame: 15});
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('inserts its rAF callback as early into the queue as possible', () => {
      const {unstable_scheduleCallback: scheduleCallback} = Scheduler;
      const log = [];
      const useRAFCallback = () => {
        log.push('userRAFCallback');
      };
      scheduleCallback(() => {
        // Call rAF while idle work is being flushed.
        requestAnimationFrame(useRAFCallback);
      });
      advanceOneFrame({timeLeftInFrame: 1});
      // There should be two callbacks: the one scheduled by Scheduler at the
      // beginning of the frame, and the one scheduled later during that frame.
      expect(rAFCallbacks.length).toBe(2);
      // The user callback should be the second callback.
      rAFCallbacks[1]();
      expect(log).toEqual(['userRAFCallback']);
    });

    describe('with multiple callbacks', () => {
      it('accepts multiple callbacks and calls within frame when not blocked', () => {
        const {unstable_scheduleCallback: scheduleCallback} = Scheduler;
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
        advanceOneFrame({timeLeftInFrame: 15});
        expect(callbackLog).toEqual(['A', 'B']);
      });

      it("accepts callbacks betweeen animationFrame and postMessage and doesn't stall", () => {
        const {unstable_scheduleCallback: scheduleCallback} = Scheduler;
        const callbackLog = [];
        const callbackA = jest.fn(() => callbackLog.push('A'));
        const callbackB = jest.fn(() => callbackLog.push('B'));
        const callbackC = jest.fn(() => callbackLog.push('C'));
        scheduleCallback(callbackA);
        // initially waits to call the callback
        expect(callbackLog).toEqual([]);
        runRAFCallbacks();
        // this should schedule work *after* the requestAnimationFrame but before the message handler
        scheduleCallback(callbackB);
        expect(callbackLog).toEqual([]);
        // now it should drain the message queue and do all scheduled work
        runPostMessageCallbacks({timeLeftInFrame: 15});
        expect(callbackLog).toEqual(['A', 'B']);

        // advances timers, now with an empty queue of work (to ensure they don't deadlock)
        advanceOneFrame({timeLeftInFrame: 15});

        // see if more work can be done now.
        scheduleCallback(callbackC);
        expect(callbackLog).toEqual(['A', 'B']);
        advanceOneFrame({timeLeftInFrame: 15});
        expect(callbackLog).toEqual(['A', 'B', 'C']);
      });

      it(
        'schedules callbacks in correct order and' +
          'keeps calling them if there is time',
        () => {
          const {unstable_scheduleCallback: scheduleCallback} = Scheduler;
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
          advanceOneFrame({timeLeftInFrame: 15});
          expect(callbackLog).toEqual(['A', 'B', 'C']);
        },
      );

      it('schedules callbacks in correct order when callbacks have many nested scheduleCallback calls', () => {
        const {unstable_scheduleCallback: scheduleCallback} = Scheduler;
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
        advanceOneFrame({timeLeftInFrame: 15});
        expect(callbackLog).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
      });

      it('schedules callbacks in correct order when they use scheduleCallback to schedule themselves', () => {
        const {unstable_scheduleCallback: scheduleCallback} = Scheduler;
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
          const {unstable_scheduleCallback: scheduleCallback} = Scheduler;
          startOfLatestFrame = 1000000000000;
          currentTime = startOfLatestFrame - 10;
          const callbackLog = [];
          // simple case of one callback which times out, another that won't.
          const callbackA = jest.fn(() => callbackLog.push('A'));
          const callbackB = jest.fn(() => callbackLog.push('B'));
          const callbackC = jest.fn(() => callbackLog.push('C'));

          scheduleCallback(callbackA); // won't time out
          scheduleCallback(callbackB, {timeout: 100}); // times out later
          scheduleCallback(callbackC, {timeout: 2}); // will time out fast

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
          const {unstable_scheduleCallback: scheduleCallback} = Scheduler;
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

          scheduleCallback(callbackA, {timeout: 100}); // won't time out
          scheduleCallback(callbackB, {timeout: 100}); // times out later
          scheduleCallback(callbackC, {timeout: 2}); // will time out fast
          scheduleCallback(callbackD, {timeout: 200}); // won't time out

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

  describe('cancelCallback', () => {
    it('cancels the scheduled callback', () => {
      const {
        unstable_scheduleCallback: scheduleCallback,
        unstable_cancelCallback: cancelCallback,
      } = Scheduler;
      const cb = jest.fn();
      const callbackId = scheduleCallback(cb);
      expect(cb).toHaveBeenCalledTimes(0);
      cancelCallback(callbackId);
      advanceOneFrame({timeLeftInFrame: 15});
      expect(cb).toHaveBeenCalledTimes(0);
    });

    describe('with multiple callbacks', () => {
      it('when called more than once', () => {
        const {
          unstable_scheduleCallback: scheduleCallback,
          unstable_cancelCallback: cancelCallback,
        } = Scheduler;
        const callbackLog = [];
        const callbackA = jest.fn(() => callbackLog.push('A'));
        const callbackB = jest.fn(() => callbackLog.push('B'));
        const callbackC = jest.fn(() => callbackLog.push('C'));
        scheduleCallback(callbackA);
        const callbackId = scheduleCallback(callbackB);
        scheduleCallback(callbackC);
        cancelCallback(callbackId);
        cancelCallback(callbackId);
        cancelCallback(callbackId);
        // Initially doesn't call anything
        expect(callbackLog).toEqual([]);
        advanceOneFrame({timeLeftInFrame: 15});

        // Should still call A and C
        expect(callbackLog).toEqual(['A', 'C']);
        expect(callbackB).toHaveBeenCalledTimes(0);
      });

      it('when one callback cancels the next one', () => {
        const {
          unstable_scheduleCallback: scheduleCallback,
          unstable_cancelCallback: cancelCallback,
        } = Scheduler;
        const callbackLog = [];
        let callbackBId;
        const callbackA = jest.fn(() => {
          callbackLog.push('A');
          cancelCallback(callbackBId);
        });
        const callbackB = jest.fn(() => callbackLog.push('B'));
        scheduleCallback(callbackA);
        callbackBId = scheduleCallback(callbackB);
        // Initially doesn't call anything
        expect(callbackLog).toEqual([]);
        advanceOneFrame({timeLeftInFrame: 15});
        // B should not get called because A cancelled B
        expect(callbackLog).toEqual(['A']);
        expect(callbackB).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('when callbacks throw errors', () => {
    describe('when some callbacks throw', () => {
      /**
       * +                                                             +
       * |  rAF                        postMessage                     |
       * |                                                             |
       * |      +---------------------+                                |
       * |      | paint/layout        |  cbA() cbB() cbC() cbD() cbE() |
       * |      +---------------------+         ^           ^          |
       * |                                      |           |          |
       * +                                      |           |          +
       *                                        +           +
       *                                        throw errors
       *
       *
       */
      it('still calls all callbacks within same frame', () => {
        const {unstable_scheduleCallback: scheduleCallback} = Scheduler;
        const callbackLog = [];
        const callbackA = jest.fn(() => callbackLog.push('A'));
        const callbackB = jest.fn(() => {
          callbackLog.push('B');
          throw new Error('B error');
        });
        const callbackC = jest.fn(() => callbackLog.push('C'));
        const callbackD = jest.fn(() => {
          callbackLog.push('D');
          throw new Error('D error');
        });
        const callbackE = jest.fn(() => callbackLog.push('E'));
        scheduleCallback(callbackA);
        scheduleCallback(callbackB);
        scheduleCallback(callbackC);
        scheduleCallback(callbackD);
        scheduleCallback(callbackE);
        // Initially doesn't call anything
        expect(callbackLog).toEqual([]);
        catchPostMessageErrors = true;
        advanceOneFrame({timeLeftInFrame: 15});
        // calls all callbacks
        expect(callbackLog).toEqual(['A', 'B', 'C', 'D', 'E']);
        // errors should still get thrown
        const postMessageErrorMessages = postMessageErrors.map(e => e.message);
        expect(postMessageErrorMessages).toEqual(['B error', 'D error']);
        catchPostMessageErrors = false;
      });

      /**
       *                                               timed out
       *                                               +     +  +--+
       *  +  rAF                        postMessage    |     |     |    +
       *  |                                            |     |     |    |
       *  |      +---------------------+               v     v     v    |
       *  |      | paint/layout        |  cbA() cbB() cbC() cbD() cbE() |
       *  |      +---------------------+   ^                 ^          |
       *  |                                |                 |          |
       *  +                                |                 |          +
       *                                   +                 +
       *                                   throw errors
       *
       *
       */
      it('and with some timed out callbacks, still calls all callbacks within same frame', () => {
        const {unstable_scheduleCallback: scheduleCallback} = Scheduler;
        const callbackLog = [];
        const callbackA = jest.fn(() => {
          callbackLog.push('A');
          throw new Error('A error');
        });
        const callbackB = jest.fn(() => callbackLog.push('B'));
        const callbackC = jest.fn(() => callbackLog.push('C'));
        const callbackD = jest.fn(() => {
          callbackLog.push('D');
          throw new Error('D error');
        });
        const callbackE = jest.fn(() => callbackLog.push('E'));
        scheduleCallback(callbackA);
        scheduleCallback(callbackB);
        scheduleCallback(callbackC, {timeout: 2}); // times out fast
        scheduleCallback(callbackD, {timeout: 2}); // times out fast
        scheduleCallback(callbackE, {timeout: 2}); // times out fast
        // Initially doesn't call anything
        expect(callbackLog).toEqual([]);
        catchPostMessageErrors = true;
        advanceOneFrame({timeLeftInFrame: 15});
        // calls all callbacks; calls timed out ones first
        expect(callbackLog).toEqual(['C', 'D', 'E', 'A', 'B']);
        // errors should still get thrown
        const postMessageErrorMessages = postMessageErrors.map(e => e.message);
        expect(postMessageErrorMessages).toEqual(['D error', 'A error']);
        catchPostMessageErrors = false;
      });
    });
    describe('when all scheduled callbacks throw', () => {
      /**
       * +                                                             +
       * |  rAF                        postMessage                     |
       * |                                                             |
       * |      +---------------------+                                |
       * |      | paint/layout        |  cbA() cbB() cbC() cbD() cbE() |
       * |      +---------------------+   ^     ^     ^     ^     ^    |
       * |                                |     |     |     |     |    |
       * +                                |     |     |     |     |    +
       *                                  |     +     +     +     +
       *                                  + all callbacks throw errors
       *
       *
       */
      it('still calls all callbacks within same frame', () => {
        const {unstable_scheduleCallback: scheduleCallback} = Scheduler;
        const callbackLog = [];
        const callbackA = jest.fn(() => {
          callbackLog.push('A');
          throw new Error('A error');
        });
        const callbackB = jest.fn(() => {
          callbackLog.push('B');
          throw new Error('B error');
        });
        const callbackC = jest.fn(() => {
          callbackLog.push('C');
          throw new Error('C error');
        });
        const callbackD = jest.fn(() => {
          callbackLog.push('D');
          throw new Error('D error');
        });
        const callbackE = jest.fn(() => {
          callbackLog.push('E');
          throw new Error('E error');
        });
        scheduleCallback(callbackA);
        scheduleCallback(callbackB);
        scheduleCallback(callbackC);
        scheduleCallback(callbackD);
        scheduleCallback(callbackE);
        // Initially doesn't call anything
        expect(callbackLog).toEqual([]);
        catchPostMessageErrors = true;
        advanceOneFrame({timeLeftInFrame: 15});
        // calls all callbacks
        expect(callbackLog).toEqual(['A', 'B', 'C', 'D', 'E']);
        // errors should still get thrown
        const postMessageErrorMessages = postMessageErrors.map(e => e.message);
        expect(postMessageErrorMessages).toEqual([
          'A error',
          'B error',
          'C error',
          'D error',
          'E error',
        ]);
        catchPostMessageErrors = false;
      });

      /**
       *                                  postMessage
       *  +                                                             +
       *  |  rAF                               all callbacks time out   |
       *  |                                                             |
       *  |      +---------------------+                                |
       *  |      | paint/layout        |  cbA() cbB() cbC() cbD() cbE() |
       *  |      +---------------------+   ^     ^     ^     ^     ^    |
       *  |                                |     |     |     |     |    |
       *  +                                |     |     |     |     |    +
       *                                   |     +     +     +     +
       *                                   + all callbacks throw errors
       *
       *
       */
      it('and with all timed out callbacks, still calls all callbacks within same frame', () => {
        const {unstable_scheduleCallback: scheduleCallback} = Scheduler;
        const callbackLog = [];
        const callbackA = jest.fn(() => {
          callbackLog.push('A');
          throw new Error('A error');
        });
        const callbackB = jest.fn(() => {
          callbackLog.push('B');
          throw new Error('B error');
        });
        const callbackC = jest.fn(() => {
          callbackLog.push('C');
          throw new Error('C error');
        });
        const callbackD = jest.fn(() => {
          callbackLog.push('D');
          throw new Error('D error');
        });
        const callbackE = jest.fn(() => {
          callbackLog.push('E');
          throw new Error('E error');
        });
        scheduleCallback(callbackA, {timeout: 2}); // times out fast
        scheduleCallback(callbackB, {timeout: 2}); // times out fast
        scheduleCallback(callbackC, {timeout: 2}); // times out fast
        scheduleCallback(callbackD, {timeout: 2}); // times out fast
        scheduleCallback(callbackE, {timeout: 2}); // times out fast
        // Initially doesn't call anything
        expect(callbackLog).toEqual([]);
        catchPostMessageErrors = true;
        advanceOneFrame({timeLeftInFrame: 15});
        // calls all callbacks
        expect(callbackLog).toEqual(['A', 'B', 'C', 'D', 'E']);
        // errors should still get thrown
        const postMessageErrorMessages = postMessageErrors.map(e => e.message);
        expect(postMessageErrorMessages).toEqual([
          'A error',
          'B error',
          'C error',
          'D error',
          'E error',
        ]);
        catchPostMessageErrors = false;
      });
    });
    describe('when callbacks throw over multiple frames', () => {
      /**
       *
       * **Detail View of Frame 1**
       *
       * +                                            +
       * |  rAF                        postMessage    |
       * |                                            |
       * |      +---------------------+               |
       * |      | paint/layout        |  cbA() cbB()  |  ... Frame 2
       * |      +---------------------+   ^     ^     |
       * |                                |     |     |
       * +                                +     |     +
       *                              errors    |
       *                                        +
       *                                 takes long time
       *                                 and pushes rest of
       *                                 callbacks into
       *                                 next frame ->
       *
       *
       *
       * **Overview of frames 1-4**
       *
       *
       *  +            +            +            +            +
       *  |            |            |            |            |
       *  |  +--+      |  +--+      |  +--+      |  +--+      |
       *  |  +--+  A,B+-> +--+  C,D+-> +--+  E,F+-> +--+  G   |
       *  +        ^   +        ^   +        ^   +            +
       *           |            |            |
       *          error        error        error
       *
       *
       */
      it('still calls all callbacks within same frame', () => {
        const {unstable_scheduleCallback: scheduleCallback} = Scheduler;
        startOfLatestFrame = 1000000000000;
        currentTime = startOfLatestFrame - 10;
        catchPostMessageErrors = true;
        const callbackLog = [];
        const callbackA = jest.fn(() => {
          callbackLog.push('A');
          throw new Error('A error');
        });
        const callbackB = jest.fn(() => {
          callbackLog.push('B');
          // time passes, causing us to run out of idle time
          currentTime += 25;
        });
        const callbackC = jest.fn(() => {
          callbackLog.push('C');
          throw new Error('C error');
        });
        const callbackD = jest.fn(() => {
          callbackLog.push('D');
          // time passes, causing us to run out of idle time
          currentTime += 25;
        });
        const callbackE = jest.fn(() => {
          callbackLog.push('E');
          throw new Error('E error');
        });
        const callbackF = jest.fn(() => {
          callbackLog.push('F');
          // time passes, causing us to run out of idle time
          currentTime += 25;
        });
        const callbackG = jest.fn(() => callbackLog.push('G'));

        scheduleCallback(callbackA);
        scheduleCallback(callbackB);
        scheduleCallback(callbackC);
        scheduleCallback(callbackD);
        scheduleCallback(callbackE);
        scheduleCallback(callbackF);
        scheduleCallback(callbackG);

        // does nothing initially
        expect(callbackLog).toEqual([]);

        // frame 1;
        // callback A runs and throws, callback B takes up rest of frame
        advanceOneFrame({timeLeftInFrame: 15}); // runs rAF and postMessage callbacks

        // calls A and B
        expect(callbackLog).toEqual(['A', 'B']);
        // error was thrown from A
        let postMessageErrorMessages = postMessageErrors.map(e => e.message);
        expect(postMessageErrorMessages).toEqual(['A error']);

        // frame 2;
        // callback C runs and throws, callback D takes up rest of frame
        advanceOneFrame({timeLeftInFrame: 15}); // runs rAF and postMessage callbacks

        // calls C and D
        expect(callbackLog).toEqual(['A', 'B', 'C', 'D']);
        // error was thrown from A
        postMessageErrorMessages = postMessageErrors.map(e => e.message);
        expect(postMessageErrorMessages).toEqual(['A error', 'C error']);

        // frame 3;
        // callback E runs and throws, callback F takes up rest of frame
        advanceOneFrame({timeLeftInFrame: 15}); // runs rAF and postMessage callbacks

        // calls E and F
        expect(callbackLog).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
        // error was thrown from A
        postMessageErrorMessages = postMessageErrors.map(e => e.message);
        expect(postMessageErrorMessages).toEqual([
          'A error',
          'C error',
          'E error',
        ]);

        // frame 4;
        // callback G runs and it's the last one
        advanceOneFrame({timeLeftInFrame: 15}); // runs rAF and postMessage callbacks

        // calls G
        expect(callbackLog).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
        // error was thrown from A
        postMessageErrorMessages = postMessageErrors.map(e => e.message);
        expect(postMessageErrorMessages).toEqual([
          'A error',
          'C error',
          'E error',
        ]);

        catchPostMessageErrors = true;
      });
    });
  });

  // TODO: test 'now'
});
