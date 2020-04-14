let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;

let levels = 5;
let expansion = 3;

xdescribe('ReactSpeculativeWork', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
  });

  it('exercises bailoutReducer', () => {
    let _dispatch;

    let App = () => {
      return <Parent />;
    };

    let Parent = () => {
      return <Child />;
    };

    let Child = () => {
      let [value, dispatch] = React.useReducer(function noZs(s, a) {
        if (a === 'z') return s;
        return s + a;
      }, '');
      Scheduler.unstable_yieldValue(value);
      _dispatch = dispatch;
      return value;
    };

    console.log('------------------------------------ initial');
    const root = ReactNoop.createRoot();
    ReactNoop.act(() => root.render(<App />));
    expect(Scheduler).toHaveYielded(['']);
    expect(root).toMatchRenderedOutput('');

    console.log('------------------------------------ dispatch a');
    ReactNoop.act(() => _dispatch('a'));
    expect(Scheduler).toHaveYielded(['a']);
    expect(root).toMatchRenderedOutput('a');

    console.log('------------------------------------ dispatch b');
    ReactNoop.act(() => _dispatch('b'));
    expect(Scheduler).toHaveYielded(['ab']);
    expect(root).toMatchRenderedOutput('ab');

    console.log('------------------------------------ dispatch z');
    ReactNoop.act(() => _dispatch('z'));
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('ab');

    console.log('------------------------------------ dispatch c');
    ReactNoop.act(() => _dispatch('c'));
    expect(Scheduler).toHaveYielded(['abc']);
    expect(root).toMatchRenderedOutput('abc');

    console.log('------------------------------------ dispatch zd');
    ReactNoop.act(() => {
      _dispatch('z');
      _dispatch('d');
    });
    expect(Scheduler).toHaveYielded(['abcd']);
    expect(root).toMatchRenderedOutput('abcd');

    console.log('------------------------------------ dispatch ezzzzfzzz');
    ReactNoop.act(() => {
      _dispatch('e');
      _dispatch('z');
      _dispatch('z');
      _dispatch('z');
      _dispatch('z');
      _dispatch('f');
      _dispatch('z');
      _dispatch('z');
      _dispatch('z');
    });
    expect(Scheduler).toHaveYielded(['abcdef']);
    expect(root).toMatchRenderedOutput('abcdef');
  });

  it('exercises reifyNextWork', () => {
    let externalSetValue;
    let externalSetMyContextValue;

    let App = () => {
      let ctxVal = React.useContext(MyContext);
      let [value, setMyContextValue] = React.useState(ctxVal);
      externalSetMyContextValue = setMyContextValue;

      return (
        <MyContext.Provider value={value}>
          <Indirection>
            <Intermediate>
              <BeforeUpdatingLeafBranch>
                <Leaf />
              </BeforeUpdatingLeafBranch>
              <Intermediate>
                <Intermediate>
                  <Leaf />
                </Intermediate>
                <UpdatingLeaf />
                <Leaf />
                <Leaf />
              </Intermediate>
              <AfterUpdatingLeafBranch />
            </Intermediate>
          </Indirection>
        </MyContext.Provider>
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

    let Intermediate = React.memo(function Intermediate({children}) {
      return children || null;
    });
    let BeforeUpdatingLeafBranch = React.memo(
      function BeforeUpdatingLeafBranch({children}) {
        return children || null;
      },
    );
    let AfterUpdatingLeafBranch = React.memo(function AfterUpdatingLeafBranch({
      children,
    }) {
      return children || null;
    });
    let Leaf = React.memo(function Leaf() {
      return null;
    });

    let MyContext = React.createContext(0);

    let UpdatingLeaf = React.memo(
      function UpdatingLeaf() {
        let [value, setValue] = React.useState('leaf');
        let isEven = React.useContext(MyContext, v => v % 2 === 0);
        Scheduler.unstable_yieldValue(value);
        externalSetValue = setValue;
        return `${value}-${isEven ? 'even' : 'odd'}`;
      },
      (prevProps, nextProps) => prevProps === nextProps,
    );

    let root = ReactNoop.createRoot();

    ReactNoop.act(() => root.render(<App />));
    expect(Scheduler).toHaveYielded(['leaf']);
    expect(root).toMatchRenderedOutput('leaf-even');

    ReactNoop.act(() => externalSetValue('leaf'));
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('leaf-even');

    ReactNoop.act(() => externalSetMyContextValue(2));
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('leaf-even');

    ReactNoop.act(() => {
      externalSetValue('leaf');
      externalSetMyContextValue(4);
    });
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('leaf-even');

    ReactNoop.act(() => externalSetMyContextValue(5));
    expect(Scheduler).toHaveYielded(['leaf']);
    expect(root).toMatchRenderedOutput('leaf-odd');

    ReactNoop.act(() => {
      externalSetValue('bar');
      externalSetMyContextValue(4);
    });
    expect(Scheduler).toHaveYielded(['bar']);
    expect(root).toMatchRenderedOutput('bar-even');

    ReactNoop.act(() => externalSetValue('baz'));
    expect(Scheduler).toHaveYielded(['baz']);
    expect(root).toMatchRenderedOutput('baz-even');
  });

  it('enters advanced context tracking mode when you read from different contexts in different orders', () => {
    const ContextProviderContext = React.createContext(
      React.createContext('dummy'),
    );

    const NumberContext = React.createContext(0);
    const StringContext = React.createContext('zero');

    let Consumer = () => {
      let ContextToUse = React.useContext(ContextProviderContext);
      let value = React.useContext(ContextToUse);
      return value;
    };

    class Indirection extends React.Component {
      shouldComponentUpdate() {
        return false;
      }

      render() {
        return this.props.children;
      }
    }

    let App = ({ContextToUse, numberValue, stringValue, keyValue}) => {
      return (
        <ContextProviderContext.Provider value={ContextToUse}>
          <NumberContext.Provider value={numberValue}>
            <StringContext.Provider value={stringValue}>
              <Indirection key={keyValue}>
                <Consumer />
              </Indirection>
            </StringContext.Provider>
          </NumberContext.Provider>
        </ContextProviderContext.Provider>
      );
    };

    let root = ReactNoop.createRoot();

    console.log('---------------------- initial render with NumberContext');
    ReactNoop.act(() =>
      root.render(
        <App
          ContextToUse={NumberContext}
          numberValue={1}
          stringValue="one"
          keyValue={1}
        />,
      ),
    );
    expect(root).toMatchRenderedOutput('1');

    console.log('---------------------- remount render with NumberContext');
    ReactNoop.act(() =>
      root.render(
        <App
          ContextToUse={NumberContext}
          numberValue={1}
          stringValue="one"
          keyValue={2}
        />,
      ),
    );
    expect(root).toMatchRenderedOutput('1');

    console.log('---------------------- change numberValue render');
    ReactNoop.act(() =>
      root.render(
        <App
          ContextToUse={NumberContext}
          numberValue={2}
          stringValue="two"
          keyValue={2}
        />,
      ),
    );
    expect(root).toMatchRenderedOutput('2');

    console.log('---------------------- switch to StringContext render');
    ReactNoop.act(() =>
      root.render(
        <App
          ContextToUse={StringContext}
          numberValue={2}
          stringValue="two"
          keyValue={2}
        />,
      ),
    );
    expect(root).toMatchRenderedOutput('two');

    console.log('---------------------- remount on NumberContext render');
    ReactNoop.act(() =>
      root.render(
        <App
          ContextToUse={NumberContext}
          numberValue={3}
          stringValue="three"
          keyValue={3}
        />,
      ),
    );
    expect(root).toMatchRenderedOutput('3');

    console.log('---------------------- switch to StringContext render');
    ReactNoop.act(() =>
      root.render(
        <App
          ContextToUse={StringContext}
          numberValue={3}
          stringValue="three"
          keyValue={3}
        />,
      ),
    );
    expect(root).toMatchRenderedOutput('three');

    console.log('---------------------- switch back to NumberContext render');
    ReactNoop.act(() =>
      root.render(
        <App
          ContextToUse={NumberContext}
          numberValue={3}
          stringValue="three"
          keyValue={3}
        />,
      ),
    );
    expect(root).toMatchRenderedOutput('3');

    console.log('---------------------- switch back to StringContext render');
    ReactNoop.act(() =>
      root.render(
        <App
          ContextToUse={StringContext}
          numberValue={3}
          stringValue="three"
          keyValue={3}
        />,
      ),
    );
    expect(root).toMatchRenderedOutput('three');
  });

  let warmups = [];
  let tests = [];

  function warmupAndRunTest(testFn, label) {
    warmups.push(() =>
      it(`warmup(${label})`, () => testFn(`warmup(${label})`)),
    );
    tests.push(() => it(label, () => testFn(label)));
  }

  warmupAndRunTest(label => {
    ReactFeatureFlags.enableContextReaderPropagation = false;
    ReactFeatureFlags.enableReifyNextWork = false;
    runTest(label);
  }, 'regular(walk)');

  warmupAndRunTest(label => {
    ReactFeatureFlags.enableContextReaderPropagation = true;
    ReactFeatureFlags.enableReifyNextWork = false;
    runTest(label);
  }, 'regular(reader)');

  warmupAndRunTest(label => {
    ReactFeatureFlags.enableContextReaderPropagation = false;
    ReactFeatureFlags.enableReifyNextWork = true;
    runTest(label);
  }, 'speculative(walk)');

  warmupAndRunTest(label => {
    ReactFeatureFlags.enableContextReaderPropagation = true;
    ReactFeatureFlags.enableReifyNextWork = true;
    runTest(label);
  }, 'speculative(reader)');

  warmupAndRunTest(label => {
    ReactFeatureFlags.enableContextReaderPropagation = false;
    ReactFeatureFlags.enableReifyNextWork = true;
    runTest(label, true);
  }, 'speculativeSelector(walk)');

  warmupAndRunTest(label => {
    ReactFeatureFlags.enableContextReaderPropagation = true;
    ReactFeatureFlags.enableReifyNextWork = true;
    runTest(label, true);
  }, 'speculativeSelector(reader)');

  warmups.forEach(t => t());
  tests.forEach(t => t());
});

