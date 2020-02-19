let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;
let ReactCache;
let Suspense;
let TextResource;

describe('ReactLazyReconciler', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    // ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    // ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    ReactCache = require('react-cache');
    Suspense = React.Suspense;
  });

  it('yields text', () => {
    const root = ReactNoop.createBlockingRoot();

    const Ctx = React.createContext(1);

    function Text(props) {
      let ctx = React.useContext(Ctx);
      Scheduler.unstable_yieldValue(props.text);
      Scheduler.unstable_yieldValue(ctx);
      return props.text;
    }

    let triggerState = null;

    function Nothing({children}) {
      let [state, setState] = React.useState(0);
      triggerState = () => setState(s => s);
      console.log('^^^^ rendering Nothing Component');
      Scheduler.unstable_yieldValue('Nothing');
      return children;
    }

    let triggerCtx = null;

    function App() {
      let [val, setVal] = React.useState(1);
      let texts = React.useMemo(
        () => (
          <Nothing>
            <Nothing>
              <Text text="A" />
              <Text text="B" />
              <Text text="C" />
            </Nothing>
          </Nothing>
        ),
        [],
      );
      triggerCtx = setVal;
      return <Ctx.Provider value={val}>{texts}</Ctx.Provider>;
    }

    root.render(<App />);

    // Nothing should have rendered yet
    expect(root).toMatchRenderedOutput(null);

    // Everything should render immediately in the next event
    expect(Scheduler).toFlushExpired([
      'Nothing',
      'Nothing',
      'Nothing', // double renders for components with hooks that are indeterminant
      'Nothing',
      'A',
      1,
      'B',
      1,
      'C',
      1,
    ]);
    expect(root).toMatchRenderedOutput('ABC');

    ReactNoop.act(() => triggerCtx(2));

    // Everything should render immediately in the next event
    expect(Scheduler).toHaveYielded(['A', 2, 'B', 2, 'C', 2]);
    expect(root).toMatchRenderedOutput('ABC');

    ReactNoop.act(() => triggerCtx(3));

    // Everything should render immediately in the next event
    expect(Scheduler).toHaveYielded(['A', 3, 'B', 3, 'C', 3]);
    expect(root).toMatchRenderedOutput('ABC');

    ReactNoop.act(() => triggerState());

    // Everything should render immediately in the next event
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('ABC');
  });
});
