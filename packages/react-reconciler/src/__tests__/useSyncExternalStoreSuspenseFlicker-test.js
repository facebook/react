/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// Scoping guard for the post-hydration useSyncExternalStore keep-content feature
// (enableHoldHydratedContentOnStoreSync). The feature itself is verified in
// ReactDOMFizzShellHydration-test.js, which needs real SSR + hydration. Here we
// lock in the boundary of that feature: a STEADY-STATE (non-hydration) sync store
// update that re-suspends an already-revealed boundary is NOT delay-able; it
// still flashes the fallback, with or without the flag.

let React;
let ReactNoop;
let Scheduler;
let act;
let useSyncExternalStore;
let Suspense;
let assertLog;
let textCache;

describe('useSyncExternalStore Suspense flicker', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    useSyncExternalStore = React.useSyncExternalStore;
    Suspense = React.Suspense;
    textCache = new Map();

    const InternalTestUtils = require('internal-test-utils');
    assertLog = InternalTestUtils.assertLog;
    act = InternalTestUtils.act;
  });

  function resolveText(text) {
    const record = textCache.get(text);
    if (record === undefined) {
      textCache.set(text, {status: 'resolved', value: text});
    } else if (record.status === 'pending') {
      const thenable = record.value;
      record.status = 'resolved';
      record.value = text;
      thenable.pings.forEach(t => t());
    }
  }

  function readText(text) {
    const record = textCache.get(text);
    if (record !== undefined) {
      switch (record.status) {
        case 'pending':
          throw record.value;
        case 'rejected':
          throw record.value;
        case 'resolved':
          return record.value;
      }
    } else {
      const thenable = {
        pings: [],
        then(resolve) {
          if (newRecord.status === 'pending') {
            thenable.pings.push(resolve);
          } else {
            Promise.resolve().then(() => resolve(newRecord.value));
          }
        },
      };
      const newRecord = {status: 'pending', value: thenable};
      textCache.set(text, newRecord);
      throw thenable;
    }
  }

  function AsyncText({text}) {
    const result = readText(text);
    Scheduler.log(text);
    return <span>{result}</span>;
  }

  function createExternalStore(initialState) {
    const listeners = new Set();
    let currentState = initialState;
    return {
      set(text) {
        currentState = text;
        ReactNoop.batchedUpdates(() => {
          listeners.forEach(listener => listener());
        });
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getState() {
        return currentState;
      },
    };
  }

  // A steady-state (non-hydration) sync store update is NOT delay-able: it still
  // commits the fallback, hiding the previous content. Only the post-hydration
  // patch-up keeps content (covered in the react-dom hydration test).
  it('steady-state sync store update still flashes the fallback', async () => {
    const store = createExternalStore('A');
    resolveText('A');

    function App() {
      const value = useSyncExternalStore(store.subscribe, store.getState);
      return (
        <Suspense fallback={<span>Loading</span>}>
          <AsyncText text={value} />
        </Suspense>
      );
    }

    const root = ReactNoop.createRoot();
    await act(() => root.render(<App />));
    assertLog(['A']);
    expect(root).toMatchRenderedOutput(<span>A</span>);

    await act(() => store.set('B'));
    // Previous content is hidden and the fallback is shown (today's behavior,
    // preserved for steady-state updates).
    expect(root).toMatchRenderedOutput(
      <>
        <span hidden={true}>A</span>
        <span>Loading</span>
      </>,
    );

    await act(() => resolveText('B'));
    assertLog(['B']);
    expect(root).toMatchRenderedOutput(<span>B</span>);
  });
});
