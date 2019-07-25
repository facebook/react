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
    const resolveRef = {current: null};
    let promise = {
      then(resolve, reject) {
        resolveRef.current = () => {
          completed = true;
          resolve();
        };
      },
    };

    const PromiseComp = () => {
      if (!completed) {
        throw promise;
      }
      return 'Done';
    };
    return {promise, resolveRef, PromiseComp};
  }

  it('check type', () => {
    const {PromiseComp} = createThenable();

    const elementBadType = (
      <React.Suspense suspenseCallback={1} fallback={'Waiting'}>
        <PromiseComp />
      </React.Suspense>
    );

    ReactNoop.render(elementBadType);
    expect(() => Scheduler.unstable_flushAll()).toWarnDev([
      'Warning: Unexpected type for suspenseCallback.',
    ]);

    const elementMissingCallback = (
      <React.Suspense fallback={'Waiting'}>
        <PromiseComp />
      </React.Suspense>
    );

    ReactNoop.render(elementMissingCallback);
    expect(() => Scheduler.unstable_flushAll()).toWarnDev([]);
  });

  it('1 then 0 suspense callback', () => {
    const {promise, resolveRef, PromiseComp} = createThenable();

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

    resolveRef.current();
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([text('Done')]);
    expect(ops).toEqual([]);
  });

  it('2 then 1 then 0 suspense callback', () => {
    const {
      promise: promise1,
      resolveRef: resolveRef1,
      PromiseComp: PromiseComp1,
    } = createThenable();
    const {
      promise: promise2,
      resolveRef: resolveRef2,
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

    resolveRef1.current();
    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([text('Waiting Tier 1')]);
    expect(ops).toEqual([new Set([promise2])]);
    ops = [];

    resolveRef2.current();
    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([text('Done'), text('Done')]);
    expect(ops).toEqual([]);
  });

  it('nested suspense promises are reported only for their tier', () => {
    const {promise, PromiseComp} = createThenable();

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

  it('competing suspense promises', () => {
    const {
      promise: promise1,
      resolveRef: resolveRef1,
      PromiseComp: PromiseComp1,
    } = createThenable();
    const {
      promise: promise2,
      resolveRef: resolveRef2,
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

    resolveRef1.current();
    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([
      text('Waiting Tier 2'),
      text('Done'),
    ]);
    expect(ops1).toEqual([]);
    expect(ops2).toEqual([new Set([promise2])]);
    ops1 = [];
    ops2 = [];

    resolveRef2.current();
    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([text('Done'), text('Done')]);
    expect(ops1).toEqual([]);
    expect(ops2).toEqual([]);
  });
});
