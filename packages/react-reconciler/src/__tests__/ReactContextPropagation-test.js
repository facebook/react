let React;
let ReactNoop;
let Scheduler;
let useState;
let useContext;

describe('ReactLazyContextPropagation', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    useState = React.useState;
    useContext = React.useContext;
  });

  function Text({text}) {
    Scheduler.unstable_yieldValue(text);
    return text;
  }

  // NOTE: These tests are not specific to the lazy propagation (as opposed to
  // eager propagation). The behavior should be the same in both
  // implementations. These are tests that are more relevant to the lazy
  // propagation implementation, though.

  test(
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

      await ReactNoop.act(async () => {
        root.render(<App />);
      });
      expect(Scheduler).toHaveYielded([0]);
      expect(root).toMatchRenderedOutput('0');

      await ReactNoop.act(async () => {
        setValue(1);
      });
      expect(Scheduler).toHaveYielded([1]);
      expect(root).toMatchRenderedOutput('1');
    },
  );

  test('context change should prevent bailout of memoized component (memo HOC)', async () => {
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

    await ReactNoop.act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded([0]);
    expect(root).toMatchRenderedOutput('0');

    await ReactNoop.act(async () => {
      setValue(1);
    });
    expect(Scheduler).toHaveYielded([1]);
    expect(root).toMatchRenderedOutput('1');
  });

  test('context change should prevent bailout of memoized component (PureComponent)', async () => {
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

    await ReactNoop.act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded([0]);
    expect(root).toMatchRenderedOutput('0');

    await ReactNoop.act(async () => {
      setValue(1);
    });
    expect(Scheduler).toHaveYielded([1]);
    expect(root).toMatchRenderedOutput('1');
  });

  test("context consumer bails out if context hasn't changed", async () => {
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

      Scheduler.unstable_yieldValue('Consumer');

      return <Text text={value} />;
    });

    await ReactNoop.act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['Consumer', 0]);
    expect(root).toMatchRenderedOutput('0');

    await ReactNoop.act(async () => {
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
    expect(Scheduler).toHaveYielded(['Consumer']);
    expect(root).toMatchRenderedOutput('0');
  });
});
