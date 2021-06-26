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

describe('profiling charts', () => {
  let React;
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
    Scheduler = require('scheduler');
    TestRenderer = utils.requireTestRenderer();
  });

  describe('flamegraph chart', () => {
    it('should contain valid data', () => {
      const Parent = (_: {||}) => {
        Scheduler.unstable_advanceTime(10);
        return (
          <React.Fragment>
            <Child key="first" duration={3} />
            <Child key="second" duration={2} />
            <Child key="third" duration={0} />
          </React.Fragment>
        );
      };

      // Memoize children to verify that chart doesn't include in the update.
      const Child = React.memo(function Child({duration}) {
        Scheduler.unstable_advanceTime(duration);
        return null;
      });

      const container = document.createElement('div');

      utils.act(() => store.profilerStore.startProfiling());
      utils.act(() => legacyRender(<Parent />, container));
      utils.act(() => legacyRender(<Parent />, container));
      utils.act(() => store.profilerStore.stopProfiling());

      let renderFinished = false;

      function Validator({commitIndex, rootID}) {
        const commitTree = store.profilerStore.profilingCache.getCommitTree({
          commitIndex,
          rootID,
        });
        const chartData = store.profilerStore.profilingCache.getFlamegraphChartData(
          {
            commitIndex,
            commitTree,
            rootID,
          },
        );
        expect(commitTree).toMatchSnapshot(`${commitIndex}: CommitTree`);
        expect(chartData).toMatchSnapshot(
          `${commitIndex}: FlamegraphChartData`,
        );
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

      expect(renderFinished).toBe(true);
    });
  });

  describe('ranked chart', () => {
    it('should contain valid data', () => {
      const Parent = (_: {||}) => {
        Scheduler.unstable_advanceTime(10);
        return (
          <React.Fragment>
            <Child key="first" duration={3} />
            <Child key="second" duration={2} />
            <Child key="third" duration={0} />
          </React.Fragment>
        );
      };

      // Memoize children to verify that chart doesn't include in the update.
      const Child = React.memo(function Child({duration}) {
        Scheduler.unstable_advanceTime(duration);
        return null;
      });

      const container = document.createElement('div');

      utils.act(() => store.profilerStore.startProfiling());
      utils.act(() => legacyRender(<Parent />, container));
      utils.act(() => legacyRender(<Parent />, container));
      utils.act(() => store.profilerStore.stopProfiling());

      let renderFinished = false;

      function Validator({commitIndex, rootID}) {
        const commitTree = store.profilerStore.profilingCache.getCommitTree({
          commitIndex,
          rootID,
        });
        const chartData = store.profilerStore.profilingCache.getRankedChartData(
          {
            commitIndex,
            commitTree,
            rootID,
          },
        );
        expect(commitTree).toMatchSnapshot(`${commitIndex}: CommitTree`);
        expect(chartData).toMatchSnapshot(`${commitIndex}: RankedChartData`);
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
