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
let act;
let NormalPriority;
let IdlePriority;
let runWithPriority;
let startTransition;

describe('ReactSchedulerIntegration', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
    NormalPriority = Scheduler.unstable_NormalPriority;
    IdlePriority = Scheduler.unstable_IdlePriority;
    runWithPriority = Scheduler.unstable_runWithPriority;
    startTransition = React.startTransition;
  });

  // Note: This is based on a similar component we use in www. We can delete
  // once the extra div wrapper is no longer necessary.
  function LegacyHiddenDiv({children, mode}) {
    return (
      <div hidden={mode === 'hidden'}>
        <React.unstable_LegacyHidden
          mode={mode === 'hidden' ? 'unstable-defer-without-hiding' : mode}>
          {children}
        </React.unstable_LegacyHidden>
      </div>
    );
  }

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
    await act(async () => {
      ReactNoop.render(<CleanupEffect />);
    });
    expect(Scheduler).toHaveYielded([]);
    await act(async () => {
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

  it('requests a paint after committing', () => {
    const scheduleCallback = Scheduler.unstable_scheduleCallback;

    const root = ReactNoop.createRoot();
    root.render('Initial');
    Scheduler.unstable_flushAll();

    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('A'));
    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('B'));
    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('C'));

    // Schedule a React render. React will request a paint after committing it.
    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
        root.render('Update');
      });
    } else {
      root.render('Update');
    }

    // Advance time just to be sure the next tasks have lower priority
    Scheduler.unstable_advanceTime(2000);

    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('D'));
    scheduleCallback(NormalPriority, () => Scheduler.unstable_yieldValue('E'));

    // Flush everything up to the next paint. Should yield after the
    // React commit.
    Scheduler.unstable_flushUntilNextPaint();
    expect(Scheduler).toHaveYielded(['A', 'B', 'C']);
  });

  // @gate www
  it('idle updates are not blocked by offscreen work', async () => {
    function Text({text}) {
      Scheduler.unstable_yieldValue(text);
      return text;
    }

    function App({label}) {
      return (
        <>
          <Text text={`Visible: ` + label} />
          <LegacyHiddenDiv mode="hidden">
            <Text text={`Hidden: ` + label} />
          </LegacyHiddenDiv>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
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
        const actual = jest.requireActual('scheduler/unstable_mock');
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
      startTransition = React.startTransition;
    });

    afterEach(() => {
      jest.mock('scheduler', () =>
        jest.requireActual('scheduler/unstable_mock'),
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

      await act(async () => {
        ReactNoop.render(<App />);
        expect(Scheduler).toFlushUntilNextPaint([]);
        expect(Scheduler).toFlushUntilNextPaint([]);
      });
    });

    it('mock Scheduler module to check if `shouldYield` is called', async () => {
      // This test reproduces a bug where React's Scheduler task timed out but
      // the `shouldYield` method returned true. Usually we try not to mock
      // internal methods, but I've made an exception here since the point is
      // specifically to test that React is resilient to the behavior of a
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

      await act(async () => {
        // Partially render the tree, then yield
        startTransition(() => {
          ReactNoop.render(<App />);
        });
        expect(Scheduler).toFlushAndYieldThrough(['A']);

        // Start logging whenever shouldYield is called
        logDuringShouldYield = true;
        // Let's call it once to confirm the mock actually works
        Scheduler.unstable_shouldYield();
        expect(Scheduler).toHaveYielded(['shouldYield']);

        // Expire the task
        Scheduler.unstable_advanceTime(10000);
        // Scheduling a new update is a trick to force the expiration to kick
        // in. We don't check if a update has been starved at the beginning of
        // working on it, since there's no point — we're already working on it.
        // We only check before yielding to the main thread (to avoid starvation
        // by other main thread work) or when receiving an update (to avoid
        // starvation by incoming updates).
        startTransition(() => {
          ReactNoop.render(<App />);
        });

        // Because the render expired, React should finish the tree without
        // consulting `shouldYield` again
        Scheduler.unstable_flushNumberOfYields(1);
        expect(Scheduler).toHaveYielded(['B', 'C']);
      });
    });
  },
);
