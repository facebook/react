/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;

function shouldDoubleInvokingEffects() {
  // For now, this feature only exists in the old fork (while the new fork is being bisected).
  // Eventually we'll land it in both forks.
  return __DEV__ && !__VARIANT__;
}

describe('ReactDoubleInvokeEvents', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');

    ReactFeatureFlags.enableDoubleInvokingEffects = shouldDoubleInvokingEffects();
  });

  it('should not double invoke effects outside of StrictMode', () => {
    function App({text}) {
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('useEffect mount');
        return () => Scheduler.unstable_yieldValue('useEffect unmount');
      });

      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('useLayoutEffect mount');
        return () => Scheduler.unstable_yieldValue('useLayoutEffect unmount');
      });

      return text;
    }

    ReactNoop.act(() => {
      ReactNoop.renderLegacySyncRoot(<App text={'mount'} />);
    });

    expect(Scheduler).toHaveYielded([
      'useLayoutEffect mount',
      'useEffect mount',
    ]);
  });

  it('should double invoke effects only within StrictMode subtrees', () => {
    function ComponentWithEffects({label}) {
      React.useEffect(() => {
        Scheduler.unstable_yieldValue(`useEffect mount "${label}"`);
        return () =>
          Scheduler.unstable_yieldValue(`useEffect unmount "${label}"`);
      });

      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue(`useLayoutEffect mount "${label}"`);
        return () =>
          Scheduler.unstable_yieldValue(`useLayoutEffect unmount "${label}"`);
      });

      return label;
    }

    ReactNoop.act(() => {
      ReactNoop.renderLegacySyncRoot(
        <>
          <ComponentWithEffects label={'loose'} />
          <React.StrictMode>
            <ComponentWithEffects label={'strict'} />
          </React.StrictMode>
        </>,
      );
    });

    if (shouldDoubleInvokingEffects()) {
      expect(Scheduler).toHaveYielded([
        'useLayoutEffect mount "loose"',
        'useLayoutEffect mount "strict"',
        'useEffect mount "loose"',
        'useEffect mount "strict"',

        'useLayoutEffect unmount "strict"',
        'useEffect unmount "strict"',
        'useLayoutEffect mount "strict"',
        'useEffect mount "strict"',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'useLayoutEffect mount "loose"',
        'useLayoutEffect mount "strict"',
        'useEffect mount "loose"',
        'useEffect mount "strict"',
      ]);
    }
  });

  it('should flush double-invoked effects within the same frame as layout effects if there are no passive effects', () => {
    function ComponentWithEffects({label}) {
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue(`useLayoutEffect mount "${label}"`);
        return () =>
          Scheduler.unstable_yieldValue(`useLayoutEffect unmount "${label}"`);
      });

      return label;
    }

    ReactNoop.act(() => {
      ReactNoop.renderLegacySyncRoot(
        <React.StrictMode>
          <ComponentWithEffects label={'one'} />
        </React.StrictMode>,
      );

      if (shouldDoubleInvokingEffects()) {
        expect(Scheduler).toFlushUntilNextPaint([
          'useLayoutEffect mount "one"',
          'useLayoutEffect unmount "one"',
          'useLayoutEffect mount "one"',
        ]);
      } else {
        expect(Scheduler).toFlushUntilNextPaint([
          'useLayoutEffect mount "one"',
        ]);
      }
    });

    ReactNoop.act(() => {
      ReactNoop.renderLegacySyncRoot(
        <React.StrictMode>
          <ComponentWithEffects label={'one'} />
          <ComponentWithEffects label={'two'} />
        </React.StrictMode>,
      );

      if (shouldDoubleInvokingEffects()) {
        expect(Scheduler).toFlushUntilNextPaint([
          // Cleanup and re-run "one" (and "two") since there is no dependencies array.
          'useLayoutEffect unmount "one"',
          'useLayoutEffect mount "one"',
          'useLayoutEffect mount "two"',

          // Since "two" is new, it should be double-invoked.
          'useLayoutEffect unmount "two"',
          'useLayoutEffect mount "two"',
        ]);
      } else {
        expect(Scheduler).toFlushUntilNextPaint([
          'useLayoutEffect unmount "one"',
          'useLayoutEffect mount "one"',
          'useLayoutEffect mount "two"',
        ]);
      }
    });
  });

  // This test also verifies that double-invoked effects flush synchronously
  // within the same frame as passive effects.
  it('should double invoke effects only for newly mounted components', () => {
    function ComponentWithEffects({label}) {
      React.useEffect(() => {
        Scheduler.unstable_yieldValue(`useEffect mount "${label}"`);
        return () =>
          Scheduler.unstable_yieldValue(`useEffect unmount "${label}"`);
      });

      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue(`useLayoutEffect mount "${label}"`);
        return () =>
          Scheduler.unstable_yieldValue(`useLayoutEffect unmount "${label}"`);
      });

      return label;
    }

    ReactNoop.act(() => {
      ReactNoop.renderLegacySyncRoot(
        <React.StrictMode>
          <ComponentWithEffects label={'one'} />
        </React.StrictMode>,
      );

      if (shouldDoubleInvokingEffects()) {
        expect(Scheduler).toFlushAndYieldThrough([
          'useLayoutEffect mount "one"',
        ]);
        expect(Scheduler).toFlushAndYield([
          'useEffect mount "one"',
          'useLayoutEffect unmount "one"',
          'useEffect unmount "one"',
          'useLayoutEffect mount "one"',
          'useEffect mount "one"',
        ]);
      } else {
        expect(Scheduler).toFlushAndYieldThrough([
          'useLayoutEffect mount "one"',
        ]);
        expect(Scheduler).toFlushAndYield(['useEffect mount "one"']);
      }
    });

    ReactNoop.act(() => {
      ReactNoop.renderLegacySyncRoot(
        <React.StrictMode>
          <ComponentWithEffects label={'one'} />
          <ComponentWithEffects label={'two'} />
        </React.StrictMode>,
      );

      if (shouldDoubleInvokingEffects()) {
        expect(Scheduler).toFlushAndYieldThrough([
          // Cleanup and re-run "one" (and "two") since there is no dependencies array.
          'useLayoutEffect unmount "one"',
          'useLayoutEffect mount "one"',
          'useLayoutEffect mount "two"',
        ]);
        expect(Scheduler).toFlushAndYield([
          'useEffect unmount "one"',
          'useEffect mount "one"',
          'useEffect mount "two"',

          // Since "two" is new, it should be double-invoked.
          'useLayoutEffect unmount "two"',
          'useEffect unmount "two"',
          'useLayoutEffect mount "two"',
          'useEffect mount "two"',
        ]);
      } else {
        expect(Scheduler).toFlushAndYieldThrough([
          'useLayoutEffect unmount "one"',
          'useLayoutEffect mount "one"',
          'useLayoutEffect mount "two"',
        ]);
        expect(Scheduler).toFlushAndYield([
          'useEffect unmount "one"',
          'useEffect mount "one"',
          'useEffect mount "two"',
        ]);
      }
    });
  });

  it('double invoking for effects for modern roots', () => {
    function App({text}) {
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('useEffect mount');
        return () => Scheduler.unstable_yieldValue('useEffect unmount');
      });

      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('useLayoutEffect mount');
        return () => Scheduler.unstable_yieldValue('useLayoutEffect unmount');
      });

      return text;
    }
    ReactNoop.act(() => {
      ReactNoop.render(<App text={'mount'} />);
    });

    if (shouldDoubleInvokingEffects()) {
      expect(Scheduler).toHaveYielded([
        'useLayoutEffect mount',
        'useEffect mount',
        'useLayoutEffect unmount',
        'useEffect unmount',
        'useLayoutEffect mount',
        'useEffect mount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'useLayoutEffect mount',
        'useEffect mount',
      ]);
    }

    ReactNoop.act(() => {
      ReactNoop.render(<App text={'update'} />);
    });

    expect(Scheduler).toHaveYielded([
      'useLayoutEffect unmount',
      'useLayoutEffect mount',
      'useEffect unmount',
      'useEffect mount',
    ]);

    ReactNoop.act(() => {
      ReactNoop.render(null);
    });

    expect(Scheduler).toHaveYielded([
      'useLayoutEffect unmount',
      'useEffect unmount',
    ]);
  });

  it('multiple effects are double invoked in the right order (all mounted, all unmounted, all remounted)', () => {
    function App({text}) {
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('useEffect One mount');
        return () => Scheduler.unstable_yieldValue('useEffect One unmount');
      });

      React.useEffect(() => {
        Scheduler.unstable_yieldValue('useEffect Two mount');
        return () => Scheduler.unstable_yieldValue('useEffect Two unmount');
      });

      return text;
    }

    ReactNoop.act(() => {
      ReactNoop.render(<App text={'mount'} />);
    });

    if (shouldDoubleInvokingEffects()) {
      expect(Scheduler).toHaveYielded([
        'useEffect One mount',
        'useEffect Two mount',
        'useEffect One unmount',
        'useEffect Two unmount',
        'useEffect One mount',
        'useEffect Two mount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'useEffect One mount',
        'useEffect Two mount',
      ]);
    }

    ReactNoop.act(() => {
      ReactNoop.render(<App text={'update'} />);
    });

    expect(Scheduler).toHaveYielded([
      'useEffect One unmount',
      'useEffect Two unmount',
      'useEffect One mount',
      'useEffect Two mount',
    ]);

    ReactNoop.act(() => {
      ReactNoop.render(null);
    });

    expect(Scheduler).toHaveYielded([
      'useEffect One unmount',
      'useEffect Two unmount',
    ]);
  });

  it('multiple layout effects are double invoked in the right order (all mounted, all unmounted, all remounted)', () => {
    function App({text}) {
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('useLayoutEffect One mount');
        return () =>
          Scheduler.unstable_yieldValue('useLayoutEffect One unmount');
      });

      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('useLayoutEffect Two mount');
        return () =>
          Scheduler.unstable_yieldValue('useLayoutEffect Two unmount');
      });

      return text;
    }

    ReactNoop.act(() => {
      ReactNoop.render(<App text={'mount'} />);
    });

    if (shouldDoubleInvokingEffects()) {
      expect(Scheduler).toHaveYielded([
        'useLayoutEffect One mount',
        'useLayoutEffect Two mount',
        'useLayoutEffect One unmount',
        'useLayoutEffect Two unmount',
        'useLayoutEffect One mount',
        'useLayoutEffect Two mount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'useLayoutEffect One mount',
        'useLayoutEffect Two mount',
      ]);
    }

    ReactNoop.act(() => {
      ReactNoop.render(<App text={'update'} />);
    });

    expect(Scheduler).toHaveYielded([
      'useLayoutEffect One unmount',
      'useLayoutEffect Two unmount',
      'useLayoutEffect One mount',
      'useLayoutEffect Two mount',
    ]);

    ReactNoop.act(() => {
      ReactNoop.render(null);
    });

    expect(Scheduler).toHaveYielded([
      'useLayoutEffect One unmount',
      'useLayoutEffect Two unmount',
    ]);
  });

  it('useEffect and useLayoutEffect is called twice when there is no unmount', () => {
    function App({text}) {
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('useEffect mount');
      });

      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('useLayoutEffect mount');
      });

      return text;
    }

    ReactNoop.act(() => {
      ReactNoop.render(<App text={'mount'} />);
    });

    if (shouldDoubleInvokingEffects()) {
      expect(Scheduler).toHaveYielded([
        'useLayoutEffect mount',
        'useEffect mount',
        'useLayoutEffect mount',
        'useEffect mount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'useLayoutEffect mount',
        'useEffect mount',
      ]);
    }

    ReactNoop.act(() => {
      ReactNoop.render(<App text={'update'} />);
    });

    expect(Scheduler).toHaveYielded([
      'useLayoutEffect mount',
      'useEffect mount',
    ]);

    ReactNoop.act(() => {
      ReactNoop.render(null);
    });

    expect(Scheduler).toHaveYielded([]);
  });

  it('passes the right context to class component lifecycles', () => {
    class App extends React.PureComponent {
      test() {}

      componentDidMount() {
        this.test();
        Scheduler.unstable_yieldValue('componentDidMount');
      }

      componentDidUpdate() {
        this.test();
        Scheduler.unstable_yieldValue('componentDidUpdate');
      }

      componentWillUnmount() {
        this.test();
        Scheduler.unstable_yieldValue('componentWillUnmount');
      }

      render() {
        return null;
      }
    }

    ReactNoop.act(() => {
      ReactNoop.render(<App />);
    });

    if (shouldDoubleInvokingEffects()) {
      expect(Scheduler).toHaveYielded([
        'componentDidMount',
        'componentWillUnmount',
        'componentDidMount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded(['componentDidMount']);
    }
  });

  it('double invoking works for class components', () => {
    class App extends React.PureComponent {
      componentDidMount() {
        Scheduler.unstable_yieldValue('componentDidMount');
      }

      componentDidUpdate() {
        Scheduler.unstable_yieldValue('componentDidUpdate');
      }

      componentWillUnmount() {
        Scheduler.unstable_yieldValue('componentWillUnmount');
      }

      render() {
        return this.props.text;
      }
    }

    ReactNoop.act(() => {
      ReactNoop.render(<App text={'mount'} />);
    });

    if (shouldDoubleInvokingEffects()) {
      expect(Scheduler).toHaveYielded([
        'componentDidMount',
        'componentWillUnmount',
        'componentDidMount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded(['componentDidMount']);
    }

    ReactNoop.act(() => {
      ReactNoop.render(<App text={'update'} />);
    });

    expect(Scheduler).toHaveYielded(['componentDidUpdate']);

    ReactNoop.act(() => {
      ReactNoop.render(null);
    });

    expect(Scheduler).toHaveYielded(['componentWillUnmount']);
  });

  it('double flushing passive effects only results in one double invoke', () => {
    function App({text}) {
      const [state, setState] = React.useState(0);
      React.useEffect(() => {
        if (state !== 1) {
          setState(1);
        }
        Scheduler.unstable_yieldValue('useEffect mount');
        return () => Scheduler.unstable_yieldValue('useEffect unmount');
      });

      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('useLayoutEffect mount');
        return () => Scheduler.unstable_yieldValue('useLayoutEffect unmount');
      });

      Scheduler.unstable_yieldValue(text);
      return text;
    }

    ReactNoop.act(() => {
      ReactNoop.render(<App text={'mount'} />);
    });

    if (shouldDoubleInvokingEffects()) {
      expect(Scheduler).toHaveYielded([
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
    } else {
      expect(Scheduler).toHaveYielded([
        'mount',
        'useLayoutEffect mount',
        'useEffect mount',
        'mount',
        'useLayoutEffect unmount',
        'useLayoutEffect mount',
        'useEffect unmount',
        'useEffect mount',
      ]);
    }
  });

  it('newly mounted components after initial mount get double invoked', () => {
    let _setShowChild;
    function Child() {
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('Child useEffect mount');
        return () => Scheduler.unstable_yieldValue('Child useEffect unmount');
      });
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Child useLayoutEffect mount');
        return () =>
          Scheduler.unstable_yieldValue('Child useLayoutEffect unmount');
      });

      return null;
    }

    function App() {
      const [showChild, setShowChild] = React.useState(false);
      _setShowChild = setShowChild;
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('App useEffect mount');
        return () => Scheduler.unstable_yieldValue('App useEffect unmount');
      });
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('App useLayoutEffect mount');
        return () =>
          Scheduler.unstable_yieldValue('App useLayoutEffect unmount');
      });

      return showChild && <Child />;
    }

    ReactNoop.act(() => {
      ReactNoop.render(<App />);
    });

    if (shouldDoubleInvokingEffects()) {
      expect(Scheduler).toHaveYielded([
        'App useLayoutEffect mount',
        'App useEffect mount',
        'App useLayoutEffect unmount',
        'App useEffect unmount',
        'App useLayoutEffect mount',
        'App useEffect mount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'App useLayoutEffect mount',
        'App useEffect mount',
      ]);
    }

    ReactNoop.act(() => {
      _setShowChild(true);
    });

    if (shouldDoubleInvokingEffects()) {
      expect(Scheduler).toHaveYielded([
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
    } else {
      expect(Scheduler).toHaveYielded([
        'App useLayoutEffect unmount',
        'Child useLayoutEffect mount',
        'App useLayoutEffect mount',
        'App useEffect unmount',
        'Child useEffect mount',
        'App useEffect mount',
      ]);
    }
  });

  it('classes and functions are double invoked together correctly', () => {
    class ClassChild extends React.PureComponent {
      componentDidMount() {
        Scheduler.unstable_yieldValue('componentDidMount');
      }

      componentWillUnmount() {
        Scheduler.unstable_yieldValue('componentWillUnmount');
      }

      render() {
        return this.props.text;
      }
    }

    function FunctionChild({text}) {
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('useEffect mount');
        return () => Scheduler.unstable_yieldValue('useEffect unmount');
      });
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('useLayoutEffect mount');
        return () => Scheduler.unstable_yieldValue('useLayoutEffect unmount');
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

    ReactNoop.act(() => {
      ReactNoop.render(<App text={'mount'} />);
    });

    if (shouldDoubleInvokingEffects()) {
      expect(Scheduler).toHaveYielded([
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
    } else {
      expect(Scheduler).toHaveYielded([
        'componentDidMount',
        'useLayoutEffect mount',
        'useEffect mount',
      ]);
    }

    ReactNoop.act(() => {
      ReactNoop.render(<App text={'mount'} />);
    });

    expect(Scheduler).toHaveYielded([
      'useLayoutEffect unmount',
      'useLayoutEffect mount',
      'useEffect unmount',
      'useEffect mount',
    ]);

    ReactNoop.act(() => {
      ReactNoop.render(null);
    });

    expect(Scheduler).toHaveYielded([
      'componentWillUnmount',
      'useLayoutEffect unmount',
      'useEffect unmount',
    ]);
  });
});
