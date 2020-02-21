let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;
let ReactCache;
let Suspense;
let TextResource;

describe('ReactSpeculativeWork', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableSpeculativeWork = false;
    ReactFeatureFlags.enableSpeculativeWorkTracing = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    ReactCache = require('react-cache');
    Suspense = React.Suspense;
  });

  it('yields text', () => {
    const Ctx = React.createContext(1);

    let selectorTest = false;

    function Text(props) {
      let ctx = React.useContext(Ctx, v => {
        selectorTest && Scheduler.unstable_yieldValue('selector');
        return Math.floor(v / 2);
      });
      Scheduler.unstable_yieldValue(props.text);
      Scheduler.unstable_yieldValue(ctx);
      return props.text + (props.plusValue ? ctx : '');
    }

    let triggerState = null;

    function Nothing({children}) {
      let [state, setState] = React.useState(0);
      // trigger state will result in an identical state. it is used to see
      // where how and if the state bailout is working
      triggerState = () => setState(s => s);
      // Scheduler.unstable_yieldValue('Nothing');
      return children;
    }

    let triggerCtx = null;

    function App() {
      let [val, setVal] = React.useState(2);
      let texts = React.useMemo(
        () => (
          <Nothing>
            <Nothing>
              <Nothing>
                <Nothing>
                  <Nothing>
                    <Nothing>
                      <Nothing>
                        <Nothing>
                          <Nothing>
                            <Nothing>
                              <Nothing>
                                <Nothing>
                                  <Nothing>
                                    <Nothing>
                                      <Nothing>
                                        <Nothing>
                                          <Nothing>
                                            <Nothing>
                                              <Text text="A" plusValue />
                                              <Text text="B" plusValue />
                                              <Text text="C" />
                                            </Nothing>
                                          </Nothing>
                                        </Nothing>
                                      </Nothing>
                                    </Nothing>
                                  </Nothing>
                                </Nothing>
                              </Nothing>
                            </Nothing>
                          </Nothing>
                        </Nothing>
                      </Nothing>
                    </Nothing>
                  </Nothing>
                </Nothing>
              </Nothing>
            </Nothing>
          </Nothing>
        ),
        [],
      );
      triggerCtx = setVal;
      return <Ctx.Provider value={val}>{texts}</Ctx.Provider>;
    }

    for (let i = 0; i < 1000; i++) {
      const root = ReactNoop.createBlockingRoot();

      root.render(<App />);

      // Nothing should have rendered yet
      expect(root).toMatchRenderedOutput(null);

      // Everything should render immediately in the next event
      if (ReactFeatureFlags.enableSpeculativeWork) {
        // double renders for each component with hooks
        expect(Scheduler).toFlushExpired([
          // 'Nothing',
          // 'Nothing',
          // 'Nothing',
          // 'Nothing',
          'A',
          1,
          'A',
          1,
          'B',
          1,
          'B',
          1,
          'C',
          1,
          'C',
          1,
        ]);
        expect(root).toMatchRenderedOutput('A1B1C');
      } else {
        // Text only uses useContext which does not persist a hook in non-spec feature
        // this means no double render
        // also no selector means we get the actual value
        expect(Scheduler).toFlushExpired([
          // 'Nothing',
          // 'Nothing',
          // 'Nothing',
          // 'Nothing',
          'A',
          2,
          'B',
          2,
          'C',
          2,
        ]);
        expect(root).toMatchRenderedOutput('A2B2C');
      }

      ReactNoop.act(() => triggerCtx(4));

      if (ReactFeatureFlags.enableSpeculativeWork) {
        // Everything should render immediately in the next event
        expect(Scheduler).toHaveYielded([
          'A',
          2,
          'A',
          2,
          'B',
          2,
          'B',
          2,
          'C',
          2,
          'C',
          2,
        ]);
        expect(root).toMatchRenderedOutput('A2B2C');
      } else {
        // Everything should render immediately in the next event
        expect(Scheduler).toHaveYielded(['A', 4, 'B', 4, 'C', 4]);
        expect(root).toMatchRenderedOutput('A4B4C');
      }

      selectorTest = true;
      ReactNoop.act(() => triggerCtx(5));
      selectorTest = false;
      // nothing should render (below app) because the value will be the same

      if (ReactFeatureFlags.enableSpeculativeWork) {
        expect(Scheduler).toHaveYielded(['selector', 'selector', 'selector']);
        expect(root).toMatchRenderedOutput('A2B2C');
      } else {
        expect(Scheduler).toHaveYielded(['A', 5, 'B', 5, 'C', 5]);
        expect(root).toMatchRenderedOutput('A5B5C');
      }

      ReactNoop.act(() => triggerCtx(6));

      if (ReactFeatureFlags.enableSpeculativeWork) {
        expect(Scheduler).toHaveYielded([
          'A',
          3,
          'A',
          3,
          'B',
          3,
          'B',
          3,
          'C',
          3,
          'C',
          3,
        ]);
        expect(root).toMatchRenderedOutput('A3B3C');
      } else {
        expect(Scheduler).toHaveYielded(['A', 6, 'B', 6, 'C', 6]);
        expect(root).toMatchRenderedOutput('A6B6C');
      }

      ReactNoop.act(() => triggerState());

      if (ReactFeatureFlags.enableSpeculativeWork) {
        // Everything should render immediately in the next event
        expect(Scheduler).toHaveYielded([]);
        expect(root).toMatchRenderedOutput('A3B3C');
      } else {
        expect(Scheduler).toHaveYielded([]);
        expect(root).toMatchRenderedOutput('A6B6C');
      }
    }
  });
});
