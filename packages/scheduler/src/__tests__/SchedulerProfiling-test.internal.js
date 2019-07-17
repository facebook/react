/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

/* eslint-disable no-for-of-loops/no-for-of-loops */

'use strict';

let Scheduler;
// let runWithPriority;
let ImmediatePriority;
let UserBlockingPriority;
let NormalPriority;
let LowPriority;
let IdlePriority;
let scheduleCallback;
let cancelCallback;
// let wrapCallback;
// let getCurrentPriorityLevel;
// let shouldYield;
let performance;

function priorityLevelToString(priorityLevel) {
  switch (priorityLevel) {
    case ImmediatePriority:
      return 'Immediate';
    case UserBlockingPriority:
      return 'User-blocking';
    case NormalPriority:
      return 'Normal';
    case LowPriority:
      return 'Low';
    case IdlePriority:
      return 'Idle';
    default:
      return null;
  }
}

describe('Scheduler', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('scheduler', () => require('scheduler/unstable_mock'));

    performance = global.performance = createUserTimingPolyfill();

    require('scheduler/src/SchedulerFeatureFlags').enableUserTimingAPI = true;
    Scheduler = require('scheduler');

    // runWithPriority = Scheduler.unstable_runWithPriority;
    ImmediatePriority = Scheduler.unstable_ImmediatePriority;
    UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
    NormalPriority = Scheduler.unstable_NormalPriority;
    LowPriority = Scheduler.unstable_LowPriority;
    IdlePriority = Scheduler.unstable_IdlePriority;
    scheduleCallback = Scheduler.unstable_scheduleCallback;
    cancelCallback = Scheduler.unstable_cancelCallback;
    // wrapCallback = Scheduler.unstable_wrapCallback;
    // getCurrentPriorityLevel = Scheduler.unstable_getCurrentPriorityLevel;
    // shouldYield = Scheduler.unstable_shouldYield;
  });

  afterEach(() => {
    performance.assertAllUserTimingsAreCleared();
  });

  function createUserTimingPolyfill() {
    let marks = new Map();
    let unclearedMarkCount = 0;

    return {
      mark(name) {
        if (marks.has(name)) {
          throw Error(`Mark ${name} already exists`);
        }
        marks.set(name, {name, cleared: false, time: Scheduler.unstable_now()});
        unclearedMarkCount += 1;
      },
      clearMarks(name) {
        if (typeof name !== 'string') {
          throw Error('Must pass a name to clearMarks');
        }
        const mark = marks.get(name);
        if (mark === undefined) {
          throw Error(`Mark "${name}" does not exist`);
        }
        if (mark.cleared) {
          throw Error(`Mark "${name}" already cleared.`);
        }
        mark.cleared = true;
        unclearedMarkCount -= 1;
      },
      printUserTimings() {
        const tasks = new Map();
        const mainThreadRuns = [];

        // `marks` are stored in a map so that we can detect when they are
        // cleared; however, we're going to treat them like an event log, since
        // that's the format we'll have in a real performance profile.
        //
        // This first step reduces the event log to a map of tasks.
        for (const mark of marks.values()) {
          const parts = mark.name.split('-');
          const type = parts[0];
          switch (type) {
            case 'SchedulerTask': {
              const taskId = parts[1];
              const eventType = parts[2];
              let task = tasks.get(taskId);
              if (task === undefined) {
                task = {
                  id: taskId,
                  priorityLevel: -1,
                  label: null,
                  start: -1,
                  end: -1,
                  exitStatus: null,
                  runs: [],
                };
                tasks.set(taskId, task);
              }
              switch (eventType) {
                case 'Start': {
                  task.start = mark.time;
                  break;
                }
                case 'End': {
                  const info = JSON.parse(parts[3]);
                  task.end = mark.time;
                  task.priorityLevel = info.priorityLevel;
                  task.label = info.label;
                  task.exitStatus = info.exitStatus;
                  break;
                }
                case 'Run':
                case 'Yield': {
                  // NOTE: Mark times are assumed to be monotonic in these tests
                  // but they might not be given an arbitrary profiling format.
                  task.runs.push(mark.time);
                  break;
                }
                default: {
                  throw Error(`Unrecognized mark: "${mark.name}"`);
                }
              }
              break;
            }
            case 'SchedulerSuspended': {
              const eventType = parts[1];
              switch (eventType) {
                case 'Start':
                case 'End': {
                  // NOTE: Mark times are assumed to be monotonic in these tests
                  // but they might not be given an arbitrary profiling format.
                  mainThreadRuns.push(mark.time);
                  break;
                }
                default: {
                  throw Error(`Unrecognized mark: "${mark.name}"`);
                }
              }
              break;
            }
            default: {
              throw Error(`Unrecognized mark: "${mark.name}"`);
            }
          }
        }

        // Now we can render the tasks as a flamegraph.
        const labelColumnWidth = 30;
        const msPerChar = 50;

        let result = '';

        const mainThreadLabelColumn = '!!! Main thread              ';
        let mainThreadTimelineColumn = '';
        let isMainThreadBusy = false;
        for (const time of mainThreadRuns) {
          const index = time / msPerChar;
          mainThreadTimelineColumn += (isMainThreadBusy ? '█' : ' ').repeat(
            index - mainThreadTimelineColumn.length,
          );
          isMainThreadBusy = !isMainThreadBusy;
        }
        result += `${mainThreadLabelColumn}│${mainThreadTimelineColumn}\n`;

        const tasksByPriority = Array.from(tasks.values()).sort(
          (t1, t2) => t1.priorityLevel - t2.priorityLevel,
        );

        for (const task of tasksByPriority) {
          let label = task.label;
          if (label === undefined) {
            label = 'Task';
          }
          let labelColumn = `[${task.id}] ${label} [${priorityLevelToString(
            task.priorityLevel,
          )}]`;
          labelColumn += ' '.repeat(labelColumnWidth - labelColumn.length - 1);

          // Add empty space up until the start mark
          let timelineColumn = ' '.repeat(task.start / msPerChar);

          let isRunning = false;
          for (const time of task.runs) {
            const index = time / msPerChar;
            timelineColumn += (isRunning ? '█' : '░').repeat(
              index - timelineColumn.length,
            );
            isRunning = !isRunning;
          }

          const endIndex = task.end / msPerChar;
          timelineColumn += (isRunning ? '█' : '░').repeat(
            endIndex - timelineColumn.length,
          );

          if (task.exitStatus !== 'completed') {
            timelineColumn += `🡐 ${task.exitStatus}`;
          }

          result += `${labelColumn}│${timelineColumn}\n`;
        }
        return '\n' + result;
      },
      resetUserTimings() {
        marks = new Map();
        unclearedMarkCount = 0;
      },
      assertAllUserTimingsAreCleared() {
        if (unclearedMarkCount !== 0) {
          const unclearedMarkNames = [];
          marks.forEach((mark, markName) => {
            if (!mark.cleared) {
              unclearedMarkNames.push(markName);
            }
          });
          throw Error('Marks not cleared: ' + unclearedMarkNames.join(', '));
        }
      },
    };
  }

  if (!__DEV__) {
    // The tests in this suite are dev only
    it("empty test so Jest doesn't complain that there are no tests in this file", () => {});
    return;
  }

  it('creates a basic flamegraph', () => {
    Scheduler.unstable_advanceTime(100);
    scheduleCallback(
      NormalPriority,
      () => {
        Scheduler.unstable_advanceTime(300);
        scheduleCallback(
          UserBlockingPriority,
          () => {
            Scheduler.unstable_advanceTime(300);
          },
          {label: 'Bar'},
        );
        Scheduler.unstable_advanceTime(100);
        Scheduler.unstable_yieldValue('Yield');
        return () => {
          Scheduler.unstable_advanceTime(300);
        };
      },
      {label: 'Foo'},
    );
    expect(Scheduler).toFlushAndYieldThrough(['Yield']);
    Scheduler.unstable_advanceTime(100);
    expect(Scheduler).toFlushWithoutYielding();
    expect(performance.printUserTimings()).toEqual(
      `
!!! Main thread              │          ██
[2] Bar [User-blocking]      │        ░░░░██████
[1] Foo [Normal]             │  ████████░░░░░░░░██████
`,
    );
  });

  it('marks when a task is canceled', () => {
    const task = scheduleCallback(NormalPriority, () => {
      Scheduler.unstable_advanceTime(300);
      Scheduler.unstable_yieldValue('Yield');
      return () => {
        Scheduler.unstable_yieldValue('Continuation');
        Scheduler.unstable_advanceTime(200);
      };
    });

    expect(Scheduler).toFlushAndYieldThrough(['Yield']);
    Scheduler.unstable_advanceTime(100);

    cancelCallback(task);

    // Advance more time. This should not affect the size of the main
    // thread row, since the Scheduler queue is empty.
    Scheduler.unstable_advanceTime(1000);
    expect(Scheduler).toFlushWithoutYielding();

    // The main thread row should end when the callback is cancelled.
    expect(performance.printUserTimings()).toEqual(
      `
!!! Main thread              │      ██
[1] Task [Normal]            │██████░░🡐 canceled
`,
    );
  });

  it('marks when a task errors', () => {
    scheduleCallback(NormalPriority, () => {
      Scheduler.unstable_advanceTime(300);
      throw Error('Oops');
    });

    expect(Scheduler).toFlushAndThrow('Oops');
    Scheduler.unstable_advanceTime(100);

    // Advance more time. This should not affect the size of the main
    // thread row, since the Scheduler queue is empty.
    Scheduler.unstable_advanceTime(1000);
    expect(Scheduler).toFlushWithoutYielding();

    // The main thread row should end when the callback is cancelled.
    expect(performance.printUserTimings()).toEqual(
      `
!!! Main thread              │
[1] Task [Normal]            │██████🡐 errored
`,
    );
  });

  it('handles cancelling a task that already finished', () => {
    const task = scheduleCallback(NormalPriority, () => {
      Scheduler.unstable_yieldValue('A');
      Scheduler.unstable_advanceTime(1000);
    });
    expect(Scheduler).toFlushAndYield(['A']);
    cancelCallback(task);
    expect(performance.printUserTimings()).toEqual(
      `
!!! Main thread              │
[1] Task [Normal]            │████████████████████
`,
    );
  });

  it('handles cancelling a task multiple times', () => {
    scheduleCallback(
      NormalPriority,
      () => {
        Scheduler.unstable_yieldValue('A');
        Scheduler.unstable_advanceTime(1000);
      },
      {label: 'A'},
    );
    Scheduler.unstable_advanceTime(200);
    const task = scheduleCallback(
      NormalPriority,
      () => {
        Scheduler.unstable_yieldValue('B');
        Scheduler.unstable_advanceTime(1000);
      },
      {label: 'B'},
    );
    Scheduler.unstable_advanceTime(400);
    cancelCallback(task);
    cancelCallback(task);
    cancelCallback(task);
    expect(Scheduler).toFlushAndYield(['A']);
    expect(performance.printUserTimings()).toEqual(
      `
!!! Main thread              │████████████
[1] A [Normal]               │░░░░░░░░░░░░████████████████████
[2] B [Normal]               │    ░░░░░░░░🡐 canceled
`,
    );
  });

  it('handles cancelling a delayed task', () => {
    const task = scheduleCallback(
      NormalPriority,
      () => Scheduler.unstable_yieldValue('A'),
      {delay: 1000},
    );
    cancelCallback(task);
    expect(Scheduler).toFlushWithoutYielding();
  });
});
