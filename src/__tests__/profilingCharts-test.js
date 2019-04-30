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

    React = require('react');
    ReactDOM = require('react-dom');
    Scheduler = require('scheduler');
    SchedulerTracing = require('scheduler/tracing');
    TestRenderer = utils.requireTestRenderer();
  });

  describe('flamegraph chart', () => {
    it('should contain valid data', async done => {
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

      utils.act(() => store.startProfiling());
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
      utils.act(() => store.stopProfiling());

      let suspenseResolved = false;

      function Suspender({ commitIndex, rendererID, rootID }) {
        const profilingSummary = store.profilingCache.ProfilingSummary.read({
          rendererID,
          rootID,
        });
        const commitDetails = store.profilingCache.CommitDetails.read({
          commitIndex,
          rendererID,
          rootID,
        });
        suspenseResolved = true;
        const commitTree = store.profilingCache.getCommitTree({
          commitIndex,
          profilingSummary,
        });
        const chartData = store.profilingCache.getFlamegraphChartData({
          commitDetails,
          commitIndex,
          commitTree,
        });
        expect(commitTree).toMatchSnapshot(`${commitIndex}: CommitTree`);
        expect(chartData).toMatchSnapshot(
          `${commitIndex}: FlamegraphChartData`
        );
        return null;
      }

      const rendererID = utils.getRendererID();
      const rootID = store.roots[0];

      for (let commitIndex = 0; commitIndex < 2; commitIndex++) {
        suspenseResolved = false;

        await utils.actAsync(
          () =>
            TestRenderer.create(
              <React.Suspense fallback={null}>
                <Suspender
                  commitIndex={commitIndex}
                  rendererID={rendererID}
                  rootID={rootID}
                />
              </React.Suspense>
            ),
          3
        );

        expect(suspenseResolved).toBe(true);
      }

      expect(suspenseResolved).toBe(true);

      done();
    });
  });

  describe('ranked chart', () => {
    it('should contain valid data', async done => {
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

      utils.act(() => store.startProfiling());
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
      utils.act(() => store.stopProfiling());

      let suspenseResolved = false;

      function Suspender({ commitIndex, rendererID, rootID }) {
        const profilingSummary = store.profilingCache.ProfilingSummary.read({
          rendererID,
          rootID,
        });
        const commitDetails = store.profilingCache.CommitDetails.read({
          commitIndex,
          rendererID,
          rootID,
        });
        suspenseResolved = true;
        const commitTree = store.profilingCache.getCommitTree({
          commitIndex,
          profilingSummary,
        });
        const chartData = store.profilingCache.getRankedChartData({
          commitDetails,
          commitIndex,
          commitTree,
        });
        expect(commitTree).toMatchSnapshot(`${commitIndex}: CommitTree`);
        expect(chartData).toMatchSnapshot(`${commitIndex}: RankedChartData`);
        return null;
      }

      const rendererID = utils.getRendererID();
      const rootID = store.roots[0];

      for (let commitIndex = 0; commitIndex < 2; commitIndex++) {
        suspenseResolved = false;

        await utils.actAsync(
          () =>
            TestRenderer.create(
              <React.Suspense fallback={null}>
                <Suspender
                  commitIndex={commitIndex}
                  rendererID={rendererID}
                  rootID={rootID}
                />
              </React.Suspense>
            ),
          3
        );

        expect(suspenseResolved).toBe(true);
      }

      done();
    });
  });

  describe('interactions', () => {
    it('should contain valid data', async done => {
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

      utils.act(() => store.startProfiling());
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
      utils.act(() => store.stopProfiling());

      let suspenseResolved = false;

      function Suspender({ commitIndex, rendererID, rootID }) {
        const profilingSummary = store.profilingCache.ProfilingSummary.read({
          rendererID,
          rootID,
        });
        const { interactions } = store.profilingCache.Interactions.read({
          rendererID,
          rootID,
        });
        suspenseResolved = true;
        const chartData = store.profilingCache.getInteractionsChartData({
          interactions,
          profilingSummary,
        });
        expect(chartData).toMatchSnapshot('Interactions');
        return null;
      }

      const rendererID = utils.getRendererID();
      const rootID = store.roots[0];

      for (let commitIndex = 0; commitIndex < 2; commitIndex++) {
        suspenseResolved = false;

        await utils.actAsync(
          () =>
            TestRenderer.create(
              <React.Suspense fallback={null}>
                <Suspender
                  commitIndex={commitIndex}
                  rendererID={rendererID}
                  rootID={rootID}
                />
              </React.Suspense>
            ),
          3
        );

        expect(suspenseResolved).toBe(true);
      }

      done();
    });
  });
});