function runTest(label, withSelector) {
  let Context = React.createContext(0);
  let renderCount = 0;

  let span = <span>Consumer</span>;
  let selector = withSelector ? value => 1 : undefined;
  let Consumer = React.forwardRef(() => {
    let value = React.useContext(Context, selector);
    let reduced = withSelector ? Math.floor(value / 3) : value;
    // whenever this effect has a HasEffect tag we won't bail out of updates. currently 33% of the time
    React.useEffect(() => {}, [reduced]);
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
      return (
        <>
          <Consumer />
          <ExtraNodes level={3} />
        </>
      );
    }
  });

  let ExtraNodes = ({level}) => {
    if (level > 0) {
      return (
        <span>
          {new Array(expansion).fill(0).map((_, i) => (
            <ExtraNodes key={i} level={level - 1} />
          ))}
        </span>
      );
    } else {
      return 'extra-leaf';
    }
  };

  let externalSetValue;

  let App = () => {
    let [value, setValue] = React.useState(0);
    externalSetValue = setValue;
    let child = React.useMemo(() => <Expansion level={levels} />, [levels]);
    return <Context.Provider value={value}>{child}</Context.Provider>;
  };

  let root = ReactNoop.createRoot();

  ReactNoop.act(() => root.render(<App />));

  ReactNoop.act(() => {
    externalSetValue(1);
  });

  for (let i = 2; i < 10; i++) {
    ReactNoop.act(() => {
      externalSetValue(i);
    });
  }

  console.log(`${label}: renderCount`, renderCount);
}
