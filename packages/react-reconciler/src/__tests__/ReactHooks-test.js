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
let ReactTestRenderer;
let ReactDOMServer;
let act;

// Additional tests can be found in ReactHooksWithNoopRenderer. Plan is to
// gradually migrate those to this file.
describe('ReactHooks', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    ReactDOMServer = require('react-dom/server');
    act = ReactTestRenderer.act;
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

  it('assumes useEffect clean-up function is either a function or undefined', () => {
    const {useLayoutEffect} = React;

    function App(props) {
      useLayoutEffect(() => {
        return props.return;
      });
      return null;
    }

    const root1 = ReactTestRenderer.create(null);
    expect(() => root1.update(<App return={17} />)).toWarnDev([
      'Warning: An Effect function must not return anything besides a ' +
        'function, which is used for clean-up. You returned: 17',
    ]);

    const root2 = ReactTestRenderer.create(null);
    expect(() => root2.update(<App return={null} />)).toWarnDev([
      'Warning: An Effect function must not return anything besides a ' +
        'function, which is used for clean-up. You returned null. If your ' +
        'effect does not require clean up, return undefined (or nothing).',
    ]);

    const root3 = ReactTestRenderer.create(null);
    expect(() => root3.update(<App return={Promise.resolve()} />)).toWarnDev([
      'Warning: An Effect function must not return anything besides a ' +
        'function, which is used for clean-up.\n\n' +
        'It looks like you wrote useEffect(async () => ...) or returned a Promise.',
    ]);

    // Error on unmount because React assumes the value is a function
    expect(() => {
      root3.update(null);
    }).toThrow('is not a function');
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
      }).toThrow('is not a function');
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
      'Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks.',
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
        act(() =>
          _setState(() => {
            ReactCurrentDispatcher.current.readContext(ThemeContext);
          }),
        );
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
    ).toWarnDev(
      [
        'Context can only be read while React is rendering',
        'Render methods should be a pure function of props and state',
      ],
      {withoutStack: 1},
    );
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
        'Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks',
      );
    }
  });

  it("warns when calling hooks inside useState's initialize function", () => {
    const {useState, useRef} = React;
    function App() {
      useState(() => {
        useRef(0);
        return 0;
      });
      return null;
    }
    expect(() => ReactTestRenderer.create(<App />)).toWarnDev(
      'Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks.',
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
      'Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks',
      'Context can only be read while React is rendering',
      'Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks',
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
      'Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks',
      'Context can only be read while React is rendering',
      'Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks',
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
      act(() =>
        _setState(() => {
          throw new Error('Hello');
        }),
      );
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
