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

  // TODO: Delete this once new API exists in both forks
  function LegacyHiddenDiv({hidden, children, ...props}) {
    if (gate(flags => flags.new)) {
      return (
        <div hidden={hidden} {...props}>
          <React.unstable_LegacyHidden mode={hidden ? 'hidden' : 'visible'}>
            {children}
          </React.unstable_LegacyHidden>
        </div>
      );
    } else {
      return (
        <div hidden={hidden} {...props}>
          {children}
        </div>
      );
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
        <>
          <ReadPriority />
          <ReadPriority />
          <ReadPriority />
        </>,
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

  it('passive effects never have higher than normal priority', async () => {
    const {useEffect} = React;
    function ReadPriority({step}) {
      Scheduler.unstable_yieldValue(
        `Render priority: ${getCurrentPriorityAsString()}`,
      );
      useEffect(() => {
        Scheduler.unstable_yieldValue(
          `Effect priority: ${getCurrentPriorityAsString()}`,
        );
        return () => {
          Scheduler.unstable_yieldValue(
            `Effect clean-up priority: ${getCurrentPriorityAsString()}`,
          );
        };
      });
      return null;
    }

    // High priority renders spawn effects at normal priority
    await ReactNoop.act(async () => {
      Scheduler.unstable_runWithPriority(ImmediatePriority, () => {
        ReactNoop.render(<ReadPriority />);
      });
    });
    expect(Scheduler).toHaveYielded([
      'Render priority: Immediate',
      'Effect priority: Normal',
    ]);
    await ReactNoop.act(async () => {
      Scheduler.unstable_runWithPriority(UserBlockingPriority, () => {
        ReactNoop.render(<ReadPriority />);
      });
    });
    expect(Scheduler).toHaveYielded([
      'Render priority: UserBlocking',
      'Effect clean-up priority: Normal',
      'Effect priority: Normal',
    ]);

    // Renders lower than normal priority spawn effects at the same priority
    await ReactNoop.act(async () => {
      Scheduler.unstable_runWithPriority(IdlePriority, () => {
        ReactNoop.render(<ReadPriority />);
      });
    });
    expect(Scheduler).toHaveYielded([
      'Render priority: Idle',
      'Effect clean-up priority: Idle',
      'Effect priority: Idle',
    ]);
  });

  it('passive effects have correct priority even if they are flushed early', async () => {
    const {useEffect} = React;
    function ReadPriority({step}) {
      Scheduler.unstable_yieldValue(
        `Render priority [step ${step}]: ${getCurrentPriorityAsString()}`,
      );
      useEffect(() => {
        Scheduler.unstable_yieldValue(
          `Effect priority [step ${step}]: ${getCurrentPriorityAsString()}`,
        );
      });
      return null;
    }
    await ReactNoop.act(async () => {
      ReactNoop.render(<ReadPriority step={1} />);
      Scheduler.unstable_flushUntilNextPaint();
      expect(Scheduler).toHaveYielded(['Render priority [step 1]: Normal']);
      Scheduler.unstable_runWithPriority(UserBlockingPriority, () => {
        ReactNoop.render(<ReadPriority step={2} />);
      });
    });
    expect(Scheduler).toHaveYielded([
      'Effect priority [step 1]: Normal',
      'Render priority [step 2]: UserBlocking',
      'Effect priority [step 2]: Normal',
    ]);
  });

  it('passive effect clean-up functions have correct priority even when component is deleted', async () => {
    const {useEffect} = React;
    function ReadPriority({step}) {
      useEffect(() => {
        return () => {
          Scheduler.unstable_yieldValue(
            `Effect clean-up priority: ${getCurrentPriorityAsString()}`,
          );
        };
      });
      return null;
    }

    await ReactNoop.act(async () => {
      ReactNoop.render(<ReadPriority />);
    });
    await ReactNoop.act(async () => {
      Scheduler.unstable_runWithPriority(ImmediatePriority, () => {
        ReactNoop.render(null);
      });
    });
    expect(Scheduler).toHaveYielded(['Effect clean-up priority: Normal']);

    await ReactNoop.act(async () => {
      ReactNoop.render(<ReadPriority />);
    });
    await ReactNoop.act(async () => {
      Scheduler.unstable_runWithPriority(UserBlockingPriority, () => {
        ReactNoop.render(null);
      });
    });
    expect(Scheduler).toHaveYielded(['Effect clean-up priority: Normal']);

    // Renders lower than normal priority spawn effects at the same priority
    await ReactNoop.act(async () => {
      ReactNoop.render(<ReadPriority />);
    });
    await ReactNoop.act(async () => {
      Scheduler.unstable_runWithPriority(IdlePriority, () => {
        ReactNoop.render(null);
      });
    });
    expect(Scheduler).toHaveYielded(['Effect clean-up priority: Idle']);
  });

  it('passive effects are called before Normal-pri scheduled in layout effects', async () => {
    const {useEffect, useLayoutEffect} = React;
    function Effects({step}) {
      useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Layout Effect');
        Scheduler.unstable_scheduleCallback(NormalPriority, () =>
          Scheduler.unstable_yieldValue(
            'Scheduled Normal Callback from Layout Effect',
          ),
        );
      });
      useEffect(() => {
        Scheduler.unstable_yieldValue('Passive Effect');
      });
      return null;
    }
    function CleanupEffect() {
      useLayoutEffect(() => () => {
        Scheduler.unstable_yieldValue('Cleanup Layout Effect');
        Scheduler.unstable_scheduleCallback(NormalPriority, () =>
          Scheduler.unstable_yieldValue(
            'Scheduled Normal Callback from Cleanup Layout Effect',
          ),
        );
      });
      return null;
    }
    await ReactNoop.act(async () => {
      ReactNoop.render(<CleanupEffect />);
    });
    expect(Scheduler).toHaveYielded([]);
    await ReactNoop.act(async () => {
      ReactNoop.render(<Effects />);
    });
    expect(Scheduler).toHaveYielded([
      'Cleanup Layout Effect',
      'Layout Effect',
      'Passive Effect',
      // These callbacks should be scheduled after the passive effects.
      'Scheduled Normal Callback from Cleanup Layout Effect',
      'Scheduled Normal Callback from Layout Effect',
    ]);
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

  // @gate enableLegacyHiddenType
  it('idle updates are not blocked by offscreen work', async () => {
    function Text({text}) {
      Scheduler.unstable_yieldValue(text);
      return text;
    }

    function App({label}) {
      return (
        <>
          <Text text={`Visible: ` + label} />
          <LegacyHiddenDiv hidden={true}>
            <Text text={`Hidden: ` + label} />
          </LegacyHiddenDiv>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App label="A" />);

      // Commit the visible content
      expect(Scheduler).toFlushUntilNextPaint(['Visible: A']);
      expect(root).toMatchRenderedOutput(
        <>
          Visible: A
          <div hidden={true} />
        </>,
      );

      // Before the hidden content has a chance to render, schedule an
      // idle update
      runWithPriority(IdlePriority, () => {
        root.render(<App label="B" />);
      });

      // The next commit should only include the visible content
      expect(Scheduler).toFlushUntilNextPaint(['Visible: B']);
      expect(root).toMatchRenderedOutput(
        <>
          Visible: B
          <div hidden={true} />
        </>,
      );
    });

    // The hidden content commits later
    expect(Scheduler).toHaveYielded(['Hidden: B']);
    expect(root).toMatchRenderedOutput(
      <>
        Visible: B<div hidden={true}>Hidden: B</div>
      </>,
    );
  });
});

