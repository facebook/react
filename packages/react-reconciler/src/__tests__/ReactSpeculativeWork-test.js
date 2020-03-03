let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;
let ReactCache;
let Suspense;
let TextResource;

let levels = 7;
let expansion = 3;
let leaves = expansion ** levels;

describe('ReactSpeculativeWork', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableSpeculativeWork = true;
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

    let selector = v => {
      selectorTest && Scheduler.unstable_yieldValue('selector');
      return Math.floor(v / 2);
    };

    function Text(props) {
      let ctx = React.useContext(
        Ctx,
        ReactFeatureFlags.enableSpeculativeWork ? selector : undefined,
      );
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

    for (let i = 0; i < 100; i++) {
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

  it.only('WARMUP with selector: stresses the createWorkInProgress less', () => {
    ReactFeatureFlags.enableSpeculativeWork = false;
    runTest('warmup');
    ReactFeatureFlags.enableSpeculativeWork = true;
    runTest('warmup');
    runTest('warmup', true);
  });

  it.only('regular: stresses the createWorkInProgress less', () => {
    ReactFeatureFlags.enableSpeculativeWork = false;
    runTest('regular');
  });

  it.only('speculative: stresses the createWorkInProgress less', () => {
    ReactFeatureFlags.enableSpeculativeWork = true;
    runTest('speculative');
  });

  it.only('speculative with selector: stresses the createWorkInProgress less', () => {
    ReactFeatureFlags.enableSpeculativeWork = true;
    runTest('selector', true);
  });

  it('breaks', () => {
    let App = () => {
      return (
        <div>
          <Indirection>
            <div>
              <ThingTwo />
              <ThingOne />
            </div>
          </Indirection>
        </div>
      );
    };

    class Indirection extends React.Component {
      shouldComponentUpdate() {
        return false;
      }

      render() {
        return this.props.children;
      }
    }

    let setOne;
    let setTwo;

    let ThingOne = () => {
      let [val, setVal] = React.useState(0);
      setOne = setVal;
      let thing = React.useMemo(() => {
        return <span>thing one</span>;
      }, [Math.floor(val / 2)]);
      return thing;
    };

    let ThingTwo = () => {
      let [val, setVal] = React.useState(0);
      setTwo = setVal;
      let thing = React.useMemo(() => {
        return <span>thing two</span>;
      }, [Math.floor(val / 3)]);
      return thing;
    };

    let root = ReactNoop.createRoot();

    console.log('-------------------------- root render');
    ReactNoop.act(() => root.render(<App />));

    console.log('-------------------------- first update');
    ReactNoop.act(() => {
      setOne(1);
      setTwo(1);
    });

    console.log('-------------------------- second update');
    ReactNoop.act(() => {
      setOne(2);
      setTwo(2);
    });
  });

  it.only('breaks (redux benchmark)', () => {
    let Context = React.createContext(0);

    let c = {
      TREE_DEPTH: 15,
      NUMBER_OF_SLICES: 250,
    };

    let state = {};
    let listeners = new Set();

    let notify = val =>
      listeners.forEach(l => {
        l(val);
      });

    let store = {
      getState: () => state,
      updateRandomId: val =>
        val == null
          ? notify(Math.floor(Math.random() * listeners.size))
          : notify(val),
      subscribe: l => {
        listeners.add(l);
        return () => listeners.delete(l);
      },
    };

    let counters = 0;

    const ConnectedCounter = () => {
      let store = React.useContext(Context);
      let id = React.useRef(null);
      React.useEffect(() => {
        id.current = counters++;
      }, []);
      let [counter, setCounter] = React.useState(0);
      React.useEffect(() => {
        return store.subscribe(v => {
          v === id.current && setCounter(c => c + 1);
        });
      });

      return <Counter value={counter} />;
    };

    const Counter = ({value}) => {
      return <div>Value: {value}</div>;
    };

    class Slice extends React.Component {
      state = {};

      componentDidMount = () => {
        //this.props.fillPairs(this.props.idx);
      };

      render() {
        const {remainingDepth, idx} = this.props;

        if (remainingDepth > 0) {
          return (
            <div>
              {idx}.{remainingDepth}
              <div>
                <Slice idx={idx} remainingDepth={remainingDepth - 1} />
              </div>
            </div>
          );
        }

        return <ConnectedCounter idx={idx} />;
      }
    }
    Slice.displayName = 'Slice';

    class App extends React.Component {
      render() {
        return (
          <div>
            <button onClick={this.props.incrementRandomCounter}>
              Update Random Counter
            </button>
            <div className="row">
              {this.props.slices.map((slice, idx) => {
                return (
                  <div
                    style={{display: 'inline-block', minWidth: 70}}
                    key={idx}>
                    <Slice idx={slice} remainingDepth={c.TREE_DEPTH} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    }
    App.displayName = 'App';

    ReactNoop.act(() =>
      ReactNoop.render(
        <React.Profiler id="appProfiler" onRender={console.log}>
          <Context.Provider value={store}>
            <App
              slices={new Array(c.NUMBER_OF_SLICES)
                .fill(0)
                .map((_, idx) => idx)}
            />
          </Context.Provider>
        </React.Profiler>,
      ),
    );
    console.log('--------------------- about to update random id');
    ReactNoop.act(() => store.updateRandomId(1));
    console.log('*******--------------------- about to update random id');
    ReactNoop.act(() => store.updateRandomId(0));
    ReactNoop.act(() => store.updateRandomId(0));

    expect(true).toBe(true);
  });
});

function runTest(label, withSelector) {
  let Context = React.createContext(0);
  let renderCount = 0;

  let span = <span>Consumer</span>;
  let selector = withSelector ? c => 1 : undefined;
  let Consumer = React.forwardRef(() => {
    let value = React.useContext(Context, selector);
    let reduced = Math.floor(value / 2);
    // whenever this effect has a HasEffect tag we won't bail out of updates. currently 50% of the time
    // React.useEffect(() => {}, [reduced]);
    renderCount++;
    // with residue feature this static element will enable bailouts even if we do a render
    return span;
  });

  let Expansion = React.memo(({level}) => {
    if (level > 0) {
      return (
        <span>
          {new Array(expansion).fill(0).map((_, i) => (
            <Expansion key={i} level={level - 1} />
          ))}
        </span>
      );
    } else {
      return <Consumer />;
    }
  });

  let externalSetValue;

  let App = () => {
    let [value, setValue] = React.useState(0);
    externalSetValue = setValue;
    let child = React.useMemo(() => <Expansion level={levels} />, [levels]);
    return <Context.Provider value={value}>{child}</Context.Provider>;
  };

  let root = ReactNoop.createRoot();

  ReactNoop.act(() => root.render(<App />));

  expect(Scheduler).toFlushAndYield([]);

  ReactNoop.act(() => {
    externalSetValue(1);
  });
  expect(Scheduler).toFlushAndYield([]);
  // expect(root.getChildren().length).toBe(leaves);

  for (let i = 2; i < 10; i++) {
    ReactNoop.act(() => {
      externalSetValue(i);
    });
    expect(Scheduler).toFlushAndYield([]);
  }
  // expect(root.getChildren().length).toBe(leaves);

  console.log(`${label}: renderCount`, renderCount);
}
