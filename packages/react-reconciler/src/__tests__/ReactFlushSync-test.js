let React;
let ReactNoop;
let Scheduler;
let act;
let useState;
let useEffect;
let startTransition;
let assertLog;
let waitForPaint;

// TODO: Migrate tests to React DOM instead of React Noop

describe('ReactFlushSync', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    useState = React.useState;
    useEffect = React.useEffect;
    startTransition = React.startTransition;

    const InternalTestUtils = require('internal-test-utils');
    assertLog = InternalTestUtils.assertLog;
    waitForPaint = InternalTestUtils.waitForPaint;
  });

  function Text({text}) {
    Scheduler.log(text);
    return text;
  }

  test('changes priority of updates in useEffect', async () => {
    spyOnDev(console, 'error').mockImplementation(() => {});

    function App() {
      const [syncState, setSyncState] = useState(0);
      const [state, setState] = useState(0);
      useEffect(() => {
        if (syncState !== 1) {
          setState(1);
          ReactNoop.flushSync(() => setSyncState(1));
        }
      }, [syncState, state]);
      return <Text text={`${syncState}, ${state}`} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        React.startTransition(() => {
          root.render(<App />);
        });
      } else {
        root.render(<App />);
      }
      // This will yield right before the passive effect fires
      await waitForPaint(['0, 0']);

      // The passive effect will schedule a sync update and a normal update.
      // They should commit in two separate batches. First the sync one.
      await waitForPaint(
        gate(flags => flags.enableUnifiedSyncLane) ? ['1, 1'] : ['1, 0'],
      );

      // The remaining update is not sync
      ReactNoop.flushSync();
      assertLog([]);

      if (gate(flags => flags.enableUnifiedSyncLane)) {
        await waitForPaint([]);
      } else {
        // Now flush it.
        await waitForPaint(['1, 1']);
      }
    });
    expect(root).toMatchRenderedOutput('1, 1');

    if (__DEV__) {
      expect(console.error.mock.calls[0][0]).toContain(
        'flushSync was called from inside a lifecycle method. React ' +
          'cannot flush when React is already rendering. Consider moving this ' +
          'call to a scheduler task or micro task.%s',
      );
    }
  });

  test('nested with startTransition', async () => {
    let setSyncState;
    let setState;
    function App() {
      const [syncState, _setSyncState] = useState(0);
      const [state, _setState] = useState(0);
      setSyncState = _setSyncState;
      setState = _setState;
      return <Text text={`${syncState}, ${state}`} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<App />);
    });
    assertLog(['0, 0']);
    expect(root).toMatchRenderedOutput('0, 0');

    await act(() => {
      ReactNoop.flushSync(() => {
        startTransition(() => {
          // This should be async even though flushSync is on the stack, because
          // startTransition is closer.
          setState(1);
          ReactNoop.flushSync(() => {
            // This should be async even though startTransition is on the stack,
            // because flushSync is closer.
            setSyncState(1);
          });
        });
      });
      // Only the sync update should have flushed
      assertLog(['1, 0']);
      expect(root).toMatchRenderedOutput('1, 0');
    });
    // Now the async update has flushed, too.
    assertLog(['1, 1']);
    expect(root).toMatchRenderedOutput('1, 1');
  });

  test('flushes passive effects synchronously when they are the result of a sync render', async () => {
    function App() {
      useEffect(() => {
        Scheduler.log('Effect');
      }, []);
      return <Text text="Child" />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      ReactNoop.flushSync(() => {
        root.render(<App />);
      });
      assertLog([
        'Child',
        // Because the pending effect was the result of a sync update, calling
        // flushSync should flush it.
        'Effect',
      ]);
      expect(root).toMatchRenderedOutput('Child');
    });
  });

  test('do not flush passive effects synchronously after render in legacy mode', async () => {
    function App() {
      useEffect(() => {
        Scheduler.log('Effect');
      }, []);
      return <Text text="Child" />;
    }

    const root = ReactNoop.createLegacyRoot();
    await act(() => {
      ReactNoop.flushSync(() => {
        root.render(<App />);
      });
      assertLog([
        'Child',
        // Because we're in legacy mode, we shouldn't have flushed the passive
        // effects yet.
      ]);
      expect(root).toMatchRenderedOutput('Child');
    });
    // Effect flushes after paint.
    assertLog(['Effect']);
  });

  test('flush pending passive effects before scope is called in legacy mode', async () => {
    let currentStep = 0;

    function App({step}) {
      useEffect(() => {
        currentStep = step;
        Scheduler.log('Effect: ' + step);
      }, [step]);
      return <Text text={step} />;
    }

    const root = ReactNoop.createLegacyRoot();
    await act(() => {
      ReactNoop.flushSync(() => {
        root.render(<App step={1} />);
      });
      assertLog([
        1,
        // Because we're in legacy mode, we shouldn't have flushed the passive
        // effects yet.
      ]);
      expect(root).toMatchRenderedOutput('1');

      ReactNoop.flushSync(() => {
        // This should render step 2 because the passive effect has already
        // fired, before the scope function is called.
        root.render(<App step={currentStep + 1} />);
      });
      assertLog(['Effect: 1', 2]);
      expect(root).toMatchRenderedOutput('2');
    });
    assertLog(['Effect: 2']);
  });

  test("do not flush passive effects synchronously when they aren't the result of a sync render", async () => {
    function App() {
      useEffect(() => {
        Scheduler.log('Effect');
      }, []);
      return <Text text="Child" />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
      await waitForPaint([
        'Child',
        // Because the passive effect was not the result of a sync update, it
        // should not flush before paint.
      ]);
      expect(root).toMatchRenderedOutput('Child');
    });
    // Effect flushes after paint.
    assertLog(['Effect']);
  });

  test('does not flush pending passive effects', async () => {
    function App() {
      useEffect(() => {
        Scheduler.log('Effect');
      }, []);
      return <Text text="Child" />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
      await waitForPaint(['Child']);
      expect(root).toMatchRenderedOutput('Child');

      // Passive effects are pending. Calling flushSync should not affect them.
      ReactNoop.flushSync();
      // Effects still haven't fired.
      assertLog([]);
    });
    // Now the effects have fired.
    assertLog(['Effect']);
  });

  test('completely exhausts synchronous work queue even if something throws', async () => {
    function Throws({error}) {
      throw error;
    }

    const root1 = ReactNoop.createRoot();
    const root2 = ReactNoop.createRoot();
    const root3 = ReactNoop.createRoot();

    await act(async () => {
      root1.render(<Text text="Hi" />);
      root2.render(<Text text="Andrew" />);
      root3.render(<Text text="!" />);
    });
    assertLog(['Hi', 'Andrew', '!']);

    const aahh = new Error('AAHH!');
    const nooo = new Error('Noooooooooo!');

    let error;
    try {
      ReactNoop.flushSync(() => {
        root1.render(<Throws error={aahh} />);
        root2.render(<Throws error={nooo} />);
        root3.render(<Text text="aww" />);
      });
    } catch (e) {
      error = e;
    }

    // The update to root 3 should have finished synchronously, even though the
    // earlier updates errored.
    assertLog(['aww']);
    // Roots 1 and 2 were unmounted.
    expect(root1).toMatchRenderedOutput(null);
    expect(root2).toMatchRenderedOutput(null);
    expect(root3).toMatchRenderedOutput('aww');

    // Because there were multiple errors, React threw an AggregateError.
    // eslint-disable-next-line no-undef
    expect(error).toBeInstanceOf(AggregateError);
    expect(error.errors.length).toBe(2);
    expect(error.errors[0]).toBe(aahh);
    expect(error.errors[1]).toBe(nooo);
  });
});
