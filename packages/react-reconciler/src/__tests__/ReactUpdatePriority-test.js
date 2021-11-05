let React;
let ReactNoop;
let Scheduler;
let ContinuousEventPriority;
let startTransition;
let useState;
let useEffect;
let act;

describe('ReactUpdatePriority', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
    ContinuousEventPriority = require('react-reconciler/constants')
      .ContinuousEventPriority;
    startTransition = React.startTransition;
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

    await act(async () => {
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
      const [defaultState, _setDefaultState] = useState(1);
      setDefaultState = _setDefaultState;
      useEffect(() => {
        Scheduler.unstable_yieldValue('Idle update');
        setIdleState(2);
      }, []);
      return <Text text={`Idle: ${idleState}, Default: ${defaultState}`} />;
    }

    await act(async () => {
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

  test('continuous updates should interrupt transitions', async () => {
    const root = ReactNoop.createRoot();

    let setCounter;
    let setIsHidden;
    function App() {
      const [counter, _setCounter] = useState(1);
      const [isHidden, _setIsHidden] = useState(false);
      setCounter = _setCounter;
      setIsHidden = _setIsHidden;
      if (isHidden) {
        return <Text text={'(hidden)'} />;
      }
      return (
        <>
          <Text text={'A' + counter} />
          <Text text={'B' + counter} />
          <Text text={'C' + counter} />
        </>
      );
    }

    await act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['A1', 'B1', 'C1']);
    expect(root).toMatchRenderedOutput('A1B1C1');

    await act(async () => {
      startTransition(() => {
        setCounter(2);
      });
      expect(Scheduler).toFlushAndYieldThrough(['A2']);
      ReactNoop.unstable_runWithPriority(ContinuousEventPriority, () => {
        setIsHidden(true);
      });
    });
    expect(Scheduler).toHaveYielded([
      // Because the hide update has continuous priority, it should interrupt the
      // in-progress transition
      '(hidden)',
      // When the transition resumes, it's a no-op because the children are
      // now hidden.
      '(hidden)',
    ]);
    expect(root).toMatchRenderedOutput('(hidden)');
  });
});
