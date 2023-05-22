/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactNoop;
let Scheduler;
let act;
let assertLog;
let waitFor;
let waitForAll;
let waitForPaint;

describe('StrictEffectsMode defaults', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;

    const InternalTestUtils = require('internal-test-utils');
    waitFor = InternalTestUtils.waitFor;
    waitForAll = InternalTestUtils.waitForAll;
    waitForPaint = InternalTestUtils.waitForPaint;
    assertLog = InternalTestUtils.assertLog;

    const ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.createRootStrictEffectsByDefault = __DEV__;
  });

  it('should not double invoke effects in legacy mode', async () => {
    function App({text}) {
      React.useEffect(() => {
        Scheduler.log('useEffect mount');
        return () => Scheduler.log('useEffect unmount');
      });

      React.useLayoutEffect(() => {
        Scheduler.log('useLayoutEffect mount');
        return () => Scheduler.log('useLayoutEffect unmount');
      });

      return text;
    }

    await act(() => {
      ReactNoop.renderLegacySyncRoot(<App text={'mount'} />);
    });

    assertLog(['useLayoutEffect mount', 'useEffect mount']);
  });

  it('should not double invoke class lifecycles in legacy mode', async () => {
    class App extends React.PureComponent {
      componentDidMount() {
        Scheduler.log('componentDidMount');
      }

      componentDidUpdate() {
        Scheduler.log('componentDidUpdate');
      }

      componentWillUnmount() {
        Scheduler.log('componentWillUnmount');
      }

      render() {
        return this.props.text;
      }
    }

    await act(() => {
      ReactNoop.renderLegacySyncRoot(<App text={'mount'} />);
    });

    assertLog(['componentDidMount']);
  });

  if (__DEV__) {
    it('should flush double-invoked effects within the same frame as layout effects if there are no passive effects', async () => {
      function ComponentWithEffects({label}) {
        React.useLayoutEffect(() => {
          Scheduler.log(`useLayoutEffect mount "${label}"`);
          return () => Scheduler.log(`useLayoutEffect unmount "${label}"`);
        });

        return label;
      }

      await act(async () => {
        ReactNoop.render(
          <>
            <ComponentWithEffects label={'one'} />
          </>,
        );

        await waitForPaint([
          'useLayoutEffect mount "one"',
          'useLayoutEffect unmount "one"',
          'useLayoutEffect mount "one"',
        ]);
      });

      await act(async () => {
        ReactNoop.render(
          <>
            <ComponentWithEffects label={'one'} />
            <ComponentWithEffects label={'two'} />
          </>,
        );

        assertLog([]);
        await waitForPaint([
          // Cleanup and re-run "one" (and "two") since there is no dependencies array.
          'useLayoutEffect unmount "one"',
          'useLayoutEffect mount "one"',
          'useLayoutEffect mount "two"',

          // Since "two" is new, it should be double-invoked.
          'useLayoutEffect unmount "two"',
          'useLayoutEffect mount "two"',
        ]);
      });
    });

    // This test also verifies that double-invoked effects flush synchronously
    // within the same frame as passive effects.
    it('should double invoke effects only for newly mounted components', async () => {
      function ComponentWithEffects({label}) {
        React.useEffect(() => {
          Scheduler.log(`useEffect mount "${label}"`);
          return () => Scheduler.log(`useEffect unmount "${label}"`);
        });

        React.useLayoutEffect(() => {
          Scheduler.log(`useLayoutEffect mount "${label}"`);
          return () => Scheduler.log(`useLayoutEffect unmount "${label}"`);
        });

        return label;
      }

      await act(async () => {
        ReactNoop.render(
          <>
            <ComponentWithEffects label={'one'} />
          </>,
        );

        await waitForAll([
          'useLayoutEffect mount "one"',
          'useEffect mount "one"',
          'useLayoutEffect unmount "one"',
          'useEffect unmount "one"',
          'useLayoutEffect mount "one"',
          'useEffect mount "one"',
        ]);
      });

      await act(async () => {
        ReactNoop.render(
          <>
            <ComponentWithEffects label={'one'} />
            <ComponentWithEffects label={'two'} />
          </>,
        );

        await waitFor([
          // Cleanup and re-run "one" (and "two") since there is no dependencies array.
          'useLayoutEffect unmount "one"',
          'useLayoutEffect mount "one"',
          'useLayoutEffect mount "two"',
        ]);
        await waitForAll([
          'useEffect unmount "one"',
          'useEffect mount "one"',
          'useEffect mount "two"',

          // Since "two" is new, it should be double-invoked.
          'useLayoutEffect unmount "two"',
          'useEffect unmount "two"',
          'useLayoutEffect mount "two"',
          'useEffect mount "two"',
        ]);
      });
    });

    it('double invoking for effects for modern roots', async () => {
      function App({text}) {
        React.useEffect(() => {
          Scheduler.log('useEffect mount');
          return () => Scheduler.log('useEffect unmount');
        });

        React.useLayoutEffect(() => {
          Scheduler.log('useLayoutEffect mount');
          return () => Scheduler.log('useLayoutEffect unmount');
        });

        return text;
      }
      await act(() => {
        ReactNoop.render(<App text={'mount'} />);
      });

      assertLog([
        'useLayoutEffect mount',
        'useEffect mount',
        'useLayoutEffect unmount',
        'useEffect unmount',
        'useLayoutEffect mount',
        'useEffect mount',
      ]);

      await act(() => {
        ReactNoop.render(<App text={'update'} />);
      });

      assertLog([
        'useLayoutEffect unmount',
        'useLayoutEffect mount',
        'useEffect unmount',
        'useEffect mount',
      ]);

      await act(() => {
        ReactNoop.render(null);
      });

      assertLog(['useLayoutEffect unmount', 'useEffect unmount']);
    });

    it('multiple effects are double invoked in the right order (all mounted, all unmounted, all remounted)', async () => {
      function App({text}) {
        React.useEffect(() => {
          Scheduler.log('useEffect One mount');
          return () => Scheduler.log('useEffect One unmount');
        });

        React.useEffect(() => {
          Scheduler.log('useEffect Two mount');
          return () => Scheduler.log('useEffect Two unmount');
        });

        return text;
      }

      await act(() => {
        ReactNoop.render(<App text={'mount'} />);
      });

      assertLog([
        'useEffect One mount',
        'useEffect Two mount',
        'useEffect One unmount',
        'useEffect Two unmount',
        'useEffect One mount',
        'useEffect Two mount',
      ]);

      await act(() => {
        ReactNoop.render(<App text={'update'} />);
      });

      assertLog([
        'useEffect One unmount',
        'useEffect Two unmount',
        'useEffect One mount',
        'useEffect Two mount',
      ]);

      await act(() => {
        ReactNoop.render(null);
      });

      assertLog(['useEffect One unmount', 'useEffect Two unmount']);
    });

    it('multiple layout effects are double invoked in the right order (all mounted, all unmounted, all remounted)', async () => {
      function App({text}) {
        React.useLayoutEffect(() => {
          Scheduler.log('useLayoutEffect One mount');
          return () => Scheduler.log('useLayoutEffect One unmount');
        });

        React.useLayoutEffect(() => {
          Scheduler.log('useLayoutEffect Two mount');
          return () => Scheduler.log('useLayoutEffect Two unmount');
        });

        return text;
      }

      await act(() => {
        ReactNoop.render(<App text={'mount'} />);
      });

      assertLog([
        'useLayoutEffect One mount',
        'useLayoutEffect Two mount',
        'useLayoutEffect One unmount',
        'useLayoutEffect Two unmount',
        'useLayoutEffect One mount',
        'useLayoutEffect Two mount',
      ]);

      await act(() => {
        ReactNoop.render(<App text={'update'} />);
      });

      assertLog([
        'useLayoutEffect One unmount',
        'useLayoutEffect Two unmount',
        'useLayoutEffect One mount',
        'useLayoutEffect Two mount',
      ]);

      await act(() => {
        ReactNoop.render(null);
      });

      assertLog(['useLayoutEffect One unmount', 'useLayoutEffect Two unmount']);
    });

    it('useEffect and useLayoutEffect is called twice when there is no unmount', async () => {
      function App({text}) {
        React.useEffect(() => {
          Scheduler.log('useEffect mount');
        });

        React.useLayoutEffect(() => {
          Scheduler.log('useLayoutEffect mount');
        });

        return text;
      }

      await act(() => {
        ReactNoop.render(<App text={'mount'} />);
      });

      assertLog([
        'useLayoutEffect mount',
        'useEffect mount',
        'useLayoutEffect mount',
        'useEffect mount',
      ]);

      await act(() => {
        ReactNoop.render(<App text={'update'} />);
      });

      assertLog(['useLayoutEffect mount', 'useEffect mount']);

      await act(() => {
        ReactNoop.render(null);
      });

      assertLog([]);
    });

    //@gate useModernStrictMode
    it('disconnects refs during double invoking', async () => {
      const onRefMock = jest.fn();
      function App({text}) {
        return (
          <span
            ref={ref => {
              onRefMock(ref);
            }}>
            text
          </span>
        );
      }

      await act(() => {
        ReactNoop.render(<App text={'mount'} />);
      });

      expect(onRefMock.mock.calls.length).toBe(3);
      expect(onRefMock.mock.calls[0][0]).not.toBeNull();
      expect(onRefMock.mock.calls[1][0]).toBe(null);
      expect(onRefMock.mock.calls[2][0]).not.toBeNull();
    });

    it('passes the right context to class component lifecycles', async () => {
      class App extends React.PureComponent {
        test() {}

        componentDidMount() {
          this.test();
          Scheduler.log('componentDidMount');
        }

        componentDidUpdate() {
          this.test();
          Scheduler.log('componentDidUpdate');
        }

        componentWillUnmount() {
          this.test();
          Scheduler.log('componentWillUnmount');
        }

        render() {
          return null;
        }
      }

      await act(() => {
        ReactNoop.render(<App />);
      });

      assertLog([
        'componentDidMount',
        'componentWillUnmount',
        'componentDidMount',
      ]);
    });

    it('double invoking works for class components', async () => {
      class App extends React.PureComponent {
        componentDidMount() {
          Scheduler.log('componentDidMount');
        }

        componentDidUpdate() {
          Scheduler.log('componentDidUpdate');
        }

        componentWillUnmount() {
          Scheduler.log('componentWillUnmount');
        }

        render() {
          return this.props.text;
        }
      }

      await act(() => {
        ReactNoop.render(<App text={'mount'} />);
      });

      assertLog([
        'componentDidMount',
        'componentWillUnmount',
        'componentDidMount',
      ]);

      await act(() => {
        ReactNoop.render(<App text={'update'} />);
      });

      assertLog(['componentDidUpdate']);

      await act(() => {
        ReactNoop.render(null);
      });

      assertLog(['componentWillUnmount']);
    });

    it('double flushing passive effects only results in one double invoke', async () => {
      function App({text}) {
        const [state, setState] = React.useState(0);
        React.useEffect(() => {
          if (state !== 1) {
            setState(1);
          }
          Scheduler.log('useEffect mount');
          return () => Scheduler.log('useEffect unmount');
        });

        React.useLayoutEffect(() => {
          Scheduler.log('useLayoutEffect mount');
          return () => Scheduler.log('useLayoutEffect unmount');
        });

        Scheduler.log(text);
        return text;
      }

      await act(() => {
        ReactNoop.render(<App text={'mount'} />);
      });

      assertLog([
        'mount',
        'useLayoutEffect mount',
        'useEffect mount',
        'useLayoutEffect unmount',
        'useEffect unmount',
        'useLayoutEffect mount',
        'useEffect mount',
        'mount',
        'useLayoutEffect unmount',
        'useLayoutEffect mount',
        'useEffect unmount',
        'useEffect mount',
      ]);
    });

    it('newly mounted components after initial mount get double invoked', async () => {
      let _setShowChild;
      function Child() {
        React.useEffect(() => {
          Scheduler.log('Child useEffect mount');
          return () => Scheduler.log('Child useEffect unmount');
        });
        React.useLayoutEffect(() => {
          Scheduler.log('Child useLayoutEffect mount');
          return () => Scheduler.log('Child useLayoutEffect unmount');
        });

        return null;
      }

      function App() {
        const [showChild, setShowChild] = React.useState(false);
        _setShowChild = setShowChild;
        React.useEffect(() => {
          Scheduler.log('App useEffect mount');
          return () => Scheduler.log('App useEffect unmount');
        });
        React.useLayoutEffect(() => {
          Scheduler.log('App useLayoutEffect mount');
          return () => Scheduler.log('App useLayoutEffect unmount');
        });

        return showChild && <Child />;
      }

      await act(() => {
        ReactNoop.render(<App />);
      });

      assertLog([
        'App useLayoutEffect mount',
        'App useEffect mount',
        'App useLayoutEffect unmount',
        'App useEffect unmount',
        'App useLayoutEffect mount',
        'App useEffect mount',
      ]);

      await act(() => {
        _setShowChild(true);
      });

      assertLog([
        'App useLayoutEffect unmount',
        'Child useLayoutEffect mount',
        'App useLayoutEffect mount',
        'App useEffect unmount',
        'Child useEffect mount',
        'App useEffect mount',
        'Child useLayoutEffect unmount',
        'Child useEffect unmount',
        'Child useLayoutEffect mount',
        'Child useEffect mount',
      ]);
    });

    it('classes and functions are double invoked together correctly', async () => {
      class ClassChild extends React.PureComponent {
        componentDidMount() {
          Scheduler.log('componentDidMount');
        }

        componentWillUnmount() {
          Scheduler.log('componentWillUnmount');
        }

        render() {
          return this.props.text;
        }
      }

      function FunctionChild({text}) {
        React.useEffect(() => {
          Scheduler.log('useEffect mount');
          return () => Scheduler.log('useEffect unmount');
        });
        React.useLayoutEffect(() => {
          Scheduler.log('useLayoutEffect mount');
          return () => Scheduler.log('useLayoutEffect unmount');
        });
        return text;
      }

      function App({text}) {
        return (
          <>
            <ClassChild text={text} />
            <FunctionChild text={text} />
          </>
        );
      }

      await act(() => {
        ReactNoop.render(<App text={'mount'} />);
      });

      assertLog([
        'componentDidMount',
        'useLayoutEffect mount',
        'useEffect mount',
        'componentWillUnmount',
        'useLayoutEffect unmount',
        'useEffect unmount',
        'componentDidMount',
        'useLayoutEffect mount',
        'useEffect mount',
      ]);

      await act(() => {
        ReactNoop.render(<App text={'mount'} />);
      });

      assertLog([
        'useLayoutEffect unmount',
        'useLayoutEffect mount',
        'useEffect unmount',
        'useEffect mount',
      ]);

      await act(() => {
        ReactNoop.render(null);
      });

      assertLog([
        'componentWillUnmount',
        'useLayoutEffect unmount',
        'useEffect unmount',
      ]);
    });
  }
});
