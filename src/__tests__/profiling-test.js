// @flow

import type React from 'react';
import type ReactDOM from 'react-dom';
import typeof ReactTestRenderer from 'react-test-renderer';
import type Store from 'src/devtools/store';

describe('profiling', () => {
  let React: React;
  let ReactDOM: ReactDOM;
  let Scheduler;
  let SchedulerTracing;
  let TestRenderer: ReactTestRenderer;
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

  describe('ProfilingSummary', () => {
    it('should be collected for each commit', async done => {
      const Parent = ({ count }) => {
        Scheduler.advanceTime(10);
        return new Array(count)
          .fill(true)
          .map((_, index) => <Child key={index} />);
      };
      const Child = () => {
        Scheduler.advanceTime(2);
        return null;
      };

      const container = document.createElement('div');

      utils.act(() => ReactDOM.render(<Parent count={2} />, container));
      utils.act(() => store.startProfiling());
      utils.act(() => ReactDOM.render(<Parent count={3} />, container));
      utils.act(() => ReactDOM.render(<Parent count={1} />, container));
      utils.act(() => ReactDOM.render(<Parent count={0} />, container));
      utils.act(() => store.stopProfiling());

      function Suspender({ rendererID, rootID }) {
        const profilingSummary = store.profilingCache.ProfilingSummary.read({
          rendererID,
          rootID,
        });
        expect(profilingSummary).toMatchSnapshot('ProfilingSummary');
        return null;
      }

      const rendererID = utils.getRendererID();
      const rootID = store.roots[0];

      await utils.actSuspense(() =>
        TestRenderer.create(
          <React.Suspense fallback={null}>
            <Suspender rendererID={rendererID} rootID={rootID} />
          </React.Suspense>
        )
      );

      done();
    });
  });

  describe('CommitDetails', () => {
    it('should be collected for each commit', async done => {
      const Parent = ({ count }) => {
        Scheduler.advanceTime(10);
        return new Array(count)
          .fill(true)
          .map((_, index) => <Child key={index} />);
      };
      const Child = () => {
        Scheduler.advanceTime(2);
        return null;
      };

      const container = document.createElement('div');

      utils.act(() => store.startProfiling());
      utils.act(() => ReactDOM.render(<Parent count={2} />, container));
      utils.act(() => ReactDOM.render(<Parent count={3} />, container));
      utils.act(() => ReactDOM.render(<Parent count={1} />, container));
      utils.act(() => ReactDOM.render(<Parent count={0} />, container));
      utils.act(() => store.stopProfiling());

      function Suspender({ commitIndex, rendererID, rootID }) {
        const commitDetails = store.profilingCache.CommitDetails.read({
          commitIndex,
          rendererID,
          rootID,
        });
        expect(commitDetails).toMatchSnapshot(
          `CommitDetails commitIndex: ${commitIndex}`
        );
        return null;
      }

      const rendererID = utils.getRendererID();
      const rootID = store.roots[0];

      for (let commitIndex = 0; commitIndex <= 3; commitIndex++) {
        await utils.actSuspense(() =>
          TestRenderer.create(
            <React.Suspense fallback={null}>
              <Suspender
                commitIndex={commitIndex}
                rendererID={rendererID}
                rootID={rootID}
              />
            </React.Suspense>
          )
        );
      }

      done();
    });
  });

  describe('FiberCommits', () => {
    it('should be collected for each rendered fiber', async done => {
      const Parent = ({ count }) => {
        Scheduler.advanceTime(10);
        return new Array(count)
          .fill(true)
          .map((_, index) => <Child key={index} />);
      };
      const Child = () => {
        Scheduler.advanceTime(2);
        return null;
      };

      const container = document.createElement('div');

      utils.act(() => store.startProfiling());
      utils.act(() => ReactDOM.render(<Parent count={1} />, container));
      utils.act(() => ReactDOM.render(<Parent count={2} />, container));
      utils.act(() => ReactDOM.render(<Parent count={3} />, container));
      utils.act(() => store.stopProfiling());

      function Suspender({ fiberID, rendererID, rootID }) {
        const fiberCommits = store.profilingCache.FiberCommits.read({
          fiberID,
          rendererID,
          rootID,
        });
        expect(fiberCommits).toMatchSnapshot(
          `FiberCommits: element ${fiberID}`
        );
        return null;
      }

      const rendererID = utils.getRendererID();
      const rootID = store.roots[0];

      for (let index = 0; index < store.numElements; index++) {
        await utils.actSuspense(() => {
          const fiberID = store.getElementIDAtIndex(index);
          if (fiberID == null) {
            throw Error(`Unexpected null ID for element at index ${index}`);
          }
          TestRenderer.create(
            <React.Suspense fallback={null}>
              <Suspender
                fiberID={fiberID}
                rendererID={rendererID}
                rootID={rootID}
              />
            </React.Suspense>
          );
        });
      }

      done();
    });
  });

  describe('Interactions', () => {
    it('should be collected for every traced interaction', async done => {
      const Parent = ({ count }) => {
        Scheduler.advanceTime(10);
        return new Array(count)
          .fill(true)
          .map((_, index) => <Child key={index} />);
      };
      const Child = () => {
        Scheduler.advanceTime(2);
        return null;
      };

      const container = document.createElement('div');

      utils.act(() => store.startProfiling());
      utils.act(() =>
        SchedulerTracing.unstable_trace(
          'mount: one child',
          Scheduler.unstable_now(),
          () => ReactDOM.render(<Parent count={1} />, container)
        )
      );
      utils.act(() =>
        SchedulerTracing.unstable_trace(
          'update: two children',
          Scheduler.unstable_now(),
          () => ReactDOM.render(<Parent count={2} />, container)
        )
      );
      utils.act(() => store.stopProfiling());

      function Suspender({ rendererID, rootID }) {
        const interactions = store.profilingCache.Interactions.read({
          rendererID,
          rootID,
        });
        expect(interactions).toMatchSnapshot('Interactions');
        return null;
      }

      const rendererID = utils.getRendererID();
      const rootID = store.roots[0];

      await utils.actSuspense(() =>
        TestRenderer.create(
          <React.Suspense fallback={null}>
            <Suspender rendererID={rendererID} rootID={rootID} />
          </React.Suspense>
        )
      );

      done();
    });
  });

  it('should remove profiling data when roots are unmounted', async () => {
    const Parent = ({ count }) =>
      new Array(count).fill(true).map((_, index) => <Child key={index} />);
    const Child = () => <div>Hi!</div>;

    const containerA = document.createElement('div');
    const containerB = document.createElement('div');

    utils.act(() => {
      ReactDOM.render(<Parent key="A" count={3} />, containerA);
      ReactDOM.render(<Parent key="B" count={2} />, containerB);
    });

    utils.act(() => store.startProfiling());

    utils.act(() => {
      ReactDOM.render(<Parent key="A" count={4} />, containerA);
      ReactDOM.render(<Parent key="B" count={1} />, containerB);
    });

    utils.act(() => ReactDOM.unmountComponentAtNode(containerB));

    utils.act(() => ReactDOM.unmountComponentAtNode(containerA));

    utils.act(() => store.stopProfiling());

    // Assert all maps are empty
    store.assertExpectedRootMapSizes();
  });
});
