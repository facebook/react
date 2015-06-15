/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('mock-modules').autoMockOff();

describe('FakeTimers', function() {
  var FakeTimers;

  beforeEach(function() {
    FakeTimers = require('../FakeTimers');
  });

  describe('construction', function() {
    /* jshint nonew:false */
    it('installs setTimeout mock', function() {
      var global = {};
      new FakeTimers(global);
      expect(global.setTimeout).not.toBe(undefined);
    });

    it('installs clearTimeout mock', function() {
      var global = {};
      new FakeTimers(global);
      expect(global.clearTimeout).not.toBe(undefined);
    });

    it('installs setInterval mock', function() {
      var global = {};
      new FakeTimers(global);
      expect(global.setInterval).not.toBe(undefined);
    });

    it('installs clearInterval mock', function() {
      var global = {};
      new FakeTimers(global);
      expect(global.clearInterval).not.toBe(undefined);
    });

    it('mocks process.nextTick if on exists on global', function() {
      var origNextTick = function() {};
      var global = {
        process: {
          nextTick: origNextTick
        }
      };
      new FakeTimers(global);
      expect(global.process.nextTick).not.toBe(origNextTick);
    });

    it('doesn\'t mock process.nextTick if real impl isnt present', function() {
      var global = {};
      new FakeTimers(global);
      expect(global.process).toBe(undefined);
    });

    it('mocks setImmediate if it exists on global', function() {
      var origSetImmediate = function() {};
      var global = {
        setImmediate: origSetImmediate
      };
      new FakeTimers(global);
      expect(global.setImmediate).not.toBe(origSetImmediate);
    });

    it('mocks clearImmediate if setImmediate is on global', function() {
      var origSetImmediate = function() {};
      var origClearImmediate = function(){};
      var global = {
        setImmediate: origSetImmediate,
        clearImmediate: origClearImmediate
      };
      new FakeTimers(global);
      expect(global.clearImmediate).not.toBe(origClearImmediate);
    });

    it('doesn\'t mock setImmediate if real impl isnt present', function() {
      var global = {};
      new FakeTimers(global);
      expect(global.setImmediate).toBe(undefined);
    });

    it('doesnt mock clearImmediate if real immediate isnt present', function() {
      var global = {};
      new FakeTimers(global);
      expect(global.clearImmediate).toBe(undefined);
    });
  });

  describe('runAllTicks', function() {
    it('runs all ticks, in order', function() {
      var global = {
        process: {
          nextTick: function() {}
        }
      };

      var fakeTimers = new FakeTimers(global);

      var runOrder = [];
      var mock1 = jest.genMockFn().mockImpl(function() {
        runOrder.push('mock1');
      });
      var mock2 = jest.genMockFn().mockImpl(function() {
        runOrder.push('mock2');
      });

      global.process.nextTick(mock1);
      global.process.nextTick(mock2);

      expect(mock1.mock.calls.length).toBe(0);
      expect(mock2.mock.calls.length).toBe(0);

      fakeTimers.runAllTicks();

      expect(mock1.mock.calls.length).toBe(1);
      expect(mock2.mock.calls.length).toBe(1);
      expect(runOrder).toEqual(['mock1', 'mock2']);
    });

    it('does nothing when no ticks have been scheduled', function() {
      var nextTick = jest.genMockFn();
      var global = {
        process: {
          nextTick: nextTick
        }
      };

      var fakeTimers = new FakeTimers(global);
      fakeTimers.runAllTicks();

      expect(nextTick.mock.calls.length).toBe(0);
    });

    it('only runs a scheduled callback once', function() {
      var global = {
        process: {
          nextTick: function() {}
        }
      };

      var fakeTimers = new FakeTimers(global);

      var mock1 = jest.genMockFn();
      global.process.nextTick(mock1);
      expect(mock1.mock.calls.length).toBe(0);

      fakeTimers.runAllTicks();
      expect(mock1.mock.calls.length).toBe(1);

      fakeTimers.runAllTicks();
      expect(mock1.mock.calls.length).toBe(1);
    });

    it('cancels a callback even from native nextTick', function() {
      var nativeNextTick = jest.genMockFn();

      var global = {
        process: {
          nextTick: nativeNextTick
        }
      };

      var fakeTimers = new FakeTimers(global);

      var mock1 = jest.genMockFn();
      global.process.nextTick(mock1);
      fakeTimers.runAllTicks();
      expect(mock1.mock.calls.length).toBe(1);
      expect(nativeNextTick.mock.calls.length).toBe(1);

      // Now imagine we fast forward to the next real tick. We need to be sure
      // that native nextTick doesn't try to run the callback again
      nativeNextTick.mock.calls[0][0]();
      expect(mock1.mock.calls.length).toBe(1);
    });

    it('cancels a callback even from native setImmediate', function() {
      var nativeSetImmediate = jest.genMockFn();

      var global = {
        setImmediate: nativeSetImmediate
      };

      var fakeTimers = new FakeTimers(global);

      var mock1 = jest.genMockFn();
      global.setImmediate(mock1);
      fakeTimers.runAllImmediates();
      expect(mock1.mock.calls.length).toBe(1);
      expect(nativeSetImmediate.mock.calls.length).toBe(1);

      // ensure that native setImmediate doesn't try to run the callback again
      nativeSetImmediate.mock.calls[0][0]();
      expect(mock1.mock.calls.length).toBe(1);
    });

    it('doesnt run a tick callback if native nextTick already did', function() {
      var nativeNextTick = jest.genMockFn();

      var global = {
        process: {
          nextTick: nativeNextTick
        }
      };

      var fakeTimers = new FakeTimers(global);

      var mock1 = jest.genMockFn();
      global.process.nextTick(mock1);

      // Emulate native nextTick running...
      nativeNextTick.mock.calls[0][0]();
      expect(mock1.mock.calls.length).toBe(1);

      // Ensure runAllTicks() doesn't run the callback again
      fakeTimers.runAllTicks();
      expect(mock1.mock.calls.length).toBe(1);
    });

    it('doesnt run immediate if native setImmediate already did', function() {
      var nativeSetImmediate = jest.genMockFn();

      var global = {
        setImmediate: nativeSetImmediate
      };

      var fakeTimers = new FakeTimers(global);

      var mock1 = jest.genMockFn();
      global.setImmediate(mock1);

      // Emulate native setImmediate running...
      nativeSetImmediate.mock.calls[0][0]();
      expect(mock1.mock.calls.length).toBe(1);

      // Ensure runAllTicks() doesn't run the callback again
      fakeTimers.runAllImmediates();
      expect(mock1.mock.calls.length).toBe(1);
    });

    it('native doesnt run immediate if fake already did', function() {
      var nativeSetImmediate = jest.genMockFn();

      var global = {
        setImmediate: nativeSetImmediate
      };

      var fakeTimers = new FakeTimers(global);

      var mock1 = jest.genMockFn();
      global.setImmediate(mock1);

      //run all immediates now
      fakeTimers.runAllImmediates();
      expect(mock1.mock.calls.length).toBe(1);

      // Emulate native setImmediate running ensuring it doesn't re-run
      nativeSetImmediate.mock.calls[0][0]();

      expect(mock1.mock.calls.length).toBe(1);
    });

    it('throws before allowing infinite recursion', function() {
      var global = {
        process: {
          nextTick: function() {}
        }
      };

      var fakeTimers = new FakeTimers(global, 100);

      global.process.nextTick(function infinitelyRecursingCallback() {
        global.process.nextTick(infinitelyRecursingCallback);
      });

      expect(function() {
        fakeTimers.runAllTicks();
      }).toThrow(
        'Ran 100 ticks, and there are still more! Assuming we\'ve hit an ' +
        'infinite recursion and bailing out...'
      );
    });
  });

  describe('runAllTimers', function() {
    it('runs all timers in order', function() {
      var global = {};
      var fakeTimers = new FakeTimers(global);

      var runOrder = [];
      var mock1 = jest.genMockFn().mockImpl(function() {
        runOrder.push('mock1');
      });
      var mock2 = jest.genMockFn().mockImpl(function() {
        runOrder.push('mock2');
      });
      var mock3 = jest.genMockFn().mockImpl(function() {
        runOrder.push('mock3');
      });
      var mock4 = jest.genMockFn().mockImpl(function() {
        runOrder.push('mock4');
      });

      global.setTimeout(mock1, 100);
      global.setTimeout(mock2, 0);
      global.setTimeout(mock3, 0);
      var intervalHandler = global.setInterval(function() {
        mock4();
        global.clearInterval(intervalHandler);
      }, 200);

      fakeTimers.runAllTimers();
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1', 'mock4']);
    });

    it('does nothing when no timers have been scheduled', function() {
      var nativeSetTimeout = jest.genMockFn();
      var global = {
        setTimeout: nativeSetTimeout
      };

      var fakeTimers = new FakeTimers(global);
      fakeTimers.runAllTimers();
    });

    it('only runs a setTimeout callback once (ever)', function() {
      var global = {};
      var fakeTimers = new FakeTimers(global);

      var fn = jest.genMockFn();
      global.setTimeout(fn, 0);
      expect(fn.mock.calls.length).toBe(0);

      fakeTimers.runAllTimers();
      expect(fn.mock.calls.length).toBe(1);

      fakeTimers.runAllTimers();
      expect(fn.mock.calls.length).toBe(1);
    });

    it('runs callbacks with arguments after the interval', function() {
      var global = {};
      var fakeTimers = new FakeTimers(global);

      var fn = jest.genMockFn();
      global.setTimeout(fn, 0, 'mockArg1', 'mockArg2');

      fakeTimers.runAllTimers();
      expect(fn.mock.calls).toEqual([
        ['mockArg1', 'mockArg2']
      ]);
    });

    it('doesnt pass the callback to native setTimeout', function() {
      var nativeSetTimeout = jest.genMockFn();

      var global = {
        setTimeout: nativeSetTimeout
      };

      var fakeTimers = new FakeTimers(global);

      var mock1 = jest.genMockFn();
      global.setTimeout(mock1, 0);

      fakeTimers.runAllTimers();
      expect(mock1.mock.calls.length).toBe(1);
      expect(nativeSetTimeout.mock.calls.length).toBe(0);
    });

    it('throws before allowing infinite recursion', function() {
      var global = {};
      var fakeTimers = new FakeTimers(global, 100);

      global.setTimeout(function infinitelyRecursingCallback() {
        global.setTimeout(infinitelyRecursingCallback, 0);
      }, 0);

      expect(function() {
        fakeTimers.runAllTimers();
      }).toThrow(
        'Ran 100 timers, and there are still more! Assuming we\'ve hit an ' +
        'infinite recursion and bailing out...'
      );
    });
  });

  describe('runTimersToTime', function() {
    it('runs timers in order', function() {
      var global = {};
      var fakeTimers = new FakeTimers(global);

      var runOrder = [];
      var mock1 = jest.genMockFn().mockImpl(function() {
        runOrder.push('mock1');
      });
      var mock2 = jest.genMockFn().mockImpl(function() {
        runOrder.push('mock2');
      });
      var mock3 = jest.genMockFn().mockImpl(function() {
        runOrder.push('mock3');
      });
      var mock4 = jest.genMockFn().mockImpl(function() {
        runOrder.push('mock4');
      });

      global.setTimeout(mock1, 100);
      global.setTimeout(mock2, 0);
      global.setTimeout(mock3, 0);
      global.setInterval(function() {
        mock4();
      }, 200);

      // Move forward to t=50
      fakeTimers.runTimersToTime(50);
      expect(runOrder).toEqual(['mock2', 'mock3']);

      // Move forward to t=60
      fakeTimers.runTimersToTime(10);
      expect(runOrder).toEqual(['mock2', 'mock3']);

      // Move forward to t=100
      fakeTimers.runTimersToTime(40);
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1']);

      // Move forward to t=200
      fakeTimers.runTimersToTime(100);
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1', 'mock4']);

      // Move forward to t=400
      fakeTimers.runTimersToTime(200);
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1', 'mock4', 'mock4']);
    });

    it('does nothing when no timers have been scheduled', function() {
      var global = {};
      var fakeTimers = new FakeTimers(global);

      fakeTimers.runTimersToTime(100);
    });

    it('throws before allowing infinite recursion', function() {
      var global = {};
      var fakeTimers = new FakeTimers(global, 100);

      global.setTimeout(function infinitelyRecursingCallback() {
        global.setTimeout(infinitelyRecursingCallback, 0);
      }, 0);

      expect(function() {
        fakeTimers.runTimersToTime(50);
      }).toThrow(
        'Ran 100 timers, and there are still more! Assuming we\'ve hit an ' +
        'infinite recursion and bailing out...'
      );
    });
  });

  describe('reset', function() {
    it('resets all pending setTimeouts', function() {
      var global = {};
      var fakeTimers = new FakeTimers(global);

      var mock1 = jest.genMockFn();
      global.setTimeout(mock1, 100);

      fakeTimers.reset();
      fakeTimers.runAllTimers();
      expect(mock1.mock.calls.length).toBe(0);
    });

    it('resets all pending setIntervals', function() {
      var global = {};
      var fakeTimers = new FakeTimers(global);

      var mock1 = jest.genMockFn();
      global.setInterval(mock1, 200);

      fakeTimers.reset();
      fakeTimers.runAllTimers();
      expect(mock1.mock.calls.length).toBe(0);
    });

    it('resets all pending ticks callbacks & immediates', function() {
      var global = {
        setImmediate: function() {},
        process: {
          nextTick: function() {}
        }
      };
      var fakeTimers = new FakeTimers(global);

      var mock1 = jest.genMockFn();
      global.process.nextTick(mock1);
      global.setImmediate(mock1);

      fakeTimers.reset();
      fakeTimers.runAllTicks();
      fakeTimers.runAllImmediates();
      expect(mock1.mock.calls.length).toBe(0);
    });

    it('resets current runTimersToTime time cursor', function() {
      var global = {};
      var fakeTimers = new FakeTimers(global);

      var mock1 = jest.genMockFn();
      global.setTimeout(mock1, 100);
      fakeTimers.runTimersToTime(50);

      fakeTimers.reset();
      global.setTimeout(mock1, 100);

      fakeTimers.runTimersToTime(50);
      expect(mock1.mock.calls.length).toBe(0);
    });
  });

  describe('runOnlyPendingTimers', function() {
    it('runs all timers in order', function() {
      var nativeSetImmediate = jest.genMockFn();

      var global = {
        setImmediate: nativeSetImmediate
      };

      var fakeTimers = new FakeTimers(global);

      var runOrder = [];

      global.setTimeout(function cb() {
        runOrder.push('mock1');
        global.setTimeout(cb, 100);
      }, 100);

      global.setTimeout(function cb() {
        runOrder.push('mock2');
        global.setTimeout(cb, 0);
      }, 0);

      global.setInterval(function() {
        runOrder.push('mock3');
      }, 200);

      global.setImmediate(function() {
        runOrder.push('mock4');
      });

      fakeTimers.runOnlyPendingTimers();
      expect(runOrder).toEqual([
        'mock4',
        'mock2',
        'mock1',
        'mock3',
      ]);

      fakeTimers.runOnlyPendingTimers();
      expect(runOrder).toEqual([
        'mock4',
        'mock2',
        'mock1',
        'mock3',

        'mock2',
        'mock1',
        'mock3'
      ]);
    });
  });

  describe('runWithRealTimers', function() {
    it('executes callback with native timers', function() {
      var nativeClearInterval = jest.genMockFn();
      var nativeClearTimeout = jest.genMockFn();
      var nativeSetInterval = jest.genMockFn();
      var nativeSetTimeout = jest.genMockFn();

      var global = {
        clearInterval: nativeClearInterval,
        clearTimeout: nativeClearTimeout,
        setInterval: nativeSetInterval,
        setTimeout: nativeSetTimeout
      };
      var fakeTimers = new FakeTimers(global);

      // clearInterval()
      fakeTimers.runWithRealTimers(function() {
        global.clearInterval();
      });
      expect(nativeClearInterval.mock.calls.length).toBe(1);
      expect(global.clearInterval.mock.calls.length).toBe(0);

      // clearTimeout()
      fakeTimers.runWithRealTimers(function() {
        global.clearTimeout();
      });
      expect(nativeClearTimeout.mock.calls.length).toBe(1);
      expect(global.clearTimeout.mock.calls.length).toBe(0);

      // setInterval()
      fakeTimers.runWithRealTimers(function() {
        global.setInterval();
      });
      expect(nativeSetInterval.mock.calls.length).toBe(1);
      expect(global.setInterval.mock.calls.length).toBe(0);

      // setTimeout()
      fakeTimers.runWithRealTimers(function() {
        global.setTimeout();
      });
      expect(nativeSetTimeout.mock.calls.length).toBe(1);
      expect(global.setTimeout.mock.calls.length).toBe(0);
    });

    it('resets mock timers after executing callback', function() {
      var nativeClearInterval = jest.genMockFn();
      var nativeClearTimeout = jest.genMockFn();
      var nativeSetInterval = jest.genMockFn();
      var nativeSetTimeout = jest.genMockFn();


      var global = {
        clearInterval: nativeClearInterval,
        clearTimeout: nativeClearTimeout,
        setInterval: nativeSetInterval,
        setTimeout: nativeSetTimeout
      };
      var fakeTimers = new FakeTimers(global);

      // clearInterval()
      fakeTimers.runWithRealTimers(function() {
        global.clearInterval();
      });
      expect(nativeClearInterval.mock.calls.length).toBe(1);
      expect(global.clearInterval.mock.calls.length).toBe(0);

      global.clearInterval();
      expect(nativeClearInterval.mock.calls.length).toBe(1);
      expect(global.clearInterval.mock.calls.length).toBe(1);

      // clearTimeout()
      fakeTimers.runWithRealTimers(function() {
        global.clearTimeout();
      });
      expect(nativeClearTimeout.mock.calls.length).toBe(1);
      expect(global.clearTimeout.mock.calls.length).toBe(0);

      global.clearTimeout();
      expect(nativeClearTimeout.mock.calls.length).toBe(1);
      expect(global.clearTimeout.mock.calls.length).toBe(1);

      // setInterval()
      fakeTimers.runWithRealTimers(function() {
        global.setInterval();
      });
      expect(nativeSetInterval.mock.calls.length).toBe(1);
      expect(global.setInterval.mock.calls.length).toBe(0);

      global.setInterval();
      expect(nativeSetInterval.mock.calls.length).toBe(1);
      expect(global.setInterval.mock.calls.length).toBe(1);

      // setTimeout()
      fakeTimers.runWithRealTimers(function() {
        global.setTimeout();
      });
      expect(nativeSetTimeout.mock.calls.length).toBe(1);
      expect(global.setTimeout.mock.calls.length).toBe(0);

      global.setTimeout();
      expect(nativeSetTimeout.mock.calls.length).toBe(1);
      expect(global.setTimeout.mock.calls.length).toBe(1);
    });

    it('resets mock timer functions even if callback throws', function() {
      var nativeSetTimeout = jest.genMockFn();
      var global = {setTimeout: nativeSetTimeout};
      var fakeTimers = new FakeTimers(global);

      expect(function() {
        fakeTimers.runWithRealTimers(function() {
          global.setTimeout();
          throw new Error('test');
        });
      }).toThrow('test');
      expect(nativeSetTimeout.mock.calls.length).toBe(1);
      expect(global.setTimeout.mock.calls.length).toBe(0);

      global.setTimeout();
      expect(nativeSetTimeout.mock.calls.length).toBe(1);
      expect(global.setTimeout.mock.calls.length).toBe(1);
    });
  });

  describe('useRealTimers', function() {
    it('resets native timer APIs', function() {
      var nativeSetTimeout = jest.genMockFn();
      var nativeSetInterval = jest.genMockFn();
      var nativeClearTimeout = jest.genMockFn();
      var nativeClearInterval = jest.genMockFn();

      var global = {
        setTimeout: nativeSetTimeout,
        setInterval: nativeSetInterval,
        clearTimeout: nativeClearTimeout,
        clearInterval: nativeClearInterval
      };
      var fakeTimers = new FakeTimers(global);

      // Ensure that fakeTimers has overridden the native timer APIs
      // (because if it didn't, this test might pass when it shouldn't)
      expect(global.setTimeout).not.toBe(nativeSetTimeout);
      expect(global.setInterval).not.toBe(nativeSetInterval);
      expect(global.clearTimeout).not.toBe(nativeClearTimeout);
      expect(global.clearInterval).not.toBe(nativeClearInterval);

      fakeTimers.useRealTimers();

      expect(global.setTimeout).toBe(nativeSetTimeout);
      expect(global.setInterval).toBe(nativeSetInterval);
      expect(global.clearTimeout).toBe(nativeClearTimeout);
      expect(global.clearInterval).toBe(nativeClearInterval);
    });

    it('resets native process.nextTick when present', function() {
      var nativeProcessNextTick = jest.genMockFn();

      var global = {
        process: {nextTick: nativeProcessNextTick}
      };
      var fakeTimers = new FakeTimers(global);

      // Ensure that fakeTimers has overridden the native timer APIs
      // (because if it didn't, this test might pass when it shouldn't)
      expect(global.process.nextTick).not.toBe(nativeProcessNextTick);

      fakeTimers.useRealTimers();

      expect(global.process.nextTick).toBe(nativeProcessNextTick);
    });

    it('resets native setImmediate when present', function() {
      var nativeSetImmediate = jest.genMockFn();
      var nativeClearImmediate = jest.genMockFn();

      var global = {
        setImmediate: nativeSetImmediate,
        clearImmediate: nativeClearImmediate
      };
      var fakeTimers = new FakeTimers(global);

      // Ensure that fakeTimers has overridden the native timer APIs
      // (because if it didn't, this test might pass when it shouldn't)
      expect(global.setImmediate).not.toBe(nativeSetImmediate);
      expect(global.clearImmediate).not.toBe(nativeClearImmediate);

      fakeTimers.useRealTimers();

      expect(global.setImmediate).toBe(nativeSetImmediate);
      expect(global.clearImmediate).toBe(nativeClearImmediate);
    });
  });

  describe('useFakeTimers', function() {
    it('resets mock timer APIs', function() {
      var nativeSetTimeout = jest.genMockFn();
      var nativeSetInterval = jest.genMockFn();
      var nativeClearTimeout = jest.genMockFn();
      var nativeClearInterval = jest.genMockFn();

      var global = {
        setTimeout: nativeSetTimeout,
        setInterval: nativeSetInterval,
        clearTimeout: nativeClearTimeout,
        clearInterval: nativeClearInterval
      };
      var fakeTimers = new FakeTimers(global);
      fakeTimers.useRealTimers();

      // Ensure that the real timers are installed at this point
      // (because if they aren't, this test might pass when it shouldn't)
      expect(global.setTimeout).toBe(nativeSetTimeout);
      expect(global.setInterval).toBe(nativeSetInterval);
      expect(global.clearTimeout).toBe(nativeClearTimeout);
      expect(global.clearInterval).toBe(nativeClearInterval);

      fakeTimers.useFakeTimers();

      expect(global.setTimeout).not.toBe(nativeSetTimeout);
      expect(global.setInterval).not.toBe(nativeSetInterval);
      expect(global.clearTimeout).not.toBe(nativeClearTimeout);
      expect(global.clearInterval).not.toBe(nativeClearInterval);
    });

    it('resets mock process.nextTick when present', function() {
      var nativeProcessNextTick = jest.genMockFn();

      var global = {
        process: {nextTick: nativeProcessNextTick}
      };
      var fakeTimers = new FakeTimers(global);
      fakeTimers.useRealTimers();

      // Ensure that the real timers are installed at this point
      // (because if they aren't, this test might pass when it shouldn't)
      expect(global.process.nextTick).toBe(nativeProcessNextTick);

      fakeTimers.useFakeTimers();

      expect(global.process.nextTick).not.toBe(nativeProcessNextTick);
    });

    it('resets mock setImmediate when present', function() {
      var nativeSetImmediate = jest.genMockFn();
      var nativeClearImmediate = jest.genMockFn();

      var global = {
        setImmediate: nativeSetImmediate,
        clearImmediate: nativeClearImmediate
      };
      var fakeTimers = new FakeTimers(global);
      fakeTimers.useRealTimers();

      // Ensure that the real timers are installed at this point
      // (because if they aren't, this test might pass when it shouldn't)
      expect(global.setImmediate).toBe(nativeSetImmediate);
      expect(global.clearImmediate).toBe(nativeClearImmediate);

      fakeTimers.useFakeTimers();

      expect(global.setImmediate).not.toBe(nativeSetImmediate);
      expect(global.clearImmediate).not.toBe(nativeClearImmediate);
    });
  });
});
