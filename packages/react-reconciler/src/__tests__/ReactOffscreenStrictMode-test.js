let React;
let Offscreen;
let ReactNoop;
let act;
let log;

describe('ReactOffscreenStrictMode', () => {
  beforeEach(() => {
    jest.resetModules();
    log = [];

    React = require('react');
    Offscreen = React.unstable_Offscreen;
    ReactNoop = require('react-noop-renderer');
    act = require('jest-react').act;
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

  // @gate __DEV__ && enableStrictEffects && enableOffscreen
  it('should trigger strict effects when offscreen is visible', () => {
    act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <Offscreen mode="visible">
            <Component label="A" />
          </Offscreen>
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

  // @gate __DEV__ && enableStrictEffects && enableOffscreen
  it('should not trigger strict effects when offscreen is hidden', () => {
    act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <Offscreen mode="hidden">
            <Component label="A" />
          </Offscreen>
        </React.StrictMode>,
      );
    });

    expect(log).toEqual(['A: render', 'A: render']);

    log = [];

    act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <Offscreen mode="hidden">
            <Component label="A" />
            <Component label="B" />
          </Offscreen>
        </React.StrictMode>,
      );
    });

    expect(log).toEqual(['A: render', 'A: render', 'B: render', 'B: render']);

    log = [];

    act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <Offscreen mode="visible">
            <Component label="A" />
          </Offscreen>
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

    act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <Offscreen mode="hidden">
            <Component label="A" />
          </Offscreen>
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

  it('should not cause infinite render loop when StrictMode is used with Suspense and synchronous set states', () => {
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

    act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <React.Suspense>
            <App />
          </React.Suspense>
        </React.StrictMode>,
      );
    });
  });
});
