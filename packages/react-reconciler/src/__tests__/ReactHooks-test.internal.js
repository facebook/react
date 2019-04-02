/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
let Scheduler;
let ReactDOMServer;
let act;

// Additional tests can be found in ReactHooksWithNoopRenderer. Plan is to
// gradually migrate those to this file.
describe('ReactHooks', () => {
  beforeEach(() => {
    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    Scheduler = require('scheduler');
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
        'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen' +
          ' for one of the following reasons:\n' +
          '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
          '2. You might be breaking the Rules of Hooks\n' +
          '3. You might have more than one copy of React in the same app\n' +
          'See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.',
      );
    });
  }

  it('bails out in the render phase if all of the state is the same', () => {
    const {useState, useLayoutEffect} = React;

    function Child({text}) {
      Scheduler.yieldValue('Child: ' + text);
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
      Scheduler.yieldValue(`Parent: ${text}`);
      useLayoutEffect(() => {
        Scheduler.yieldValue(`Effect: ${text}`);
      });
      return <Child text={text} />;
    }

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(<Parent />);
    expect(Scheduler).toFlushAndYield([
      'Parent: 0, 0',
      'Child: 0, 0',
      'Effect: 0, 0',
    ]);
    expect(root).toMatchRenderedOutput('0, 0');

    // Normal update
    act(() => {
      setCounter1(1);
      setCounter2(1);
    });

    expect(Scheduler).toFlushAndYield([
      'Parent: 1, 1',
      'Child: 1, 1',
      'Effect: 1, 1',
    ]);

    // Update that bails out.
    act(() => setCounter1(1));
    expect(Scheduler).toFlushAndYield(['Parent: 1, 1']);

    // This time, one of the state updates but the other one doesn't. So we
    // can't bail out.
    act(() => {
      setCounter1(1);
      setCounter2(2);
    });

    expect(Scheduler).toFlushAndYield([
      'Parent: 1, 2',
      'Child: 1, 2',
      'Effect: 1, 2',
    ]);

    // Lots of updates that eventually resolve to the current values.
    act(() => {
      setCounter1(9);
      setCounter2(3);
      setCounter1(4);
      setCounter2(7);
      setCounter1(1);
      setCounter2(2);
    });

    // Because the final values are the same as the current values, the
    // component bails out.
    expect(Scheduler).toFlushAndYield(['Parent: 1, 2']);

    // prepare to check SameValue
    act(() => {
      setCounter1(0 / -1);
      setCounter2(NaN);
    });
    expect(Scheduler).toFlushAndYield([
      'Parent: 0, NaN',
      'Child: 0, NaN',
      'Effect: 0, NaN',
    ]);

    // check if re-setting to negative 0 / NaN still bails out
    act(() => {
      setCounter1(0 / -1);
      setCounter2(NaN);
      setCounter2(Infinity);
      setCounter2(NaN);
    });

    expect(Scheduler).toFlushAndYield(['Parent: 0, NaN']);

    // check if changing negative 0 to positive 0 does not bail out
    act(() => {
      setCounter1(0);
    });
    expect(Scheduler).toFlushAndYield([
      'Parent: 0, NaN',
      'Child: 0, NaN',
      'Effect: 0, NaN',
    ]);
  });

  it('bails out in render phase if all the state is the same and props bail out with memo', () => {
    const {useState, memo} = React;

    function Child({text}) {
      Scheduler.yieldValue('Child: ' + text);
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
      Scheduler.yieldValue(`Parent: ${text}`);
      return <Child text={text} />;
    }

    Parent = memo(Parent);

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(<Parent theme="light" />);
    expect(Scheduler).toFlushAndYield([
      'Parent: 0, 0 (light)',
      'Child: 0, 0 (light)',
    ]);
    expect(root).toMatchRenderedOutput('0, 0 (light)');

    // Normal update
    act(() => {
      setCounter1(1);
      setCounter2(1);
    });

    expect(Scheduler).toFlushAndYield([
      'Parent: 1, 1 (light)',
      'Child: 1, 1 (light)',
    ]);

    // Update that bails out.
    act(() => setCounter1(1));
    expect(Scheduler).toFlushAndYield(['Parent: 1, 1 (light)']);

    // This time, one of the state updates but the other one doesn't. So we
    // can't bail out.
    act(() => {
      setCounter1(1);
      setCounter2(2);
    });

    expect(Scheduler).toFlushAndYield([
      'Parent: 1, 2 (light)',
      'Child: 1, 2 (light)',
    ]);

    // Updates bail out, but component still renders because props
    // have changed
    act(() => {
      setCounter1(1);
      setCounter2(2);
    });

    root.update(<Parent theme="dark" />);
    expect(Scheduler).toFlushAndYield([
      'Parent: 1, 2 (dark)',
      'Child: 1, 2 (dark)',
    ]);

    // Both props and state bail out
    act(() => {
      setCounter1(1);
      setCounter2(2);
    });

    root.update(<Parent theme="dark" />);
    expect(Scheduler).toFlushAndYield(['Parent: 1, 2 (dark)']);
  });

  it('warns about setState second argument', () => {
    const {useState} = React;

    let setCounter;
    function Counter() {
      const [counter, _setCounter] = useState(0);
      setCounter = _setCounter;

      Scheduler.yieldValue(`Count: ${counter}`);
      return counter;
    }

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(<Counter />);
    expect(Scheduler).toFlushAndYield(['Count: 0']);
    expect(root).toMatchRenderedOutput('0');

    expect(() => {
      act(() =>
        setCounter(1, () => {
          throw new Error('Expected to ignore the callback.');
        }),
      );
    }).toWarnDev(
      'State updates from the useState() and useReducer() Hooks ' +
        "don't support the second callback argument. " +
        'To execute a side effect after rendering, ' +
        'declare it in the component body with useEffect().',
      {withoutStack: true},
    );
    expect(Scheduler).toFlushAndYield(['Count: 1']);
    expect(root).toMatchRenderedOutput('1');
  });

  it('warns about dispatch second argument', () => {
    const {useReducer} = React;

    let dispatch;
    function Counter() {
      const [counter, _dispatch] = useReducer((s, a) => a, 0);
      dispatch = _dispatch;

      Scheduler.yieldValue(`Count: ${counter}`);
      return counter;
    }

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(<Counter />);
    expect(Scheduler).toFlushAndYield(['Count: 0']);
    expect(root).toMatchRenderedOutput('0');

    expect(() => {
      act(() =>
        dispatch(1, () => {
          throw new Error('Expected to ignore the callback.');
        }),
      );
    }).toWarnDev(
      'State updates from the useState() and useReducer() Hooks ' +
        "don't support the second callback argument. " +
        'To execute a side effect after rendering, ' +
        'declare it in the component body with useEffect().',
      {withoutStack: true},
    );
    expect(Scheduler).toFlushAndYield(['Count: 1']);
    expect(root).toMatchRenderedOutput('1');
  });

  it('never bails out if context has changed', () => {
    const {useState, useLayoutEffect, useContext} = React;

    const ThemeContext = React.createContext('light');

    let setTheme;
    function ThemeProvider({children}) {
      const [theme, _setTheme] = useState('light');
      Scheduler.yieldValue('Theme: ' + theme);
      setTheme = _setTheme;
      return (
        <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
      );
    }

    function Child({text}) {
      Scheduler.yieldValue('Child: ' + text);
      return text;
    }

    let setCounter;
    function Parent() {
      const [counter, _setCounter] = useState(0);
      setCounter = _setCounter;

      const theme = useContext(ThemeContext);

      const text = `${counter} (${theme})`;
      Scheduler.yieldValue(`Parent: ${text}`);
      useLayoutEffect(() => {
        Scheduler.yieldValue(`Effect: ${text}`);
      });
      return <Child text={text} />;
    }

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(
      <ThemeProvider>
        <Parent />
      </ThemeProvider>,
    );
    expect(Scheduler).toFlushAndYield([
      'Theme: light',
      'Parent: 0 (light)',
      'Child: 0 (light)',
      'Effect: 0 (light)',
    ]);
    expect(root).toMatchRenderedOutput('0 (light)');

    // Updating the theme to the same value doesn't cause the consumers
    // to re-render.
    setTheme('light');
    expect(Scheduler).toFlushAndYield([]);
    expect(root).toMatchRenderedOutput('0 (light)');

    // Normal update
    act(() => setCounter(1));
    expect(Scheduler).toFlushAndYield([
      'Parent: 1 (light)',
      'Child: 1 (light)',
      'Effect: 1 (light)',
    ]);
    expect(root).toMatchRenderedOutput('1 (light)');

    // Update that doesn't change state, so it bails out
    act(() => setCounter(1));
    expect(Scheduler).toFlushAndYield(['Parent: 1 (light)']);
    expect(root).toMatchRenderedOutput('1 (light)');

    // Update that doesn't change state, but the context changes, too, so it
    // can't bail out
    act(() => {
      setCounter(1);
      setTheme('dark');
    });

    expect(Scheduler).toFlushAndYield([
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
      Scheduler.yieldValue('Child: ' + text);
      return text;
    }

    let setCounter;
    function Parent() {
      const [counter, _setCounter] = useState(0);
      setCounter = _setCounter;
      Scheduler.yieldValue('Parent: ' + counter);
      useLayoutEffect(() => {
        Scheduler.yieldValue('Effect: ' + counter);
      });
      return <Child text={counter} />;
    }

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(<Parent />);
    expect(Scheduler).toFlushAndYield(['Parent: 0', 'Child: 0', 'Effect: 0']);
    expect(root).toMatchRenderedOutput('0');

    // Normal update
    act(() => setCounter(1));
    expect(Scheduler).toFlushAndYield(['Parent: 1', 'Child: 1', 'Effect: 1']);
    expect(root).toMatchRenderedOutput('1');

    // Update to the same state. React doesn't know if the queue is empty
    // because the alterate fiber has pending update priority, so we have to
    // enter the render phase before we can bail out. But we bail out before
    // rendering the child, and we don't fire any effects.
    act(() => setCounter(1));
    expect(Scheduler).toFlushAndYield(['Parent: 1']);
    expect(root).toMatchRenderedOutput('1');

    // Update to the same state again. This times, neither fiber has pending
    // update priority, so we can bail out before even entering the render phase.
    act(() => setCounter(1));
    expect(Scheduler).toFlushAndYield([]);
    expect(root).toMatchRenderedOutput('1');

    // This changes the state to something different so it renders normally.
    act(() => setCounter(2));
    expect(Scheduler).toFlushAndYield(['Parent: 2', 'Child: 2', 'Effect: 2']);
    expect(root).toMatchRenderedOutput('2');

    // prepare to check SameValue
    act(() => {
      setCounter(0);
    });
    expect(Scheduler).toFlushAndYield(['Parent: 0', 'Child: 0', 'Effect: 0']);
    expect(root).toMatchRenderedOutput('0');

    // Update to the same state for the first time to flush the queue
    act(() => {
      setCounter(0);
    });

    expect(Scheduler).toFlushAndYield(['Parent: 0']);
    expect(root).toMatchRenderedOutput('0');

    // Update again to the same state. Should bail out.
    act(() => {
      setCounter(0);
    });
    expect(Scheduler).toFlushAndYield([]);
    expect(root).toMatchRenderedOutput('0');

    // Update to a different state (positive 0 to negative 0)
    act(() => {
      setCounter(0 / -1);
    });
    expect(Scheduler).toFlushAndYield(['Parent: 0', 'Child: 0', 'Effect: 0']);
    expect(root).toMatchRenderedOutput('0');
  });

  it('bails out multiple times in a row without entering render phase', () => {
    const {useState} = React;

    function Child({text}) {
      Scheduler.yieldValue('Child: ' + text);
      return text;
    }

    let setCounter;
    function Parent() {
      const [counter, _setCounter] = useState(0);
      setCounter = _setCounter;
      Scheduler.yieldValue('Parent: ' + counter);
      return <Child text={counter} />;
    }

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(<Parent />);
    expect(Scheduler).toFlushAndYield(['Parent: 0', 'Child: 0']);
    expect(root).toMatchRenderedOutput('0');

    const update = value => {
      setCounter(previous => {
        Scheduler.yieldValue(`Compute state (${previous} -> ${value})`);
        return value;
      });
    };
    act(() => {
      update(0);
      update(0);
      update(0);
      update(1);
      update(2);
      update(3);
    });

    expect(Scheduler).toHaveYielded([
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
    expect(Scheduler).toFlushAndYield([
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
      Scheduler.yieldValue('Child: ' + text);
      return text;
    }

    let setCounter;
    function Parent() {
      const [counter, _setCounter] = useState(1);
      setCounter = _setCounter;
      Scheduler.yieldValue('Parent: ' + counter);
      return <Child text={counter} />;
    }

    const root = ReactTestRenderer.create(null, {unstable_isConcurrent: true});
    root.update(<Parent />);
    expect(Scheduler).toFlushAndYield(['Parent: 1', 'Child: 1']);
    expect(root).toMatchRenderedOutput('1');

    const update = compute => {
      setCounter(previous => {
        const value = compute(previous);
        Scheduler.yieldValue(`Compute state (${previous} -> ${value})`);
        return value;
      });
    };

    // Update at normal priority
    act(() => update(n => n * 100));

    // The new state is eagerly computed.
    expect(Scheduler).toHaveYielded(['Compute state (1 -> 100)']);

    // but before it's flushed, a higher priority update interrupts it.
    root.unstable_flushSync(() => {
      update(n => n + 5);
    });
    expect(Scheduler).toHaveYielded([
      // The eagerly computed state was completely skipped
      'Compute state (1 -> 6)',
      'Parent: 6',
      'Child: 6',
    ]);
    expect(root).toMatchRenderedOutput('6');

    // Now when we finish the first update, the second update is rebased on top.
    // Notice we didn't have to recompute the first update even though it was
    // skipped in the previous render.
    expect(Scheduler).toFlushAndYield([
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
        Scheduler.yieldValue('Did commit: ' + props.dependencies.join(', '));
      }, props.dependencies);
      return props.dependencies;
    }
    const root = ReactTestRenderer.create(<App dependencies={['A']} />);
    expect(Scheduler).toHaveYielded(['Did commit: A']);
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
        Scheduler.yieldValue('Compute');
        return text.toUpperCase();
      }, hasDeps ? null : [text]);
      return resolvedText;
    }

    const root = ReactTestRenderer.create(null);
    root.update(<App text="Hello" hasDeps={true} />);
    expect(Scheduler).toHaveYielded(['Compute']);
    expect(root).toMatchRenderedOutput('HELLO');

    expect(() => {
      root.update(<App text="Hello" hasDeps={false} />);
    }).toWarnDev([
      'Warning: useMemo received a final argument during this render, but ' +
        'not during the previous render. Even though the final argument is ' +
        'optional, its type cannot change between renders.',
    ]);
  });

  it('warns if deps is not an array', () => {
    const {useEffect, useLayoutEffect, useMemo, useCallback} = React;

    function App(props) {
      useEffect(() => {}, props.deps);
      useLayoutEffect(() => {}, props.deps);
      useMemo(() => {}, props.deps);
      useCallback(() => {}, props.deps);
      return null;
    }

    expect(() => {
      ReactTestRenderer.create(<App deps={'hello'} />);
    }).toWarnDev([
      'Warning: useEffect received a final argument that is not an array (instead, received `string`). ' +
        'When specified, the final argument must be an array.',
      'Warning: useLayoutEffect received a final argument that is not an array (instead, received `string`). ' +
        'When specified, the final argument must be an array.',
      'Warning: useMemo received a final argument that is not an array (instead, received `string`). ' +
        'When specified, the final argument must be an array.',
      'Warning: useCallback received a final argument that is not an array (instead, received `string`). ' +
        'When specified, the final argument must be an array.',
    ]);
    expect(() => {
      ReactTestRenderer.create(<App deps={100500} />);
    }).toWarnDev([
      'Warning: useEffect received a final argument that is not an array (instead, received `number`). ' +
        'When specified, the final argument must be an array.',
      'Warning: useLayoutEffect received a final argument that is not an array (instead, received `number`). ' +
        'When specified, the final argument must be an array.',
      'Warning: useMemo received a final argument that is not an array (instead, received `number`). ' +
        'When specified, the final argument must be an array.',
      'Warning: useCallback received a final argument that is not an array (instead, received `number`). ' +
        'When specified, the final argument must be an array.',
    ]);
    expect(() => {
      ReactTestRenderer.create(<App deps={{}} />);
    }).toWarnDev([
      'Warning: useEffect received a final argument that is not an array (instead, received `object`). ' +
        'When specified, the final argument must be an array.',
      'Warning: useLayoutEffect received a final argument that is not an array (instead, received `object`). ' +
        'When specified, the final argument must be an array.',
      'Warning: useMemo received a final argument that is not an array (instead, received `object`). ' +
        'When specified, the final argument must be an array.',
      'Warning: useCallback received a final argument that is not an array (instead, received `object`). ' +
        'When specified, the final argument must be an array.',
    ]);
    ReactTestRenderer.create(<App deps={[]} />);
    ReactTestRenderer.create(<App deps={null} />);
    ReactTestRenderer.create(<App deps={undefined} />);
  });

  it('warns if deps is not an array for useImperativeHandle', () => {
    const {useImperativeHandle} = React;

    const App = React.forwardRef((props, ref) => {
      useImperativeHandle(ref, () => {}, props.deps);
      return null;
    });

    expect(() => {
      ReactTestRenderer.create(<App deps={'hello'} />);
    }).toWarnDev([
      'Warning: useImperativeHandle received a final argument that is not an array (instead, received `string`). ' +
        'When specified, the final argument must be an array.',
    ]);
    ReactTestRenderer.create(<App deps={[]} />);
    ReactTestRenderer.create(<App deps={null} />);
    ReactTestRenderer.create(<App deps={undefined} />);
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
      'Warning: An effect function must not return anything besides a ' +
        'function, which is used for clean-up. You returned: 17',
    ]);

    const root2 = ReactTestRenderer.create(null);
    expect(() => root2.update(<App return={null} />)).toWarnDev([
      'Warning: An effect function must not return anything besides a ' +
        'function, which is used for clean-up. You returned null. If your ' +
        'effect does not require clean up, return undefined (or nothing).',
    ]);

    const root3 = ReactTestRenderer.create(null);
    expect(() => root3.update(<App return={Promise.resolve()} />)).toWarnDev([
      'Warning: An effect function must not return anything besides a ' +
        'function, which is used for clean-up.\n\n' +
        'It looks like you wrote useEffect(async () => ...) or returned a Promise.',
    ]);

    // Error on unmount because React assumes the value is a function
    expect(() => {
      root3.update(null);
    }).toThrow('is not a function');
  });

  it('does not forget render phase useState updates inside an effect', () => {
    const {useState, useEffect} = React;

    function Counter() {
      const [counter, setCounter] = useState(0);
      if (counter === 0) {
        setCounter(x => x + 1);
        setCounter(x => x + 1);
      }
      useEffect(() => {
        setCounter(x => x + 1);
        setCounter(x => x + 1);
      }, []);
      return counter;
    }

    const root = ReactTestRenderer.create(null);
    ReactTestRenderer.act(() => {
      root.update(<Counter />);
    });
    expect(root).toMatchRenderedOutput('4');
  });

  it('does not forget render phase useReducer updates inside an effect with hoisted reducer', () => {
    const {useReducer, useEffect} = React;

    const reducer = x => x + 1;
    function Counter() {
      const [counter, increment] = useReducer(reducer, 0);
      if (counter === 0) {
        increment();
        increment();
      }
      useEffect(() => {
        increment();
        increment();
      }, []);
      return counter;
    }

    const root = ReactTestRenderer.create(null);
    ReactTestRenderer.act(() => {
      root.update(<Counter />);
    });
    expect(root).toMatchRenderedOutput('4');
  });

  it('does not forget render phase useReducer updates inside an effect with inline reducer', () => {
    const {useReducer, useEffect} = React;

    function Counter() {
      const [counter, increment] = useReducer(x => x + 1, 0);
      if (counter === 0) {
        increment();
        increment();
      }
      useEffect(() => {
        increment();
        increment();
      }, []);
      return counter;
    }

    const root = ReactTestRenderer.create(null);
    ReactTestRenderer.act(() => {
      root.update(<Counter />);
    });
    expect(root).toMatchRenderedOutput('4');
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
      'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
        ' one of the following reasons:\n' +
        '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
        '2. You might be breaking the Rules of Hooks\n' +
        '3. You might have more than one copy of React in the same app\n' +
        'See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.',
    );
    // the next round, it does a fresh mount, so should render
    expect(() => root.update(<MemoApp />)).not.toThrow(
      'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
        ' one of the following reasons:\n' +
        '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
        '2. You might be breaking the Rules of Hooks\n' +
        '3. You might have more than one copy of React in the same app\n' +
        'See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.',
    );
    // and then again, fail
    expect(() => root.update(<MemoApp />)).toThrow(
      'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
        ' one of the following reasons:\n' +
        '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
        '2. You might be breaking the Rules of Hooks\n' +
        '3. You might have more than one copy of React in the same app\n' +
        'See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.',
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
        _setState(() =>
          ReactCurrentDispatcher.current.readContext(ThemeContext),
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
    ).toWarnDev(['Context can only be read while React is rendering']);
  });

  it('warns when calling hooks inside useReducer', () => {
    const {useReducer, useState, useRef} = React;

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
      expect(() => {
        ReactTestRenderer.create(<App />);
      }).toThrow('Rendered more hooks than during the previous render.');
    }).toWarnDev([
      'Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks',
      'Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks',
      'Warning: React has detected a change in the order of Hooks called by App. ' +
        'This will lead to bugs and errors if not fixed. For more information, ' +
        'read the Rules of Hooks: https://fb.me/rules-of-hooks\n\n' +
        '   Previous render            Next render\n' +
        '   ------------------------------------------------------\n' +
        '1. useReducer                 useReducer\n' +
        '2. useState                   useRef\n' +
        '   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n\n',
    ]);
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
    expect(() => renderer.update(<Factory />)).toWarnDev(
      'Warning: The <Factory /> component appears to be a function component that returns a class instance. ' +
        'Change Factory to a class that extends React.Component instead. ' +
        "If you can't use a class try assigning the prototype on the function as a workaround. " +
        '`Factory.prototype = React.Component.prototype`. ' +
        "Don't use an arrow function since it cannot be called with `new` by React.",
      {withoutStack: true},
    );
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

  describe('hook ordering', () => {
    const useCallbackHelper = () => React.useCallback(() => {}, []);
    const useContextHelper = () => React.useContext(React.createContext());
    const useDebugValueHelper = () => React.useDebugValue('abc');
    const useEffectHelper = () => React.useEffect(() => () => {}, []);
    const useImperativeHandleHelper = () => {
      React.useImperativeHandle({current: null}, () => ({}), []);
    };
    const useLayoutEffectHelper = () =>
      React.useLayoutEffect(() => () => {}, []);
    const useMemoHelper = () => React.useMemo(() => 123, []);
    const useReducerHelper = () => React.useReducer((s, a) => a, 0);
    const useRefHelper = () => React.useRef(null);
    const useStateHelper = () => React.useState(0);

    // We don't include useImperativeHandleHelper in this set,
    // because it generates an additional warning about the inputs length changing.
    // We test it below with its own test.
    let orderedHooks = [
      useCallbackHelper,
      useContextHelper,
      useDebugValueHelper,
      useEffectHelper,
      useLayoutEffectHelper,
      useMemoHelper,
      useReducerHelper,
      useRefHelper,
      useStateHelper,
    ];

    const formatHookNamesToMatchErrorMessage = (hookNameA, hookNameB) => {
      return `use${hookNameA}${' '.repeat(24 - hookNameA.length)}${
        hookNameB ? `use${hookNameB}` : undefined
      }`;
    };

    orderedHooks.forEach((firstHelper, index) => {
      const secondHelper =
        index > 0
          ? orderedHooks[index - 1]
          : orderedHooks[orderedHooks.length - 1];

      const hookNameA = firstHelper.name
        .replace('use', '')
        .replace('Helper', '');
      const hookNameB = secondHelper.name
        .replace('use', '')
        .replace('Helper', '');

      it(`warns on using differently ordered hooks (${hookNameA}, ${hookNameB}) on subsequent renders`, () => {
        function App(props) {
          /* eslint-disable no-unused-vars */
          if (props.update) {
            secondHelper();
            firstHelper();
          } else {
            firstHelper();
            secondHelper();
          }
          // This should not appear in the warning message because it occurs after the first mismatch
          useRefHelper();
          return null;
          /* eslint-enable no-unused-vars */
        }
        let root = ReactTestRenderer.create(<App update={false} />);
        expect(() => {
          try {
            root.update(<App update={true} />);
          } catch (error) {
            // Swapping certain types of hooks will cause runtime errors.
            // This is okay as far as this test is concerned.
            // We just want to verify that warnings are always logged.
          }
        }).toWarnDev([
          'Warning: React has detected a change in the order of Hooks called by App. ' +
            'This will lead to bugs and errors if not fixed. For more information, ' +
            'read the Rules of Hooks: https://fb.me/rules-of-hooks\n\n' +
            '   Previous render            Next render\n' +
            '   ------------------------------------------------------\n' +
            `1. ${formatHookNamesToMatchErrorMessage(hookNameA, hookNameB)}\n` +
            '   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n\n' +
            '    in App (at **)',
        ]);

        // further warnings for this component are silenced
        try {
          root.update(<App update={false} />);
        } catch (error) {
          // Swapping certain types of hooks will cause runtime errors.
          // This is okay as far as this test is concerned.
          // We just want to verify that warnings are always logged.
        }
      });

      it(`warns when more hooks (${(hookNameA,
      hookNameB)}) are used during update than mount`, () => {
        function App(props) {
          /* eslint-disable no-unused-vars */
          if (props.update) {
            firstHelper();
            secondHelper();
          } else {
            firstHelper();
          }
          return null;
          /* eslint-enable no-unused-vars */
        }
        let root = ReactTestRenderer.create(<App update={false} />);
        expect(() => {
          try {
            root.update(<App update={true} />);
          } catch (error) {
            // Swapping certain types of hooks will cause runtime errors.
            // This is okay as far as this test is concerned.
            // We just want to verify that warnings are always logged.
          }
        }).toWarnDev([
          'Warning: React has detected a change in the order of Hooks called by App. ' +
            'This will lead to bugs and errors if not fixed. For more information, ' +
            'read the Rules of Hooks: https://fb.me/rules-of-hooks\n\n' +
            '   Previous render            Next render\n' +
            '   ------------------------------------------------------\n' +
            `1. ${formatHookNamesToMatchErrorMessage(hookNameA, hookNameA)}\n` +
            `2. undefined                  use${hookNameB}\n` +
            '   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n\n' +
            '    in App (at **)',
        ]);
      });
    });

    // We don't include useContext or useDebugValue in this set,
    // because they aren't added to the hooks list and so won't throw.
    let hooksInList = [
      useCallbackHelper,
      useEffectHelper,
      useImperativeHandleHelper,
      useLayoutEffectHelper,
      useMemoHelper,
      useReducerHelper,
      useRefHelper,
      useStateHelper,
    ];

    hooksInList.forEach((firstHelper, index) => {
      const secondHelper =
        index > 0
          ? hooksInList[index - 1]
          : hooksInList[hooksInList.length - 1];

      const hookNameA = firstHelper.name
        .replace('use', '')
        .replace('Helper', '');
      const hookNameB = secondHelper.name
        .replace('use', '')
        .replace('Helper', '');

      it(`warns when fewer hooks (${(hookNameA,
      hookNameB)}) are used during update than mount`, () => {
        function App(props) {
          /* eslint-disable no-unused-vars */
          if (props.update) {
            firstHelper();
          } else {
            firstHelper();
            secondHelper();
          }
          return null;
          /* eslint-enable no-unused-vars */
        }
        let root = ReactTestRenderer.create(<App update={false} />);
        expect(() => {
          root.update(<App update={true} />);
        }).toThrow('Rendered fewer hooks than expected.');
      });
    });

    it(
      'warns on using differently ordered hooks ' +
        '(useImperativeHandleHelper, useMemoHelper) on subsequent renders',
      () => {
        function App(props) {
          /* eslint-disable no-unused-vars */
          if (props.update) {
            useMemoHelper();
            useImperativeHandleHelper();
          } else {
            useImperativeHandleHelper();
            useMemoHelper();
          }
          // This should not appear in the warning message because it occurs after the first mismatch
          useRefHelper();
          return null;
          /* eslint-enable no-unused-vars */
        }
        let root = ReactTestRenderer.create(<App update={false} />);
        expect(() => {
          try {
            root.update(<App update={true} />);
          } catch (error) {
            // Swapping certain types of hooks will cause runtime errors.
            // This is okay as far as this test is concerned.
            // We just want to verify that warnings are always logged.
          }
        }).toWarnDev([
          'Warning: React has detected a change in the order of Hooks called by App. ' +
            'This will lead to bugs and errors if not fixed. For more information, ' +
            'read the Rules of Hooks: https://fb.me/rules-of-hooks\n\n' +
            '   Previous render            Next render\n' +
            '   ------------------------------------------------------\n' +
            `1. ${formatHookNamesToMatchErrorMessage(
              'ImperativeHandle',
              'Memo',
            )}\n` +
            '   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n\n' +
            '    in App (at **)',
        ]);

        // further warnings for this component are silenced
        root.update(<App update={false} />);
      },
    );

    it('detects a bad hook order even if the component throws', () => {
      const {useState, useReducer} = React;
      function useCustomHook() {
        useState(0);
      }
      function App(props) {
        /* eslint-disable no-unused-vars */
        if (props.update) {
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
      let root = ReactTestRenderer.create(<App update={false} />);
      expect(() => {
        expect(() => root.update(<App update={true} />)).toThrow(
          'custom error',
        );
      }).toWarnDev([
        'Warning: React has detected a change in the order of Hooks called by App. ' +
          'This will lead to bugs and errors if not fixed. For more information, ' +
          'read the Rules of Hooks: https://fb.me/rules-of-hooks\n\n' +
          '   Previous render            Next render\n' +
          '   ------------------------------------------------------\n' +
          '1. useReducer                 useState\n' +
          '   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n\n',
      ]);
    });
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

  // Regression test for https://github.com/facebook/react/issues/14790
  it('does not fire a false positive warning when suspending memo', async () => {
    const {Suspense, useState} = React;

    let wasSuspended = false;
    function trySuspend() {
      if (!wasSuspended) {
        throw new Promise(resolve => {
          wasSuspended = true;
          resolve();
        });
      }
    }

    function Child() {
      useState();
      trySuspend();
      return 'hello';
    }

    const Wrapper = React.memo(Child);
    const root = ReactTestRenderer.create(
      <Suspense fallback="loading">
        <Wrapper />
      </Suspense>,
    );
    expect(root).toMatchRenderedOutput('loading');
    await Promise.resolve();
    Scheduler.flushAll();
    expect(root).toMatchRenderedOutput('hello');
  });

  // Regression test for https://github.com/facebook/react/issues/14790
  it('does not fire a false positive warning when suspending forwardRef', async () => {
    const {Suspense, useState} = React;

    let wasSuspended = false;
    function trySuspend() {
      if (!wasSuspended) {
        throw new Promise(resolve => {
          wasSuspended = true;
          resolve();
        });
      }
    }

    function render(props, ref) {
      useState();
      trySuspend();
      return 'hello';
    }

    const Wrapper = React.forwardRef(render);
    const root = ReactTestRenderer.create(
      <Suspense fallback="loading">
        <Wrapper />
      </Suspense>,
    );
    expect(root).toMatchRenderedOutput('loading');
    await Promise.resolve();
    Scheduler.flushAll();
    expect(root).toMatchRenderedOutput('hello');
  });

  // Regression test for https://github.com/facebook/react/issues/14790
  it('does not fire a false positive warning when suspending memo(forwardRef)', async () => {
    const {Suspense, useState} = React;

    let wasSuspended = false;
    function trySuspend() {
      if (!wasSuspended) {
        throw new Promise(resolve => {
          wasSuspended = true;
          resolve();
        });
      }
    }

    function render(props, ref) {
      useState();
      trySuspend();
      return 'hello';
    }

    const Wrapper = React.memo(React.forwardRef(render));
    const root = ReactTestRenderer.create(
      <Suspense fallback="loading">
        <Wrapper />
      </Suspense>,
    );
    expect(root).toMatchRenderedOutput('loading');
    await Promise.resolve();
    Scheduler.flushAll();
    expect(root).toMatchRenderedOutput('hello');
  });
});