describe(
  'regression test: does not infinite loop if `shouldYield` returns ' +
    'true after a partial tree expires',
  () => {
    let logDuringShouldYield = false;

    beforeEach(() => {
      jest.resetModules();

      jest.mock('scheduler', () => {
        const actual = require.requireActual('scheduler/unstable_mock');
        return {
          ...actual,
          unstable_shouldYield() {
            if (logDuringShouldYield) {
              actual.unstable_yieldValue('shouldYield');
            }
            return actual.unstable_shouldYield();
          },
        };
      });

      React = require('react');
      ReactNoop = require('react-noop-renderer');
      Scheduler = require('scheduler');

      React = require('react');
    });

    afterEach(() => {
      jest.mock('scheduler', () =>
        require.requireActual('scheduler/unstable_mock'),
      );
    });

    it('using public APIs to trigger real world scenario', async () => {
      // This test reproduces a case where React's Scheduler task timed out but
      // the `shouldYield` method returned true. The bug was that React fell
      // into an infinite loop, because it would enter the work loop then
      // immediately yield back to Scheduler.
      //
      // (The next test in this suite covers the same case. The difference is
      // that this test only uses public APIs, whereas the next test mocks
      // `shouldYield` to check when it is called.)
      function Text({text}) {
        return text;
      }

      function App({step}) {
        return (
          <>
            <Text text="A" />
            <TriggerErstwhileSchedulerBug />
            <Text text="B" />
            <TriggerErstwhileSchedulerBug />
            <Text text="C" />
          </>
        );
      }

      function TriggerErstwhileSchedulerBug() {
        // This triggers a once-upon-a-time bug in Scheduler that caused
        // `shouldYield` to return true even though the current task expired.
        Scheduler.unstable_advanceTime(10000);
        Scheduler.unstable_requestPaint();
        return null;
      }

      await ReactNoop.act(async () => {
        ReactNoop.render(<App />);
        expect(Scheduler).toFlushUntilNextPaint([]);
        expect(Scheduler).toFlushUntilNextPaint([]);
      });
    });

    it('mock Scheduler module to check if `shouldYield` is called', async () => {
      // This test reproduces a bug where React's Scheduler task timed out but
      // the `shouldYield` method returned true. Usually we try not to mock
      // internal methods, but I've made an exception here since the point is
      // specifically to test that React is reslient to the behavior of a
      // Scheduler API. That being said, feel free to rewrite or delete this
      // test if/when the API changes.
      function Text({text}) {
        Scheduler.unstable_yieldValue(text);
        return text;
      }

      function App({step}) {
        return (
          <>
            <Text text="A" />
            <Text text="B" />
            <Text text="C" />
          </>
        );
      }

      await ReactNoop.act(async () => {
        // Partially render the tree, then yield
        ReactNoop.render(<App />);
        expect(Scheduler).toFlushAndYieldThrough(['A']);

        // Start logging whenever shouldYield is called
        logDuringShouldYield = true;
        // Let's call it once to confirm the mock actually works
        Scheduler.unstable_shouldYield();
        expect(Scheduler).toHaveYielded(['shouldYield']);

        // Expire the task
        Scheduler.unstable_advanceTime(10000);
        // Because the render expired, React should finish the tree without
        // consulting `shouldYield` again
        expect(Scheduler).toFlushExpired(['B', 'C']);
      });
    });
  },
);
