/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type Store from 'react-devtools-shared/src/devtools/store';

describe('commit tree', () => {
  let React;
  let ReactDOMClient;
  let Scheduler;
  let legacyRender;
  let store: Store;
  let utils;

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    legacyRender = utils.legacyRender;

    store = global.store;
    store.collapseNodesByDefault = false;
    store.recordChangeDescriptions = true;

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    Scheduler = require('scheduler');
  });

  it('should be able to rebuild the store tree for each commit', () => {
    const Parent = ({count}) => {
      Scheduler.unstable_advanceTime(10);
      return new Array(count)
        .fill(true)
        .map((_, index) => <Child key={index} />);
    };
    const Child = React.memo(function Child() {
      Scheduler.unstable_advanceTime(2);
      return null;
    });

    const container = document.createElement('div');

    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => legacyRender(<Parent count={1} />, container));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Parent>
            <Child key="0"> [Memo]
    `);
    utils.act(() => legacyRender(<Parent count={3} />, container));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Parent>
            <Child key="0"> [Memo]
            <Child key="1"> [Memo]
            <Child key="2"> [Memo]
    `);
    utils.act(() => legacyRender(<Parent count={2} />, container));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Parent>
            <Child key="0"> [Memo]
            <Child key="1"> [Memo]
    `);
    utils.act(() => legacyRender(<Parent count={0} />, container));
    expect(store).toMatchInlineSnapshot(`
      [root]
          <Parent>
    `);
    utils.act(() => store.profilerStore.stopProfiling());

    const rootID = store.roots[0];
    const commitTrees = [];
    for (let commitIndex = 0; commitIndex < 4; commitIndex++) {
      commitTrees.push(
        store.profilerStore.profilingCache.getCommitTree({
          commitIndex,
          rootID,
        }),
      );
    }

    expect(commitTrees[0].nodes.size).toBe(3); // <Root> + <Parent> + <Child>
    expect(commitTrees[1].nodes.size).toBe(5); // <Root> + <Parent> + <Child> x 3
    expect(commitTrees[2].nodes.size).toBe(4); // <Root> + <Parent> + <Child> x 2
    expect(commitTrees[3].nodes.size).toBe(2); // <Root> + <Parent>
  });

  describe('Lazy', () => {
    async function fakeImport(result) {
      return {default: result};
    }

    const LazyInnerComponent = () => null;

    const App = ({renderChildren}) => {
      if (renderChildren) {
        return (
          <React.Suspense fallback="Loading...">
            <LazyComponent />
          </React.Suspense>
        );
      } else {
        return null;
      }
    };

    let LazyComponent;
    beforeEach(() => {
      LazyComponent = React.lazy(() => fakeImport(LazyInnerComponent));
    });

    it('should support Lazy components (legacy render)', async () => {
      const container = document.createElement('div');

      utils.act(() => store.profilerStore.startProfiling());
      utils.act(() => legacyRender(<App renderChildren={true} />, container));
      await Promise.resolve();
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <App>
              <Suspense>
      `);
      utils.act(() => legacyRender(<App renderChildren={true} />, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <App>
            ▾ <Suspense>
                <LazyInnerComponent>
      `);
      utils.act(() => legacyRender(<App renderChildren={false} />, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
            <App>
      `);
      utils.act(() => store.profilerStore.stopProfiling());

      const rootID = store.roots[0];
      const commitTrees = [];
      for (let commitIndex = 0; commitIndex < 3; commitIndex++) {
        commitTrees.push(
          store.profilerStore.profilingCache.getCommitTree({
            commitIndex,
            rootID,
          }),
        );
      }

      expect(commitTrees[0].nodes.size).toBe(3); // <Root> + <App> + <Suspense>
      expect(commitTrees[1].nodes.size).toBe(4); // <Root> + <App> + <Suspense> + <LazyInnerComponent>
      expect(commitTrees[2].nodes.size).toBe(2); // <Root> + <App>
    });

    it('should support Lazy components (createRoot)', async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);

      utils.act(() => store.profilerStore.startProfiling());
      utils.act(() => root.render(<App renderChildren={true} />));
      await Promise.resolve();
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <App>
              <Suspense>
      `);
      utils.act(() => root.render(<App renderChildren={true} />));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <App>
            ▾ <Suspense>
                <LazyInnerComponent>
      `);
      utils.act(() => root.render(<App renderChildren={false} />));
      expect(store).toMatchInlineSnapshot(`
        [root]
            <App>
      `);
      utils.act(() => store.profilerStore.stopProfiling());

      const rootID = store.roots[0];
      const commitTrees = [];
      for (let commitIndex = 0; commitIndex < 3; commitIndex++) {
        commitTrees.push(
          store.profilerStore.profilingCache.getCommitTree({
            commitIndex,
            rootID,
          }),
        );
      }

      expect(commitTrees[0].nodes.size).toBe(3); // <Root> + <App> + <Suspense>
      expect(commitTrees[1].nodes.size).toBe(4); // <Root> + <App> + <Suspense> + <LazyInnerComponent>
      expect(commitTrees[2].nodes.size).toBe(2); // <Root> + <App>
    });

    it('should support Lazy components that are unmounted before resolving (legacy render)', async () => {
      const container = document.createElement('div');

      utils.act(() => store.profilerStore.startProfiling());
      utils.act(() => legacyRender(<App renderChildren={true} />, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <App>
              <Suspense>
      `);
      utils.act(() => legacyRender(<App renderChildren={false} />, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
            <App>
      `);
      utils.act(() => store.profilerStore.stopProfiling());

      const rootID = store.roots[0];
      const commitTrees = [];
      for (let commitIndex = 0; commitIndex < 2; commitIndex++) {
        commitTrees.push(
          store.profilerStore.profilingCache.getCommitTree({
            commitIndex,
            rootID,
          }),
        );
      }

      expect(commitTrees[0].nodes.size).toBe(3); // <Root> + <App> + <Suspense>
      expect(commitTrees[1].nodes.size).toBe(2); // <Root> + <App>
    });

    it('should support Lazy components that are unmounted before resolving (createRoot)', async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);

      utils.act(() => store.profilerStore.startProfiling());
      utils.act(() => root.render(<App renderChildren={true} />));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <App>
              <Suspense>
      `);
      utils.act(() => root.render(<App renderChildren={false} />));
      expect(store).toMatchInlineSnapshot(`
        [root]
            <App>
      `);
      utils.act(() => store.profilerStore.stopProfiling());

      const rootID = store.roots[0];
      const commitTrees = [];
      for (let commitIndex = 0; commitIndex < 2; commitIndex++) {
        commitTrees.push(
          store.profilerStore.profilingCache.getCommitTree({
            commitIndex,
            rootID,
          }),
        );
      }

      expect(commitTrees[0].nodes.size).toBe(3); // <Root> + <App> + <Suspense>
      expect(commitTrees[1].nodes.size).toBe(2); // <Root> + <App>
    });
  });
});
