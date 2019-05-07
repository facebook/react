// @flow

import typeof ReactTestRenderer from 'react-test-renderer';
import type Bridge from 'src/bridge';
import type Store from 'src/devtools/store';

describe('profiling', () => {
  let React;
  let ReactDOM;
  let Scheduler;
  let SchedulerTracing;
  let TestRenderer: ReactTestRenderer;
  let bridge: Bridge;
  let store: Store;
  let utils;

  const exportImportHelper = (rendererID: number, rootID: number) => {
    const {
      prepareProfilingExport,
      prepareProfilingImport,
    } = require('src/devtools/views/Profiler/utils');

    let exportedProfilingSummary;
    bridge.addListener('exportFile', ({ contents }) => {
      exportedProfilingSummary = contents;
    });

    utils.act(() => {
      const exportProfilingSummary = prepareProfilingExport(
        store.profilingOperations,
        store.profilingSnapshots,
        rootID,
        rendererID
      );
      bridge.send('exportProfilingSummary', exportProfilingSummary);
    });

    expect(exportedProfilingSummary).toBeDefined();

    const importedProfilingSummary = prepareProfilingImport(
      ((exportedProfilingSummary: any): string)
    );

    // Sanity check that profiling snapshots are serialized correctly.
    expect(store.profilingSnapshots.get(rootID)).toEqual(
      importedProfilingSummary.profilingSnapshots.get(rootID)
    );

    // Snapshot the JSON-parsed object, rather than the raw string, because Jest formats the diff nicer.
    expect(importedProfilingSummary).toMatchSnapshot('exported data');

    utils.act(() => {
      store.importedProfilingData = importedProfilingSummary;
    });
  };

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    bridge = global.bridge;
    store = global.store;
    store.collapseNodesByDefault = false;

    React = require('react');
    ReactDOM = require('react-dom');
    Scheduler = require('scheduler');
    SchedulerTracing = require('scheduler/tracing');
    TestRenderer = utils.requireTestRenderer();
  });

  it('should throw if importing older/unsupported data', () => {
    const {
      prepareProfilingImport,
    } = require('src/devtools/views/Profiler/utils');
    expect(() =>
      prepareProfilingImport(
        JSON.stringify({
          version: 0,
        })
      )
    ).toThrow('Unsupported profiler export version "0"');
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

      let profilingSummary = null;

      function Suspender({ previousPofilingSummary, rendererID, rootID }) {
        profilingSummary = store.profilingCache.ProfilingSummary.read({
          rendererID,
          rootID,
        });
        if (previousPofilingSummary != null) {
          expect(profilingSummary).toEqual(previousPofilingSummary);
        } else {
          expect(profilingSummary).toMatchSnapshot('ProfilingSummary');
        }
        return null;
      }

      const rendererID = utils.getRendererID();
      const rootID = store.roots[0];

      await utils.actSuspense(() =>
        TestRenderer.create(
          <React.Suspense fallback={null}>
            <Suspender
              previousPofilingSummary={null}
              rendererID={rendererID}
              rootID={rootID}
            />
          </React.Suspense>
        )
      );

      expect(profilingSummary).not.toBeNull();

      exportImportHelper(rendererID, rootID);

      await utils.actSuspense(() =>
        TestRenderer.create(
          <React.Suspense fallback={null}>
            <Suspender
              previousPofilingSummary={profilingSummary}
              rendererID={rendererID}
              rootID={rootID}
            />
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

      const allCommitDetails = [];

      function Suspender({
        commitIndex,
        previousCommitDetails,
        rendererID,
        rootID,
      }) {
        const commitDetails = store.profilingCache.CommitDetails.read({
          commitIndex,
          rendererID,
          rootID,
        });
        if (previousCommitDetails != null) {
          expect(commitDetails).toEqual(previousCommitDetails);
        } else {
          allCommitDetails.push(commitDetails);
          expect(commitDetails).toMatchSnapshot(
            `CommitDetails commitIndex: ${commitIndex}`
          );
        }
        return null;
      }

      const rendererID = utils.getRendererID();
      const rootID = store.roots[0];

      for (let commitIndex = 0; commitIndex < 4; commitIndex++) {
        await utils.actSuspense(() => {
          TestRenderer.create(
            <React.Suspense fallback={null}>
              <Suspender
                commitIndex={commitIndex}
                previousCommitDetails={null}
                rendererID={rendererID}
                rootID={rootID}
              />
            </React.Suspense>
          );
        });
      }

      expect(allCommitDetails).toHaveLength(4);

      exportImportHelper(rendererID, rootID);

      for (let commitIndex = 0; commitIndex < 4; commitIndex++) {
        await utils.actSuspense(() => {
          TestRenderer.create(
            <React.Suspense fallback={null}>
              <Suspender
                commitIndex={commitIndex}
                previousCommitDetails={allCommitDetails[commitIndex]}
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

      const allFiberCommits = [];

      function Suspender({
        fiberID,
        previousFiberCommits,
        rendererID,
        rootID,
      }) {
        const fiberCommits = store.profilingCache.FiberCommits.read({
          fiberID,
          rendererID,
          rootID,
        });
        if (previousFiberCommits != null) {
          expect(fiberCommits).toEqual(previousFiberCommits);
        } else {
          allFiberCommits.push(fiberCommits);
          expect(fiberCommits).toMatchSnapshot(
            `FiberCommits: element ${fiberID}`
          );
        }
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
                previousFiberCommits={null}
                rendererID={rendererID}
                rootID={rootID}
              />
            </React.Suspense>
          );
        });
      }

      expect(allFiberCommits).toHaveLength(store.numElements);

      exportImportHelper(rendererID, rootID);

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
                previousFiberCommits={allFiberCommits[index]}
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

      let interactions = null;

      function Suspender({ previousInteractions, rendererID, rootID }) {
        interactions = store.profilingCache.Interactions.read({
          rendererID,
          rootID,
        });
        if (previousInteractions != null) {
          expect(interactions).toEqual(previousInteractions);
        } else {
          expect(interactions).toMatchSnapshot('Interactions');
        }
        return null;
      }

      const rendererID = utils.getRendererID();
      const rootID = store.roots[0];

      await utils.actSuspense(() =>
        TestRenderer.create(
          <React.Suspense fallback={null}>
            <Suspender
              previousInteractions={null}
              rendererID={rendererID}
              rootID={rootID}
            />
          </React.Suspense>
        )
      );

      expect(interactions).not.toBeNull();

      exportImportHelper(rendererID, rootID);

      await utils.actSuspense(() =>
        TestRenderer.create(
          <React.Suspense fallback={null}>
            <Suspender
              previousInteractions={interactions}
              rendererID={rendererID}
              rootID={rootID}
            />
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
