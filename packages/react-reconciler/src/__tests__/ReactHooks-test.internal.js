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
    act = ReactTestRenderer.act;
  });

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
    act(() => {
      setCounter1(1);
      setCounter2(1);
    });

    expect(root).toFlushAndYield([
      'Parent: 1, 1',
      'Child: 1, 1',
      'Effect: 1, 1',
    ]);

    // Update that bails out.
    act(() => setCounter1(1));
    expect(root).toFlushAndYield(['Parent: 1, 1']);

    // This time, one of the state updates but the other one doesn't. So we
    // can't bail out.
    act(() => {
      setCounter1(1);
      setCounter2(2);
    });

    expect(root).toFlushAndYield([
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
    expect(root).toFlushAndYield(['Parent: 1, 2']);

    // prepare to check SameValue
    act(() => {
      setCounter1(0 / -1);
      setCounter2(NaN);
    });
    expect(root).toFlushAndYield([
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

    expect(root).toFlushAndYield(['Parent: 0, NaN']);

    // check if changing negative 0 to positive 0 does not bail out
    act(() => {
      setCounter1(0);
    });
    expect(root).toFlushAndYield([
      'Parent: 0, NaN',
      'Child: 0, NaN',
      'Effect: 0, NaN',
    ]);
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
    act(() => {
      setCounter1(1);
      setCounter2(1);
    });

    expect(root).toFlushAndYield([
      'Parent: 1, 1 (light)',
      'Child: 1, 1 (light)',
    ]);

    // Update that bails out.
    act(() => setCounter1(1));
    expect(root).toFlushAndYield(['Parent: 1, 1 (light)']);

    // This time, one of the state updates but the other one doesn't. So we
    // can't bail out.
    act(() => {
      setCounter1(1);
      setCounter2(2);
    });

    expect(root).toFlushAndYield([
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
    expect(root).toFlushAndYield(['Parent: 1, 2 (dark)', 'Child: 1, 2 (dark)']);

    // Both props and state bail out
    act(() => {
      setCounter1(1);
      setCounter2(2);
    });

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
    act(() => setCounter(1));
    expect(root).toFlushAndYield([
      'Parent: 1 (light)',
      'Child: 1 (light)',
      'Effect: 1 (light)',
    ]);
    expect(root).toMatchRenderedOutput('1 (light)');

    // Update that doesn't change state, so it bails out
    act(() => setCounter(1));
    expect(root).toFlushAndYield(['Parent: 1 (light)']);
    expect(root).toMatchRenderedOutput('1 (light)');

    // Update that doesn't change state, but the context changes, too, so it
    // can't bail out
    act(() => {
      setCounter(1);
      setTheme('dark');
    });

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
    act(() => setCounter(1));
    expect(root).toFlushAndYield(['Parent: 1', 'Child: 1', 'Effect: 1']);
    expect(root).toMatchRenderedOutput('1');

    // Update to the same state. React doesn't know if the queue is empty
    // because the alterate fiber has pending update priority, so we have to
    // enter the render phase before we can bail out. But we bail out before
    // rendering the child, and we don't fire any effects.
    act(() => setCounter(1));
    expect(root).toFlushAndYield(['Parent: 1']);
    expect(root).toMatchRenderedOutput('1');

    // Update to the same state again. This times, neither fiber has pending
    // update priority, so we can bail out before even entering the render phase.
    act(() => setCounter(1));
    expect(root).toFlushAndYield([]);
    expect(root).toMatchRenderedOutput('1');

    // This changes the state to something different so it renders normally.
    act(() => setCounter(2));
    expect(root).toFlushAndYield(['Parent: 2', 'Child: 2', 'Effect: 2']);
    expect(root).toMatchRenderedOutput('2');

    // prepare to check SameValue
    act(() => {
      setCounter(0);
    });
    expect(root).toFlushAndYield(['Parent: 0', 'Child: 0', 'Effect: 0']);
    expect(root).toMatchRenderedOutput('0');

    // Update to the same state for the first time to flush the queue
    act(() => {
      setCounter(0);
    });

    expect(root).toFlushAndYield(['Parent: 0']);
    expect(root).toMatchRenderedOutput('0');

    // Update again to the same state. Should bail out.
    act(() => {
      setCounter(0);
    });
    expect(root).toFlushAndYield([]);
    expect(root).toMatchRenderedOutput('0');

    // Update to a different state (positive 0 to negative 0)
    act(() => {
      setCounter(0 / -1);
    });
    expect(root).toFlushAndYield(['Parent: 0', 'Child: 0', 'Effect: 0']);
    expect(root).toMatchRenderedOutput('0');
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
    act(() => {
      update(0);
      update(0);
      update(0);
      update(1);
      update(2);
      update(3);
    });

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
    act(() => update(n => n * 100));

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
});
