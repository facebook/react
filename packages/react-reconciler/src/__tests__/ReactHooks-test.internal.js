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
    ReactFeatureFlags.enableHooks = true;
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
      'Warning: Detected a variable number of hook dependencies. The length ' +
        'of the dependencies array should be constant between renders.\n\n' +
        'Previous: A, B\n' +
        'Incoming: A',
    ]);
    expect(ReactTestRenderer).toHaveYielded(['Did commit: A, B']);
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
});
