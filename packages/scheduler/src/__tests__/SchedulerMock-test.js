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
let LowPriority;
let IdlePriority;
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
    LowPriority = Scheduler.unstable_LowPriority;
    IdlePriority = Scheduler.unstable_IdlePriority;
    scheduleCallback = Scheduler.unstable_scheduleCallback;
    cancelCallback = Scheduler.unstable_cancelCallback;
    wrapCallback = Scheduler.unstable_wrapCallback;
    getCurrentPriorityLevel = Scheduler.unstable_getCurrentPriorityLevel;
    shouldYield = Scheduler.unstable_shouldYield;
  });

  it('flushes work incrementally', () => {
    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('A'));
    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('B'));
    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('C'));
    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('D'));

    expect(Scheduler).toFlushAndYieldThrough(['A', 'B']);
    expect(Scheduler).toFlushAndYieldThrough(['C']);
    expect(Scheduler).toFlushAndYield(['D']);
  });

  it('cancels work', () => {
    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('A'));
    const callbackHandleB = scheduleCallback(NormalPriority, () =>
      Scheduler.unstable_yieldValue('B'),
    );
    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('C'));

    cancelCallback(callbackHandleB);

    expect(Scheduler).toFlushAndYield([
      'A',
      // B should have been cancelled
      'C',
    ]);
  });

  it('executes the highest priority callbacks first', () => {
    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('A'));
    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('B'));

    // Yield before B is flushed
    expect(Scheduler).toFlushAndYieldThrough(['A']);

    scheduleCallback(UserBlockingPriority, () =>
      Scheduler.unstable_yieldValue('C'),
    );
    scheduleCallback(UserBlockingPriority, () =>
      Scheduler.unstable_yieldValue('D'),
    );

    // C and D should come first, because they are higher priority
    expect(Scheduler).toFlushAndYield(['C', 'D', 'B']);
  });

  it('expires work', () => {
    scheduleCallback(NormalPriority, didTimeout => {
      Scheduler.unstable_advanceTime(100);
      Scheduler.unstable_yieldValue(`A (did timeout: ${didTimeout})`);
    });
    scheduleCallback(UserBlockingPriority, didTimeout => {
      Scheduler.unstable_advanceTime(100);
      Scheduler.unstable_yieldValue(`B (did timeout: ${didTimeout})`);
    });
    scheduleCallback(UserBlockingPriority, didTimeout => {
      Scheduler.unstable_advanceTime(100);
      Scheduler.unstable_yieldValue(`C (did timeout: ${didTimeout})`);
    });

    // Advance time, but not by enough to expire any work
    Scheduler.unstable_advanceTime(249);
    expect(Scheduler).toHaveYielded([]);

    // Schedule a few more callbacks
    scheduleCallback(NormalPriority, didTimeout => {
      Scheduler.unstable_advanceTime(100);
      Scheduler.unstable_yieldValue(`D (did timeout: ${didTimeout})`);
    });
    scheduleCallback(NormalPriority, didTimeout => {
      Scheduler.unstable_advanceTime(100);
      Scheduler.unstable_yieldValue(`E (did timeout: ${didTimeout})`);
    });

    // Advance by just a bit more to expire the user blocking callbacks
    Scheduler.unstable_advanceTime(1);
    expect(Scheduler).toFlushAndYieldThrough([
      'B (did timeout: true)',
      'C (did timeout: true)',
    ]);

    // Expire A
    Scheduler.unstable_advanceTime(4600);
    expect(Scheduler).toFlushAndYieldThrough(['A (did timeout: true)']);

    // Flush the rest without expiring
    expect(Scheduler).toFlushAndYield([
      'D (did timeout: false)',
      'E (did timeout: true)',
    ]);
  });

  it('has a default expiration of ~5 seconds', () => {
    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('A'));

    Scheduler.unstable_advanceTime(4999);
    expect(Scheduler).toHaveYielded([]);

    Scheduler.unstable_advanceTime(1);
    expect(Scheduler).toFlushExpired(['A']);
  });

  it('continues working on same task after yielding', () => {
    scheduleCallback(NormalPriority, () => {
      Scheduler.unstable_advanceTime(100);
      Scheduler.unstable_yieldValue('A');
    });
    scheduleCallback(NormalPriority, () => {
      Scheduler.unstable_advanceTime(100);
      Scheduler.unstable_yieldValue('B');
    });

    let didYield = false;
    const tasks = [
      ['C1', 100],
      ['C2', 100],
      ['C3', 100],
    ];
    const C = () => {
      while (tasks.length > 0) {
        const [label, ms] = tasks.shift();
        Scheduler.unstable_advanceTime(ms);
        Scheduler.unstable_yieldValue(label);
        if (shouldYield()) {
          didYield = true;
          return C;
        }
      }
    };

    scheduleCallback(NormalPriority, C);

    scheduleCallback(NormalPriority, () => {
      Scheduler.unstable_advanceTime(100);
      Scheduler.unstable_yieldValue('D');
    });
    scheduleCallback(NormalPriority, () => {
      Scheduler.unstable_advanceTime(100);
      Scheduler.unstable_yieldValue('E');
    });

    // Flush, then yield while in the middle of C.
    expect(didYield).toBe(false);
    expect(Scheduler).toFlushAndYieldThrough(['A', 'B', 'C1']);
    expect(didYield).toBe(true);

    // When we resume, we should continue working on C.
    expect(Scheduler).toFlushAndYield(['C2', 'C3', 'D', 'E']);
  });

  it('continuation callbacks inherit the expiration of the previous callback', () => {
    const tasks = [
      ['A', 125],
      ['B', 124],
      ['C', 100],
      ['D', 100],
    ];
    const work = () => {
      while (tasks.length > 0) {
        const [label, ms] = tasks.shift();
        Scheduler.unstable_advanceTime(ms);
        Scheduler.unstable_yieldValue(label);
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
    Scheduler.unstable_advanceTime(1);
    expect(Scheduler).toFlushExpired(['C', 'D']);
  });

  it('continuations are interrupted by higher priority work', () => {
    const tasks = [
      ['A', 100],
      ['B', 100],
      ['C', 100],
      ['D', 100],
    ];
    const work = () => {
      while (tasks.length > 0) {
        const [label, ms] = tasks.shift();
        Scheduler.unstable_advanceTime(ms);
        Scheduler.unstable_yieldValue(label);
        if (tasks.length > 0 && shouldYield()) {
          return work;
        }
      }
    };
    scheduleCallback(NormalPriority, work);
    expect(Scheduler).toFlushAndYieldThrough(['A']);

    scheduleCallback(UserBlockingPriority, () => {
      Scheduler.unstable_advanceTime(100);
      Scheduler.unstable_yieldValue('High pri');
    });

    expect(Scheduler).toFlushAndYield(['High pri', 'B', 'C', 'D']);
  });

  it(
    'continuations do not block higher priority work scheduled ' +
      'inside an executing callback',
    () => {
      const tasks = [
        ['A', 100],
        ['B', 100],
        ['C', 100],
        ['D', 100],
      ];
      const work = () => {
        while (tasks.length > 0) {
          const task = tasks.shift();
          const [label, ms] = task;
          Scheduler.unstable_advanceTime(ms);
          Scheduler.unstable_yieldValue(label);
          if (label === 'B') {
            // Schedule high pri work from inside another callback
            Scheduler.unstable_yieldValue('Schedule high pri');
            scheduleCallback(UserBlockingPriority, () => {
              Scheduler.unstable_advanceTime(100);
              Scheduler.unstable_yieldValue('High pri');
            });
          }
          if (tasks.length > 0) {
            // Return a continuation
            return work;
          }
        }
      };
      scheduleCallback(NormalPriority, work);
      expect(Scheduler).toFlushAndYield([
        'A',
        'B',
        'Schedule high pri',
        // The high pri callback should fire before the continuation of the
        // lower pri work
        'High pri',
        // Continue low pri work
        'C',
        'D',
      ]);
    },
  );

  it('cancelling a continuation', () => {
    const task = scheduleCallback(NormalPriority, () => {
      Scheduler.unstable_yieldValue('Yield');
      return () => {
        Scheduler.unstable_yieldValue('Continuation');
      };
    });

    expect(Scheduler).toFlushAndYieldThrough(['Yield']);
    cancelCallback(task);
    expect(Scheduler).toFlushWithoutYielding();
  });

  it('top-level immediate callbacks fire in a subsequent task', () => {
    scheduleCallback(ImmediatePriority, () =>
      Scheduler.unstable_yieldValue('A'),
    );
    scheduleCallback(ImmediatePriority, () =>
      Scheduler.unstable_yieldValue('B'),
    );
    scheduleCallback(ImmediatePriority, () =>
      Scheduler.unstable_yieldValue('C'),
    );
    scheduleCallback(ImmediatePriority, () =>
      Scheduler.unstable_yieldValue('D'),
    );
    // Immediate callback hasn't fired, yet.
    expect(Scheduler).toHaveYielded([]);
    // They all flush immediately within the subsequent task.
    expect(Scheduler).toFlushExpired(['A', 'B', 'C', 'D']);
  });

  it('nested immediate callbacks are added to the queue of immediate callbacks', () => {
    scheduleCallback(ImmediatePriority, () =>
      Scheduler.unstable_yieldValue('A'),
    );
    scheduleCallback(ImmediatePriority, () => {
      Scheduler.unstable_yieldValue('B');
      // This callback should go to the end of the queue
      scheduleCallback(ImmediatePriority, () =>
        Scheduler.unstable_yieldValue('C'),
      );
    });
    scheduleCallback(ImmediatePriority, () =>
      Scheduler.unstable_yieldValue('D'),
    );
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
        Scheduler.unstable_yieldValue(getCurrentPriorityLevel());
      }),
    );

    const wrappedUserBlockingCallback = runWithPriority(
      UserBlockingPriority,
      () =>
        wrapCallback(() => {
          Scheduler.unstable_yieldValue(getCurrentPriorityLevel());
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
        Scheduler.unstable_yieldValue(getCurrentPriorityLevel());
      });
      wrappedUserBlockingCallback = runWithPriority(UserBlockingPriority, () =>
        wrapCallback(() => {
          Scheduler.unstable_yieldValue(getCurrentPriorityLevel());
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
      Scheduler.unstable_yieldValue('A');
      throw new Error('Oops A');
    });
    scheduleCallback(ImmediatePriority, () => {
      Scheduler.unstable_yieldValue('B');
    });
    scheduleCallback(ImmediatePriority, () => {
      Scheduler.unstable_yieldValue('C');
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
    expect(() => Scheduler.unstable_flushAll()).toThrow('First error');
    // The next error is thrown in the subsequent event
    expect(() => Scheduler.unstable_flushAll()).toThrow('Second error');
  });

  it('exposes the current priority level', () => {
    Scheduler.unstable_yieldValue(getCurrentPriorityLevel());
    runWithPriority(ImmediatePriority, () => {
      Scheduler.unstable_yieldValue(getCurrentPriorityLevel());
      runWithPriority(NormalPriority, () => {
        Scheduler.unstable_yieldValue(getCurrentPriorityLevel());
        runWithPriority(UserBlockingPriority, () => {
          Scheduler.unstable_yieldValue(getCurrentPriorityLevel());
        });
      });
      Scheduler.unstable_yieldValue(getCurrentPriorityLevel());
    });

    expect(Scheduler).toHaveYielded([
      NormalPriority,
      ImmediatePriority,
      NormalPriority,
      UserBlockingPriority,
      ImmediatePriority,
    ]);
  });

  if (__DEV__) {
    // Function names are minified in prod, though you could still infer the
    // priority if you have sourcemaps.
    // TODO: Feature temporarily disabled while we investigate a bug in one of
    // our minifiers.
    it.skip('adds extra function to the JS stack whose name includes the priority level', () => {
      function inferPriorityFromCallstack() {
        try {
          throw Error();
        } catch (e) {
          const stack = e.stack;
          const lines = stack.split('\n');
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];
            const found = line.match(
              /scheduler_flushTaskAtPriority_([A-Za-z]+)/,
            );
            if (found !== null) {
              const priorityStr = found[1];
              switch (priorityStr) {
                case 'Immediate':
                  return ImmediatePriority;
                case 'UserBlocking':
                  return UserBlockingPriority;
                case 'Normal':
                  return NormalPriority;
                case 'Low':
                  return LowPriority;
                case 'Idle':
                  return IdlePriority;
              }
            }
          }
          return null;
        }
      }

      scheduleCallback(ImmediatePriority, () =>
        Scheduler.unstable_yieldValue(
          'Immediate: ' + inferPriorityFromCallstack(),
        ),
      );
      scheduleCallback(UserBlockingPriority, () =>
        Scheduler.unstable_yieldValue(
          'UserBlocking: ' + inferPriorityFromCallstack(),
        ),
      );
      scheduleCallback(NormalPriority, () =>
        Scheduler.unstable_yieldValue(
          'Normal: ' + inferPriorityFromCallstack(),
        ),
      );
      scheduleCallback(LowPriority, () =>
        Scheduler.unstable_yieldValue('Low: ' + inferPriorityFromCallstack()),
      );
      scheduleCallback(IdlePriority, () =>
        Scheduler.unstable_yieldValue('Idle: ' + inferPriorityFromCallstack()),
      );

      expect(Scheduler).toFlushAndYield([
        'Immediate: ' + ImmediatePriority,
        'UserBlocking: ' + UserBlockingPriority,
        'Normal: ' + NormalPriority,
        'Low: ' + LowPriority,
        'Idle: ' + IdlePriority,
      ]);
    });
  }

  describe('delayed tasks', () => {
    it('schedules a delayed task', () => {
      scheduleCallback(
        NormalPriority,
        () => Scheduler.unstable_yieldValue('A'),
        {
          delay: 1000,
        },
      );

      // Should flush nothing, because delay hasn't elapsed
      expect(Scheduler).toFlushAndYield([]);

      // Advance time until right before the threshold
      Scheduler.unstable_advanceTime(999);
      // Still nothing
      expect(Scheduler).toFlushAndYield([]);

      // Advance time past the threshold
      Scheduler.unstable_advanceTime(1);

      // Now it should flush like normal
      expect(Scheduler).toFlushAndYield(['A']);
    });

    it('schedules multiple delayed tasks', () => {
      scheduleCallback(
        NormalPriority,
        () => Scheduler.unstable_yieldValue('C'),
        {
          delay: 300,
        },
      );

      scheduleCallback(
        NormalPriority,
        () => Scheduler.unstable_yieldValue('B'),
        {
          delay: 200,
        },
      );

      scheduleCallback(
        NormalPriority,
        () => Scheduler.unstable_yieldValue('D'),
        {
          delay: 400,
        },
      );

      scheduleCallback(
        NormalPriority,
        () => Scheduler.unstable_yieldValue('A'),
        {
          delay: 100,
        },
      );

      // Should flush nothing, because delay hasn't elapsed
      expect(Scheduler).toFlushAndYield([]);

      // Advance some time.
      Scheduler.unstable_advanceTime(200);
      // Both A and B are no longer delayed. They can now flush incrementally.
      expect(Scheduler).toFlushAndYieldThrough(['A']);
      expect(Scheduler).toFlushAndYield(['B']);

      // Advance the rest
      Scheduler.unstable_advanceTime(200);
      expect(Scheduler).toFlushAndYield(['C', 'D']);
    });

    it('interleaves normal tasks and delayed tasks', () => {
      // Schedule some high priority callbacks with a delay. When their delay
      // elapses, they will be the most important callback in the queue.
      scheduleCallback(
        UserBlockingPriority,
        () => Scheduler.unstable_yieldValue('Timer 2'),
        {delay: 300},
      );
      scheduleCallback(
        UserBlockingPriority,
        () => Scheduler.unstable_yieldValue('Timer 1'),
        {delay: 100},
      );

      // Schedule some tasks at default priority.
      scheduleCallback(NormalPriority, () => {
        Scheduler.unstable_yieldValue('A');
        Scheduler.unstable_advanceTime(100);
      });
      scheduleCallback(NormalPriority, () => {
        Scheduler.unstable_yieldValue('B');
        Scheduler.unstable_advanceTime(100);
      });
      scheduleCallback(NormalPriority, () => {
        Scheduler.unstable_yieldValue('C');
        Scheduler.unstable_advanceTime(100);
      });
      scheduleCallback(NormalPriority, () => {
        Scheduler.unstable_yieldValue('D');
        Scheduler.unstable_advanceTime(100);
      });

      // Flush all the work. The timers should be interleaved with the
      // other tasks.
      expect(Scheduler).toFlushAndYield([
        'A',
        'Timer 1',
        'B',
        'C',
        'Timer 2',
        'D',
      ]);
    });

    it('interleaves delayed tasks with time-sliced tasks', () => {
      // Schedule some high priority callbacks with a delay. When their delay
      // elapses, they will be the most important callback in the queue.
      scheduleCallback(
        UserBlockingPriority,
        () => Scheduler.unstable_yieldValue('Timer 2'),
        {delay: 300},
      );
      scheduleCallback(
        UserBlockingPriority,
        () => Scheduler.unstable_yieldValue('Timer 1'),
        {delay: 100},
      );

      // Schedule a time-sliced task at default priority.
      const tasks = [
        ['A', 100],
        ['B', 100],
        ['C', 100],
        ['D', 100],
      ];
      const work = () => {
        while (tasks.length > 0) {
          const task = tasks.shift();
          const [label, ms] = task;
          Scheduler.unstable_advanceTime(ms);
          Scheduler.unstable_yieldValue(label);
          if (tasks.length > 0) {
            return work;
          }
        }
      };
      scheduleCallback(NormalPriority, work);

      // Flush all the work. The timers should be interleaved with the
      // other tasks.
      expect(Scheduler).toFlushAndYield([
        'A',
        'Timer 1',
        'B',
        'C',
        'Timer 2',
        'D',
      ]);
    });

    it('cancels a delayed task', () => {
      // Schedule several tasks with the same delay
      const options = {delay: 100};

      scheduleCallback(
        NormalPriority,
        () => Scheduler.unstable_yieldValue('A'),
        options,
      );
      const taskB = scheduleCallback(
        NormalPriority,
        () => Scheduler.unstable_yieldValue('B'),
        options,
      );
      const taskC = scheduleCallback(
        NormalPriority,
        () => Scheduler.unstable_yieldValue('C'),
        options,
      );

      // Cancel B before its delay has elapsed
      expect(Scheduler).toFlushAndYield([]);
      cancelCallback(taskB);

      // Cancel C after its delay has elapsed
      Scheduler.unstable_advanceTime(500);
      cancelCallback(taskC);

      // Only A should flush
      expect(Scheduler).toFlushAndYield(['A']);
    });

    it('gracefully handles scheduled tasks that are not a function', () => {
      scheduleCallback(ImmediatePriority, null);
      expect(Scheduler).toFlushWithoutYielding();

      scheduleCallback(ImmediatePriority, undefined);
      expect(Scheduler).toFlushWithoutYielding();

      scheduleCallback(ImmediatePriority, {});
      expect(Scheduler).toFlushWithoutYielding();

      scheduleCallback(ImmediatePriority, 42);
      expect(Scheduler).toFlushWithoutYielding();
    });

    it('toFlushUntilNextPaint stops if a continuation is returned', () => {
      scheduleCallback(NormalPriority, () => {
        Scheduler.unstable_yieldValue('Original Task');
        Scheduler.unstable_yieldValue('shouldYield: ' + shouldYield());
        Scheduler.unstable_yieldValue('Return a continuation');
        return () => {
          Scheduler.unstable_yieldValue('Continuation Task');
        };
      });

      expect(Scheduler).toFlushUntilNextPaint([
        'Original Task',
        // Immediately before returning a continuation, `shouldYield` returns
        // false, which means there must be time remaining in the frame.
        'shouldYield: false',
        'Return a continuation',

        // The continuation should not flush yet.
      ]);

      // No time has elapsed
      expect(Scheduler.unstable_now()).toBe(0);

      // Continue the task
      expect(Scheduler).toFlushAndYield(['Continuation Task']);
    });

    it("toFlushAndYield keeps flushing even if there's a continuation", () => {
      scheduleCallback(NormalPriority, () => {
        Scheduler.unstable_yieldValue('Original Task');
        Scheduler.unstable_yieldValue('shouldYield: ' + shouldYield());
        Scheduler.unstable_yieldValue('Return a continuation');
        return () => {
          Scheduler.unstable_yieldValue('Continuation Task');
        };
      });

      expect(Scheduler).toFlushAndYield([
        'Original Task',
        // Immediately before returning a continuation, `shouldYield` returns
        // false, which means there must be time remaining in the frame.
        'shouldYield: false',
        'Return a continuation',

        // The continuation should flush immediately, even though the task
        // yielded a continuation.
        'Continuation Task',
      ]);
    });
  });
});
