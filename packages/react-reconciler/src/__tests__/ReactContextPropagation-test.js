let React;
let ReactNoop;
let Scheduler;
let act;
let useState;
let useContext;
let Suspense;
let SuspenseList;
let getCacheForType;
let caches;
let seededCache;
let assertLog;

describe('ReactLazyContextPropagation', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    useState = React.useState;
    useContext = React.useContext;
    Suspense = React.Suspense;
    if (gate(flags => flags.enableSuspenseList)) {
      SuspenseList = React.unstable_SuspenseList;
    }

    const InternalTestUtils = require('internal-test-utils');
    assertLog = InternalTestUtils.assertLog;

    getCacheForType = React.unstable_getCacheForType;

    caches = [];
    seededCache = null;
  });

  function createTextCache() {
    if (seededCache !== null) {
      // Trick to seed a cache before it exists.
      // TODO: Need a built-in API to seed data before the initial render (i.e.
      // not a refresh because nothing has mounted yet).
      const cache = seededCache;
      seededCache = null;
      return cache;
    }

    const data = new Map();
    const version = caches.length + 1;
    const cache = {
      version,
      data,
      resolve(text) {
        const record = data.get(text);
        if (record === undefined) {
          const newRecord = {
            status: 'resolved',
            value: text,
          };
          data.set(text, newRecord);
        } else if (record.status === 'pending') {
          const thenable = record.value;
          record.status = 'resolved';
          record.value = text;
          thenable.pings.forEach(t => t());
        }
      },
      reject(text, error) {
        const record = data.get(text);
        if (record === undefined) {
          const newRecord = {
            status: 'rejected',
            value: error,
          };
          data.set(text, newRecord);
        } else if (record.status === 'pending') {
          const thenable = record.value;
          record.status = 'rejected';
          record.value = error;
          thenable.pings.forEach(t => t());
        }
      },
    };
    caches.push(cache);
    return cache;
  }

  function readText(text) {
    const textCache = getCacheForType(createTextCache);
    const record = textCache.data.get(text);
    if (record !== undefined) {
      switch (record.status) {
        case 'pending':
          Scheduler.log(`Suspend! [${text}]`);
          throw record.value;
        case 'rejected':
          Scheduler.log(`Error! [${text}]`);
          throw record.value;
        case 'resolved':
          return textCache.version;
      }
    } else {
      Scheduler.log(`Suspend! [${text}]`);

      const thenable = {
        pings: [],
        then(resolve) {
          if (newRecord.status === 'pending') {
            thenable.pings.push(resolve);
          } else {
            Promise.resolve().then(() => resolve(newRecord.value));
          }
        },
      };

      const newRecord = {
        status: 'pending',
        value: thenable,
      };
      textCache.data.set(text, newRecord);

      throw thenable;
    }
  }

  function Text({text}) {
    Scheduler.log(text);
    return text;
  }

  // function AsyncText({text, showVersion}) {
  //   const version = readText(text);
  //   const fullText = showVersion ? `${text} [v${version}]` : text;
  //   Scheduler.log(fullText);
  //   return text;
  // }

  function seedNextTextCache(text) {
    if (seededCache === null) {
      seededCache = createTextCache();
    }
    seededCache.resolve(text);
  }

  function resolveMostRecentTextCache(text) {
    if (caches.length === 0) {
      throw Error('Cache does not exist.');
    } else {
      // Resolve the most recently created cache. An older cache can by
      // resolved with `caches[index].resolve(text)`.
      caches[caches.length - 1].resolve(text);
    }
  }

  const resolveText = resolveMostRecentTextCache;

  // function rejectMostRecentTextCache(text, error) {
  //   if (caches.length === 0) {
  //     throw Error('Cache does not exist.');
  //   } else {
  //     // Resolve the most recently created cache. An older cache can by
  //     // resolved with `caches[index].reject(text, error)`.
  //     caches[caches.length - 1].reject(text, error);
  //   }
  // }

  it(
    'context change should prevent bailout of memoized component (useMemo -> ' +
      'no intermediate fiber)',
    async () => {
      const root = ReactNoop.createRoot();

      const Context = React.createContext(0);

      let setValue;
      function App() {
        const [value, _setValue] = useState(0);
        setValue = _setValue;

        // NOTE: It's an important part of this test that we're memoizing the
        // props of the Consumer component, as opposed to wrapping in an
        // additional memoized fiber, because the implementation propagates
        // context changes whenever a fiber bails out.
        const consumer = React.useMemo(() => <Consumer />, []);

        return <Context.Provider value={value}>{consumer}</Context.Provider>;
      }

      function Consumer() {
        const value = useContext(Context);
        // Even though Consumer is memoized, Consumer should re-render
        // DeepChild whenever the context value changes. Otherwise DeepChild
        // won't receive the new value.
        return <DeepChild value={value} />;
      }

      function DeepChild({value}) {
        return <Text text={value} />;
      }

      await act(() => {
        root.render(<App />);
      });
      assertLog([0]);
      expect(root).toMatchRenderedOutput('0');

      await act(() => {
        setValue(1);
      });
      assertLog([1]);
      expect(root).toMatchRenderedOutput('1');
    },
  );

  it('context change should prevent bailout of memoized component (memo HOC)', async () => {
    const root = ReactNoop.createRoot();

    const Context = React.createContext(0);

    let setValue;
    function App() {
      const [value, _setValue] = useState(0);
      setValue = _setValue;
      return (
        <Context.Provider value={value}>
          <Consumer />
        </Context.Provider>
      );
    }

    const Consumer = React.memo(() => {
      const value = useContext(Context);
      // Even though Consumer is memoized, Consumer should re-render
      // DeepChild whenever the context value changes. Otherwise DeepChild
      // won't receive the new value.
      return <DeepChild value={value} />;
    });

    function DeepChild({value}) {
      return <Text text={value} />;
    }

    await act(() => {
      root.render(<App />);
    });
    assertLog([0]);
    expect(root).toMatchRenderedOutput('0');

    await act(() => {
      setValue(1);
    });
    assertLog([1]);
    expect(root).toMatchRenderedOutput('1');
  });

  it('context change should prevent bailout of memoized component (PureComponent)', async () => {
    const root = ReactNoop.createRoot();

    const Context = React.createContext(0);

    let setValue;
    function App() {
      const [value, _setValue] = useState(0);
      setValue = _setValue;
      return (
        <Context.Provider value={value}>
          <Consumer />
        </Context.Provider>
      );
    }

    class Consumer extends React.PureComponent {
      static contextType = Context;
      render() {
        // Even though Consumer is memoized, Consumer should re-render
        // DeepChild whenever the context value changes. Otherwise DeepChild
        // won't receive the new value.
        return <DeepChild value={this.context} />;
      }
    }

    function DeepChild({value}) {
      return <Text text={value} />;
    }

    await act(() => {
      root.render(<App />);
    });
    assertLog([0]);
    expect(root).toMatchRenderedOutput('0');

    await act(() => {
      setValue(1);
    });
    assertLog([1]);
    expect(root).toMatchRenderedOutput('1');
  });

  it("context consumer bails out if context hasn't changed", async () => {
    const root = ReactNoop.createRoot();

    const Context = React.createContext(0);

    function App() {
      return (
        <Context.Provider value={0}>
          <Consumer />
        </Context.Provider>
      );
    }

    let setOtherValue;
    const Consumer = React.memo(() => {
      const value = useContext(Context);

      const [, _setOtherValue] = useState(0);
      setOtherValue = _setOtherValue;

      Scheduler.log('Consumer');

      return <Text text={value} />;
    });

    await act(() => {
      root.render(<App />);
    });
    assertLog(['Consumer', 0]);
    expect(root).toMatchRenderedOutput('0');

    await act(() => {
      // Intentionally calling setState to some other arbitrary value before
      // setting it back to the current one. That way an update is scheduled,
      // but we'll bail out during render when nothing has changed.
      setOtherValue(1);
      setOtherValue(0);
    });
    // NOTE: If this didn't yield anything, that indicates that we never visited
    // the consumer during the render phase, which probably means the eager
    // bailout mechanism kicked in. Because we're testing the _lazy_ bailout
    // mechanism, update this test to foil the _eager_ bailout, somehow. Perhaps
    // by switching to useReducer.
    assertLog(['Consumer']);
    expect(root).toMatchRenderedOutput('0');
  });

  // @gate enableLegacyCache
  it('context is propagated across retries', async () => {
    const root = ReactNoop.createRoot();

    const Context = React.createContext('A');

    let setContext;
    function App() {
      const [value, setValue] = useState('A');
      setContext = setValue;
      return (
        <Context.Provider value={value}>
          <Suspense fallback={<Text text="Loading..." />}>
            <Async />
          </Suspense>
          <Text text={value} />
        </Context.Provider>
      );
    }

    function Async() {
      const value = useContext(Context);
      readText(value);

      // When `readText` suspends, we haven't yet visited Indirection and all
      // of its children. They won't get rendered until a later retry.
      return <Indirection />;
    }

    const Indirection = React.memo(() => {
      // This child must always be consistent with the sibling Text component.
      return <DeepChild />;
    });

    function DeepChild() {
      const value = useContext(Context);
      return <Text text={value} />;
    }

    await seedNextTextCache('A');
    await act(() => {
      root.render(<App />);
    });
    assertLog(['A', 'A']);
    expect(root).toMatchRenderedOutput('AA');

    await act(() => {
      // Intentionally not wrapping in startTransition, so that the fallback
      // the fallback displays despite this being a refresh.
      setContext('B');
    });
    assertLog([
      'Suspend! [B]',
      'Loading...',
      'B',
      // pre-warming
      'Suspend! [B]',
    ]);
    expect(root).toMatchRenderedOutput('Loading...B');

    await act(async () => {
      await resolveText('B');
    });
    assertLog(['B']);
    expect(root).toMatchRenderedOutput('BB');
  });

  // @gate enableLegacyCache
  it('multiple contexts are propagated across retries', async () => {
    // Same as previous test, but with multiple context providers
    const root = ReactNoop.createRoot();

    const Context1 = React.createContext('A');
    const Context2 = React.createContext('A');

    let setContext;
    function App() {
      const [value, setValue] = useState('A');
      setContext = setValue;
      return (
        <Context1.Provider value={value}>
          <Context2.Provider value={value}>
            <Suspense fallback={<Text text="Loading..." />}>
              <Async />
            </Suspense>
            <Text text={value} />
          </Context2.Provider>
        </Context1.Provider>
      );
    }

    function Async() {
      const value = useContext(Context1);
      readText(value);

      // When `readText` suspends, we haven't yet visited Indirection and all
      // of its children. They won't get rendered until a later retry.
      return (
        <>
          <Indirection1 />
          <Indirection2 />
        </>
      );
    }

    const Indirection1 = React.memo(() => {
      // This child must always be consistent with the sibling Text component.
      return <DeepChild1 />;
    });

    const Indirection2 = React.memo(() => {
      // This child must always be consistent with the sibling Text component.
      return <DeepChild2 />;
    });

    function DeepChild1() {
      const value = useContext(Context1);
      return <Text text={value} />;
    }

    function DeepChild2() {
      const value = useContext(Context2);
      return <Text text={value} />;
    }

    await seedNextTextCache('A');
    await act(() => {
      root.render(<App />);
    });
    assertLog(['A', 'A', 'A']);
    expect(root).toMatchRenderedOutput('AAA');

    await act(() => {
      // Intentionally not wrapping in startTransition, so that the fallback
      // the fallback displays despite this being a refresh.
      setContext('B');
    });
    assertLog([
      'Suspend! [B]',
      'Loading...',
      'B',
      // pre-warming
      'Suspend! [B]',
    ]);
    expect(root).toMatchRenderedOutput('Loading...B');

    await act(async () => {
      await resolveText('B');
    });
    assertLog(['B', 'B']);
    expect(root).toMatchRenderedOutput('BBB');
  });

  // @gate enableLegacyCache && !disableLegacyMode
  it('context is propagated across retries (legacy)', async () => {
    const root = ReactNoop.createLegacyRoot();

    const Context = React.createContext('A');

    let setContext;
    function App() {
      const [value, setValue] = useState('A');
      setContext = setValue;
      return (
        <Context.Provider value={value}>
          <Suspense fallback={<Text text="Loading..." />}>
            <Async />
          </Suspense>
          <Text text={value} />
        </Context.Provider>
      );
    }

    function Async() {
      const value = useContext(Context);
      readText(value);

      // When `readText` suspends, we haven't yet visited Indirection and all
      // of its children. They won't get rendered until a later retry.
      return <Indirection />;
    }

    const Indirection = React.memo(() => {
      // This child must always be consistent with the sibling Text component.
      return <DeepChild />;
    });

    function DeepChild() {
      const value = useContext(Context);
      return <Text text={value} />;
    }

    await seedNextTextCache('A');
    await act(() => {
      root.render(<App />);
    });
    assertLog(['A', 'A']);
    expect(root).toMatchRenderedOutput('AA');

    await act(() => {
      // Intentionally not wrapping in startTransition, so that the fallback
      // the fallback displays despite this being a refresh.
      setContext('B');
    });
    assertLog(['Suspend! [B]', 'Loading...', 'B']);
    expect(root).toMatchRenderedOutput('Loading...B');

    await act(async () => {
      await resolveText('B');
    });
    assertLog(['B']);
    expect(root).toMatchRenderedOutput('BB');
  });

  // @gate enableLegacyCache && enableLegacyHidden
  it('context is propagated through offscreen trees', async () => {
    const LegacyHidden = React.unstable_LegacyHidden;

    const root = ReactNoop.createRoot();

    const Context = React.createContext('A');

    let setContext;
    function App() {
      const [value, setValue] = useState('A');
      setContext = setValue;
      return (
        <Context.Provider value={value}>
          <LegacyHidden mode="hidden">
            <Indirection />
          </LegacyHidden>
          <Text text={value} />
        </Context.Provider>
      );
    }

    const Indirection = React.memo(() => {
      // This child must always be consistent with the sibling Text component.
      return <DeepChild />;
    });

    function DeepChild() {
      const value = useContext(Context);
      return <Text text={value} />;
    }

    await seedNextTextCache('A');
    await act(() => {
      root.render(<App />);
    });
    assertLog(['A', 'A']);
    expect(root).toMatchRenderedOutput('AA');

    await act(() => {
      setContext('B');
    });
    assertLog(['B', 'B']);
    expect(root).toMatchRenderedOutput('BB');
  });

  // @gate enableLegacyCache && enableLegacyHidden
  it('multiple contexts are propagated across through offscreen trees', async () => {
    // Same as previous test, but with multiple context providers
    const LegacyHidden = React.unstable_LegacyHidden;

    const root = ReactNoop.createRoot();

    const Context1 = React.createContext('A');
    const Context2 = React.createContext('A');

    let setContext;
    function App() {
      const [value, setValue] = useState('A');
      setContext = setValue;
      return (
        <Context1.Provider value={value}>
          <Context2.Provider value={value}>
            <LegacyHidden mode="hidden">
              <Indirection1 />
              <Indirection2 />
            </LegacyHidden>
            <Text text={value} />
          </Context2.Provider>
        </Context1.Provider>
      );
    }

    const Indirection1 = React.memo(() => {
      // This child must always be consistent with the sibling Text component.
      return <DeepChild1 />;
    });

    const Indirection2 = React.memo(() => {
      // This child must always be consistent with the sibling Text component.
      return <DeepChild2 />;
    });

    function DeepChild1() {
      const value = useContext(Context1);
      return <Text text={value} />;
    }

    function DeepChild2() {
      const value = useContext(Context2);
      return <Text text={value} />;
    }

    await seedNextTextCache('A');
    await act(() => {
      root.render(<App />);
    });
    assertLog(['A', 'A', 'A']);
    expect(root).toMatchRenderedOutput('AAA');

    await act(() => {
      setContext('B');
    });
    assertLog(['B', 'B', 'B']);
    expect(root).toMatchRenderedOutput('BBB');
  });

  // @gate enableSuspenseList
  it('contexts are propagated through SuspenseList', async () => {
    // This kinda tests an implementation detail. SuspenseList has an early
    // bailout that doesn't use `bailoutOnAlreadyFinishedWork`. It probably
    // should just use that function, though.
    const Context = React.createContext('A');

    let setContext;
    function App() {
      const [value, setValue] = useState('A');
      setContext = setValue;
      const children = React.useMemo(
        () => (
          <SuspenseList revealOrder="forwards">
            <Child />
            <Child />
          </SuspenseList>
        ),
        [],
      );
      return <Context.Provider value={value}>{children}</Context.Provider>;
    }

    function Child() {
      const value = useContext(Context);
      return <Text text={value} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<App />);
    });
    assertLog(['A', 'A']);
    expect(root).toMatchRenderedOutput('AA');

    await act(() => {
      setContext('B');
    });
    assertLog(['B', 'B']);
    expect(root).toMatchRenderedOutput('BB');
  });

  it('nested bailouts', async () => {
    // Lazy context propagation will stop propagating when it hits the first
    // match. If we bail out again inside that tree, we must resume propagating.

    const Context = React.createContext('A');

    let setContext;
    function App() {
      const [value, setValue] = useState('A');
      setContext = setValue;
      return (
        <Context.Provider value={value}>
          <ChildIndirection />
        </Context.Provider>
      );
    }

    const ChildIndirection = React.memo(() => {
      return <Child />;
    });

    function Child() {
      const value = useContext(Context);
      return (
        <>
          <Text text={value} />
          <DeepChildIndirection />
        </>
      );
    }

    const DeepChildIndirection = React.memo(() => {
      return <DeepChild />;
    });

    function DeepChild() {
      const value = useContext(Context);
      return <Text text={value} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<App />);
    });
    assertLog(['A', 'A']);
    expect(root).toMatchRenderedOutput('AA');

    await act(() => {
      setContext('B');
    });
    assertLog(['B', 'B']);
    expect(root).toMatchRenderedOutput('BB');
  });

  // @gate enableLegacyCache
  it('nested bailouts across retries', async () => {
    // Lazy context propagation will stop propagating when it hits the first
    // match. If we bail out again inside that tree, we must resume propagating.

    const Context = React.createContext('A');

    let setContext;
    function App() {
      const [value, setValue] = useState('A');
      setContext = setValue;
      return (
        <Context.Provider value={value}>
          <Suspense fallback={<Text text="Loading..." />}>
            <Async value={value} />
          </Suspense>
        </Context.Provider>
      );
    }

    function Async({value}) {
      // When this suspends, we won't be able to visit its children during the
      // current render. So we must take extra care to propagate the context
      // change in such a way that they're aren't lost when we retry in a
      // later render.
      readText(value);
      return <Child value={value} />;
    }

    function Child() {
      const value = useContext(Context);
      return (
        <>
          <Text text={value} />
          <DeepChildIndirection />
        </>
      );
    }

    const DeepChildIndirection = React.memo(() => {
      return <DeepChild />;
    });

    function DeepChild() {
      const value = useContext(Context);
      return <Text text={value} />;
    }

    const root = ReactNoop.createRoot();
    await seedNextTextCache('A');
    await act(() => {
      root.render(<App />);
    });
    assertLog(['A', 'A']);
    expect(root).toMatchRenderedOutput('AA');

    await act(() => {
      setContext('B');
    });
    assertLog([
      'Suspend! [B]',
      'Loading...',
      // pre-warming
      'Suspend! [B]',
    ]);
    expect(root).toMatchRenderedOutput('Loading...');

    await act(async () => {
      await resolveText('B');
    });
    assertLog(['B', 'B']);
    expect(root).toMatchRenderedOutput('BB');
  });

  // @gate enableLegacyCache && enableLegacyHidden
  it('nested bailouts through offscreen trees', async () => {
    // Lazy context propagation will stop propagating when it hits the first
    // match. If we bail out again inside that tree, we must resume propagating.

    const LegacyHidden = React.unstable_LegacyHidden;

    const Context = React.createContext('A');

    let setContext;
    function App() {
      const [value, setValue] = useState('A');
      setContext = setValue;
      return (
        <Context.Provider value={value}>
          <LegacyHidden mode="hidden">
            <Child />
          </LegacyHidden>
        </Context.Provider>
      );
    }

    function Child() {
      const value = useContext(Context);
      return (
        <>
          <Text text={value} />
          <DeepChildIndirection />
        </>
      );
    }

    const DeepChildIndirection = React.memo(() => {
      return <DeepChild />;
    });

    function DeepChild() {
      const value = useContext(Context);
      return <Text text={value} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<App />);
    });
    assertLog(['A', 'A']);
    expect(root).toMatchRenderedOutput('AA');

    await act(() => {
      setContext('B');
    });
    assertLog(['B', 'B']);
    expect(root).toMatchRenderedOutput('BB');
  });

  it('finds context consumers in multiple sibling branches', async () => {
    // This test confirms that when we find a matching context consumer during
    // propagation, we continue propagating to its sibling branches.

    const Context = React.createContext('A');

    let setContext;
    function App() {
      const [value, setValue] = useState('A');
      setContext = setValue;
      return (
        <Context.Provider value={value}>
          <Blah />
        </Context.Provider>
      );
    }

    const Blah = React.memo(() => {
      return (
        <>
          <Indirection />
          <Indirection />
        </>
      );
    });

    const Indirection = React.memo(() => {
      return <Child />;
    });

    function Child() {
      const value = useContext(Context);
      return <Text text={value} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<App />);
    });
    assertLog(['A', 'A']);
    expect(root).toMatchRenderedOutput('AA');

    await act(() => {
      setContext('B');
    });
    assertLog(['B', 'B']);
    expect(root).toMatchRenderedOutput('BB');
  });
});
