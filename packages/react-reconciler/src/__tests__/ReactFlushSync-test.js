let React;
let ReactNoop;
let Scheduler;
let useState;
let useEffect;

describe('ReactFlushSync', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    useState = React.useState;
    useEffect = React.useEffect;
  });

  function Text({text}) {
    Scheduler.unstable_yieldValue(text);
    return text;
  }

  test('changes priority of updates in useEffect', async () => {
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
    await ReactNoop.act(async () => {
      root.render(<App />);
      // This will yield right before the passive effect fires
      expect(Scheduler).toFlushUntilNextPaint(['0, 0']);

      // The passive effect will schedule a sync update and a normal update.
      // They should commit in two separate batches. First the sync one.
      expect(() =>
        expect(Scheduler).toFlushUntilNextPaint(['1, 0']),
      ).toErrorDev('flushSync was called from inside a lifecycle method');

      // The remaining update is not sync
      ReactNoop.flushSync();
      expect(Scheduler).toHaveYielded([]);

      // Now flush it.
      expect(Scheduler).toFlushUntilNextPaint(['1, 1']);
    });
    expect(root).toMatchRenderedOutput('1, 1');
  });

  test('flushes pending passive effects if they were the result of a sync render', async () => {
    function App() {
      useEffect(() => {
        Scheduler.unstable_yieldValue('Effect');
      }, []);
      return <Text text="Child" />;
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      ReactNoop.flushSync(() => {
        root.render(<App />);
      });
      expect(Scheduler).toHaveYielded([
        'Child',
        // Passive effect hasn't fired yet
      ]);
      expect(root).toMatchRenderedOutput('Child');

      // Because the pending effect was the result of a sync update, calling
      // flushSync should flush it.
      ReactNoop.flushSync();
      expect(Scheduler).toHaveYielded(['Effect']);
    });
  });

  test("does not flush pending passive effects if they weren't the result of a sync render", async () => {
    function App() {
      useEffect(() => {
        Scheduler.unstable_yieldValue('Effect');
      }, []);
      return <Text text="Child" />;
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App />);
      expect(Scheduler).toFlushUntilNextPaint([
        'Child',
        // Passive effect hasn't fired yet
      ]);
      expect(root).toMatchRenderedOutput('Child');

      // Because the pending effect was not the result of a sync update, calling
      // flushSync should not flush it.
      ReactNoop.flushSync();
      expect(Scheduler).toHaveYielded([]);
    });
    expect(Scheduler).toHaveYielded(['Effect']);
  });
});
