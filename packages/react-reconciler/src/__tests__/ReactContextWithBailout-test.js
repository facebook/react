let React;
let ReactNoop;
let Scheduler;
let act;
let assertLog;
let useState;
let useContext;
let unstable_useContextWithBailout;

describe('ReactContextWithBailout', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    const testUtils = require('internal-test-utils');
    act = testUtils.act;
    assertLog = testUtils.assertLog;
    useState = React.useState;
    useContext = React.useContext;
    unstable_useContextWithBailout = React.unstable_useContextWithBailout;
  });

  function Text({text}) {
    Scheduler.log(text);
    return text;
  }

  // @gate enableLazyContextPropagation && enableContextProfiling
  test('unstable_useContextWithBailout basic usage', async () => {
    const Context = React.createContext();

    let setContext;
    function App() {
      const [context, _setContext] = useState({a: 'A0', b: 'B0', c: 'C0'});
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
          A: <A />, B: <B />, C: <C />, AB: <AB />
        </>
      );
    });

    function A() {
      const {a} = unstable_useContextWithBailout(Context, context => [
        context.a,
      ]);
      return <Text text={a} />;
    }

    function B() {
      const {b} = unstable_useContextWithBailout(Context, context => [
        context.b,
      ]);
      return <Text text={b} />;
    }

    function C() {
      const {c} = unstable_useContextWithBailout(Context, context => [
        context.c,
      ]);
      return <Text text={c} />;
    }

    function AB() {
      const {a, b} = unstable_useContextWithBailout(Context, context => [
        context.a,
        context.b,
      ]);
      return <Text text={a + b} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });
    assertLog(['A0', 'B0', 'C0', 'A0B0']);
    expect(root).toMatchRenderedOutput('A: A0, B: B0, C: C0, AB: A0B0');

    // Update a. Only the A and AB consumer should re-render.
    await act(async () => {
      setContext({a: 'A1', c: 'C0', b: 'B0'});
    });
    assertLog(['A1', 'A1B0']);
    expect(root).toMatchRenderedOutput('A: A1, B: B0, C: C0, AB: A1B0');

    // Update b. Only the B and AB consumer should re-render.
    await act(async () => {
      setContext({a: 'A1', b: 'B1', c: 'C0'});
    });
    assertLog(['B1', 'A1B1']);
    expect(root).toMatchRenderedOutput('A: A1, B: B1, C: C0, AB: A1B1');

    // Update c. Only the C consumer should re-render.
    await act(async () => {
      setContext({a: 'A1', b: 'B1', c: 'C1'});
    });
    assertLog(['C1']);
    expect(root).toMatchRenderedOutput('A: A1, B: B1, C: C1, AB: A1B1');
  });

  // @gate enableLazyContextPropagation && enableContextProfiling
  test('unstable_useContextWithBailout and useContext subscribing to same context in same component', async () => {
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
      const {a} = unstable_useContextWithBailout(Context, context => [
        context.a,
      ]);
      const context = useContext(Context);
      return <Text text={`A: ${a}, B: ${context.b}`} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });
    assertLog(['A: 0, B: 0']);
    expect(root).toMatchRenderedOutput('A: 0, B: 0');

    // Update an unrelated field that isn't used by the component. The context
    // attempts to bail out, but the normal context forces an update.
    await act(async () => {
      setContext({a: 0, b: 0, unrelated: 1});
    });
    assertLog(['A: 0, B: 0']);
    expect(root).toMatchRenderedOutput('A: 0, B: 0');
  });

  // @gate enableLazyContextPropagation && enableContextProfiling
  test('unstable_useContextWithBailout and useContext subscribing to different contexts in same component', async () => {
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
      const {a} = unstable_useContextWithBailout(ContextA, context => [
        context.a,
      ]);
      const b = useContext(ContextB);
      return <Text text={`A: ${a}, B: ${b}`} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });
    assertLog(['A: 0, B: 0']);
    expect(root).toMatchRenderedOutput('A: 0, B: 0');

    // Update a field in A that isn't part of the compared context. It should
    // bail out.
    await act(async () => {
      setContextA({a: 0, unrelated: 1});
    });
    assertLog([]);
    expect(root).toMatchRenderedOutput('A: 0, B: 0');

    // Now update the same a field again, but this time, also update a different
    // context in the same batch. The other context prevents a bail out.
    await act(async () => {
      setContextA({a: 0, unrelated: 1});
      setContextB(1);
    });
    assertLog(['A: 0, B: 1']);
    expect(root).toMatchRenderedOutput('A: 0, B: 1');
  });
});
