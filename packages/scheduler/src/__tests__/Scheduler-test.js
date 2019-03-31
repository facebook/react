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
    scheduleCallback(() => Scheduler.yieldValue('A'));
    scheduleCallback(() => Scheduler.yieldValue('B'));
    scheduleCallback(() => Scheduler.yieldValue('C'));
    scheduleCallback(() => Scheduler.yieldValue('D'));

    expect(Scheduler).toFlushAndYieldThrough(['A', 'B']);
    expect(Scheduler).toFlushAndYieldThrough(['C']);
    expect(Scheduler).toFlushAndYield(['D']);
  });

  it('cancels work', () => {
    scheduleCallback(() => Scheduler.yieldValue('A'));
    const callbackHandleB = scheduleCallback(() => Scheduler.yieldValue('B'));
    scheduleCallback(() => Scheduler.yieldValue('C'));

    cancelCallback(callbackHandleB);

    expect(Scheduler).toFlushAndYield([
      'A',
      // B should have been cancelled
      'C',
    ]);
  });

  it('executes the highest priority callbacks first', () => {
    scheduleCallback(() => Scheduler.yieldValue('A'));
    scheduleCallback(() => Scheduler.yieldValue('B'));

    // Yield before B is flushed
    expect(Scheduler).toFlushAndYieldThrough(['A']);

    runWithPriority(UserBlockingPriority, () => {
      scheduleCallback(() => Scheduler.yieldValue('C'));
      scheduleCallback(() => Scheduler.yieldValue('D'));
    });

    // C and D should come first, because they are higher priority
    expect(Scheduler).toFlushAndYield(['C', 'D', 'B']);
  });

  it('expires work', () => {
    scheduleCallback(didTimeout => {
      Scheduler.advanceTime(100);
      Scheduler.yieldValue(`A (did timeout: ${didTimeout})`);
    });
    runWithPriority(UserBlockingPriority, () => {
      scheduleCallback(didTimeout => {
        Scheduler.advanceTime(100);
        Scheduler.yieldValue(`B (did timeout: ${didTimeout})`);
      });
    });
    runWithPriority(UserBlockingPriority, () => {
      scheduleCallback(didTimeout => {
        Scheduler.advanceTime(100);
        Scheduler.yieldValue(`C (did timeout: ${didTimeout})`);
      });
    });

    // Advance time, but not by enough to expire any work
    Scheduler.advanceTime(249);
    expect(Scheduler).toHaveYielded([]);

    // Schedule a few more callbacks
    scheduleCallback(didTimeout => {
      Scheduler.advanceTime(100);
      Scheduler.yieldValue(`D (did timeout: ${didTimeout})`);
    });
    scheduleCallback(didTimeout => {
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
    scheduleCallback(() => Scheduler.yieldValue('A'));

    Scheduler.advanceTime(4999);
    expect(Scheduler).toHaveYielded([]);

    Scheduler.advanceTime(1);
    expect(Scheduler).toHaveYielded(['A']);
  });

  it('continues working on same task after yielding', () => {
    scheduleCallback(() => {
      Scheduler.advanceTime(100);
      Scheduler.yieldValue('A');
    });
    scheduleCallback(() => {
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

    scheduleCallback(C);

    scheduleCallback(() => {
      Scheduler.advanceTime(100);
      Scheduler.yieldValue('D');
    });
    scheduleCallback(() => {
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
    runWithPriority(UserBlockingPriority, () => scheduleCallback(work));

    // Flush until just before the expiration time
    expect(Scheduler).toFlushAndYieldThrough(['A', 'B']);

    // Advance time by just a bit more. This should expire all the remaining work.
    Scheduler.advanceTime(1);
    expect(Scheduler).toHaveYielded(['C', 'D']);
  });

  it('nested callbacks inherit the priority of the currently executing callback', () => {
    runWithPriority(UserBlockingPriority, () => {
      scheduleCallback(() => {
        Scheduler.advanceTime(100);
        Scheduler.yieldValue('Parent callback');
        scheduleCallback(() => {
          Scheduler.advanceTime(100);
          Scheduler.yieldValue('Nested callback');
        });
      });
    });

    expect(Scheduler).toFlushAndYieldThrough(['Parent callback']);

    // The nested callback has user-blocking priority, so it should
    // expire quickly.
    Scheduler.advanceTime(250 + 100);
    expect(Scheduler).toHaveYielded(['Nested callback']);
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
    scheduleCallback(work);
    expect(Scheduler).toFlushAndYieldThrough(['A']);

    runWithPriority(UserBlockingPriority, () => {
      scheduleCallback(() => {
        Scheduler.advanceTime(100);
        Scheduler.yieldValue('High pri');
      });
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
            runWithPriority(UserBlockingPriority, () =>
              scheduleCallback(() => {
                Scheduler.advanceTime(100);
                Scheduler.yieldValue('High pri');
              }),
            );
          }
          if (tasks.length > 0 && shouldYield()) {
            Scheduler.yieldValue('Yield!');
            return work;
          }
        }
      };
      scheduleCallback(work);
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

  it('immediate callbacks fire at the end of outermost event', () => {
    runWithPriority(ImmediatePriority, () => {
      scheduleCallback(() => Scheduler.yieldValue('A'));
      scheduleCallback(() => Scheduler.yieldValue('B'));
      // Nested event
      runWithPriority(ImmediatePriority, () => {
        scheduleCallback(() => Scheduler.yieldValue('C'));
        // Nothing should have fired yet
        expect(Scheduler).toHaveYielded([]);
      });
      // Nothing should have fired yet
      expect(Scheduler).toHaveYielded([]);
    });
    // The callbacks were called at the end of the outer event
    expect(Scheduler).toHaveYielded(['A', 'B', 'C']);
  });

  it('wrapped callbacks have same signature as original callback', () => {
    const wrappedCallback = wrapCallback((...args) => ({args}));
    expect(wrappedCallback('a', 'b')).toEqual({args: ['a', 'b']});
  });

  it('wrapped callbacks inherit the current priority', () => {
    const wrappedCallback = wrapCallback(() => {
      scheduleCallback(() => {
        Scheduler.advanceTime(100);
        Scheduler.yieldValue('Normal');
      });
    });
    const wrappedInteractiveCallback = runWithPriority(
      UserBlockingPriority,
      () =>
        wrapCallback(() => {
          scheduleCallback(() => {
            Scheduler.advanceTime(100);
            Scheduler.yieldValue('User-blocking');
          });
        }),
    );

    // This should schedule a normal callback
    wrappedCallback();
    // This should schedule an user-blocking callback
    wrappedInteractiveCallback();

    Scheduler.advanceTime(249);
    expect(Scheduler).toHaveYielded([]);
    Scheduler.advanceTime(1);
    expect(Scheduler).toHaveYielded(['User-blocking']);

    Scheduler.advanceTime(10000);
    expect(Scheduler).toHaveYielded(['Normal']);
  });

  it('wrapped callbacks inherit the current priority even when nested', () => {
    const wrappedCallback = wrapCallback(() => {
      scheduleCallback(() => {
        Scheduler.advanceTime(100);
        Scheduler.yieldValue('Normal');
      });
    });
    const wrappedInteractiveCallback = runWithPriority(
      UserBlockingPriority,
      () =>
        wrapCallback(() => {
          scheduleCallback(() => {
            Scheduler.advanceTime(100);
            Scheduler.yieldValue('User-blocking');
          });
        }),
    );

    runWithPriority(UserBlockingPriority, () => {
      // This should schedule a normal callback
      wrappedCallback();
      // This should schedule an user-blocking callback
      wrappedInteractiveCallback();
    });

    Scheduler.advanceTime(249);
    expect(Scheduler).toHaveYielded([]);
    Scheduler.advanceTime(1);
    expect(Scheduler).toHaveYielded(['User-blocking']);

    Scheduler.advanceTime(10000);
    expect(Scheduler).toHaveYielded(['Normal']);
  });

  it('immediate callbacks fire at the end of callback', () => {
    const immediateCallback = runWithPriority(ImmediatePriority, () =>
      wrapCallback(() => {
        scheduleCallback(() => Scheduler.yieldValue('callback'));
      }),
    );
    immediateCallback();

    // The callback was called at the end of the outer event
    expect(Scheduler).toHaveYielded(['callback']);
  });

  it("immediate callbacks fire even if there's an error", () => {
    expect(() => {
      runWithPriority(ImmediatePriority, () => {
        scheduleCallback(() => {
          Scheduler.yieldValue('A');
          throw new Error('Oops A');
        });
        scheduleCallback(() => {
          Scheduler.yieldValue('B');
        });
        scheduleCallback(() => {
          Scheduler.yieldValue('C');
          throw new Error('Oops C');
        });
      });
    }).toThrow('Oops A');

    expect(Scheduler).toHaveYielded(['A']);

    // B and C flush in a subsequent event. That way, the second error is not
    // swallowed.
    expect(() => Scheduler.unstable_flushExpired()).toThrow('Oops C');
    expect(Scheduler).toHaveYielded(['B', 'C']);
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
