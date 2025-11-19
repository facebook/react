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

describe('useStoreWithSelector', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    createStore = React.createStore;
    useStoreWithSelector = React.useStoreWithSelector;
    startTransition = React.startTransition;
    const InternalTestUtils = require('internal-test-utils');
    waitFor = InternalTestUtils.waitFor;
    assertLog = InternalTestUtils.assertLog;

    act = require('internal-test-utils').act;
  });

  it('useStoreWithSelector', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment' | 'decrement'},
    ): number {
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

    function App() {
      const value = useStoreWithSelector(store, identify);
      Scheduler.log(value);
      return <>{value}</>;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
      await waitFor([2]);
    });
    expect(root).toMatchRenderedOutput('2');

    await act(async () => {
      startTransition(() => {
        store.dispatch({type: 'increment'});
      });
    });
    assertLog([3]);
    expect(root).toMatchRenderedOutput('3');

    await act(async () => {
      startTransition(() => {
        store.dispatch({type: 'increment'});
      });
    });
    assertLog([4]);
    expect(root).toMatchRenderedOutput('4');
  });
  it('rebasing', async () => {
    function counterReducer(
      count: number,
      action: {type: 'increment' | 'decrement'},
    ): number {
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

    function App() {
      const value = useStoreWithSelector(store, identify);
      Scheduler.log(value);
      return <>{value}</>;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
      await waitFor([2]);
    });
    expect(root).toMatchRenderedOutput('2');

    let resolve;

    await act(async () => {
      await startTransition(async () => {
        store.dispatch({type: 'increment'});
        await new Promise(r => (resolve = r));
      });
    });

    assertLog([]);
    expect(root).toMatchRenderedOutput('2');

    await act(async () => {
      store.dispatch({type: 'double'});
    });

    assertLog([4]);
    expect(root).toMatchRenderedOutput('4');

    await act(async () => {
      resolve();
    });

    assertLog([6]);
    expect(root).toMatchRenderedOutput('6');
  });
});

function identify<T>(x: T): T {
  return x;
}
