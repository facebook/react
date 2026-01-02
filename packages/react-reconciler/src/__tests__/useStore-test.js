/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @gate enableStore
 */

'use strict';

let useStore;
let React;
let ReactNoop;
let Scheduler;
let act;
let createStore;
let startTransition;
let waitFor;
let assertLog;
let useLayoutEffect;
let useEffect;
let use;
let Suspense;

describe('useStore', () => {
  beforeEach(() => {
    jest.resetModules();

    act = require('internal-test-utils').act;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    createStore = React.createStore;
    useStore = React.useStore;
    useLayoutEffect = React.useLayoutEffect;
    useEffect = React.useEffect;
    use = React.use;
    Suspense = React.Suspense;
    startTransition = React.startTransition;
    const InternalTestUtils = require('internal-test-utils');
    waitFor = InternalTestUtils.waitFor;
    assertLog = InternalTestUtils.assertLog;
  });

  it('simplest use', async () => {
    const store = createStore(2);

    function App() {
      const value = useStore(store);
      Scheduler.log({kind: 'render', value});
      return <>{value}</>;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
      await waitFor([{kind: 'render', value: 2}]);
    });
    expect(root).toMatchRenderedOutput('2');

    await act(async () => {
      startTransition(() => {
        store.dispatch(3);
      });
    });
    assertLog([{kind: 'render', value: 3}]);
    expect(root).toMatchRenderedOutput('3');

    await act(async () => {
      startTransition(() => {
        store.dispatch(4);
      });
    });
    assertLog([{kind: 'render', value: 4}]);
    expect(root).toMatchRenderedOutput('4');
  });

  it('simplest use (updater function)', async () => {
    const store = createStore(2);

    function App() {
      const value = useStore(store);
      Scheduler.log({kind: 'render', value});
      return <>{value}</>;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
      await waitFor([{kind: 'render', value: 2}]);
    });
    expect(root).toMatchRenderedOutput('2');

    await act(async () => {
      startTransition(() => {
        store.dispatch(n => n + 1);
      });
    });
    assertLog([{kind: 'render', value: 3}]);
    expect(root).toMatchRenderedOutput('3');

    await act(async () => {
      startTransition(() => {
        store.dispatch(n => n + 1);
      });
    });
    assertLog([{kind: 'render', value: 4}]);
    expect(root).toMatchRenderedOutput('4');
  });
  it('useStore', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }
    const store = createStore(2, counterReducer);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function App() {
      const value = useStore(store, identity);
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

  it('useStore (no selector)', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }
    const store = createStore(2, counterReducer);

    function App() {
      const value = useStore(store);
      Scheduler.log({kind: 'render', value});
      return <>{value}</>;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
      await waitFor([{kind: 'render', value: 2}]);
    });
    expect(root).toMatchRenderedOutput('2');

    await act(async () => {
      startTransition(() => {
        store.dispatch({type: 'increment'});
      });
    });
    assertLog([
      {kind: 'reducer', state: 2, action: 'increment'},
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
      {kind: 'render', value: 4},
    ]);
    expect(root).toMatchRenderedOutput('4');
  });
  it('sync update interrupts transition update', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment' | 'double'},
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
    const store = createStore(2, counterReducer);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function App() {
      const value = useStore(store, identity);
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
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }
    const store = createStore(2, counterReducer);
    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function StoreReader({componentName}) {
      const value = useStore(store, identity);
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
      {kind: 'render', componentName: 'conditional', value: 2},
      {kind: 'selector', state: 3},
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
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }
    const store = createStore(2, counterReducer);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function StoreReader({componentName}) {
      const value = useStore(store, identity);
      Scheduler.log({kind: 'render', value, componentName});
      return <>{value}</>;
    }

    function App() {
      const value = useStore(store, identity);
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
      action: {type: 'increment' | 'double'},
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
    const store = createStore(2, counterReducer);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function StoreReader({componentName}) {
      const value = useStore(store, identity);
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
      store.dispatch({type: 'double'});
    });
    assertLog([
      {kind: 'reducer', state: 3, action: 'double'},
      {kind: 'reducer', state: 2, action: 'double'},
      {kind: 'selector', state: 4},
      {kind: 'selector', state: 6},
      {kind: 'render', value: 4, componentName: 'stable'},
    ]);

    expect(root).toMatchRenderedOutput('4');

    await act(async () => {
      setShowReader(true);
    });

    assertLog([
      {kind: 'render', value: 4, componentName: 'stable'},
      {kind: 'selector', state: 4},
      {kind: 'render', componentName: 'conditional', value: 4},
      {kind: 'selector', state: 6},
    ]);

    expect(root).toMatchRenderedOutput('44');

    await act(async () => {
      resolve();
    });

    assertLog([
      {kind: 'render', value: 6, componentName: 'stable'},
      {kind: 'render', componentName: 'conditional', value: 6},
    ]);
  });
  it('After mid-transition sync update commits, new mounters mount with up-to-date sync state (but not transition state)', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }
    const store = createStore(2, counterReducer);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function StoreReader({componentName}) {
      const value = useStore(store, identity);
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
    function counterReducer(count: number, action: {type: 'double'}): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'double':
          return count * 2;
        default:
          return count;
      }
    }
    const store = createStore(2, counterReducer);

    function isEven(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x % 2 === 0;
    }

    function App() {
      const value = useStore(store, isEven);
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

  it('selector changes sync mid transition while store is updating', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }
    const store = createStore(2, counterReducer);

    function identity(x) {
      Scheduler.log({kind: 'selector:identity', state: x});
      return x;
    }

    function doubled(x) {
      Scheduler.log({kind: 'selector:doubled', state: x});
      return x * 2;
    }

    let setSelector;

    function App() {
      const [selector, _setSelector] = React.useState(() => identity);
      setSelector = _setSelector;
      const value = useStore(store, selector);
      Scheduler.log({kind: 'render', value});
      return <>{value}</>;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
      await waitFor([
        {kind: 'selector:identity', state: 2},
        {kind: 'render', value: 2},
      ]);
    });

    expect(root).toMatchRenderedOutput('2');

    let resolve;

    // Start a transition that updates the store
    await act(async () => {
      await startTransition(async () => {
        store.dispatch({type: 'increment'});
        await new Promise(r => (resolve = r));
      });
    });

    assertLog([
      {kind: 'reducer', state: 2, action: 'increment'},
      {kind: 'selector:identity', state: 3},
    ]);
    // Still showing pre-transition state
    expect(root).toMatchRenderedOutput('2');

    // Now change the selector synchronously while transition is pending
    await act(async () => {
      setSelector(() => doubled);
    });

    // Should sync render with the new selector applied to the pre-transition state (2)
    // and also compute the new selector for the transition state (3)
    assertLog([
      {kind: 'selector:doubled', state: 2},
      {kind: 'render', value: 4},
      {kind: 'selector:doubled', state: 3},
    ]);
    // Rendered with new selector applied to pre-transition state: doubled(2) = 4
    expect(root).toMatchRenderedOutput('4');

    // Complete the transition
    await act(async () => {
      resolve();
    });

    // Should render with new selector applied to transition state: doubled(3) = 6
    assertLog([{kind: 'render', value: 6}]);
    expect(root).toMatchRenderedOutput('6');
  });

  it('store reader mounts after sibling updates state in useLayoutEffect', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }
    const store = createStore(2, counterReducer);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function StoreUpdater() {
      useLayoutEffect(() => {
        Scheduler.log({kind: 'layout effect'});
        store.dispatch({type: 'increment'});
      }, []);
      Scheduler.log({kind: 'render', componentName: 'StoreUpdater'});
      return null;
    }

    function StoreReader() {
      const value = useStore(store, identity);
      Scheduler.log({kind: 'render', value, componentName: 'StoreReader'});
      return <>{value}</>;
    }

    function App() {
      return (
        <>
          <StoreUpdater />
          <StoreReader />
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });

    // First render: StoreUpdater renders, StoreReader renders with initial state (2)
    // Then useLayoutEffect fires, dispatches increment
    // StoreReader re-renders with updated state (3) before mount completes
    assertLog([
      {kind: 'render', componentName: 'StoreUpdater'},
      {kind: 'selector', state: 2},
      {kind: 'render', value: 2, componentName: 'StoreReader'},
      {kind: 'layout effect'},
      {kind: 'reducer', state: 2, action: 'increment'},
      {kind: 'selector', state: 3},
      {kind: 'render', value: 3, componentName: 'StoreReader'},
    ]);
    expect(root).toMatchRenderedOutput('3');
  });

  it('store reader mounts after sibling updates state in useEffect', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }
    const store = createStore(2, counterReducer);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function StoreUpdater() {
      useEffect(() => {
        Scheduler.log({kind: 'effect'});
        store.dispatch({type: 'increment'});
      }, []);
      Scheduler.log({kind: 'render', componentName: 'StoreUpdater'});
      return null;
    }

    function StoreReader() {
      const value = useStore(store, identity);
      Scheduler.log({kind: 'render', value, componentName: 'StoreReader'});
      return <>{value}</>;
    }

    function App() {
      return (
        <>
          <StoreUpdater />
          <StoreReader />
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });

    // First render: StoreUpdater renders, StoreReader renders with initial state (2)
    // Then useLayoutEffect fires, dispatches increment
    // StoreReader re-renders with updated state (3) before mount completes
    assertLog([
      {kind: 'render', componentName: 'StoreUpdater'},
      {kind: 'selector', state: 2},
      {kind: 'render', value: 2, componentName: 'StoreReader'},
      {kind: 'effect'},
      {kind: 'reducer', state: 2, action: 'increment'},
      {kind: 'selector', state: 3},
      {kind: 'render', value: 3, componentName: 'StoreReader'},
    ]);
    expect(root).toMatchRenderedOutput('3');
  });

  // This test checks an edge case in update short circuiting to ensure we don't incorrectly skip
  // the second transition update based on the fact that it matches the "current" state.
  it('second transition update reverts state to pre-transition state', async () => {
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
    const store = createStore(2, counterReducer);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function App() {
      const value = useStore(store, identity);
      Scheduler.log({kind: 'render', value});
      return <>{value}</>;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });

    assertLog([
      {kind: 'selector', state: 2},
      {kind: 'render', value: 2},
    ]);
    expect(root).toMatchRenderedOutput('2');

    let resolve;

    // Start a transition that increments the store
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
    // Still showing pre-transition state
    expect(root).toMatchRenderedOutput('2');

    // Apply a second transition update that reverts back to the original state
    await act(async () => {
      startTransition(() => {
        store.dispatch({type: 'decrement'});
      });
    });

    // The second transition decrements the transition state (3 -> 2)
    // Since the transition state now equals the pre-transition state,
    // we still render (could be optimized in the future)
    assertLog([
      {kind: 'reducer', state: 3, action: 'decrement'},
      {kind: 'selector', state: 2},
      {kind: 'render', value: 2},
    ]);
    expect(root).toMatchRenderedOutput('2');

    // Complete the first transition
    await act(async () => {
      resolve();
    });

    // The transition completes but state is still 2, so no re-render needed
    assertLog([]);
    expect(root).toMatchRenderedOutput('2');
  });

  // This test checks an edge case in update short circuiting to ensure we don't incorrectly skip
  // the sync  update based on the fact that it matches the most recently rendered state.
  it('sync update interrupts transition with identical state change', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }
    const store = createStore(2, counterReducer);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function App() {
      const value = useStore(store, identity);
      Scheduler.log({kind: 'render', value});
      return <>{value}</>;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });

    assertLog([
      {kind: 'selector', state: 2},
      {kind: 'render', value: 2},
    ]);
    expect(root).toMatchRenderedOutput('2');

    let resolve;

    // Start a transition that increments the store
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
    // Still showing pre-transition state
    expect(root).toMatchRenderedOutput('2');

    // Interrupt with a sync update that results in the same state as the transition
    await act(async () => {
      store.dispatch({type: 'increment'});
    });

    // The sync update increments the sync state (2 -> 3)
    // This matches what the transition state already was
    assertLog([
      {kind: 'reducer', state: 3, action: 'increment'},
      {kind: 'reducer', state: 2, action: 'increment'},
      {kind: 'selector', state: 3},
      {kind: 'selector', state: 4},
      {kind: 'render', value: 3},
    ]);
    expect(root).toMatchRenderedOutput('3');

    // Complete the transition
    await act(async () => {
      resolve();
    });

    // The transition completes with state 4 (original transition 3 + sync increment)
    assertLog([{kind: 'render', value: 4}]);
    expect(root).toMatchRenderedOutput('4');
  });

  it('selector is not called after component unmounts', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }
    const store = createStore(2, counterReducer);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function StoreReader() {
      const value = useStore(store, identity);
      Scheduler.log({kind: 'render', value});
      return <>{value}</>;
    }

    let setShowReader;

    function App() {
      const [showReader, _setShowReader] = React.useState(true);
      setShowReader = _setShowReader;
      return showReader ? <StoreReader /> : null;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });

    assertLog([
      {kind: 'selector', state: 2},
      {kind: 'render', value: 2},
    ]);
    expect(root).toMatchRenderedOutput('2');

    // Unmount the component that uses the store
    await act(async () => {
      setShowReader(false);
    });

    assertLog([]);
    expect(root).toMatchRenderedOutput(null);

    // Dispatch an action to the store after unmount
    // The selector should NOT be called since the component is unmounted
    await act(async () => {
      store.dispatch({type: 'increment'});
    });

    // Only the reducer should run, not the selector
    assertLog([{kind: 'reducer', state: 2, action: 'increment'}]);
    expect(root).toMatchRenderedOutput(null);

    // Dispatch another action to confirm selector is still not called
    await act(async () => {
      store.dispatch({type: 'increment'});
    });

    assertLog([{kind: 'reducer', state: 3, action: 'increment'}]);
    expect(root).toMatchRenderedOutput(null);
  });

  it('batched sync updates in an event handler', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }
    const store = createStore(0, counterReducer);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function App() {
      const value = useStore(store, identity);
      Scheduler.log({kind: 'render', value});
      return <>{value}</>;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });

    assertLog([
      {kind: 'selector', state: 0},
      {kind: 'render', value: 0},
    ]);
    expect(root).toMatchRenderedOutput('0');

    // Dispatch multiple actions synchronously, simulating an event handler
    // They should be batched into a single render
    await act(async () => {
      store.dispatch({type: 'increment'});
      store.dispatch({type: 'increment'});
      store.dispatch({type: 'increment'});
    });

    // All three reducer calls happen, but only one render
    // Note: A future optimization could allow us to avoid calling the selector
    // multiple times here
    assertLog([
      {kind: 'reducer', state: 0, action: 'increment'},
      {kind: 'selector', state: 1},
      {kind: 'reducer', state: 1, action: 'increment'},
      {kind: 'selector', state: 2},
      {kind: 'reducer', state: 2, action: 'increment'},
      {kind: 'selector', state: 3},
      {kind: 'render', value: 3},
    ]);
    expect(root).toMatchRenderedOutput('3');
  });

  it('changing the store prop triggers a re-render with the new store state', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }

    const storeA = createStore(10, counterReducer);
    const storeB = createStore(20, counterReducer);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    let setStore;

    function App() {
      const [store, _setStore] = React.useState(storeA);
      setStore = _setStore;
      const value = useStore(store, identity);
      Scheduler.log({kind: 'render', value});
      return <>{value}</>;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });

    assertLog([
      {kind: 'selector', state: 10},
      {kind: 'render', value: 10},
    ]);
    expect(root).toMatchRenderedOutput('10');

    // Change the store prop from storeA to storeB
    await act(async () => {
      setStore(storeB);
    });

    // Should re-render with storeB's state (20)
    assertLog([
      {kind: 'selector', state: 20},
      {kind: 'render', value: 20},
    ]);
    expect(root).toMatchRenderedOutput('20');
  });

  it('first store reader is in a tree that suspends on mount', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }
    const store = createStore(2, counterReducer);

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    let resolve;
    const promise = new Promise(r => {
      resolve = r;
    });

    function SuspendingStoreReader() {
      const value = useStore(store, identity);
      Scheduler.log({
        kind: 'render',
        value,
        componentName: 'SuspendingStoreReader',
      });
      use(promise);
      Scheduler.log({
        kind: 'after suspend',
        componentName: 'SuspendingStoreReader',
      });
      return <>{value}</>;
    }

    function Fallback() {
      Scheduler.log({kind: 'render', componentName: 'Fallback'});
      return 'Loading...';
    }

    function App() {
      return (
        <Suspense fallback={<Fallback />}>
          <SuspendingStoreReader />
        </Suspense>
      );
    }

    const root = ReactNoop.createRoot();

    // Initial render - the store reader suspends
    await act(async () => {
      root.render(<App />);
    });

    assertLog([
      {kind: 'selector', state: 2},
      {kind: 'render', value: 2, componentName: 'SuspendingStoreReader'},
      // Component suspends, fallback is shown
      {kind: 'render', componentName: 'Fallback'},
      // TODO: React tries to render the suspended tree again?
      {kind: 'selector', state: 2},
      {kind: 'render', value: 2, componentName: 'SuspendingStoreReader'},
      // {kind: 'render', componentName: 'Fallback'},
    ]);
    expect(root).toMatchRenderedOutput('Loading...');

    // Dispatch while suspended - only the reducer runs since the
    // suspended component is not being re-rendered

    let resolveTransition;
    await act(async () => {
      startTransition(async () => {
        store.dispatch({type: 'increment'});
        await new Promise(r => (resolveTransition = r));
      });
    });

    assertLog([{kind: 'reducer', state: 2, action: 'increment'}]);
    // Still showing fallback
    expect(root).toMatchRenderedOutput('Loading...');

    // Resolve the suspense
    await act(async () => {
      resolve();
    });

    // Now the component should render with the pre-transition state
    assertLog([
      {kind: 'selector', state: 2},
      {kind: 'render', value: 2, componentName: 'SuspendingStoreReader'},
      {kind: 'after suspend', componentName: 'SuspendingStoreReader'},
      // React tries to re-render the transition state eagerly
      {kind: 'selector', state: 3},
      // WAT?
      {kind: 'render', componentName: 'Fallback'},
    ]);
    expect(root).toMatchRenderedOutput('2');

    // Verify updates continue to work after unsuspending
    await act(async () => {
      resolveTransition();
    });

    assertLog([
      {kind: 'render', value: 3, componentName: 'SuspendingStoreReader'},
      {kind: 'after suspend', componentName: 'SuspendingStoreReader'},
    ]);
    expect(root).toMatchRenderedOutput('3');
  });

  it('store is already updating in transition on initial mount', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }

    const store = createStore(2, counterReducer);

    let resolve;

    startTransition(async () => {
      store.dispatch({type: 'increment'});
      await new Promise(r => {
        resolve = r;
      });
    });

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function App() {
      const value = useStore(store, identity);
      Scheduler.log({kind: 'render', value});
      return <>{value}</>;
    }

    const root = ReactNoop.createRoot();
    assertLog([{kind: 'reducer', state: 2, action: 'increment'}]);
    await act(async () => {
      root.render(<App />);
    });

    // Technically we the transition is not complete, so we
    // SHOULD be showing 2 here.
    assertLog([
      {kind: 'selector', state: 3},
      {kind: 'render', value: 3},
    ]);
    expect(root).toMatchRenderedOutput('3');

    await act(async () => {
      resolve();
    });

    assertLog([
      // This is where we should be updating to 3.
    ]);
    expect(root).toMatchRenderedOutput('3');
  });

  it('store is previously updated in transition before initial mount', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }

    const store = createStore(2, counterReducer);

    startTransition(async () => {
      store.dispatch({type: 'increment'});
    });
    // Transition completed immediately, so if we are tracking committed state
    // we would need to mark this transtion as complete.

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function App() {
      const value = useStore(store, identity);
      Scheduler.log({kind: 'render', value});
      return <>{value}</>;
    }

    const root = ReactNoop.createRoot();
    assertLog([{kind: 'reducer', action: 'increment', state: 2}]);
    await act(async () => {
      root.render(<App />);
    });

    assertLog([
      {kind: 'selector', state: 3},
      {kind: 'render', value: 3},
    ]);
    expect(root).toMatchRenderedOutput('3');
  });

  it('store is created in a transition that is still ongoing during initial mount', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment'},
    ): number {
      Scheduler.log({kind: 'reducer', state: count, action: action.type});
      switch (action.type) {
        case 'increment':
          return count + 1;
        default:
          return count;
      }
    }

    let store;
    let resolve;

    startTransition(async () => {
      store = createStore(2, counterReducer);
      await new Promise(r => {
        resolve = r;
      });
    });

    function identity(x) {
      Scheduler.log({kind: 'selector', state: x});
      return x;
    }

    function App() {
      const value = useStore(store, identity);
      Scheduler.log({kind: 'render', value});
      return <>{value}</>;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });

    // Technically there is no valid state since the store should not really
    // exist until the transition completes?
    assertLog([
      {kind: 'selector', state: 2},
      {kind: 'render', value: 2},
    ]);
    expect(root).toMatchRenderedOutput('2');

    await act(async () => {
      resolve();
    });

    assertLog([
      // Not clear what should be happening here.
    ]);
    expect(root).toMatchRenderedOutput('2');
  });
});
