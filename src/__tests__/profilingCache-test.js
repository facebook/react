// @flow

import typeof ReactTestRenderer from 'react-test-renderer';
import type Bridge from 'src/bridge';
import type Store from 'src/devtools/store';

describe('ProfilingCache', () => {
  let React;
  let ReactDOM;
  let Scheduler;
  let SchedulerTracing;
  let TestRenderer: ReactTestRenderer;
  let bridge: Bridge;
  let store: Store;
  let utils;

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

  it('should collect data for each root', async done => {
    const Parent = ({ count }) => {
      Scheduler.advanceTime(10);
      const children = new Array(count)
        .fill(true)
        .map((_, index) => <Child key={index} duration={index} />);
      return (
        <React.Fragment>
          {children}
          <MemoizedChild duration={1} />
        </React.Fragment>
      );
    };
    const Child = ({ duration }) => {
      Scheduler.advanceTime(duration);
      return null;
    };
    const MemoizedChild = React.memo(Child);

    const container = document.createElement('div');

    utils.act(() => ReactDOM.render(<Parent count={2} />, container));
    utils.act(() => store.startProfiling());
    utils.act(() => ReactDOM.render(<Parent count={3} />, container));
    utils.act(() => ReactDOM.render(<Parent count={1} />, container));
    utils.act(() => ReactDOM.render(<Parent count={0} />, container));
    utils.act(() => store.stopProfiling());

    let profilingDataForRoot = null;

    // TODO (profarc) Add multi roots

    function Suspender({ previousProfilingDataForRoot, rootID }) {
      profilingDataForRoot = store.profilerStore.getDataForRoot(rootID);
      if (previousProfilingDataForRoot != null) {
        expect(profilingDataForRoot).toEqual(previousProfilingDataForRoot);
      } else {
        expect(profilingDataForRoot).toMatchSnapshot('ProfilingSummary');
      }
      return null;
    }

    const rootID = store.roots[0];

    await utils.actAsync(() =>
      TestRenderer.create(
        <React.Suspense fallback={null}>
          <Suspender previousProfilingDataForRoot={null} rootID={rootID} />
        </React.Suspense>
      )
    );

    expect(profilingDataForRoot).not.toBeNull();

    utils.exportImportHelper(bridge, store, rootID);

    await utils.actAsync(() =>
      TestRenderer.create(
        <React.Suspense fallback={null}>
          <Suspender
            previousProfilingDataForRoot={profilingDataForRoot}
            rootID={rootID}
          />
        </React.Suspense>
      )
    );

    done();
  });

  it('should collect data for each commit', async done => {
    const Parent = ({ count }) => {
      Scheduler.advanceTime(10);
      const children = new Array(count)
        .fill(true)
        .map((_, index) => <Child key={index} duration={index} />);
      return (
        <React.Fragment>
          {children}
          <MemoizedChild duration={1} />
        </React.Fragment>
      );
    };
    const Child = ({ duration }) => {
      Scheduler.advanceTime(duration);
      return null;
    };
    const MemoizedChild = React.memo(Child);

    const container = document.createElement('div');

    utils.act(() => store.startProfiling());
    utils.act(() => ReactDOM.render(<Parent count={2} />, container));
    utils.act(() => ReactDOM.render(<Parent count={3} />, container));
    utils.act(() => ReactDOM.render(<Parent count={1} />, container));
    utils.act(() => ReactDOM.render(<Parent count={0} />, container));
    utils.act(() => store.stopProfiling());

    const allCommitData = [];

    function Suspender({ commitIndex, previousCommitDetails, rootID }) {
      const commitData = store.profilerStore.getCommitData(rootID, commitIndex);
      if (previousCommitDetails != null) {
        expect(commitData).toEqual(previousCommitDetails);
      } else {
        allCommitData.push(commitData);
        expect(commitData).toMatchSnapshot(
          `CommitDetails commitIndex: ${commitIndex}`
        );
      }
      return null;
    }

    const rootID = store.roots[0];

    for (let commitIndex = 0; commitIndex < 4; commitIndex++) {
      await utils.actAsync(() => {
        TestRenderer.create(
          <React.Suspense fallback={null}>
            <Suspender
              commitIndex={commitIndex}
              previousCommitDetails={null}
              rootID={rootID}
            />
          </React.Suspense>
        );
      });
    }

    expect(allCommitData).toHaveLength(4);

    utils.exportImportHelper(bridge, store, rootID);

    for (let commitIndex = 0; commitIndex < 4; commitIndex++) {
      await utils.actAsync(() => {
        TestRenderer.create(
          <React.Suspense fallback={null}>
            <Suspender
              commitIndex={commitIndex}
              previousCommitDetails={allCommitData[commitIndex]}
              rootID={rootID}
            />
          </React.Suspense>
        );
      });
    }

    done();
  });

  it('should calculate a self duration based on actual children (not filtered children)', async done => {
    store.componentFilters = [utils.createDisplayNameFilter('^Parent$')];

    const Grandparent = () => {
      Scheduler.advanceTime(10);
      return (
        <React.Fragment>
          <Parent key="one" />
          <Parent key="two" />
        </React.Fragment>
      );
    };
    const Parent = () => {
      Scheduler.advanceTime(2);
      return <Child />;
    };
    const Child = () => {
      Scheduler.advanceTime(1);
      return null;
    };

    utils.act(() => store.startProfiling());
    utils.act(() =>
      ReactDOM.render(<Grandparent />, document.createElement('div'))
    );
    utils.act(() => store.stopProfiling());

    let commitData = null;

    function Suspender({ commitIndex, rootID }) {
      commitData = store.profilerStore.getCommitData(rootID, commitIndex);
      expect(commitData).toMatchSnapshot(
        `CommitDetails with filtered self durations`
      );
      return null;
    }

    const rootID = store.roots[0];

    await utils.actAsync(() => {
      TestRenderer.create(
        <React.Suspense fallback={null}>
          <Suspender commitIndex={0} rootID={rootID} />
        </React.Suspense>
      );
    });

    expect(commitData).not.toBeNull();

    done();
  });

  it('should calculate self duration correctly for suspended views', async done => {
    let data;
    const getData = () => {
      if (data) {
        return data;
      } else {
        throw new Promise(resolve => {
          data = 'abc';
          resolve(data);
        });
      }
    };

    const Parent = () => {
      Scheduler.advanceTime(10);
      return (
        <React.Suspense fallback={<Fallback />}>
          <Async />
        </React.Suspense>
      );
    };
    const Fallback = () => {
      Scheduler.advanceTime(2);
      return 'Fallback...';
    };
    const Async = () => {
      Scheduler.advanceTime(3);
      const data = getData();
      return data;
    };

    utils.act(() => store.startProfiling());
    await utils.actAsync(() =>
      ReactDOM.render(<Parent />, document.createElement('div'))
    );
    utils.act(() => store.stopProfiling());

    const allCommitData = [];

    function Suspender({ commitIndex, rootID }) {
      const commitData = store.profilerStore.getCommitData(rootID, commitIndex);
      allCommitData.push(commitData);
      expect(commitData).toMatchSnapshot(
        `CommitDetails with filtered self durations`
      );
      return null;
    }

    const rootID = store.roots[0];

    for (let commitIndex = 0; commitIndex < 2; commitIndex++) {
      await utils.actAsync(() => {
        TestRenderer.create(
          <React.Suspense fallback={null}>
            <Suspender commitIndex={commitIndex} rootID={rootID} />
          </React.Suspense>
        );
      });
    }

    expect(allCommitData).toHaveLength(2);

    done();
  });

  it('should collect data for each rendered fiber', async done => {
    const Parent = ({ count }) => {
      Scheduler.advanceTime(10);
      const children = new Array(count)
        .fill(true)
        .map((_, index) => <Child key={index} duration={index} />);
      return (
        <React.Fragment>
          {children}
          <MemoizedChild duration={1} />
        </React.Fragment>
      );
    };
    const Child = ({ duration }) => {
      Scheduler.advanceTime(duration);
      return null;
    };
    const MemoizedChild = React.memo(Child);

    const container = document.createElement('div');

    utils.act(() => store.startProfiling());
    utils.act(() => ReactDOM.render(<Parent count={1} />, container));
    utils.act(() => ReactDOM.render(<Parent count={2} />, container));
    utils.act(() => ReactDOM.render(<Parent count={3} />, container));
    utils.act(() => store.stopProfiling());

    const allFiberCommits = [];

    function Suspender({ fiberID, previousFiberCommits, rootID }) {
      const fiberCommits = store.profilingCache.getFiberCommits({
        fiberID,
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

    const rootID = store.roots[0];

    for (let index = 0; index < store.numElements; index++) {
      await utils.actAsync(() => {
        const fiberID = store.getElementIDAtIndex(index);
        if (fiberID == null) {
          throw Error(`Unexpected null ID for element at index ${index}`);
        }
        TestRenderer.create(
          <React.Suspense fallback={null}>
            <Suspender
              fiberID={fiberID}
              previousFiberCommits={null}
              rootID={rootID}
            />
          </React.Suspense>
        );
      });
    }

    expect(allFiberCommits).toHaveLength(store.numElements);

    utils.exportImportHelper(bridge, store, rootID);

    for (let index = 0; index < store.numElements; index++) {
      await utils.actAsync(() => {
        const fiberID = store.getElementIDAtIndex(index);
        if (fiberID == null) {
          throw Error(`Unexpected null ID for element at index ${index}`);
        }
        TestRenderer.create(
          <React.Suspense fallback={null}>
            <Suspender
              fiberID={fiberID}
              previousFiberCommits={allFiberCommits[index]}
              rootID={rootID}
            />
          </React.Suspense>
        );
      });
    }

    done();
  });

  it('should report every traced interaction', async done => {
    const Parent = ({ count }) => {
      Scheduler.advanceTime(10);
      const children = new Array(count)
        .fill(true)
        .map((_, index) => <Child key={index} duration={index} />);
      return (
        <React.Fragment>
          {children}
          <MemoizedChild duration={1} />
        </React.Fragment>
      );
    };
    const Child = ({ duration }) => {
      Scheduler.advanceTime(duration);
      return null;
    };
    const MemoizedChild = React.memo(Child);

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

    function Suspender({ previousInteractions, rootID }) {
      interactions = store.profilingCache.getInteractionsChartData({
        rootID,
      }).interactions;
      if (previousInteractions != null) {
        expect(interactions).toEqual(previousInteractions);
      } else {
        expect(interactions).toMatchSnapshot('Interactions');
      }
      return null;
    }

    const rootID = store.roots[0];

    await utils.actAsync(() =>
      TestRenderer.create(
        <React.Suspense fallback={null}>
          <Suspender previousInteractions={null} rootID={rootID} />
        </React.Suspense>
      )
    );

    expect(interactions).not.toBeNull();

    utils.exportImportHelper(bridge, store, rootID);

    await utils.actAsync(() =>
      TestRenderer.create(
        <React.Suspense fallback={null}>
          <Suspender previousInteractions={interactions} rootID={rootID} />
        </React.Suspense>
      )
    );

    done();
  });
});
