/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

/* eslint-disable no-func-assign */

'use strict';

let React;
let ReactFeatureFlags;
let ReactTestRenderer;
let ReactDOMServer;

// Additional tests can be found in ReactHooksWithNoopRenderer. Plan is to
// gradually migrate those to this file.
describe('ReactHooks', () => {
  beforeEach(() => {
    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    ReactDOMServer = require('react-dom/server');
  });

  if (__DEV__) {
    // useDebugValue is a DEV-only hook
    it('useDebugValue throws when used in a class component', () => {
      class Example extends React.Component {
        render() {
          React.useDebugValue('abc');
          return null;
        }
      }
      expect(() => {
        ReactTestRenderer.create(<Example />);
      }).toThrow(
        'Hooks can only be called inside the body of a function component.',
      );
    });
  }

  it('bails out in the render phase if all of the state is the same', () => {
    const {useState, useLayoutEffect} = React;

    function Child({text}) {
      ReactTestRenderer.unstable_yield('Child: ' + text);
      return text;
    }

    let setCounter1;
    let setCounter2;
    function Parent() {
      const [counter1, _setCounter1] = useState(0);
      setCounter1 = _setCounter1;
      const [counter2, _setCounter2] = useState(0);
      setCounter2 = _setCounter2;

      const text = `${counter1}, ${counter2}`;
      ReactTestRenderer.unstable_yield(`Parent: ${text}`);
      useLayoutEffect(() => {
        ReactTestRenderer.unstable_yield(`Effect: ${text}`);
      });
      return <Child text={text} />;
    }

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(<Parent />);
    expect(root).toFlushAndYield([
      'Parent: 0, 0',
      'Child: 0, 0',
      'Effect: 0, 0',
    ]);
    expect(root).toMatchRenderedOutput('0, 0');

    // Normal update
    setCounter1(1);
    setCounter2(1);
    expect(root).toFlushAndYield([
      'Parent: 1, 1',
      'Child: 1, 1',
      'Effect: 1, 1',
    ]);

    // Update that bails out.
    setCounter1(1);
    expect(root).toFlushAndYield(['Parent: 1, 1']);

    // This time, one of the state updates but the other one doesn't. So we
    // can't bail out.
    setCounter1(1);
    setCounter2(2);
    expect(root).toFlushAndYield([
      'Parent: 1, 2',
      'Child: 1, 2',
      'Effect: 1, 2',
    ]);

    // Lots of updates that eventually resolve to the current values.
    setCounter1(9);
    setCounter2(3);
    setCounter1(4);
    setCounter2(7);
    setCounter1(1);
    setCounter2(2);

    // Because the final values are the same as the current values, the
    // component bails out.
    expect(root).toFlushAndYield(['Parent: 1, 2']);
  });

  it('bails out in render phase if all the state is the same and props bail out with memo', () => {
    const {useState, memo} = React;

    function Child({text}) {
      ReactTestRenderer.unstable_yield('Child: ' + text);
      return text;
    }

    let setCounter1;
    let setCounter2;
    function Parent({theme}) {
      const [counter1, _setCounter1] = useState(0);
      setCounter1 = _setCounter1;
      const [counter2, _setCounter2] = useState(0);
      setCounter2 = _setCounter2;

      const text = `${counter1}, ${counter2} (${theme})`;
      ReactTestRenderer.unstable_yield(`Parent: ${text}`);
      return <Child text={text} />;
    }

    Parent = memo(Parent);

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(<Parent theme="light" />);
    expect(root).toFlushAndYield([
      'Parent: 0, 0 (light)',
      'Child: 0, 0 (light)',
    ]);
    expect(root).toMatchRenderedOutput('0, 0 (light)');

    // Normal update
    setCounter1(1);
    setCounter2(1);
    expect(root).toFlushAndYield([
      'Parent: 1, 1 (light)',
      'Child: 1, 1 (light)',
    ]);

    // Update that bails out.
    setCounter1(1);
    expect(root).toFlushAndYield(['Parent: 1, 1 (light)']);

    // This time, one of the state updates but the other one doesn't. So we
    // can't bail out.
    setCounter1(1);
    setCounter2(2);
    expect(root).toFlushAndYield([
      'Parent: 1, 2 (light)',
      'Child: 1, 2 (light)',
    ]);

    // Updates bail out, but component still renders because props
    // have changed
    setCounter1(1);
    setCounter2(2);
    root.update(<Parent theme="dark" />);
    expect(root).toFlushAndYield(['Parent: 1, 2 (dark)', 'Child: 1, 2 (dark)']);

    // Both props and state bail out
    setCounter1(1);
    setCounter2(2);
    root.update(<Parent theme="dark" />);
    expect(root).toFlushAndYield(['Parent: 1, 2 (dark)']);
  });

  it('warns about setState second argument', () => {
    const {useState} = React;

    let setCounter;
    function Counter() {
      const [counter, _setCounter] = useState(0);
      setCounter = _setCounter;

      ReactTestRenderer.unstable_yield(`Count: ${counter}`);
      return counter;
    }

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(<Counter />);
    expect(root).toFlushAndYield(['Count: 0']);
    expect(root).toMatchRenderedOutput('0');

    expect(() => {
      setCounter(1, () => {
        throw new Error('Expected to ignore the callback.');
      });
    }).toWarnDev(
      'State updates from the useState() and useReducer() Hooks ' +
        "don't support the second callback argument. " +
        'To execute a side effect after rendering, ' +
        'declare it in the component body with useEffect().',
      {withoutStack: true},
    );
    expect(root).toFlushAndYield(['Count: 1']);
    expect(root).toMatchRenderedOutput('1');
  });

  it('warns about dispatch second argument', () => {
    const {useReducer} = React;

    let dispatch;
    function Counter() {
      const [counter, _dispatch] = useReducer((s, a) => a, 0);
      dispatch = _dispatch;

      ReactTestRenderer.unstable_yield(`Count: ${counter}`);
      return counter;
    }

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(<Counter />);
    expect(root).toFlushAndYield(['Count: 0']);
    expect(root).toMatchRenderedOutput('0');

    expect(() => {
      dispatch(1, () => {
        throw new Error('Expected to ignore the callback.');
      });
    }).toWarnDev(
      'State updates from the useState() and useReducer() Hooks ' +
        "don't support the second callback argument. " +
        'To execute a side effect after rendering, ' +
        'declare it in the component body with useEffect().',
      {withoutStack: true},
    );
    expect(root).toFlushAndYield(['Count: 1']);
    expect(root).toMatchRenderedOutput('1');
  });

  it('never bails out if context has changed', () => {
    const {useState, useLayoutEffect, useContext} = React;

    const ThemeContext = React.createContext('light');

    let setTheme;
    function ThemeProvider({children}) {
      const [theme, _setTheme] = useState('light');
      ReactTestRenderer.unstable_yield('Theme: ' + theme);
      setTheme = _setTheme;
      return (
        <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
      );
    }

    function Child({text}) {
      ReactTestRenderer.unstable_yield('Child: ' + text);
      return text;
    }

    let setCounter;
    function Parent() {
      const [counter, _setCounter] = useState(0);
      setCounter = _setCounter;

      const theme = useContext(ThemeContext);

      const text = `${counter} (${theme})`;
      ReactTestRenderer.unstable_yield(`Parent: ${text}`);
      useLayoutEffect(() => {
        ReactTestRenderer.unstable_yield(`Effect: ${text}`);
      });
      return <Child text={text} />;
    }

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(
      <ThemeProvider>
        <Parent />
      </ThemeProvider>,
    );
    expect(root).toFlushAndYield([
      'Theme: light',
      'Parent: 0 (light)',
      'Child: 0 (light)',
      'Effect: 0 (light)',
    ]);
    expect(root).toMatchRenderedOutput('0 (light)');

    // Updating the theme to the same value does't cause the consumers
    // to re-render.
    setTheme('light');
    expect(root).toFlushAndYield([]);
    expect(root).toMatchRenderedOutput('0 (light)');

    // Normal update
    setCounter(1);
    expect(root).toFlushAndYield([
      'Parent: 1 (light)',
      'Child: 1 (light)',
      'Effect: 1 (light)',
    ]);
    expect(root).toMatchRenderedOutput('1 (light)');

    // Update that doesn't change state, so it bails out
    setCounter(1);
    expect(root).toFlushAndYield(['Parent: 1 (light)']);
    expect(root).toMatchRenderedOutput('1 (light)');

    // Update that doesn't change state, but the context changes, too, so it
    // can't bail out
    setCounter(1);
    setTheme('dark');
    expect(root).toFlushAndYield([
      'Theme: dark',
      'Parent: 1 (dark)',
      'Child: 1 (dark)',
      'Effect: 1 (dark)',
    ]);
    expect(root).toMatchRenderedOutput('1 (dark)');
  });

  it('can bail out without calling render phase (as an optimization) if queue is known to be empty', () => {
    const {useState, useLayoutEffect} = React;

    function Child({text}) {
      ReactTestRenderer.unstable_yield('Child: ' + text);
      return text;
    }

    let setCounter;
    function Parent() {
      const [counter, _setCounter] = useState(0);
      setCounter = _setCounter;
      ReactTestRenderer.unstable_yield('Parent: ' + counter);
      useLayoutEffect(() => {
        ReactTestRenderer.unstable_yield('Effect: ' + counter);
      });
      return <Child text={counter} />;
    }

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(<Parent />);
    expect(root).toFlushAndYield(['Parent: 0', 'Child: 0', 'Effect: 0']);
    expect(root).toMatchRenderedOutput('0');

    // Normal update
    setCounter(1);
    expect(root).toFlushAndYield(['Parent: 1', 'Child: 1', 'Effect: 1']);
    expect(root).toMatchRenderedOutput('1');

    // Update to the same state. React doesn't know if the queue is empty
    // because the alterate fiber has pending update priority, so we have to
    // enter the render phase before we can bail out. But we bail out before
    // rendering the child, and we don't fire any effects.
    setCounter(1);
    expect(root).toFlushAndYield(['Parent: 1']);
    expect(root).toMatchRenderedOutput('1');

    // Update to the same state again. This times, neither fiber has pending
    // update priority, so we can bail out before even entering the render phase.
    setCounter(1);
    expect(root).toFlushAndYield([]);
    expect(root).toMatchRenderedOutput('1');

    // This changes the state to something different so it renders normally.
    setCounter(2);
    expect(root).toFlushAndYield(['Parent: 2', 'Child: 2', 'Effect: 2']);
    expect(root).toMatchRenderedOutput('2');
  });

  it('bails out multiple times in a row without entering render phase', () => {
    const {useState} = React;

    function Child({text}) {
      ReactTestRenderer.unstable_yield('Child: ' + text);
      return text;
    }

    let setCounter;
    function Parent() {
      const [counter, _setCounter] = useState(0);
      setCounter = _setCounter;
      ReactTestRenderer.unstable_yield('Parent: ' + counter);
      return <Child text={counter} />;
    }

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(<Parent />);
    expect(root).toFlushAndYield(['Parent: 0', 'Child: 0']);
    expect(root).toMatchRenderedOutput('0');

    const update = value => {
      setCounter(previous => {
        ReactTestRenderer.unstable_yield(
          `Compute state (${previous} -> ${value})`,
        );
        return value;
      });
    };
    update(0);
    update(0);
    update(0);
    update(1);
    update(2);
    update(3);

    expect(ReactTestRenderer).toHaveYielded([
      // The first four updates were eagerly computed, because the queue is
      // empty before each one.
      'Compute state (0 -> 0)',
      'Compute state (0 -> 0)',
      'Compute state (0 -> 0)',
      // The fourth update doesn't bail out
      'Compute state (0 -> 1)',
      // so subsequent updates can't be eagerly computed.
    ]);

    // Now let's enter the render phase
    expect(root).toFlushAndYield([
      // We don't need to re-compute the first four updates. Only the final two.
      'Compute state (1 -> 2)',
      'Compute state (2 -> 3)',
      'Parent: 3',
      'Child: 3',
    ]);
    expect(root).toMatchRenderedOutput('3');
  });

  it('can rebase on top of a previously skipped update', () => {
    const {useState} = React;

    function Child({text}) {
      ReactTestRenderer.unstable_yield('Child: ' + text);
      return text;
    }

    let setCounter;
    function Parent() {
      const [counter, _setCounter] = useState(1);
      setCounter = _setCounter;
      ReactTestRenderer.unstable_yield('Parent: ' + counter);
      return <Child text={counter} />;
    }

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(<Parent />);
    expect(root).toFlushAndYield(['Parent: 1', 'Child: 1']);
    expect(root).toMatchRenderedOutput('1');

    const update = compute => {
      setCounter(previous => {
        const value = compute(previous);
        ReactTestRenderer.unstable_yield(
          `Compute state (${previous} -> ${value})`,
        );
        return value;
      });
    };

    // Update at normal priority
    update(n => n * 100);

    // The new state is eagerly computed.
    expect(ReactTestRenderer).toHaveYielded(['Compute state (1 -> 100)']);

    // but before it's flushed, a higher priority update interrupts it.
    root.unstable_flushSync(() => {
      update(n => n + 5);
    });
    expect(ReactTestRenderer).toHaveYielded([
      // The eagerly computed state was completely skipped
      'Compute state (1 -> 6)',
      'Parent: 6',
      'Child: 6',
    ]);
    expect(root).toMatchRenderedOutput('6');

    // Now when we finish the first update, the second update is rebased on top.
    // Notice we didn't have to recompute the first update even though it was
    // skipped in the previous render.
    expect(root).toFlushAndYield([
      'Compute state (100 -> 105)',
      'Parent: 105',
      'Child: 105',
    ]);
    expect(root).toMatchRenderedOutput('105');
  });

  it('warns about variable number of dependencies', () => {
    const {useLayoutEffect} = React;
    function App(props) {
      useLayoutEffect(() => {
        ReactTestRenderer.unstable_yield(
          'Did commit: ' + props.dependencies.join(', '),
        );
      }, props.dependencies);
      return props.dependencies;
    }
    const root = ReactTestRenderer.create(<App dependencies={['A']} />);
    expect(ReactTestRenderer).toHaveYielded(['Did commit: A']);
    expect(() => {
      root.update(<App dependencies={['A', 'B']} />);
    }).toWarnDev([
      'Warning: The final argument passed to useLayoutEffect changed size ' +
        'between renders. The order and size of this array must remain ' +
        'constant.\n\n' +
        'Previous: [A, B]\n' +
        'Incoming: [A]\n',
    ]);
  });

  it('warns if switching from dependencies to no dependencies', () => {
    const {useMemo} = React;
    function App({text, hasDeps}) {
      const resolvedText = useMemo(() => {
        ReactTestRenderer.unstable_yield('Compute');
        return text.toUpperCase();
      }, hasDeps ? null : [text]);
      return resolvedText;
    }

    const root = ReactTestRenderer.create(null);
    root.update(<App text="Hello" hasDeps={true} />);
    expect(ReactTestRenderer).toHaveYielded(['Compute']);
    expect(root).toMatchRenderedOutput('HELLO');

    expect(() => {
      root.update(<App text="Hello" hasDeps={false} />);
    }).toWarnDev([
      'Warning: useMemo received a final argument during this render, but ' +
        'not during the previous render. Even though the final argument is ' +
        'optional, its type cannot change between renders.',
    ]);
  });

  it('warns for bad useEffect return values', () => {
    const {useLayoutEffect} = React;
    function App(props) {
      useLayoutEffect(() => {
        return props.return;
      });
      return null;
    }
    let root;

    expect(() => {
      root = ReactTestRenderer.create(<App return={17} />);
    }).toWarnDev([
      'Warning: useEffect function must return a cleanup function or ' +
        'nothing.\n' +
        '    in App (at **)',
    ]);

    expect(() => {
      root.update(<App return={Promise.resolve()} />);
    }).toWarnDev([
      'Warning: useEffect function must return a cleanup function or nothing.\n\n' +
        'It looks like you wrote useEffect(async () => ...) or returned a Promise.',
    ]);
  });

  it('warns for bad useImperativeHandle first arg', () => {
    const {useImperativeHandle} = React;
    function App() {
      useImperativeHandle({
        focus() {},
      });
      return null;
    }

    expect(() => {
      expect(() => {
        ReactTestRenderer.create(<App />);
      }).toThrow('create is not a function');
    }).toWarnDev([
      'Expected useImperativeHandle() first argument to either be a ' +
        'ref callback or React.createRef() object. ' +
        'Instead received: an object with keys {focus}.',
      'Expected useImperativeHandle() second argument to be a function ' +
        'that creates a handle. Instead received: undefined.',
    ]);
  });

  it('warns for bad useImperativeHandle second arg', () => {
    const {useImperativeHandle} = React;
    const App = React.forwardRef((props, ref) => {
      useImperativeHandle(ref, {
        focus() {},
      });
      return null;
    });

    expect(() => {
      ReactTestRenderer.create(<App />);
    }).toWarnDev([
      'Expected useImperativeHandle() second argument to be a function ' +
        'that creates a handle. Instead received: object.',
    ]);
  });

  // https://github.com/facebook/react/issues/14022
  it('works with ReactDOMServer calls inside a component', () => {
    const {useState} = React;
    function App(props) {
      const markup1 = ReactDOMServer.renderToString(<p>hello</p>);
      const markup2 = ReactDOMServer.renderToStaticMarkup(<p>bye</p>);
      const [counter] = useState(0);
      return markup1 + counter + markup2;
    }
    const root = ReactTestRenderer.create(<App />);
    expect(root.toJSON()).toMatchSnapshot();
  });

  it("throws when calling hooks inside .memo's compare function", () => {
    const {useState} = React;
    function App() {
      useState(0);
      return null;
    }
    const MemoApp = React.memo(App, () => {
      useState(0);
      return false;
    });

    const root = ReactTestRenderer.create(<MemoApp />);
    // trying to render again should trigger comparison and throw
    expect(() => root.update(<MemoApp />)).toThrow(
      'Hooks can only be called inside the body of a function component',
    );
    // the next round, it does a fresh mount, so should render
    expect(() => root.update(<MemoApp />)).not.toThrow(
      'Hooks can only be called inside the body of a function component',
    );
    // and then again, fail
    expect(() => root.update(<MemoApp />)).toThrow(
      'Hooks can only be called inside the body of a function component',
    );
  });

  it('warns when calling hooks inside useMemo', () => {
    const {useMemo, useState} = React;
    function App() {
      useMemo(() => {
        useState(0);
      });
      return null;
    }
    expect(() => ReactTestRenderer.create(<App />)).toWarnDev(
      'Hooks can only be called inside the body of a function component',
    );
  });

  it('warns when reading context inside useMemo', () => {
    const {useMemo, createContext} = React;
    const ReactCurrentDispatcher =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .ReactCurrentDispatcher;

    const ThemeContext = createContext('light');
    function App() {
      return useMemo(() => {
        return ReactCurrentDispatcher.current.readContext(ThemeContext);
      }, []);
    }

    expect(() => ReactTestRenderer.create(<App />)).toWarnDev(
      'Context can only be read while React is rendering',
    );
  });

  it('warns when reading context inside useMemo after reading outside it', () => {
    const {useMemo, createContext} = React;
    const ReactCurrentDispatcher =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .ReactCurrentDispatcher;

    const ThemeContext = createContext('light');
    let firstRead, secondRead;
    function App() {
      firstRead = ReactCurrentDispatcher.current.readContext(ThemeContext);
      useMemo(() => {});
      secondRead = ReactCurrentDispatcher.current.readContext(ThemeContext);
      return useMemo(() => {
        return ReactCurrentDispatcher.current.readContext(ThemeContext);
      }, []);
    }

    expect(() => ReactTestRenderer.create(<App />)).toWarnDev(
      'Context can only be read while React is rendering',
    );
    expect(firstRead).toBe('light');
    expect(secondRead).toBe('light');
  });

  // Throws because there's no runtime cost for being strict here.
  it('throws when reading context inside useEffect', () => {
    const {useEffect, createContext} = React;
    const ReactCurrentDispatcher =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .ReactCurrentDispatcher;

    const ThemeContext = createContext('light');
    function App() {
      useEffect(() => {
        ReactCurrentDispatcher.current.readContext(ThemeContext);
      });
      return null;
    }

    const root = ReactTestRenderer.create(<App />);
    expect(() => root.update(<App />)).toThrow(
      // The exact message doesn't matter, just make sure we don't allow this
      'Context can only be read while React is rendering',
    );
  });

  // Throws because there's no runtime cost for being strict here.
  it('throws when reading context inside useLayoutEffect', () => {
    const {useLayoutEffect, createContext} = React;
    const ReactCurrentDispatcher =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .ReactCurrentDispatcher;

    const ThemeContext = createContext('light');
    function App() {
      useLayoutEffect(() => {
        ReactCurrentDispatcher.current.readContext(ThemeContext);
      });
      return null;
    }

    expect(() => ReactTestRenderer.create(<App />)).toThrow(
      // The exact message doesn't matter, just make sure we don't allow this
      'Context can only be read while React is rendering',
    );
  });

  it('warns when reading context inside useReducer', () => {
    const {useReducer, createContext} = React;
    const ReactCurrentDispatcher =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .ReactCurrentDispatcher;

    const ThemeContext = createContext('light');
    function App() {
      const [state, dispatch] = useReducer((s, action) => {
        ReactCurrentDispatcher.current.readContext(ThemeContext);
        return action;
      }, 0);
      if (state === 0) {
        dispatch(1);
      }
      return null;
    }

    expect(() => ReactTestRenderer.create(<App />)).toWarnDev([
      'Context can only be read while React is rendering',
    ]);
  });

  // Edge case.
  it('warns when reading context inside eager useReducer', () => {
    const {useState, createContext} = React;
    const ThemeContext = createContext('light');

    const ReactCurrentDispatcher =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .ReactCurrentDispatcher;

    let _setState;
    function Fn() {
      const [, setState] = useState(0);
      _setState = setState;
      return null;
    }

    class Cls extends React.Component {
      render() {
        _setState(() => {
          ReactCurrentDispatcher.current.readContext(ThemeContext);
        });
        return null;
      }
    }

    expect(() =>
      ReactTestRenderer.create(
        <React.Fragment>
          <Fn />
          <Cls />
        </React.Fragment>,
      ),
    ).toWarnDev('Context can only be read while React is rendering');
  });

  it('warns when calling hooks inside useReducer', () => {
    const {useReducer, useState, useRef} = React;

    spyOnDev(console, 'error');

    function App() {
      const [value, dispatch] = useReducer((state, action) => {
        useRef(0);
        return state + 1;
      }, 0);
      if (value === 0) {
        dispatch('foo');
      }
      useState();
      return value;
    }
    expect(() => {
      ReactTestRenderer.create(<App />);
    }).toThrow('Rendered more hooks than during the previous render.');

    if (__DEV__) {
      expect(console.error).toHaveBeenCalledTimes(3);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Hooks can only be called inside the body of a function component',
      );
    }
  });

  it("throws when calling hooks inside useState's initialize function", () => {
    const {useState, useRef} = React;
    function App() {
      useState(() => {
        useRef(0);
        return 0;
      });
      return null;
    }
    expect(() => ReactTestRenderer.create(<App />)).toWarnDev(
      'Hooks can only be called inside the body of a function component',
    );
  });

  it('resets warning internal state when interrupted by an error', () => {
    const ReactCurrentDispatcher =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .ReactCurrentDispatcher;

    const ThemeContext = React.createContext('light');
    function App() {
      React.useMemo(() => {
        // Trigger warnings
        ReactCurrentDispatcher.current.readContext(ThemeContext);
        React.useRef();
        // Interrupt exit from a Hook
        throw new Error('No.');
      }, []);
    }

    class Boundary extends React.Component {
      state = {};
      static getDerivedStateFromError(error) {
        return {err: true};
      }
      render() {
        if (this.state.err) {
          return 'Oops';
        }
        return this.props.children;
      }
    }

    expect(() => {
      ReactTestRenderer.create(
        <Boundary>
          <App />
        </Boundary>,
      );
    }).toWarnDev([
      // We see it twice due to replay
      'Context can only be read while React is rendering',
      'Hooks can only be called inside the body of a function component',
      'Context can only be read while React is rendering',
      'Hooks can only be called inside the body of a function component',
    ]);

    function Valid() {
      React.useState();
      React.useMemo(() => {});
      React.useReducer(() => {});
      React.useEffect(() => {});
      React.useLayoutEffect(() => {});
      React.useCallback(() => {});
      React.useRef();
      React.useImperativeHandle(() => {}, () => {});
      if (__DEV__) {
        React.useDebugValue();
      }
      return null;
    }
    // Verify it doesn't think we're still inside a Hook.
    // Should have no warnings.
    ReactTestRenderer.create(<Valid />);

    // Verify warnings don't get permanently disabled.
    expect(() => {
      ReactTestRenderer.create(
        <Boundary>
          <App />
        </Boundary>,
      );
    }).toWarnDev([
      // We see it twice due to replay
      'Context can only be read while React is rendering',
      'Hooks can only be called inside the body of a function component',
      'Context can only be read while React is rendering',
      'Hooks can only be called inside the body of a function component',
    ]);
  });

  it('warns when reading context inside useMemo', () => {
    const {useMemo, createContext} = React;
    const ReactCurrentDispatcher =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .ReactCurrentDispatcher;

    const ThemeContext = createContext('light');
    function App() {
      return useMemo(() => {
        return ReactCurrentDispatcher.current.readContext(ThemeContext);
      }, []);
    }

    expect(() => ReactTestRenderer.create(<App />)).toWarnDev(
      'Context can only be read while React is rendering',
    );
  });
  it('double-invokes components with Hooks in Strict Mode', () => {
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = true;

    const {useState, StrictMode} = React;
    let renderCount = 0;

    function NoHooks() {
      renderCount++;
      return <div />;
    }

    function HasHooks() {
      useState(0);
      renderCount++;
      return <div />;
    }

    const FwdRef = React.forwardRef((props, ref) => {
      renderCount++;
      return <div />;
    });

    const FwdRefHasHooks = React.forwardRef((props, ref) => {
      useState(0);
      renderCount++;
      return <div />;
    });

    const Memo = React.memo(props => {
      renderCount++;
      return <div />;
    });

    const MemoHasHooks = React.memo(props => {
      useState(0);
      renderCount++;
      return <div />;
    });

    function Factory() {
      return {
        state: {},
        render() {
          renderCount++;
          return <div />;
        },
      };
    }

    let renderer = ReactTestRenderer.create(null);

    renderCount = 0;
    renderer.update(<NoHooks />);
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(<NoHooks />);
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(
      <StrictMode>
        <NoHooks />
      </StrictMode>,
    );
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(
      <StrictMode>
        <NoHooks />
      </StrictMode>,
    );
    expect(renderCount).toBe(1);

    renderCount = 0;
    renderer.update(<FwdRef />);
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(<FwdRef />);
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(
      <StrictMode>
        <FwdRef />
      </StrictMode>,
    );
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(
      <StrictMode>
        <FwdRef />
      </StrictMode>,
    );
    expect(renderCount).toBe(1);

    renderCount = 0;
    renderer.update(<Memo arg={1} />);
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(<Memo arg={2} />);
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(
      <StrictMode>
        <Memo arg={1} />
      </StrictMode>,
    );
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(
      <StrictMode>
        <Memo arg={2} />
      </StrictMode>,
    );
    expect(renderCount).toBe(1);

    renderCount = 0;
    renderer.update(<Factory />);
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(<Factory />);
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(
      <StrictMode>
        <Factory />
      </StrictMode>,
    );
    expect(renderCount).toBe(__DEV__ ? 2 : 1); // Treated like a class
    renderCount = 0;
    renderer.update(
      <StrictMode>
        <Factory />
      </StrictMode>,
    );
    expect(renderCount).toBe(__DEV__ ? 2 : 1); // Treated like a class

    renderCount = 0;
    renderer.update(<HasHooks />);
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(<HasHooks />);
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(
      <StrictMode>
        <HasHooks />
      </StrictMode>,
    );
    expect(renderCount).toBe(__DEV__ ? 2 : 1); // Has Hooks
    renderCount = 0;
    renderer.update(
      <StrictMode>
        <HasHooks />
      </StrictMode>,
    );
    expect(renderCount).toBe(__DEV__ ? 2 : 1); // Has Hooks

    renderCount = 0;
    renderer.update(<FwdRefHasHooks />);
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(<FwdRefHasHooks />);
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(
      <StrictMode>
        <FwdRefHasHooks />
      </StrictMode>,
    );
    expect(renderCount).toBe(__DEV__ ? 2 : 1); // Has Hooks
    renderCount = 0;
    renderer.update(
      <StrictMode>
        <FwdRefHasHooks />
      </StrictMode>,
    );
    expect(renderCount).toBe(__DEV__ ? 2 : 1); // Has Hooks

    renderCount = 0;
    renderer.update(<MemoHasHooks arg={1} />);
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(<MemoHasHooks arg={2} />);
    expect(renderCount).toBe(1);
    renderCount = 0;
    renderer.update(
      <StrictMode>
        <MemoHasHooks arg={1} />
      </StrictMode>,
    );
    expect(renderCount).toBe(__DEV__ ? 2 : 1); // Has Hooks
    renderCount = 0;
    renderer.update(
      <StrictMode>
        <MemoHasHooks arg={2} />
      </StrictMode>,
    );
    expect(renderCount).toBe(__DEV__ ? 2 : 1); // Has Hooks
  });

  it('double-invokes useMemo in DEV StrictMode despite []', () => {
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = true;
    const {useMemo, StrictMode} = React;

    let useMemoCount = 0;
    function BadUseMemo() {
      useMemo(() => {
        useMemoCount++;
      }, []);
      return <div />;
    }

    useMemoCount = 0;
    ReactTestRenderer.create(
      <StrictMode>
        <BadUseMemo />
      </StrictMode>,
    );
    expect(useMemoCount).toBe(__DEV__ ? 2 : 1); // Has Hooks
  });

  it('warns on using differently ordered hooks on subsequent renders', () => {
    const {useState, useReducer, useRef} = React;
    function useCustomHook() {
      return useState(0);
    }
    function App(props) {
      /* eslint-disable no-unused-vars */
      if (props.flip) {
        useCustomHook(0);
        useReducer((s, a) => a, 0);
      } else {
        useReducer((s, a) => a, 0);
        useCustomHook(0);
      }
      // This should not appear in the warning message because it occurs after
      // the first mismatch
      const ref = useRef(null);
      return null;
      /* eslint-enable no-unused-vars */
    }
    let root = ReactTestRenderer.create(<App flip={false} />);
    expect(() => {
      root.update(<App flip={true} />);
    }).toWarnDev([
      'Warning: React has detected a change in the order of Hooks called by App. ' +
        'This will lead to bugs and errors if not fixed. For more information, ' +
        'read the Rules of Hooks: https://fb.me/rules-of-hooks\n\n' +
        '   Previous render    Next render\n' +
        '   -------------------------------\n' +
        '1. useReducer         useState\n' +
        '   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n\n' +
        '    in App (at **)',
    ]);

    // further warnings for this component are silenced
    root.update(<App flip={false} />);
  });

  it('detects a bad hook order even if the component throws', () => {
    const {useState, useReducer} = React;
    function useCustomHook() {
      useState(0);
    }
    function App(props) {
      /* eslint-disable no-unused-vars */
      if (props.flip) {
        useCustomHook();
        useReducer((s, a) => a, 0);
        throw new Error('custom error');
      } else {
        useReducer((s, a) => a, 0);
        useCustomHook();
      }
      return null;
      /* eslint-enable no-unused-vars */
    }
    let root = ReactTestRenderer.create(<App flip={false} />);
    expect(() => {
      expect(() => root.update(<App flip={true} />)).toThrow('custom error');
    }).toWarnDev([
      'Warning: React has detected a change in the order of Hooks called by App. ' +
        'This will lead to bugs and errors if not fixed. For more information, ' +
        'read the Rules of Hooks: https://fb.me/rules-of-hooks\n\n' +
        '   Previous render    Next render\n' +
        '   -------------------------------\n' +
        '1. useReducer         useState\n' +
        '   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^',
    ]);
  });

  // Regression test for #14674
  it('does not swallow original error when updating another component in render phase', () => {
    let {useState} = React;

    let _setState;
    function A() {
      const [, setState] = useState(0);
      _setState = setState;
      return null;
    }

    function B() {
      _setState(() => {
        throw new Error('Hello');
      });
      return null;
    }

    expect(() =>
      ReactTestRenderer.create(
        <React.Fragment>
          <A />
          <B />
        </React.Fragment>,
      ),
    ).toThrow('Hello');
  });
});
