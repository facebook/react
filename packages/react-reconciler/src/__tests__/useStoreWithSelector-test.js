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
let useLayoutEffect;
let forwardRef;
let useImperativeHandle;
let useRef;
let useState;
let use;
let createStore;
let startTransition;
let waitFor;
let waitForAll;
let assertLog;
let Suspense;
let useMemo;

describe('useStoreWithSelector', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    useLayoutEffect = React.useLayoutEffect;
    useImperativeHandle = React.useImperativeHandle;
    forwardRef = React.forwardRef;
    useRef = React.useRef;
    useState = React.useState;
    use = React.use;
    createStore = React.createStore;
    useStoreWithSelector = React.useStoreWithSelector;
    startTransition = React.startTransition;
    Suspense = React.Suspense;
    useMemo = React.useMemo;
    const InternalTestUtils = require('internal-test-utils');
    waitFor = InternalTestUtils.waitFor;
    waitForAll = InternalTestUtils.waitForAll;
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
});

function identify<T>(x: T): T {
  return x;
}
