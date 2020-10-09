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

describe('ReactDoubleInvokeEvents', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    ReactFeatureFlags.enableDoubleInvokingEffects = __VARIANT__;
  });

  it('double invoking for effects works properly', () => {
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

    if (__DEV__ && __VARIANT__) {
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

    if (__DEV__ && __VARIANT__) {
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

    if (__DEV__ && __VARIANT__) {
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

    if (__DEV__ && __VARIANT__) {
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

    if (__DEV__ && __VARIANT__) {
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

    if (__DEV__ && __VARIANT__) {
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

    if (__DEV__ && __VARIANT__) {
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

    if (__DEV__ && __VARIANT__) {
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

    if (__DEV__ && __VARIANT__) {
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

    if (__DEV__ && __VARIANT__) {
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
