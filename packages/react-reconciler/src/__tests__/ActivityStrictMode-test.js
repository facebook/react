let React;
let Activity;
let ReactNoop;
let act;
let log;

describe('Activity StrictMode', () => {
  beforeEach(() => {
    jest.resetModules();
    log = [];

    React = require('react');
    Activity = React.unstable_Activity;
    ReactNoop = require('react-noop-renderer');
    act = require('internal-test-utils').act;
  });

  function Component({label}) {
    React.useEffect(() => {
      log.push(`${label}: useEffect mount`);
      return () => log.push(`${label}: useEffect unmount`);
    });

    React.useLayoutEffect(() => {
      log.push(`${label}: useLayoutEffect mount`);
      return () => log.push(`${label}: useLayoutEffect unmount`);
    });

    log.push(`${label}: render`);

    return <span>label</span>;
  }

  // @gate __DEV__ && enableActivity
  it('should trigger strict effects when offscreen is visible', async () => {
    await act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <Activity mode="visible">
            <Component label="A" />
          </Activity>
        </React.StrictMode>,
      );
    });

    expect(log).toEqual([
      'A: render',
      'A: render',
      'A: useLayoutEffect mount',
      'A: useEffect mount',
      'A: useLayoutEffect unmount',
      'A: useEffect unmount',
      'A: useLayoutEffect mount',
      'A: useEffect mount',
    ]);
  });

  // @gate __DEV__ && enableActivity && enableDO_NOT_USE_disableStrictPassiveEffect
  it('does not trigger strict effects when disableStrictPassiveEffect is presented on StrictMode', async () => {
    await act(() => {
      ReactNoop.render(
        <React.StrictMode DO_NOT_USE_disableStrictPassiveEffect={true}>
          <Activity>
            <Component label="A" />
          </Activity>
        </React.StrictMode>,
      );
    });

    expect(log).toEqual([
      'A: render',
      'A: render',
      'A: useLayoutEffect mount',
      'A: useEffect mount',
      'A: useLayoutEffect unmount',
      'A: useLayoutEffect mount',
    ]);
  });

  // @gate __DEV__ && enableActivity
  it('should not trigger strict effects when offscreen is hidden', async () => {
    await act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <Activity mode="hidden">
            <Component label="A" />
          </Activity>
        </React.StrictMode>,
      );
    });

    expect(log).toEqual(['A: render', 'A: render']);

    log = [];

    await act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <Activity mode="hidden">
            <Component label="A" />
            <Component label="B" />
          </Activity>
        </React.StrictMode>,
      );
    });

    expect(log).toEqual(['A: render', 'A: render', 'B: render', 'B: render']);

    log = [];

    await act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <Activity mode="visible">
            <Component label="A" />
          </Activity>
        </React.StrictMode>,
      );
    });

    expect(log).toEqual([
      'A: render',
      'A: render',
      'A: useLayoutEffect mount',
      'A: useEffect mount',
      'A: useLayoutEffect unmount',
      'A: useEffect unmount',
      'A: useLayoutEffect mount',
      'A: useEffect mount',
    ]);

    log = [];

    await act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <Activity mode="hidden">
            <Component label="A" />
          </Activity>
        </React.StrictMode>,
      );
    });

    expect(log).toEqual([
      'A: useLayoutEffect unmount',
      'A: useEffect unmount',
      'A: render',
      'A: render',
    ]);
  });

  it('should not cause infinite render loop when StrictMode is used with Suspense and synchronous set states', async () => {
    // This is a regression test, see https://github.com/facebook/react/pull/25179 for more details.
    function App() {
      const [state, setState] = React.useState(false);

      React.useLayoutEffect(() => {
        setState(true);
      }, []);

      React.useEffect(() => {
        // Empty useEffect with empty dependency array is needed to trigger infinite render loop.
      }, []);

      return state;
    }

    await act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <React.Suspense>
            <App />
          </React.Suspense>
        </React.StrictMode>,
      );
    });
  });

  // @gate __DEV__ && enableActivity
  it('should double invoke effects on unsuspended child', async () => {
    let shouldSuspend = true;
    let resolve;
    const suspensePromise = new Promise(_resolve => {
      resolve = _resolve;
    });

    function Parent() {
      log.push('Parent rendered');
      React.useEffect(() => {
        log.push('Parent mount');
        return () => {
          log.push('Parent unmount');
        };
      });

      return (
        <React.Suspense fallback="fallback">
          <Child />
        </React.Suspense>
      );
    }

    function Child() {
      log.push('Child rendered');
      React.useEffect(() => {
        log.push('Child mount');
        return () => {
          log.push('Child unmount');
        };
      });
      if (shouldSuspend) {
        log.push('Child suspended');
        throw suspensePromise;
      }
      return null;
    }

    await act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <Activity mode="visible">
            <Parent />
          </Activity>
        </React.StrictMode>,
      );
    });

    log.push('------------------------------');

    await act(() => {
      resolve();
      shouldSuspend = false;
    });

    expect(log).toEqual([
      'Parent rendered',
      'Parent rendered',
      'Child rendered',
      'Child suspended',
      'Parent mount',
      'Parent unmount',
      'Parent mount',

      ...(gate('enableSiblingPrerendering')
        ? ['Child rendered', 'Child suspended']
        : []),

      '------------------------------',
      'Child rendered',
      'Child rendered',
      'Child mount',
      'Child unmount',
      'Child mount',
    ]);
  });
});
