/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */
'use strict';

let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;

describe('ReactSuspense', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableSuspenseCallback = true;

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
  });

  function text(t) {
    return {text: t, hidden: false};
  }

  function createThenable() {
    let completed = false;
    let resolve;
    const promise = new Promise(res => {
      resolve = () => {
        completed = true;
        res();
      };
    });
    const PromiseComp = () => {
      if (!completed) {
        throw promise;
      }
      return 'Done';
    };
    return {promise, resolve, PromiseComp};
  }

  it('check type', () => {
    const {PromiseComp} = createThenable();

    const elementBadType = (
      <React.Suspense suspenseCallback={1} fallback={'Waiting'}>
        <PromiseComp />
      </React.Suspense>
    );

    ReactNoop.render(elementBadType);
    expect(() => Scheduler.unstable_flushAll()).toErrorDev([
      'Warning: Unexpected type for suspenseCallback.',
    ]);

    const elementMissingCallback = (
      <React.Suspense fallback={'Waiting'}>
        <PromiseComp />
      </React.Suspense>
    );

    ReactNoop.render(elementMissingCallback);
    expect(() => Scheduler.unstable_flushAll()).toErrorDev([]);
  });

  it('1 then 0 suspense callback', async () => {
    const {promise, resolve, PromiseComp} = createThenable();

    let ops = [];
    const suspenseCallback = thenables => {
      ops.push(thenables);
    };

    const element = (
      <React.Suspense suspenseCallback={suspenseCallback} fallback={'Waiting'}>
        <PromiseComp />
      </React.Suspense>
    );

    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([text('Waiting')]);
    expect(ops).toEqual([new Set([promise])]);
    ops = [];

    await resolve();
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([text('Done')]);
    expect(ops).toEqual([]);
  });

  it('2 then 1 then 0 suspense callback', async () => {
    const {
      promise: promise1,
      resolve: resolve1,
      PromiseComp: PromiseComp1,
    } = createThenable();
    const {
      promise: promise2,
      resolve: resolve2,
      PromiseComp: PromiseComp2,
    } = createThenable();

    let ops = [];
    const suspenseCallback1 = thenables => {
      ops.push(thenables);
    };

    const element = (
      <React.Suspense
        suspenseCallback={suspenseCallback1}
        fallback={'Waiting Tier 1'}>
        <PromiseComp1 />
        <PromiseComp2 />
      </React.Suspense>
    );

    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([text('Waiting Tier 1')]);
    expect(ops).toEqual([new Set([promise1, promise2])]);
    ops = [];

    await resolve1();
    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([text('Waiting Tier 1')]);
    expect(ops).toEqual([new Set([promise2])]);
    ops = [];

    await resolve2();
    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([text('Done'), text('Done')]);
    expect(ops).toEqual([]);
  });

  it('nested suspense promises are reported only for their tier', () => {
    const {promise, PromiseComp} = createThenable();

    const ops1 = [];
    const suspenseCallback1 = thenables => {
      ops1.push(thenables);
    };
    const ops2 = [];
    const suspenseCallback2 = thenables => {
      ops2.push(thenables);
    };

    const element = (
      <React.Suspense
        suspenseCallback={suspenseCallback1}
        fallback={'Waiting Tier 1'}>
        <React.Suspense
          suspenseCallback={suspenseCallback2}
          fallback={'Waiting Tier 2'}>
          <PromiseComp />
        </React.Suspense>
      </React.Suspense>
    );

    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([text('Waiting Tier 2')]);
    expect(ops1).toEqual([]);
    expect(ops2).toEqual([new Set([promise])]);
  });

  it('competing suspense promises', async () => {
    const {
      promise: promise1,
      resolve: resolve1,
      PromiseComp: PromiseComp1,
    } = createThenable();
    const {
      promise: promise2,
      resolve: resolve2,
      PromiseComp: PromiseComp2,
    } = createThenable();

    let ops1 = [];
    const suspenseCallback1 = thenables => {
      ops1.push(thenables);
    };
    let ops2 = [];
    const suspenseCallback2 = thenables => {
      ops2.push(thenables);
    };

    const element = (
      <React.Suspense
        suspenseCallback={suspenseCallback1}
        fallback={'Waiting Tier 1'}>
        <React.Suspense
          suspenseCallback={suspenseCallback2}
          fallback={'Waiting Tier 2'}>
          <PromiseComp2 />
        </React.Suspense>
        <PromiseComp1 />
      </React.Suspense>
    );

    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([text('Waiting Tier 1')]);
    expect(ops1).toEqual([new Set([promise1])]);
    expect(ops2).toEqual([]);
    ops1 = [];
    ops2 = [];

    await resolve1();
    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();

    // Force fallback to commit.
    // TODO: Should be able to use `act` here.
    jest.runAllTimers();

    expect(ReactNoop.getChildren()).toEqual([
      text('Waiting Tier 2'),
      text('Done'),
    ]);
    expect(ops1).toEqual([]);
    expect(ops2).toEqual([new Set([promise2])]);
    ops1 = [];
    ops2 = [];

    await resolve2();
    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([text('Done'), text('Done')]);
    expect(ops1).toEqual([]);
    expect(ops2).toEqual([]);
  });

  if (__DEV__) {
    it('regression test for #16215 that relies on implementation details', async () => {
      // Regression test for https://github.com/facebook/react/pull/16215.
      // The bug only happens if there's an error earlier in the commit phase.
      // The first error is the one that gets thrown, so to observe the later
      // error, I've mocked the ReactErrorUtils module.
      //
      // If this test starts failing because the implementation details change,
      // you can probably just delete it. It's not worth the hassle.
      jest.resetModules();

      const errors = [];
      let hasCaughtError = false;
      jest.mock('shared/ReactErrorUtils', () => ({
        invokeGuardedCallback(name, fn, context, ...args) {
          try {
            return fn.call(context, ...args);
          } catch (error) {
            hasCaughtError = true;
            errors.push(error);
          }
        },
        hasCaughtError() {
          return hasCaughtError;
        },
        clearCaughtError() {
          hasCaughtError = false;
          return errors[errors.length - 1];
        },
      }));

      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactFeatureFlags.enableSuspenseCallback = true;

      React = require('react');
      ReactNoop = require('react-noop-renderer');
      Scheduler = require('scheduler');

      const {useEffect} = React;
      const {PromiseComp} = createThenable();
      function App() {
        useEffect(() => {
          Scheduler.unstable_yieldValue('Passive Effect');
        });
        return (
          <React.Suspense
            suspenseCallback={() => {
              throw Error('Oops!');
            }}
            fallback="Loading...">
            <PromiseComp />
          </React.Suspense>
        );
      }
      const root = ReactNoop.createRoot();
      await ReactNoop.act(async () => {
        root.render(<App />);
        expect(Scheduler).toFlushAndThrow('Oops!');
      });

      // Should have only received a single error. Before the bug fix, there was
      // also a second error related to the Suspense update queue.
      expect(errors.length).toBe(1);
      expect(errors[0].message).toEqual('Oops!');
    });
  }
});
