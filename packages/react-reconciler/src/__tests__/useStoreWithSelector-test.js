/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let useStoreWithSelector;
let React;
let ReactNoop;
let Scheduler;
let act;
let createStore;
let startTransition;
let waitFor;
let assertLog;
let assertConsoleErrorDev;

describe('useStoreWithSelector', () => {
  beforeEach(() => {
    jest.resetModules();

    ({
      act,
      assertConsoleErrorDev,
      // assertConsoleWarnDev,
    } = require('internal-test-utils'));

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    createStore = React.createStore;
    useStoreWithSelector = React.useStoreWithSelector;
    startTransition = React.startTransition;
    const InternalTestUtils = require('internal-test-utils');
    waitFor = InternalTestUtils.waitFor;
    assertLog = InternalTestUtils.assertLog;
  });

  it('useStoreWithSelector', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment' | 'decrement'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        case 'decrement':
          return count - 1;
        default:
          return count;
      }
    }
    const store = createStore(counterReducer, 2);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function App() {
      const value = useStoreWithSelector(store, identity);
      Scheduler.log({kind: 'render', value});
      return <>{value}</>;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
      await waitFor([
        {kind: 'selector', state: 2},
        {kind: 'render', value: 2},
      ]);
    });
    expect(root).toMatchRenderedOutput('2');

    await act(async () => {
      startTransition(() => {
        store.dispatch({type: 'increment'});
      });
    });
    assertLog([
      {kind: 'reducer', state: 2, action: 'increment'},
      {kind: 'selector', state: 3},
      {kind: 'render', value: 3},
    ]);
    expect(root).toMatchRenderedOutput('3');

    await act(async () => {
      startTransition(() => {
        store.dispatch({type: 'increment'});
      });
    });
    assertLog([
      {kind: 'reducer', state: 3, action: 'increment'},
      {kind: 'selector', state: 4},
      {kind: 'render', value: 4},
    ]);
    expect(root).toMatchRenderedOutput('4');
  });
  it('sync update interrupts transition update', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment' | 'decrement'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        case 'double':
          return count * 2;
        default:
          return count;
      }
    }
    const store = createStore(counterReducer, 2);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function App() {
      const value = useStoreWithSelector(store, identity);
      Scheduler.log({kind: 'render', value});
      return <>{value}</>;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
      await waitFor([
        {kind: 'selector', state: 2},
        {kind: 'render', value: 2},
      ]);
    });
    expect(root).toMatchRenderedOutput('2');

    let resolve;

    await act(async () => {
      await startTransition(async () => {
        store.dispatch({type: 'increment'});
        await new Promise(r => (resolve = r));
      });
    });

    assertLog([
      {kind: 'reducer', state: 2, action: 'increment'},
      {kind: 'selector', state: 3},
    ]);
    expect(root).toMatchRenderedOutput('2');

    await act(async () => {
      store.dispatch({type: 'double'});
    });

    assertLog([
      {kind: 'reducer', state: 3, action: 'double'},
      {kind: 'reducer', state: 2, action: 'double'},
      {kind: 'selector', state: 4},
      {kind: 'selector', state: 6},
      {kind: 'render', value: 4},
    ]);
    expect(root).toMatchRenderedOutput('4');

    await act(async () => {
      resolve();
    });

    assertLog([{kind: 'render', value: 6}]);
    expect(root).toMatchRenderedOutput('6');
  });
  it('store reader mounts mid transition', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment' | 'decrement'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        case 'double':
          return count * 2;
        default:
          return count;
      }
    }
    const store = createStore(counterReducer, 2);
    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function StoreReader({componentName}) {
      const value = useStoreWithSelector(store, identity);
      Scheduler.log({kind: 'render', value, componentName});
      return <>{value}</>;
    }

    let setShowReader;

    function App() {
      const [showReader, _setShowReader] = React.useState(false);
      setShowReader = _setShowReader;
      return (
        <>
          <StoreReader componentName="stable" />
          {showReader ? <StoreReader componentName="conditional" /> : null}
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
      await waitFor([
        {kind: 'selector', state: 2},
        {kind: 'render', value: 2, componentName: 'stable'},
      ]);
    });

    expect(root).toMatchRenderedOutput('2');

    let resolve;

    await act(async () => {
      await startTransition(async () => {
        store.dispatch({type: 'increment'});
        await new Promise(r => (resolve = r));
      });
    });

    assertLog([
      {kind: 'reducer', state: 2, action: 'increment'},
      {kind: 'selector', state: 3},
    ]);
    expect(root).toMatchRenderedOutput('2');

    await act(async () => {
      setShowReader(true);
    });

    assertLog([
      {kind: 'render', componentName: 'stable', value: 2},
      {kind: 'selector', state: 2},
      {kind: 'selector', state: 3},
      {kind: 'render', componentName: 'conditional', value: 2},
    ]);

    // TODO: Avoid triggering this error.
    assertConsoleErrorDev([
      'Cannot update a component (`StoreReader`) while rendering a different component (`StoreReader`). ' +
        'To locate the bad setState() call inside `StoreReader`, ' +
        'follow the stack trace as described in https://react.dev/link/setstate-in-render\n' +
        '    in App (at **)',
    ]);
    expect(root).toMatchRenderedOutput('22');

    await act(async () => {
      resolve();
    });

    assertLog([
      {kind: 'render', componentName: 'stable', value: 3},
      {kind: 'render', componentName: 'conditional', value: 3},
    ]);
    expect(root).toMatchRenderedOutput('33');
  });

  it('store reader mounts as a result of store update in transition', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment' | 'decrement'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        case 'double':
          return count * 2;
        default:
          return count;
      }
    }
    const store = createStore(counterReducer, 2);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function StoreReader({componentName}) {
      const value = useStoreWithSelector(store, identity);
      Scheduler.log({kind: 'render', value, componentName});
      return <>{value}</>;
    }

    function App() {
      const value = useStoreWithSelector(store, identity);
      Scheduler.log({kind: 'render', value, componentName: 'App'});
      return (
        <>
          {value}
          {value > 2 ? <StoreReader componentName="conditional" /> : null}
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
      await waitFor([
        {kind: 'selector', state: 2},
        {kind: 'render', value: 2, componentName: 'App'},
      ]);
    });

    expect(root).toMatchRenderedOutput('2');

    let resolve;

    await act(async () => {
      await startTransition(async () => {
        store.dispatch({type: 'increment'});
        await new Promise(r => (resolve = r));
      });
    });

    assertLog([
      {kind: 'reducer', state: 2, action: 'increment'},
      {kind: 'selector', state: 3},
    ]);
    expect(root).toMatchRenderedOutput('2');

    await act(async () => {
      resolve();
    });

    assertLog([
      {kind: 'render', componentName: 'App', value: 3},
      {kind: 'selector', state: 3},
      {kind: 'render', componentName: 'conditional', value: 3},
    ]);
    expect(root).toMatchRenderedOutput('33');
  });
  it('After transition update commits, new mounters mount with up-to-date state', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment' | 'decrement'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        case 'double':
          return count * 2;
        default:
          return count;
      }
    }
    const store = createStore(counterReducer, 2);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function StoreReader({componentName}) {
      const value = useStoreWithSelector(store, identity);
      Scheduler.log({kind: 'render', value, componentName});
      return <>{value}</>;
    }

    let setShowReader;

    function App() {
      const [showReader, _setShowReader] = React.useState(false);
      setShowReader = _setShowReader;
      return (
        <>
          <StoreReader componentName="stable" />
          {showReader ? <StoreReader componentName="conditional" /> : null}
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
      await waitFor([
        {kind: 'selector', state: 2},
        {kind: 'render', value: 2, componentName: 'stable'},
      ]);
    });

    expect(root).toMatchRenderedOutput('2');

    await act(async () => {
      startTransition(() => {
        store.dispatch({type: 'increment'});
      });
      assertLog([
        {kind: 'reducer', state: 2, action: 'increment'},
        {kind: 'selector', state: 3},
      ]);
      await waitFor([{kind: 'render', value: 3, componentName: 'stable'}]);
    });

    expect(root).toMatchRenderedOutput('3');

    await act(async () => {
      setShowReader(true);
    });

    assertLog([
      {kind: 'render', value: 3, componentName: 'stable'},
      {kind: 'selector', state: 3},
      {kind: 'render', componentName: 'conditional', value: 3},
    ]);
    expect(root).toMatchRenderedOutput('33');
  });
  it('Component does not rerender if selected value is unchanged', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment' | 'decrement'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        case 'double':
          return count * 2;
        default:
          return count;
      }
    }
    const store = createStore(counterReducer, 2);

    function isEven(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x % 2 === 0;
    }

    function App() {
      const value = useStoreWithSelector(store, isEven);
      Scheduler.log({kind: 'render', value, componentName: 'App'});
      return <>{value ? 'true' : 'false'}</>;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
      await waitFor([
        {kind: 'selector', state: 2},
        {kind: 'render', value: true, componentName: 'App'},
      ]);
    });

    expect(root).toMatchRenderedOutput('true');

    await act(async () => {
      store.dispatch({type: 'double'});
    });

    assertLog([
      {kind: 'reducer', state: 2, action: 'double'},
      {kind: 'selector', state: 4},
      // No rerender since selected value did not change
    ]);

    expect(root).toMatchRenderedOutput('true');
  });
});
