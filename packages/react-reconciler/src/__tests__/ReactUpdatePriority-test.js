let React;
let ReactNoop;
let Scheduler;
let useState;
let useEffect;

describe('ReactUpdatePriority', () => {
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

  test('setState inside passive effect triggered by sync update should have default priority', async () => {
    const root = ReactNoop.createRoot();

    function App() {
      const [state, setState] = useState(1);
      useEffect(() => {
        setState(2);
      }, []);
      return <Text text={state} />;
    }

    await ReactNoop.act(async () => {
      ReactNoop.flushSync(() => {
        root.render(<App />);
      });
      // Should not have flushed the effect update yet
      expect(Scheduler).toHaveYielded([1]);
    });
    expect(Scheduler).toHaveYielded([2]);
  });

  test('setState inside passive effect triggered by idle update should have idle priority', async () => {
    const root = ReactNoop.createRoot();

    let setDefaultState;
    function App() {
      const [idleState, setIdleState] = useState(1);
      const [defaultState, _setDetaultState] = useState(1);
      setDefaultState = _setDetaultState;
      useEffect(() => {
        Scheduler.unstable_yieldValue('Idle update');
        setIdleState(2);
      }, []);
      return <Text text={`Idle: ${idleState}, Default: ${defaultState}`} />;
    }

    await ReactNoop.act(async () => {
      ReactNoop.idleUpdates(() => {
        root.render(<App />);
      });
      // Should not have flushed the effect update yet
      expect(Scheduler).toFlushUntilNextPaint(['Idle: 1, Default: 1']);

      // Schedule another update at default priority
      setDefaultState(2);

      // The default update flushes first, because
      expect(Scheduler).toFlushUntilNextPaint([
        // Idle update is scheduled
        'Idle update',

        // The default update flushes first, without including the idle update
        'Idle: 1, Default: 2',
      ]);
    });
    // Now the idle update has flushed
    expect(Scheduler).toHaveYielded(['Idle: 2, Default: 2']);
  });
});
