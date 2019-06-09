// @flow

import typeof TestRendererType from 'react-test-renderer';
import type Store from 'src/devtools/store';

describe('profiling charts', () => {
  let React;
  let ReactDOM;
  let Scheduler;
  let SchedulerTracing;
  let TestRenderer: TestRendererType;
  let store: Store;
  let utils;

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    store = global.store;
    store.collapseNodesByDefault = false;
    store.recordChangeDescriptions = true;

    React = require('react');
    ReactDOM = require('react-dom');
    Scheduler = require('scheduler');
    SchedulerTracing = require('scheduler/tracing');
    TestRenderer = utils.requireTestRenderer();
  });

  describe('flamegraph chart', () => {
    it('should contain valid data', () => {
      const Parent = ({ count }) => {
        Scheduler.advanceTime(10);
        return (
          <React.Fragment>
            <Child key="first" duration={3} />
            <Child key="second" duration={2} />
            <Child key="third" duration={0} />
          </React.Fragment>
        );
      };

      // Memoize children to verify that chart doesn't include in the update.
      const Child = React.memo(function Child({ duration }) {
        Scheduler.advanceTime(duration);
        return null;
      });

      const container = document.createElement('div');

      utils.act(() => store.profilerStore.startProfiling());
      utils.act(() =>
        SchedulerTracing.unstable_trace('mount', Scheduler.unstable_now(), () =>
          ReactDOM.render(<Parent />, container)
        )
      );
      utils.act(() =>
        SchedulerTracing.unstable_trace(
          'update',
          Scheduler.unstable_now(),
          () => ReactDOM.render(<Parent />, container)
        )
      );
      utils.act(() => store.profilerStore.stopProfiling());

      let renderFinished = false;

      function Validator({ commitIndex, rootID }) {
        const commitTree = store.profilerStore.profilingCache.getCommitTree({
          commitIndex,
          rootID,
        });
        const chartData = store.profilerStore.profilingCache.getFlamegraphChartData(
          {
            commitIndex,
            commitTree,
            rootID,
          }
        );
        expect(commitTree).toMatchSnapshot(`${commitIndex}: CommitTree`);
        expect(chartData).toMatchSnapshot(
          `${commitIndex}: FlamegraphChartData`
        );
        renderFinished = true;
        return null;
      }

      const rootID = store.roots[0];

      for (let commitIndex = 0; commitIndex < 2; commitIndex++) {
        renderFinished = false;

        utils.act(() => {
          TestRenderer.create(
            <Validator commitIndex={commitIndex} rootID={rootID} />
          );
        });

        expect(renderFinished).toBe(true);
      }

      expect(renderFinished).toBe(true);
    });
  });

  describe('ranked chart', () => {
    it('should contain valid data', () => {
      const Parent = ({ count }) => {
        Scheduler.advanceTime(10);
        return (
          <React.Fragment>
            <Child key="first" duration={3} />
            <Child key="second" duration={2} />
            <Child key="third" duration={0} />
          </React.Fragment>
        );
      };

      // Memoize children to verify that chart doesn't include in the update.
      const Child = React.memo(function Child({ duration }) {
        Scheduler.advanceTime(duration);
        return null;
      });

      const container = document.createElement('div');

      utils.act(() => store.profilerStore.startProfiling());
      utils.act(() =>
        SchedulerTracing.unstable_trace('mount', Scheduler.unstable_now(), () =>
          ReactDOM.render(<Parent />, container)
        )
      );
      utils.act(() =>
        SchedulerTracing.unstable_trace(
          'update',
          Scheduler.unstable_now(),
          () => ReactDOM.render(<Parent />, container)
        )
      );
      utils.act(() => store.profilerStore.stopProfiling());

      let renderFinished = false;

      function Validator({ commitIndex, rootID }) {
        const commitTree = store.profilerStore.profilingCache.getCommitTree({
          commitIndex,
          rootID,
        });
        const chartData = store.profilerStore.profilingCache.getRankedChartData(
          {
            commitIndex,
            commitTree,
            rootID,
          }
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
            <Validator commitIndex={commitIndex} rootID={rootID} />
          );
        });

        expect(renderFinished).toBe(true);
      }
    });
  });

  describe('interactions', () => {
    it('should contain valid data', () => {
      const Parent = ({ count }) => {
        Scheduler.advanceTime(10);
        return (
          <React.Fragment>
            <Child key="first" duration={3} />
            <Child key="second" duration={2} />
            <Child key="third" duration={0} />
          </React.Fragment>
        );
      };

      // Memoize children to verify that chart doesn't include in the update.
      const Child = React.memo(function Child({ duration }) {
        Scheduler.advanceTime(duration);
        return null;
      });

      const container = document.createElement('div');

      utils.act(() => store.profilerStore.startProfiling());
      utils.act(() =>
        SchedulerTracing.unstable_trace('mount', Scheduler.unstable_now(), () =>
          ReactDOM.render(<Parent />, container)
        )
      );
      utils.act(() =>
        SchedulerTracing.unstable_trace(
          'update',
          Scheduler.unstable_now(),
          () => ReactDOM.render(<Parent />, container)
        )
      );
      utils.act(() => store.profilerStore.stopProfiling());

      let renderFinished = false;

      function Validator({ commitIndex, rootID }) {
        const chartData = store.profilerStore.profilingCache.getInteractionsChartData(
          {
            rootID,
          }
        );
        expect(chartData).toMatchSnapshot('Interactions');
        renderFinished = true;
        return null;
      }

      const rootID = store.roots[0];

      for (let commitIndex = 0; commitIndex < 2; commitIndex++) {
        renderFinished = false;

        utils.act(() => {
          TestRenderer.create(
            <Validator commitIndex={commitIndex} rootID={rootID} />
          );
        });

        expect(renderFinished).toBe(true);
      }
    });
  });
});
