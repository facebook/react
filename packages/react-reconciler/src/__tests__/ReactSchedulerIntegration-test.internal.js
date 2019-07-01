/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;
let ImmediatePriority;
let UserBlockingPriority;
let NormalPriority;
let LowPriority;
let IdlePriority;
let runWithPriority;

describe('ReactSchedulerIntegration', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    ImmediatePriority = Scheduler.unstable_ImmediatePriority;
    UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
    NormalPriority = Scheduler.unstable_NormalPriority;
    LowPriority = Scheduler.unstable_LowPriority;
    IdlePriority = Scheduler.unstable_IdlePriority;
    runWithPriority = Scheduler.unstable_runWithPriority;
  });

  function getCurrentPriorityAsString() {
    const priorityLevel = Scheduler.unstable_getCurrentPriorityLevel();
    switch (priorityLevel) {
      case ImmediatePriority:
        return 'Immediate';
      case UserBlockingPriority:
        return 'UserBlocking';
      case NormalPriority:
        return 'Normal';
      case LowPriority:
        return 'Low';
      case IdlePriority:
        return 'Idle';
      default:
        throw Error('Unknown priority level: ' + priorityLevel);
    }
  }

  it('flush sync has correct priority', () => {
    function ReadPriority() {
      Scheduler.unstable_yieldValue(
        'Priority: ' + getCurrentPriorityAsString(),
      );
      return null;
    }
    ReactNoop.flushSync(() => ReactNoop.render(<ReadPriority />));
    expect(Scheduler).toHaveYielded(['Priority: Immediate']);
  });

  it('has correct priority during rendering', () => {
    function ReadPriority() {
      Scheduler.unstable_yieldValue(
        'Priority: ' + getCurrentPriorityAsString(),
      );
      return null;
    }
    ReactNoop.render(<ReadPriority />);
    expect(Scheduler).toFlushAndYield(['Priority: Normal']);

    runWithPriority(UserBlockingPriority, () => {
      ReactNoop.render(<ReadPriority />);
    });
    expect(Scheduler).toFlushAndYield(['Priority: UserBlocking']);

    runWithPriority(IdlePriority, () => {
      ReactNoop.render(<ReadPriority />);
    });
    expect(Scheduler).toFlushAndYield(['Priority: Idle']);
  });

  it('has correct priority when continuing a render after yielding', () => {
    function ReadPriority() {
      Scheduler.unstable_yieldValue(
        'Priority: ' + getCurrentPriorityAsString(),
      );
      return null;
    }

    runWithPriority(UserBlockingPriority, () => {
      ReactNoop.render(
        <React.Fragment>
          <ReadPriority />
          <ReadPriority />
          <ReadPriority />
        </React.Fragment>,
      );
    });

    // Render part of the tree
    expect(Scheduler).toFlushAndYieldThrough(['Priority: UserBlocking']);

    // Priority is set back to normal when yielding
    expect(getCurrentPriorityAsString()).toEqual('Normal');

    // Priority is restored to user-blocking when continuing
    expect(Scheduler).toFlushAndYield([
      'Priority: UserBlocking',
      'Priority: UserBlocking',
    ]);
  });

  it('layout effects have immediate priority', () => {
    const {useLayoutEffect} = React;
    function ReadPriority() {
      Scheduler.unstable_yieldValue(
        'Render priority: ' + getCurrentPriorityAsString(),
      );
      useLayoutEffect(() => {
        Scheduler.unstable_yieldValue(
          'Layout priority: ' + getCurrentPriorityAsString(),
        );
      });
      return null;
    }

    ReactNoop.render(<ReadPriority />);
    expect(Scheduler).toFlushAndYield([
      'Render priority: Normal',
      'Layout priority: Immediate',
    ]);
  });

  it('passive effects have the same priority as render', () => {
    const {useEffect} = React;
    function ReadPriority() {
      Scheduler.unstable_yieldValue(
        'Render priority: ' + getCurrentPriorityAsString(),
      );
      useEffect(() => {
        Scheduler.unstable_yieldValue(
          'Passive priority: ' + getCurrentPriorityAsString(),
        );
      });
      return null;
    }
    ReactNoop.act(() => {
      ReactNoop.render(<ReadPriority />);
      expect(Scheduler).toFlushAndYield([
        'Render priority: Normal',
        'Passive priority: Normal',
      ]);

      runWithPriority(UserBlockingPriority, () => {
        ReactNoop.render(<ReadPriority />);
      });

      expect(Scheduler).toFlushAndYield([
        'Render priority: UserBlocking',
        'Passive priority: UserBlocking',
      ]);
    });
  });

  it('after completing a level of work, infers priority of the next batch based on its expiration time', () => {
    function App({label}) {
      Scheduler.unstable_yieldValue(
        `${label} [${getCurrentPriorityAsString()}]`,
      );
      return label;
    }

    // Schedule two separate updates at different priorities
    runWithPriority(UserBlockingPriority, () => {
      ReactNoop.render(<App label="A" />);
    });
    ReactNoop.render(<App label="B" />);

    // The second update should run at normal priority
    expect(Scheduler).toFlushAndYield(['A [UserBlocking]', 'B [Normal]']);
  });

  it('requests a paint after committing', () => {
    const scheduleCallback = Scheduler.unstable_scheduleCallback;

    const root = ReactNoop.createRoot();
    root.render('Initial');
    Scheduler.unstable_flushAll();

    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('A'));
    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('B'));
    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('C'));

    // Schedule a React render. React will request a paint after committing it.
    root.render('Update');

    // Advance time just to be sure the next tasks have lower priority
    Scheduler.unstable_advanceTime(2000);

    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('D'));
    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('E'));

    // Flush everything up to the next paint. Should yield after the
    // React commit.
    Scheduler.unstable_flushUntilNextPaint();
    expect(Scheduler).toHaveYielded(['A', 'B', 'C']);
  });

  // TODO
  it.skip('passive effects have render priority even if they are flushed early', () => {});
});
