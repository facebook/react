let React;
let ReactNoop;
let Scheduler;
let startTransition;
let useState;
let useEffect;
let act;

describe('ReactInterleavedUpdates', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
    startTransition = React.startTransition;
    useState = React.useState;
    useEffect = React.useEffect;
  });

  function Text({text}) {
    Scheduler.unstable_yieldValue(text);
    return text;
  }

  test('update during an interleaved event is not processed during the current render', async () => {
    const updaters = [];

    function Child() {
      const [state, setState] = useState(0);
      useEffect(() => {
        updaters.push(setState);
      }, []);
      return <Text text={state} />;
    }

    function updateChildren(value) {
      for (let i = 0; i < updaters.length; i++) {
        const setState = updaters[i];
        setState(value);
      }
    }

    const root = ReactNoop.createRoot();

    await act(async () => {
      root.render(
        <>
          <Child />
          <Child />
          <Child />
        </>,
      );
    });
    expect(Scheduler).toHaveYielded([0, 0, 0]);
    expect(root).toMatchRenderedOutput('000');

    await act(async () => {
      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        React.startTransition(() => {
          updateChildren(1);
        });
      } else {
        updateChildren(1);
      }
      // Partially render the children. Only the first one.
      expect(Scheduler).toFlushAndYieldThrough([1]);

      // In an interleaved event, schedule an update on each of the children.
      // Including the two that haven't rendered yet.
      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        React.startTransition(() => {
          updateChildren(2);
        });
      } else {
        updateChildren(2);
      }

      // We should continue rendering without including the interleaved updates.
      expect(Scheduler).toFlushUntilNextPaint([1, 1]);
      expect(root).toMatchRenderedOutput('111');
    });
    // The interleaved updates flush in a separate render.
    expect(Scheduler).toHaveYielded([2, 2, 2]);
    expect(root).toMatchRenderedOutput('222');
  });

  // @gate !enableSyncDefaultUpdates
  test('low priority update during an interleaved event is not processed during the current render', async () => {
    // Same as previous test, but the interleaved update is lower priority than
    // the in-progress render.
    const updaters = [];

    function Child() {
      const [state, setState] = useState(0);
      useEffect(() => {
        updaters.push(setState);
      }, []);
      return <Text text={state} />;
    }

    function updateChildren(value) {
      for (let i = 0; i < updaters.length; i++) {
        const setState = updaters[i];
        setState(value);
      }
    }

    const root = ReactNoop.createRoot();

    await act(async () => {
      root.render(
        <>
          <Child />
          <Child />
          <Child />
        </>,
      );
    });
    expect(Scheduler).toHaveYielded([0, 0, 0]);
    expect(root).toMatchRenderedOutput('000');

    await act(async () => {
      updateChildren(1);
      // Partially render the children. Only the first one.
      expect(Scheduler).toFlushAndYieldThrough([1]);

      // In an interleaved event, schedule an update on each of the children.
      // Including the two that haven't rendered yet.
      startTransition(() => {
        updateChildren(2);
      });

      // We should continue rendering without including the interleaved updates.
      expect(Scheduler).toFlushUntilNextPaint([1, 1]);
      expect(root).toMatchRenderedOutput('111');
    });
    // The interleaved updates flush in a separate render.
    expect(Scheduler).toHaveYielded([2, 2, 2]);
    expect(root).toMatchRenderedOutput('222');
  });
});
