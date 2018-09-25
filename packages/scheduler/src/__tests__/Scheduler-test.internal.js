/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let runWithPriority;
let ImmediatePriority;
let InteractivePriority;
let NormalPriority;
let scheduleCallback;
let cancelCallback;
let wrapCallback;
let getCurrentPriorityLevel;
let flushWork;
let advanceTime;
let doWork;
let yieldedValues;
let yieldValue;
let clearYieldedValues;

describe('Scheduler', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();

    let _flushWork = null;
    let isFlushing = false;
    let timeoutID = -1;
    let endOfFrame = -1;

    let currentTime = 0;

    flushWork = frameSize => {
      if (isFlushing) {
        throw new Error('Already flushing work.');
      }
      if (frameSize === null || frameSize === undefined) {
        frameSize = Infinity;
      }
      if (_flushWork === null) {
        throw new Error('No work is scheduled.');
      }
      timeoutID = -1;
      endOfFrame = currentTime + frameSize;
      try {
        isFlushing = true;
        _flushWork(false);
      } finally {
        isFlushing = false;
        endOfFrame = -1;
      }
      const yields = yieldedValues;
      yieldedValues = [];
      return yields;
    };

    advanceTime = ms => {
      currentTime += ms;
      jest.advanceTimersByTime(ms);
    };

    doWork = (label, timeCost) => {
      if (typeof timeCost !== 'number') {
        throw new Error('Second arg must be a number.');
      }
      advanceTime(timeCost);
      yieldValue(label);
    };

    yieldedValues = [];
    yieldValue = value => {
      yieldedValues.push(value);
    };

    clearYieldedValues = () => {
      const yields = yieldedValues;
      yieldedValues = [];
      return yields;
    };

    function onTimeout() {
      if (_flushWork === null) {
        return;
      }
      if (isFlushing) {
        // Jest fires timers synchronously when jest.advanceTimersByTime is
        // called. Use setImmediate to prevent re-entrancy.
        setImmediate(onTimeout);
      } else {
        try {
          isFlushing = true;
          _flushWork(true);
        } finally {
          isFlushing = false;
        }
      }
    }

    function requestHostCallback(fw, absoluteTimeout) {
      if (_flushWork !== null) {
        throw new Error('Work is already scheduled.');
      }
      _flushWork = fw;
      timeoutID = setTimeout(onTimeout, absoluteTimeout - currentTime);
    }
    function cancelHostCallback() {
      if (_flushWork === null) {
        throw new Error('No work is scheduled.');
      }
      _flushWork = null;
      clearTimeout(timeoutID);
    }
    function getTimeRemaining() {
      return endOfFrame;
    }

    // Override host implementation
    delete global.performance;
    global.Date.now = () => {
      return currentTime;
    };
    window._schedMock = [
      requestHostCallback,
      cancelHostCallback,
      getTimeRemaining,
    ];

    const Schedule = require('scheduler');
    runWithPriority = Schedule.unstable_runWithPriority;
    ImmediatePriority = Schedule.unstable_ImmediatePriority;
    InteractivePriority = Schedule.unstable_InteractivePriority;
    NormalPriority = Schedule.unstable_NormalPriority;
    scheduleCallback = Schedule.unstable_scheduleCallback;
    cancelCallback = Schedule.unstable_cancelCallback;
    wrapCallback = Schedule.unstable_wrapCallback;
    getCurrentPriorityLevel = Schedule.unstable_getCurrentPriorityLevel;
  });

  it('flushes work incrementally', () => {
    scheduleCallback(() => doWork('A', 100));
    scheduleCallback(() => doWork('B', 200));
    scheduleCallback(() => doWork('C', 300));
    scheduleCallback(() => doWork('D', 400));

    expect(flushWork(300)).toEqual(['A', 'B']);
    expect(flushWork(300)).toEqual(['C']);
    expect(flushWork(400)).toEqual(['D']);
  });

  it('cancels work', () => {
    scheduleCallback(() => doWork('A', 100));
    const callbackHandleB = scheduleCallback(() => doWork('B', 200));
    scheduleCallback(() => doWork('C', 300));

    cancelCallback(callbackHandleB);

    expect(flushWork()).toEqual([
      'A',
      // B should have been cancelled
      'C',
    ]);
  });

  it('executes the highest priority callbacks first', () => {
    scheduleCallback(() => doWork('A', 100));
    scheduleCallback(() => doWork('B', 100));

    // Yield before B is flushed
    expect(flushWork(100)).toEqual(['A']);

    runWithPriority(InteractivePriority, () => {
      scheduleCallback(() => doWork('C', 100));
      scheduleCallback(() => doWork('D', 100));
    });

    // C and D should come first, because they are higher priority
    expect(flushWork()).toEqual(['C', 'D', 'B']);
  });

  it('expires work', () => {
    scheduleCallback(() => doWork('A', 100));
    runWithPriority(InteractivePriority, () => {
      scheduleCallback(() => doWork('B', 100));
    });
    scheduleCallback(() => doWork('C', 100));
    runWithPriority(InteractivePriority, () => {
      scheduleCallback(() => doWork('D', 100));
    });

    // Advance time, but not by enough to expire any work
    advanceTime(249);
    expect(clearYieldedValues()).toEqual([]);

    // Advance by just a bit more to expire the high pri callbacks
    advanceTime(1);
    expect(clearYieldedValues()).toEqual(['B', 'D']);

    // Expire the rest
    advanceTime(10000);
    expect(clearYieldedValues()).toEqual(['A', 'C']);
  });

  it('has a default expiration of ~5 seconds', () => {
    scheduleCallback(() => doWork('A', 100));

    advanceTime(4999);
    expect(clearYieldedValues()).toEqual([]);

    advanceTime(1);
    expect(clearYieldedValues()).toEqual(['A']);
  });

  it('continues working on same task after yielding', () => {
    scheduleCallback(() => doWork('A', 100));
    scheduleCallback(() => doWork('B', 100));

    const tasks = [['C1', 100], ['C2', 100], ['C3', 100]];
    const C = deadline => {
      while (tasks.length > 0) {
        doWork(...tasks.shift());
        if (
          tasks.length > 0 &&
          !deadline.didTimeout &&
          deadline.timeRemaining() <= 0
        ) {
          yieldValue('Yield!');
          return C;
        }
      }
    };

    scheduleCallback(C);

    scheduleCallback(() => doWork('D', 100));
    scheduleCallback(() => doWork('E', 100));

    expect(flushWork(300)).toEqual(['A', 'B', 'C1', 'Yield!']);

    expect(flushWork()).toEqual(['C2', 'C3', 'D', 'E']);
  });

  it('continuation callbacks inherit the expiration of the previous callback', () => {
    const tasks = [['A', 125], ['B', 125], ['C', 125], ['D', 125]];
    const work = deadline => {
      while (tasks.length > 0) {
        doWork(...tasks.shift());
        if (
          tasks.length > 0 &&
          !deadline.didTimeout &&
          deadline.timeRemaining() <= 0
        ) {
          yieldValue('Yield!');
          return work;
        }
      }
    };

    // Schedule a high priority callback
    runWithPriority(InteractivePriority, () => scheduleCallback(work));

    // Flush until just before the expiration time
    expect(flushWork(249)).toEqual(['A', 'B', 'Yield!']);

    // Advance time by just a bit more. This should expire all the remaining work.
    advanceTime(1);
    expect(clearYieldedValues()).toEqual(['C', 'D']);
  });

  it('nested callbacks inherit the priority of the currently executing callback', () => {
    runWithPriority(InteractivePriority, () => {
      scheduleCallback(() => {
        doWork('Parent callback', 100);
        scheduleCallback(() => {
          doWork('Nested callback', 100);
        });
      });
    });

    expect(flushWork(100)).toEqual(['Parent callback']);

    // The nested callback has interactive priority, so it should
    // expire quickly.
    advanceTime(250 + 100);
    expect(clearYieldedValues()).toEqual(['Nested callback']);
  });

  it('continuations are interrupted by higher priority work', () => {
    const tasks = [['A', 100], ['B', 100], ['C', 100], ['D', 100]];
    const work = deadline => {
      while (tasks.length > 0) {
        doWork(...tasks.shift());
        if (
          tasks.length > 0 &&
          !deadline.didTimeout &&
          deadline.timeRemaining() <= 0
        ) {
          yieldValue('Yield!');
          return work;
        }
      }
    };
    scheduleCallback(work);
    expect(flushWork(100)).toEqual(['A', 'Yield!']);

    runWithPriority(InteractivePriority, () => {
      scheduleCallback(() => doWork('High pri', 100));
    });

    expect(flushWork()).toEqual(['High pri', 'B', 'C', 'D']);
  });

  it(
    'continutations are interrupted by higher priority work scheduled ' +
      'inside an executing callback',
    () => {
      const tasks = [['A', 100], ['B', 100], ['C', 100], ['D', 100]];
      const work = deadline => {
        while (tasks.length > 0) {
          const task = tasks.shift();
          doWork(...task);
          if (task[0] === 'B') {
            // Schedule high pri work from inside another callback
            yieldValue('Schedule high pri');
            runWithPriority(InteractivePriority, () =>
              scheduleCallback(() => doWork('High pri', 100)),
            );
          }
          if (
            tasks.length > 0 &&
            !deadline.didTimeout &&
            deadline.timeRemaining() <= 0
          ) {
            yieldValue('Yield!');
            return work;
          }
        }
      };
      scheduleCallback(work);
      expect(flushWork()).toEqual([
        'A',
        'B',
        'Schedule high pri',
        // Even though there's time left in the frame, the low pri callback
        // should yield to the high pri callback
        'Yield!',
        'High pri',
        // Continue low pri work
        'C',
        'D',
      ]);
    },
  );

  it('immediate callbacks fire at the end of outermost event', () => {
    runWithPriority(ImmediatePriority, () => {
      scheduleCallback(() => yieldValue('A'));
      scheduleCallback(() => yieldValue('B'));
      // Nested event
      runWithPriority(ImmediatePriority, () => {
        scheduleCallback(() => yieldValue('C'));
        // Nothing should have fired yet
        expect(clearYieldedValues()).toEqual([]);
      });
      // Nothing should have fired yet
      expect(clearYieldedValues()).toEqual([]);
    });
    // The callbacks were called at the end of the outer event
    expect(clearYieldedValues()).toEqual(['A', 'B', 'C']);
  });

  it('wrapped callbacks have same signature as original callback', () => {
    const wrappedCallback = wrapCallback((...args) => ({args}));
    expect(wrappedCallback('a', 'b')).toEqual({args: ['a', 'b']});
  });

  it('wrapped callbacks inherit the current priority', () => {
    const wrappedCallback = wrapCallback(() => {
      scheduleCallback(() => {
        doWork('Normal', 100);
      });
    });
    const wrappedInteractiveCallback = runWithPriority(
      InteractivePriority,
      () =>
        wrapCallback(() => {
          scheduleCallback(() => {
            doWork('Interactive', 100);
          });
        }),
    );

    // This should schedule a normal callback
    wrappedCallback();
    // This should schedule an interactive callback
    wrappedInteractiveCallback();

    advanceTime(249);
    expect(clearYieldedValues()).toEqual([]);
    advanceTime(1);
    expect(clearYieldedValues()).toEqual(['Interactive']);

    advanceTime(10000);
    expect(clearYieldedValues()).toEqual(['Normal']);
  });

  it('wrapped callbacks inherit the current priority even when nested', () => {
    const wrappedCallback = wrapCallback(() => {
      scheduleCallback(() => {
        doWork('Normal', 100);
      });
    });
    const wrappedInteractiveCallback = runWithPriority(
      InteractivePriority,
      () =>
        wrapCallback(() => {
          scheduleCallback(() => {
            doWork('Interactive', 100);
          });
        }),
    );

    runWithPriority(InteractivePriority, () => {
      // This should schedule a normal callback
      wrappedCallback();
      // This should schedule an interactive callback
      wrappedInteractiveCallback();
    });

    advanceTime(249);
    expect(clearYieldedValues()).toEqual([]);
    advanceTime(1);
    expect(clearYieldedValues()).toEqual(['Interactive']);

    advanceTime(10000);
    expect(clearYieldedValues()).toEqual(['Normal']);
  });

  it('immediate callbacks fire at the end of callback', () => {
    const immediateCallback = runWithPriority(ImmediatePriority, () =>
      wrapCallback(() => {
        scheduleCallback(() => yieldValue('callback'));
      }),
    );
    immediateCallback();

    // The callback was called at the end of the outer event
    expect(clearYieldedValues()).toEqual(['callback']);
  });

  it("immediate callbacks fire even if there's an error", () => {
    expect(() => {
      runWithPriority(ImmediatePriority, () => {
        scheduleCallback(() => {
          yieldValue('A');
          throw new Error('Oops A');
        });
        scheduleCallback(() => {
          yieldValue('B');
        });
        scheduleCallback(() => {
          yieldValue('C');
          throw new Error('Oops C');
        });
      });
    }).toThrow('Oops A');

    expect(clearYieldedValues()).toEqual(['A']);

    // B and C flush in a subsequent event. That way, the second error is not
    // swallowed.
    expect(() => flushWork(0)).toThrow('Oops C');
    expect(clearYieldedValues()).toEqual(['B', 'C']);
  });

  it('exposes the current priority level', () => {
    yieldValue(getCurrentPriorityLevel());
    runWithPriority(ImmediatePriority, () => {
      yieldValue(getCurrentPriorityLevel());
      runWithPriority(NormalPriority, () => {
        yieldValue(getCurrentPriorityLevel());
        runWithPriority(InteractivePriority, () => {
          yieldValue(getCurrentPriorityLevel());
        });
      });
      yieldValue(getCurrentPriorityLevel());
    });

    expect(clearYieldedValues()).toEqual([
      NormalPriority,
      ImmediatePriority,
      NormalPriority,
      InteractivePriority,
      ImmediatePriority,
    ]);
  });
});
