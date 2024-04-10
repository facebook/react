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

describe('StrictEffectsMode', () => {
  beforeEach(() => {
    jest.resetModules();
    act = require('internal-test-utils').act;
    const InternalTestUtils = require('internal-test-utils');
    assertLog = InternalTestUtils.assertLog;

    React = require('react');
    Scheduler = require('scheduler');
    ReactNoop = require('react-noop-renderer');
  });

  // @gate !disableLegacyMode
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

    const root = ReactNoop.createLegacyRoot();
    await act(() => {
      root.render(
        <React.StrictMode>
          <App text={'mount'} />
        </React.StrictMode>,
      );
    });

    assertLog(['useLayoutEffect mount', 'useEffect mount']);
  });

  it('double invoking for effects works properly', async () => {
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
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'mount'} />
        </React.StrictMode>,
        'root',
      );
    });

    if (__DEV__) {
      assertLog([
        'useLayoutEffect mount',
        'useEffect mount',
        'useLayoutEffect unmount',
        'useEffect unmount',
        'useLayoutEffect mount',
        'useEffect mount',
      ]);
    } else {
      assertLog(['useLayoutEffect mount', 'useEffect mount']);
    }

    await act(() => {
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'update'} />
        </React.StrictMode>,
        'root',
      );
    });

    assertLog([
      'useLayoutEffect unmount',
      'useLayoutEffect mount',
      'useEffect unmount',
      'useEffect mount',
    ]);

    await act(() => {
      ReactNoop.unmountRootWithID('root');
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
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'mount'} />
        </React.StrictMode>,
        'root',
      );
    });

    if (__DEV__) {
      assertLog([
        'useEffect One mount',
        'useEffect Two mount',
        'useEffect One unmount',
        'useEffect Two unmount',
        'useEffect One mount',
        'useEffect Two mount',
      ]);
    } else {
      assertLog(['useEffect One mount', 'useEffect Two mount']);
    }

    await act(() => {
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'update'} />
        </React.StrictMode>,
        'root',
      );
    });

    assertLog([
      'useEffect One unmount',
      'useEffect Two unmount',
      'useEffect One mount',
      'useEffect Two mount',
    ]);

    await act(() => {
      ReactNoop.unmountRootWithID('root');
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
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'mount'} />
        </React.StrictMode>,
        'root',
      );
    });

    if (__DEV__) {
      assertLog([
        'useLayoutEffect One mount',
        'useLayoutEffect Two mount',
        'useLayoutEffect One unmount',
        'useLayoutEffect Two unmount',
        'useLayoutEffect One mount',
        'useLayoutEffect Two mount',
      ]);
    } else {
      assertLog(['useLayoutEffect One mount', 'useLayoutEffect Two mount']);
    }

    await act(() => {
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'update'} />
        </React.StrictMode>,
        'root',
      );
    });

    assertLog([
      'useLayoutEffect One unmount',
      'useLayoutEffect Two unmount',
      'useLayoutEffect One mount',
      'useLayoutEffect Two mount',
    ]);

    await act(() => {
      ReactNoop.unmountRootWithID('root');
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
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'mount'} />
        </React.StrictMode>,
      );
    });

    if (__DEV__) {
      assertLog([
        'useLayoutEffect mount',
        'useEffect mount',
        'useLayoutEffect mount',
        'useEffect mount',
      ]);
    } else {
      assertLog(['useLayoutEffect mount', 'useEffect mount']);
    }

    await act(() => {
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'update'} />
        </React.StrictMode>,
      );
    });

    assertLog(['useLayoutEffect mount', 'useEffect mount']);

    await act(() => {
      ReactNoop.unmountRootWithID('root');
    });

    assertLog([]);
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
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      );
    });

    if (__DEV__) {
      assertLog([
        'componentDidMount',
        'componentWillUnmount',
        'componentDidMount',
      ]);
    } else {
      assertLog(['componentDidMount']);
    }
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
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'mount'} />
        </React.StrictMode>,
        'root',
      );
    });

    if (__DEV__) {
      assertLog([
        'componentDidMount',
        'componentWillUnmount',
        'componentDidMount',
      ]);
    } else {
      assertLog(['componentDidMount']);
    }

    await act(() => {
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'update'} />
        </React.StrictMode>,
        'root',
      );
    });

    assertLog(['componentDidUpdate']);

    await act(() => {
      ReactNoop.unmountRootWithID('root');
    });

    assertLog(['componentWillUnmount']);
  });

  it('invokes componentWillUnmount for class components without componentDidMount', async () => {
    class App extends React.PureComponent {
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
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'mount'} />
        </React.StrictMode>,
        'root',
      );
    });

    if (__DEV__) {
      assertLog(['componentWillUnmount']);
    } else {
      assertLog([]);
    }

    await act(() => {
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'update'} />
        </React.StrictMode>,
        'root',
      );
    });

    assertLog(['componentDidUpdate']);

    await act(() => {
      ReactNoop.unmountRootWithID('root');
    });

    assertLog(['componentWillUnmount']);
  });

  // @gate !disableLegacyMode
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

    const root = ReactNoop.createLegacyRoot();
    await act(() => {
      root.render(
        <React.StrictMode>
          <App text={'mount'} />
        </React.StrictMode>,
      );
    });

    assertLog(['componentDidMount']);
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
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'mount'} />
        </React.StrictMode>,
      );
    });

    if (__DEV__) {
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
    } else {
      assertLog([
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
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
        'root',
      );
    });

    if (__DEV__) {
      assertLog([
        'App useLayoutEffect mount',
        'App useEffect mount',
        'App useLayoutEffect unmount',
        'App useEffect unmount',
        'App useLayoutEffect mount',
        'App useEffect mount',
      ]);
    } else {
      assertLog(['App useLayoutEffect mount', 'App useEffect mount']);
    }

    await act(() => {
      _setShowChild(true);
    });

    if (__DEV__) {
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
    } else {
      assertLog([
        'App useLayoutEffect unmount',
        'Child useLayoutEffect mount',
        'App useLayoutEffect mount',
        'App useEffect unmount',
        'Child useEffect mount',
        'App useEffect mount',
      ]);
    }
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
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'mount'} />
        </React.StrictMode>,
        'root',
      );
    });

    if (__DEV__) {
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
    } else {
      assertLog([
        'componentDidMount',
        'useLayoutEffect mount',
        'useEffect mount',
      ]);
    }

    await act(() => {
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'mount'} />
        </React.StrictMode>,
        'root',
      );
    });

    assertLog([
      'useLayoutEffect unmount',
      'useLayoutEffect mount',
      'useEffect unmount',
      'useEffect mount',
    ]);

    await act(() => {
      ReactNoop.unmountRootWithID('root');
    });

    assertLog([
      'componentWillUnmount',
      'useLayoutEffect unmount',
      'useEffect unmount',
    ]);
  });

  it('classes without componentDidMount and functions are double invoked together correctly', async () => {
    class ClassChild extends React.PureComponent {
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
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'mount'} />
        </React.StrictMode>,
        'root',
      );
    });

    if (__DEV__) {
      assertLog([
        'useLayoutEffect mount',
        'useEffect mount',
        'componentWillUnmount',
        'useLayoutEffect unmount',
        'useEffect unmount',
        'useLayoutEffect mount',
        'useEffect mount',
      ]);
    } else {
      assertLog(['useLayoutEffect mount', 'useEffect mount']);
    }

    await act(() => {
      ReactNoop.renderToRootWithID(
        <React.StrictMode>
          <App text={'mount'} />
        </React.StrictMode>,
        'root',
      );
    });

    assertLog([
      'useLayoutEffect unmount',
      'useLayoutEffect mount',
      'useEffect unmount',
      'useEffect mount',
    ]);

    await act(() => {
      ReactNoop.unmountRootWithID('root');
    });

    assertLog([
      'componentWillUnmount',
      'useLayoutEffect unmount',
      'useEffect unmount',
    ]);
  });

  // @gate __DEV__
  it('should double invoke effects after a re-suspend', async () => {
    // Not using Scheduler.log because it silences double render logs.
    let log = [];
    let shouldSuspend = true;
    let resolve;
    const suspensePromise = new Promise(_resolve => {
      resolve = _resolve;
    });
    function Fallback() {
      log.push('Fallback');
      return 'Loading';
    }

    function Parent({prop}) {
      log.push('Parent rendered');

      React.useEffect(() => {
        log.push('Parent create');
        return () => {
          log.push('Parent destroy');
        };
      }, []);

      React.useEffect(() => {
        log.push('Parent dep create');
        return () => {
          log.push('Parent dep destroy');
        };
      }, [prop]);

      return (
        <React.Suspense fallback={<Fallback />}>
          <Child prop={prop} />
        </React.Suspense>
      );
    }

    function Child({prop}) {
      const [count, forceUpdate] = React.useState(0);
      const ref = React.useRef(null);
      log.push('Child rendered');
      React.useEffect(() => {
        log.push('Child create');
        return () => {
          log.push('Child destroy');
          ref.current = true;
        };
      }, []);
      const key = `${prop}-${count}`;
      React.useEffect(() => {
        log.push('Child dep create');
        if (ref.current === true) {
          ref.current = false;
          forceUpdate(c => c + 1);
          log.push('-----------------------after setState');
          return;
        }

        return () => {
          log.push('Child dep destroy');
        };
      }, [key]);

      if (shouldSuspend) {
        log.push('Child suspended');
        throw suspensePromise;
      }
      return null;
    }

    // Initial mount
    shouldSuspend = false;
    await act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <Parent />
        </React.StrictMode>,
      );
    });

    // Now re-suspend
    shouldSuspend = true;
    log = [];
    await act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <Parent />
        </React.StrictMode>,
      );
    });

    // while suspended, update
    log.push('-----------------------after update');
    await act(() => {
      ReactNoop.render(
        <React.StrictMode>
          <Parent prop={'bar'} />
        </React.StrictMode>,
      );
    });

    // Now resolve and commit
    log.push('-----------------------after suspense');

    await act(() => {
      resolve();
      shouldSuspend = false;
    });

    if (gate(flags => flags.useModernStrictMode)) {
      expect(log).toEqual([
        'Parent rendered',
        'Parent rendered',
        'Child rendered',
        'Child suspended',
        'Fallback',
        'Fallback',
        '-----------------------after update',
        'Parent rendered',
        'Parent rendered',
        'Child rendered',
        'Child suspended',
        'Fallback',
        'Fallback',
        'Parent dep destroy',
        'Parent dep create',
        '-----------------------after suspense',
        'Child rendered',
        'Child rendered',
        // !!! Committed, destroy and create effect.
        // !!! The other effect is not destroyed and created
        // !!! because the dep didn't change
        'Child dep destroy',
        'Child dep create',

        // Double invoke both effects
        'Child destroy',
        'Child dep destroy',
        'Child create',
        'Child dep create',
        // Fires setState
        '-----------------------after setState',
        'Child rendered',
        'Child rendered',
        'Child dep create',
      ]);
    } else {
      expect(log).toEqual([
        'Parent rendered',
        'Parent rendered',
        'Child rendered',
        'Child suspended',
        'Fallback',
        'Fallback',
        '-----------------------after update',
        'Parent rendered',
        'Parent rendered',
        'Child rendered',
        'Child suspended',
        'Fallback',
        'Fallback',
        'Parent dep destroy',
        'Parent dep create',
        '-----------------------after suspense',
        'Child rendered',
        'Child rendered',
        'Child dep destroy',
        'Child dep create',
      ]);
    }
  });
});
