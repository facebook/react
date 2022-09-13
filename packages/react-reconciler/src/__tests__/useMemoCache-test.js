let React;
let ReactNoop;
let act;
let useState;
let useMemoCache;
let ErrorBoundary;

describe('useMemoCache()', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    act = require('jest-react').act;
    useState = React.useState;
    useMemoCache = React.unstable_useMemoCache;

    class _ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {hasError: false};
      }

      static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return {hasError: true};
      }

      componentDidCatch(error, errorInfo) {}

      render() {
        if (this.state.hasError) {
          // You can render any custom fallback UI
          return <h1>Something went wrong.</h1>;
        }

        return this.props.children;
      }
    }
    ErrorBoundary = _ErrorBoundary;
  });

  // @gate enableUseMemoCacheHook
  test('render component using cache', async () => {
    function Component(props) {
      const cache = useMemoCache(1);
      expect(Array.isArray(cache)).toBe(true);
      expect(cache.length).toBe(1);
      expect(cache[0]).toBe(undefined);
      return 'Ok';
    }
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Component />);
    });
    expect(root).toMatchRenderedOutput('Ok');
  });

  // @gate enableUseMemoCacheHook
  test('update component using cache', async () => {
    let setX;
    let forceUpdate;
    function Component(props) {
      const cache = useMemoCache(4);

      // x is used to produce a `data` object passed to the child
      const [x, _setX] = useState(0);
      setX = _setX;
      const c_x = x !== cache[0];
      cache[0] = x;

      // n is passed as-is to the child as a cache breaker
      const [n, setN] = useState(0);
      forceUpdate = () => setN(a => a + 1);
      const c_n = n !== cache[1];
      cache[1] = n;

      let data;
      if (c_x) {
        data = cache[2] = {text: `Count ${x}`};
      } else {
        data = cache[2];
      }
      if (c_x || c_n) {
        return (cache[3] = <Text data={data} n={n} />);
      } else {
        return cache[3];
      }
    }
    let data;
    const Text = jest.fn(function Text(props) {
      data = props.data;
      return data.text;
    });

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Component />);
    });
    expect(root).toMatchRenderedOutput('Count 0');
    expect(Text).toBeCalledTimes(1);
    const data0 = data;

    // Changing x should reset the data object
    await act(async () => {
      setX(1);
    });
    expect(root).toMatchRenderedOutput('Count 1');
    expect(Text).toBeCalledTimes(2);
    expect(data).not.toBe(data0);
    const data1 = data;

    // Forcing an unrelated update shouldn't recreate the
    // data object.
    await act(async () => {
      forceUpdate();
    });
    expect(root).toMatchRenderedOutput('Count 1');
    expect(Text).toBeCalledTimes(3);
    expect(data).toBe(data1); // confirm that the cache persisted across renders
  });

  // @gate enableUseMemoCacheHook
  test('update component using cache with setstate during render', async () => {
    let setX;
    let setN;
    function Component(props) {
      const cache = useMemoCache(4);

      // x is used to produce a `data` object passed to the child
      const [x, _setX] = useState(0);
      setX = _setX;
      const c_x = x !== cache[0];
      cache[0] = x;

      // n is passed as-is to the child as a cache breaker
      const [n, _setN] = useState(0);
      setN = _setN;
      const c_n = n !== cache[1];
      cache[1] = n;

      // NOTE: setstate and early return here means that x will update
      // without the data value being updated. Subsequent renders could
      // therefore think that c_x = false (hasn't changed) and skip updating
      // data.
      // The memoizing compiler will have to handle this case, but the runtime
      // can help by falling back to resetting the cache if a setstate occurs
      // during render (this mirrors what we do for useMemo and friends)
      if (n === 1) {
        setN(2);
        return;
      }

      let data;
      if (c_x) {
        data = cache[2] = {text: `Count ${x}`};
      } else {
        data = cache[2];
      }
      if (c_x || c_n) {
        return (cache[3] = <Text data={data} n={n} />);
      } else {
        return cache[3];
      }
    }
    let data;
    const Text = jest.fn(function Text(props) {
      data = props.data;
      return data.text;
    });

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Component />);
    });
    expect(root).toMatchRenderedOutput('Count 0');
    expect(Text).toBeCalledTimes(1);
    const data0 = data;

    // Simultaneously trigger an update to x (should create a new data value)
    // and trigger the setState+early return. The runtime should reset the cache
    // to avoid an inconsistency
    await act(async () => {
      setX(1);
      setN(1);
    });
    expect(root).toMatchRenderedOutput('Count 1');
    expect(Text).toBeCalledTimes(2);
    expect(data).not.toBe(data0);
    const data1 = data;

    // Forcing an unrelated update shouldn't recreate the
    // data object.
    await act(async () => {
      setN(3);
    });
    expect(root).toMatchRenderedOutput('Count 1');
    expect(Text).toBeCalledTimes(3);
    expect(data).toBe(data1); // confirm that the cache persisted across renders
  });

  // @gate enableUseMemoCacheHook
  test('update component using cache with throw during render', async () => {
    let setX;
    let setN;
    let shouldFail = true;
    function Component(props) {
      const cache = useMemoCache(4);

      // x is used to produce a `data` object passed to the child
      const [x, _setX] = useState(0);
      setX = _setX;
      const c_x = x !== cache[0];
      cache[0] = x;

      // n is passed as-is to the child as a cache breaker
      const [n, _setN] = useState(0);
      setN = _setN;
      const c_n = n !== cache[1];
      cache[1] = n;

      // NOTE the initial failure will trigger a re-render, after which the function
      // will early return. This validates that the runtime resets the cache on error:
      // if it doesn't the cache will be corrupt, with the cached version of data
      // out of data from the cached version of x.
      if (n === 1) {
        if (shouldFail) {
          shouldFail = false;
          throw new Error('failed');
        }
        setN(2);
        return;
      }

      let data;
      if (c_x) {
        data = cache[2] = {text: `Count ${x}`};
      } else {
        data = cache[2];
      }
      if (c_x || c_n) {
        return (cache[3] = <Text data={data} n={n} />);
      } else {
        return cache[3];
      }
    }
    let data;
    const Text = jest.fn(function Text(props) {
      data = props.data;
      return data.text;
    });

    spyOnDev(console, 'error');

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <ErrorBoundary>
          <Component />
        </ErrorBoundary>,
      );
    });
    expect(root).toMatchRenderedOutput('Count 0');
    expect(Text).toBeCalledTimes(1);
    const data0 = data;

    // Simultaneously trigger an update to x (should create a new data value)
    // and trigger the setState+early return. The runtime should reset the cache
    // to avoid an inconsistency
    await act(async () => {
      // this update bumps the count
      setX(1);
      // this triggers a throw.
      setN(1);
    });
    expect(root).toMatchRenderedOutput('Count 1');
    expect(Text).toBeCalledTimes(2);
    expect(data).not.toBe(data0);
    const data1 = data;

    // Forcing an unrelated update shouldn't recreate the
    // data object.
    await act(async () => {
      setN(3);
    });
    expect(root).toMatchRenderedOutput('Count 1');
    expect(Text).toBeCalledTimes(3);
    expect(data).toBe(data1); // confirm that the cache persisted across renders
  });

  // @gate enableUseMemoCacheHook
  test('update component and custom hook with caches', async () => {
    let setX;
    let forceUpdate;
    function Component(props) {
      const cache = useMemoCache(4);

      // x is used to produce a `data` object passed to the child
      const [x, _setX] = useState(0);
      setX = _setX;
      const c_x = x !== cache[0];
      cache[0] = x;

      // n is passed as-is to the child as a cache breaker
      const [n, setN] = useState(0);
      forceUpdate = () => setN(a => a + 1);
      const c_n = n !== cache[1];
      cache[1] = n;

      let _data;
      if (c_x) {
        _data = cache[2] = {text: `Count ${x}`};
      } else {
        _data = cache[2];
      }
      const data = useData(_data);
      if (c_x || c_n) {
        return (cache[3] = <Text data={data} n={n} />);
      } else {
        return cache[3];
      }
    }
    function useData(data) {
      const cache = useMemoCache(2);
      const c_data = data !== cache[0];
      cache[0] = data;
      let nextData;
      if (c_data) {
        nextData = cache[1] = {text: data.text.toLowerCase()};
      } else {
        nextData = cache[1];
      }
      return nextData;
    }
    let data;
    const Text = jest.fn(function Text(props) {
      data = props.data;
      return data.text;
    });

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Component />);
    });
    expect(root).toMatchRenderedOutput('count 0');
    expect(Text).toBeCalledTimes(1);
    const data0 = data;

    // Changing x should reset the data object
    await act(async () => {
      setX(1);
    });
    expect(root).toMatchRenderedOutput('count 1');
    expect(Text).toBeCalledTimes(2);
    expect(data).not.toBe(data0);
    const data1 = data;

    // Forcing an unrelated update shouldn't recreate the
    // data object.
    await act(async () => {
      forceUpdate();
    });
    expect(root).toMatchRenderedOutput('count 1');
    expect(Text).toBeCalledTimes(3);
    expect(data).toBe(data1); // confirm that the cache persisted across renders
  });
});
