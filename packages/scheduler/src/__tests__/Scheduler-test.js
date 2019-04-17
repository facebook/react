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
let runWithPriority;
let ImmediatePriority;
let UserBlockingPriority;
let NormalPriority;
let scheduleCallback;
let cancelCallback;
let wrapCallback;
let getCurrentPriorityLevel;
let shouldYield;

describe('Scheduler', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('scheduler', () => require('scheduler/unstable_mock'));

    Scheduler = require('scheduler');

    runWithPriority = Scheduler.unstable_runWithPriority;
    ImmediatePriority = Scheduler.unstable_ImmediatePriority;
    UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
    NormalPriority = Scheduler.unstable_NormalPriority;
    scheduleCallback = Scheduler.unstable_scheduleCallback;
    cancelCallback = Scheduler.unstable_cancelCallback;
    wrapCallback = Scheduler.unstable_wrapCallback;
    getCurrentPriorityLevel = Scheduler.unstable_getCurrentPriorityLevel;
    shouldYield = Scheduler.unstable_shouldYield;
  });

  it('flushes work incrementally', () => {
    scheduleCallback(NormalPriority, () => Scheduler.yieldValue('A'));
    scheduleCallback(NormalPriority, () => Scheduler.yieldValue('B'));
    scheduleCallback(NormalPriority, () => Scheduler.yieldValue('C'));
    scheduleCallback(NormalPriority, () => Scheduler.yieldValue('D'));

    expect(Scheduler).toFlushAndYieldThrough(['A', 'B']);
    expect(Scheduler).toFlushAndYieldThrough(['C']);
    expect(Scheduler).toFlushAndYield(['D']);
  });

  it('cancels work', () => {
    scheduleCallback(NormalPriority, () => Scheduler.yieldValue('A'));
    const callbackHandleB = scheduleCallback(NormalPriority, () =>
      Scheduler.yieldValue('B'),
    );
    scheduleCallback(NormalPriority, () => Scheduler.yieldValue('C'));

    cancelCallback(callbackHandleB);

    expect(Scheduler).toFlushAndYield([
      'A',
      // B should have been cancelled
      'C',
    ]);
  });

  it('executes the highest priority callbacks first', () => {
    scheduleCallback(NormalPriority, () => Scheduler.yieldValue('A'));
    scheduleCallback(NormalPriority, () => Scheduler.yieldValue('B'));

    // Yield before B is flushed
    expect(Scheduler).toFlushAndYieldThrough(['A']);

    scheduleCallback(UserBlockingPriority, () => Scheduler.yieldValue('C'));
    scheduleCallback(UserBlockingPriority, () => Scheduler.yieldValue('D'));

    // C and D should come first, because they are higher priority
    expect(Scheduler).toFlushAndYield(['C', 'D', 'B']);
  });

  it('expires work', () => {
    scheduleCallback(NormalPriority, didTimeout => {
      Scheduler.advanceTime(100);
      Scheduler.yieldValue(`A (did timeout: ${didTimeout})`);
    });
    scheduleCallback(UserBlockingPriority, didTimeout => {
      Scheduler.advanceTime(100);
      Scheduler.yieldValue(`B (did timeout: ${didTimeout})`);
    });
    scheduleCallback(UserBlockingPriority, didTimeout => {
      Scheduler.advanceTime(100);
      Scheduler.yieldValue(`C (did timeout: ${didTimeout})`);
    });

    // Advance time, but not by enough to expire any work
    Scheduler.advanceTime(249);
    expect(Scheduler).toHaveYielded([]);

    // Schedule a few more callbacks
    scheduleCallback(NormalPriority, didTimeout => {
      Scheduler.advanceTime(100);
      Scheduler.yieldValue(`D (did timeout: ${didTimeout})`);
    });
    scheduleCallback(NormalPriority, didTimeout => {
      Scheduler.advanceTime(100);
      Scheduler.yieldValue(`E (did timeout: ${didTimeout})`);
    });

    // Advance by just a bit more to expire the user blocking callbacks
    Scheduler.advanceTime(1);
    expect(Scheduler).toHaveYielded([
      'B (did timeout: true)',
      'C (did timeout: true)',
    ]);

    // Expire A
    Scheduler.advanceTime(4600);
    expect(Scheduler).toHaveYielded(['A (did timeout: true)']);

    // Flush the rest without expiring
    expect(Scheduler).toFlushAndYield([
      'D (did timeout: false)',
      'E (did timeout: true)',
    ]);
  });

  it('has a default expiration of ~5 seconds', () => {
    scheduleCallback(NormalPriority, () => Scheduler.yieldValue('A'));

    Scheduler.advanceTime(4999);
    expect(Scheduler).toHaveYielded([]);

    Scheduler.advanceTime(1);
    expect(Scheduler).toHaveYielded(['A']);
  });

  it('continues working on same task after yielding', () => {
    scheduleCallback(NormalPriority, () => {
      Scheduler.advanceTime(100);
      Scheduler.yieldValue('A');
    });
    scheduleCallback(NormalPriority, () => {
      Scheduler.advanceTime(100);
      Scheduler.yieldValue('B');
    });

    let didYield = false;
    const tasks = [['C1', 100], ['C2', 100], ['C3', 100]];
    const C = () => {
      while (tasks.length > 0) {
        const [label, ms] = tasks.shift();
        Scheduler.advanceTime(ms);
        Scheduler.yieldValue(label);
        if (shouldYield()) {
          didYield = true;
          return C;
        }
      }
    };

    scheduleCallback(NormalPriority, C);

    scheduleCallback(NormalPriority, () => {
      Scheduler.advanceTime(100);
      Scheduler.yieldValue('D');
    });
    scheduleCallback(NormalPriority, () => {
      Scheduler.advanceTime(100);
      Scheduler.yieldValue('E');
    });

    // Flush, then yield while in the middle of C.
    expect(didYield).toBe(false);
    expect(Scheduler).toFlushAndYieldThrough(['A', 'B', 'C1']);
    expect(didYield).toBe(true);

    // When we resume, we should continue working on C.
    expect(Scheduler).toFlushAndYield(['C2', 'C3', 'D', 'E']);
  });

  it('continuation callbacks inherit the expiration of the previous callback', () => {
    const tasks = [['A', 125], ['B', 124], ['C', 100], ['D', 100]];
    const work = () => {
      while (tasks.length > 0) {
        const [label, ms] = tasks.shift();
        Scheduler.advanceTime(ms);
        Scheduler.yieldValue(label);
        if (shouldYield()) {
          return work;
        }
      }
    };

    // Schedule a high priority callback
    scheduleCallback(UserBlockingPriority, work);

    // Flush until just before the expiration time
    expect(Scheduler).toFlushAndYieldThrough(['A', 'B']);

    // Advance time by just a bit more. This should expire all the remaining work.
    Scheduler.advanceTime(1);
    expect(Scheduler).toHaveYielded(['C', 'D']);
  });

  it('continuations are interrupted by higher priority work', () => {
    const tasks = [['A', 100], ['B', 100], ['C', 100], ['D', 100]];
    const work = () => {
      while (tasks.length > 0) {
        const [label, ms] = tasks.shift();
        Scheduler.advanceTime(ms);
        Scheduler.yieldValue(label);
        if (tasks.length > 0 && shouldYield()) {
          return work;
        }
      }
    };
    scheduleCallback(NormalPriority, work);
    expect(Scheduler).toFlushAndYieldThrough(['A']);

    scheduleCallback(UserBlockingPriority, () => {
      Scheduler.advanceTime(100);
      Scheduler.yieldValue('High pri');
    });

    expect(Scheduler).toFlushAndYield(['High pri', 'B', 'C', 'D']);
  });

  it(
    'continutations are interrupted by higher priority work scheduled ' +
      'inside an executing callback',
    () => {
      const tasks = [['A', 100], ['B', 100], ['C', 100], ['D', 100]];
      const work = () => {
        while (tasks.length > 0) {
          const task = tasks.shift();
          const [label, ms] = task;
          Scheduler.advanceTime(ms);
          Scheduler.yieldValue(label);
          if (task[0] === 'B') {
            // Schedule high pri work from inside another callback
            Scheduler.yieldValue('Schedule high pri');
            scheduleCallback(UserBlockingPriority, () => {
              Scheduler.advanceTime(100);
              Scheduler.yieldValue('High pri');
            });
          }
          if (tasks.length > 0 && shouldYield()) {
            Scheduler.yieldValue('Yield!');
            return work;
          }
        }
      };
      scheduleCallback(NormalPriority, work);
      expect(Scheduler).toFlushAndYield([
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

  it('top-level immediate callbacks fire in a subsequent task', () => {
    scheduleCallback(ImmediatePriority, () => Scheduler.yieldValue('A'));
    scheduleCallback(ImmediatePriority, () => Scheduler.yieldValue('B'));
    scheduleCallback(ImmediatePriority, () => Scheduler.yieldValue('C'));
    scheduleCallback(ImmediatePriority, () => Scheduler.yieldValue('D'));
    // Immediate callback hasn't fired, yet.
    expect(Scheduler).toHaveYielded([]);
    // They all flush immediately within the subsequent task.
    expect(Scheduler).toFlushExpired(['A', 'B', 'C', 'D']);
  });

  it('nested immediate callbacks are added to the queue of immediate callbacks', () => {
    scheduleCallback(ImmediatePriority, () => Scheduler.yieldValue('A'));
    scheduleCallback(ImmediatePriority, () => {
      Scheduler.yieldValue('B');
      // This callback should go to the end of the queue
      scheduleCallback(ImmediatePriority, () => Scheduler.yieldValue('C'));
    });
    scheduleCallback(ImmediatePriority, () => Scheduler.yieldValue('D'));
    expect(Scheduler).toHaveYielded([]);
    // C should flush at the end
    expect(Scheduler).toFlushExpired(['A', 'B', 'D', 'C']);
  });

  it('wrapped callbacks have same signature as original callback', () => {
    const wrappedCallback = wrapCallback((...args) => ({args}));
    expect(wrappedCallback('a', 'b')).toEqual({args: ['a', 'b']});
  });

  it('wrapped callbacks inherit the current priority', () => {
    const wrappedCallback = runWithPriority(NormalPriority, () =>
      wrapCallback(() => {
        Scheduler.yieldValue(getCurrentPriorityLevel());
      }),
    );

    const wrappedUserBlockingCallback = runWithPriority(
      UserBlockingPriority,
      () =>
        wrapCallback(() => {
          Scheduler.yieldValue(getCurrentPriorityLevel());
        }),
    );

    wrappedCallback();
    expect(Scheduler).toHaveYielded([NormalPriority]);

    wrappedUserBlockingCallback();
    expect(Scheduler).toHaveYielded([UserBlockingPriority]);
  });

  it('wrapped callbacks inherit the current priority even when nested', () => {
    let wrappedCallback;
    let wrappedUserBlockingCallback;

    runWithPriority(NormalPriority, () => {
      wrappedCallback = wrapCallback(() => {
        Scheduler.yieldValue(getCurrentPriorityLevel());
      });
      wrappedUserBlockingCallback = runWithPriority(UserBlockingPriority, () =>
        wrapCallback(() => {
          Scheduler.yieldValue(getCurrentPriorityLevel());
        }),
      );
    });

    wrappedCallback();
    expect(Scheduler).toHaveYielded([NormalPriority]);

    wrappedUserBlockingCallback();
    expect(Scheduler).toHaveYielded([UserBlockingPriority]);
  });

  it("immediate callbacks fire even if there's an error", () => {
    scheduleCallback(ImmediatePriority, () => {
      Scheduler.yieldValue('A');
      throw new Error('Oops A');
    });
    scheduleCallback(ImmediatePriority, () => {
      Scheduler.yieldValue('B');
    });
    scheduleCallback(ImmediatePriority, () => {
      Scheduler.yieldValue('C');
      throw new Error('Oops C');
    });

    expect(() => expect(Scheduler).toFlushExpired()).toThrow('Oops A');
    expect(Scheduler).toHaveYielded(['A']);

    // B and C flush in a subsequent event. That way, the second error is not
    // swallowed.
    expect(() => expect(Scheduler).toFlushExpired()).toThrow('Oops C');
    expect(Scheduler).toHaveYielded(['B', 'C']);
  });

  it('multiple immediate callbacks can throw and there will be an error for each one', () => {
    scheduleCallback(ImmediatePriority, () => {
      throw new Error('First error');
    });
    scheduleCallback(ImmediatePriority, () => {
      throw new Error('Second error');
    });
    expect(() => Scheduler.flushAll()).toThrow('First error');
    // The next error is thrown in the subsequent event
    expect(() => Scheduler.flushAll()).toThrow('Second error');
  });

  it('exposes the current priority level', () => {
    Scheduler.yieldValue(getCurrentPriorityLevel());
    runWithPriority(ImmediatePriority, () => {
      Scheduler.yieldValue(getCurrentPriorityLevel());
      runWithPriority(NormalPriority, () => {
        Scheduler.yieldValue(getCurrentPriorityLevel());
        runWithPriority(UserBlockingPriority, () => {
          Scheduler.yieldValue(getCurrentPriorityLevel());
        });
      });
      Scheduler.yieldValue(getCurrentPriorityLevel());
    });

    expect(Scheduler).toHaveYielded([
      NormalPriority,
      ImmediatePriority,
      NormalPriority,
      UserBlockingPriority,
      ImmediatePriority,
    ]);
  });
});
