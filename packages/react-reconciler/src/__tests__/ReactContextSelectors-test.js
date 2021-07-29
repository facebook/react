let React;
let ReactNoop;
let Scheduler;
let act;
let useState;
let useContext;

describe('ReactContextSelectors', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
    useState = React.useState;
    useContext = React.useContext;
  });

  function Text({text}) {
    Scheduler.unstable_yieldValue(text);
    return text;
  }

  function useContextSelector(Context, selector) {
    return useContext(Context, {unstable_selector: selector});
  }

  // @gate enableLazyContextPropagation
  test('basic context selector', async () => {
    const Context = React.createContext();

    let setContext;
    function App() {
      const [context, _setContext] = useState({a: 0, b: 0});
      setContext = _setContext;
      return (
        <Context.Provider value={context}>
          <Indirection />
        </Context.Provider>
      );
    }

    // Intermediate parent that bails out. Children will only re-render when the
    // context changes.
    const Indirection = React.memo(() => {
      return (
        <>
          A: <A />, B: <B />
        </>
      );
    });

    function A() {
      const {a} = useContextSelector(Context, context => context.a);
      return <Text text={a} />;
    }

    function B() {
      const {b} = useContextSelector(Context, context => context.b);
      return <Text text={b} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded([0, 0]);
    expect(root).toMatchRenderedOutput('A: 0, B: 0');

    // Update a. Only the A consumer should re-render.
    await act(async () => {
      setContext({a: 1, b: 0});
    });
    expect(Scheduler).toHaveYielded([1]);
    expect(root).toMatchRenderedOutput('A: 1, B: 0');

    // Update b. Only the B consumer should re-render.
    await act(async () => {
      setContext({a: 1, b: 1});
    });
    expect(Scheduler).toHaveYielded([1]);
    expect(root).toMatchRenderedOutput('A: 1, B: 1');
  });

  // @gate enableLazyContextPropagation
  test('useContextSelector and useContext subscribing to same context in same component', async () => {
    const Context = React.createContext();

    let setContext;
    function App() {
      const [context, _setContext] = useState({a: 0, b: 0, unrelated: 0});
      setContext = _setContext;
      return (
        <Context.Provider value={context}>
          <Indirection />
        </Context.Provider>
      );
    }

    // Intermediate parent that bails out. Children will only re-render when the
    // context changes.
    const Indirection = React.memo(() => {
      return <Child />;
    });

    function Child() {
      const {a} = useContextSelector(Context, context => context.a);
      const context = useContext(Context);
      return <Text text={`A: ${a}, B: ${context.b}`} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['A: 0, B: 0']);
    expect(root).toMatchRenderedOutput('A: 0, B: 0');

    // Update an unrelated field that isn't used by the component. The selected
    // context attempts to bail out, but the normal context forces an update.
    await act(async () => {
      setContext({a: 0, b: 0, unrelated: 1});
    });
    expect(Scheduler).toHaveYielded(['A: 0, B: 0']);
    expect(root).toMatchRenderedOutput('A: 0, B: 0');
  });

  // @gate enableLazyContextPropagation
  test('useContextSelector and useContext subscribing to different contexts in same component', async () => {
    const ContextA = React.createContext();
    const ContextB = React.createContext();

    let setContextA;
    let setContextB;
    function App() {
      const [a, _setContextA] = useState({a: 0, unrelated: 0});
      const [b, _setContextB] = useState(0);
      setContextA = _setContextA;
      setContextB = _setContextB;
      return (
        <ContextA.Provider value={a}>
          <ContextB.Provider value={b}>
            <Indirection />
          </ContextB.Provider>
        </ContextA.Provider>
      );
    }

    // Intermediate parent that bails out. Children will only re-render when the
    // context changes.
    const Indirection = React.memo(() => {
      return <Child />;
    });

    function Child() {
      const {a} = useContextSelector(ContextA, context => context.a);
      const b = useContext(ContextB);
      return <Text text={`A: ${a}, B: ${b}`} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['A: 0, B: 0']);
    expect(root).toMatchRenderedOutput('A: 0, B: 0');

    // Update a field in A that isn't part of the selected context. It should
    // bail out.
    await act(async () => {
      setContextA({a: 0, unrelated: 1});
    });
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('A: 0, B: 0');

    // Now update the same a field again, but this time, also update a different
    // context in the same batch. The other context prevents a bail out.
    await act(async () => {
      setContextA({a: 0, unrelated: 1});
      setContextB(1);
    });
    expect(Scheduler).toHaveYielded(['A: 0, B: 1']);
    expect(root).toMatchRenderedOutput('A: 0, B: 1');
  });
});
