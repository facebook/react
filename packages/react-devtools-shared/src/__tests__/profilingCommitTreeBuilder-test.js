/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof TestRendererType from 'react-test-renderer';
import type Store from 'react-devtools-shared/src/devtools/store';

describe('commit tree', () => {
  let React;
  let ReactDOMClient;
  let Scheduler;
  let TestRenderer: TestRendererType;
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
    TestRenderer = utils.requireTestRenderer();
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
    utils.act(() => legacyRender(<Parent count={3} />, container));
    utils.act(() => legacyRender(<Parent count={2} />, container));
    utils.act(() => legacyRender(<Parent count={0} />, container));
    utils.act(() => store.profilerStore.stopProfiling());

    let renderFinished = false;

    function Validator({commitIndex, rootID}) {
      const commitTree = store.profilerStore.profilingCache.getCommitTree({
        commitIndex,
        rootID,
      });
      expect(commitTree).toMatchSnapshot(`${commitIndex}: CommitTree`);
      renderFinished = true;
      return null;
    }

    const rootID = store.roots[0];

    for (let commitIndex = 0; commitIndex < 4; commitIndex++) {
      renderFinished = false;

      utils.act(() => {
        TestRenderer.create(
          <Validator commitIndex={commitIndex} rootID={rootID} />,
        );
      });

      expect(renderFinished).toBe(true);
    }
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
      utils.act(() => legacyRender(<App renderChildren={true} />, container));
      utils.act(() => legacyRender(<App renderChildren={false} />, container));
      utils.act(() => store.profilerStore.stopProfiling());

      let renderFinished = false;

      function Validator({commitIndex, rootID}) {
        const commitTree = store.profilerStore.profilingCache.getCommitTree({
          commitIndex,
          rootID,
        });
        expect(commitTree).toMatchSnapshot(`${commitIndex}: CommitTree`);
        renderFinished = true;
        return null;
      }

      const rootID = store.roots[0];

      for (let commitIndex = 0; commitIndex < 2; commitIndex++) {
        renderFinished = false;

        utils.act(() => {
          TestRenderer.create(
            <Validator commitIndex={commitIndex} rootID={rootID} />,
          );
        });

        expect(renderFinished).toBe(true);
      }
    });

    it('should support Lazy components (createRoot)', async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);

      utils.act(() => store.profilerStore.startProfiling());
      utils.act(() => root.render(<App renderChildren={true} />));
      await Promise.resolve();
      utils.act(() => root.render(<App renderChildren={true} />));
      utils.act(() => root.render(<App renderChildren={false} />));
      utils.act(() => store.profilerStore.stopProfiling());

      let renderFinished = false;

      function Validator({commitIndex, rootID}) {
        const commitTree = store.profilerStore.profilingCache.getCommitTree({
          commitIndex,
          rootID,
        });
        expect(commitTree).toMatchSnapshot(`${commitIndex}: CommitTree`);
        renderFinished = true;
        return null;
      }

      const rootID = store.roots[0];

      for (let commitIndex = 0; commitIndex < 2; commitIndex++) {
        renderFinished = false;

        utils.act(() => {
          TestRenderer.create(
            <Validator commitIndex={commitIndex} rootID={rootID} />,
          );
        });

        expect(renderFinished).toBe(true);
      }
    });

    it('should support Lazy components that are unmounted before resolving (legacy render)', async () => {
      const container = document.createElement('div');

      utils.act(() => store.profilerStore.startProfiling());
      utils.act(() => legacyRender(<App renderChildren={true} />, container));
      utils.act(() => legacyRender(<App renderChildren={false} />, container));
      utils.act(() => store.profilerStore.stopProfiling());

      let renderFinished = false;

      function Validator({commitIndex, rootID}) {
        const commitTree = store.profilerStore.profilingCache.getCommitTree({
          commitIndex,
          rootID,
        });
        expect(commitTree).toMatchSnapshot(`${commitIndex}: CommitTree`);
        renderFinished = true;
        return null;
      }

      const rootID = store.roots[0];

      for (let commitIndex = 0; commitIndex < 2; commitIndex++) {
        renderFinished = false;

        utils.act(() => {
          TestRenderer.create(
            <Validator commitIndex={commitIndex} rootID={rootID} />,
          );
        });

        expect(renderFinished).toBe(true);
      }
    });

    it('should support Lazy components that are unmounted before resolving (createRoot)', async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);

      utils.act(() => store.profilerStore.startProfiling());
      utils.act(() => root.render(<App renderChildren={true} />));
      utils.act(() => root.render(<App renderChildren={false} />));
      utils.act(() => store.profilerStore.stopProfiling());

      let renderFinished = false;

      function Validator({commitIndex, rootID}) {
        const commitTree = store.profilerStore.profilingCache.getCommitTree({
          commitIndex,
          rootID,
        });
        expect(commitTree).toMatchSnapshot(`${commitIndex}: CommitTree`);
        renderFinished = true;
        return null;
      }

      const rootID = store.roots[0];

      for (let commitIndex = 0; commitIndex < 2; commitIndex++) {
        renderFinished = false;

        utils.act(() => {
          TestRenderer.create(
            <Validator commitIndex={commitIndex} rootID={rootID} />,
          );
        });

        expect(renderFinished).toBe(true);
      }
    });
  });
});
