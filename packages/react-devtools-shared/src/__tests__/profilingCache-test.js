/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof ReactTestRenderer from 'react-test-renderer';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type Store from 'react-devtools-shared/src/devtools/store';

describe('ProfilingCache', () => {
  let PropTypes;
  let React;
  let ReactDOM;
  let Scheduler;
  let SchedulerTracing;
  let TestRenderer: ReactTestRenderer;
  let bridge: FrontendBridge;
  let store: Store;
  let utils;

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    bridge = global.bridge;
    store = global.store;
    store.collapseNodesByDefault = false;
    store.recordChangeDescriptions = true;

    PropTypes = require('prop-types');
    React = require('react');
    ReactDOM = require('react-dom');
    Scheduler = require('scheduler');
    SchedulerTracing = require('scheduler/tracing');
    TestRenderer = utils.requireTestRenderer();
  });

  it('should collect data for each root (including ones added or mounted after profiling started)', () => {
    const Parent = ({count}) => {
      Scheduler.unstable_advanceTime(10);
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
    const Child = ({duration}) => {
      Scheduler.unstable_advanceTime(duration);
      return null;
    };
    const MemoizedChild = React.memo(Child);

    const containerA = document.createElement('div');
    const containerB = document.createElement('div');
    const containerC = document.createElement('div');

    utils.act(() => ReactDOM.render(<Parent count={2} />, containerA));
    utils.act(() => ReactDOM.render(<Parent count={1} />, containerB));
    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => ReactDOM.render(<Parent count={3} />, containerA));
    utils.act(() => ReactDOM.render(<Parent count={1} />, containerC));
    utils.act(() => ReactDOM.render(<Parent count={1} />, containerA));
    utils.act(() => ReactDOM.unmountComponentAtNode(containerB));
    utils.act(() => ReactDOM.render(<Parent count={0} />, containerA));
    utils.act(() => store.profilerStore.stopProfiling());

    const allProfilingDataForRoots = [];

    function Validator({previousProfilingDataForRoot, rootID}) {
      const profilingDataForRoot = store.profilerStore.getDataForRoot(rootID);
      if (previousProfilingDataForRoot != null) {
        expect(profilingDataForRoot).toEqual(previousProfilingDataForRoot);
      } else {
        expect(profilingDataForRoot).toMatchSnapshot(
          `Data for root ${profilingDataForRoot.displayName}`,
        );
      }
      allProfilingDataForRoots.push(profilingDataForRoot);
      return null;
    }

    const dataForRoots =
      store.profilerStore.profilingData !== null
        ? store.profilerStore.profilingData.dataForRoots
        : null;

    expect(dataForRoots).not.toBeNull();

    if (dataForRoots !== null) {
      dataForRoots.forEach(dataForRoot => {
        utils.act(() =>
          TestRenderer.create(
            <Validator
              previousProfilingDataForRoot={null}
              rootID={dataForRoot.rootID}
            />,
          ),
        );
      });
    }

    expect(allProfilingDataForRoots).toHaveLength(3);

    utils.exportImportHelper(bridge, store);

    allProfilingDataForRoots.forEach(profilingDataForRoot => {
      utils.act(() =>
        TestRenderer.create(
          <Validator
            previousProfilingDataForRoot={profilingDataForRoot}
            rootID={profilingDataForRoot.rootID}
          />,
        ),
      );
    });
  });

  it('should collect data for each commit', () => {
    const Parent = ({count}) => {
      Scheduler.unstable_advanceTime(10);
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
    const Child = ({duration}) => {
      Scheduler.unstable_advanceTime(duration);
      return null;
    };
    const MemoizedChild = React.memo(Child);

    const container = document.createElement('div');

    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => ReactDOM.render(<Parent count={2} />, container));
    utils.act(() => ReactDOM.render(<Parent count={3} />, container));
    utils.act(() => ReactDOM.render(<Parent count={1} />, container));
    utils.act(() => ReactDOM.render(<Parent count={0} />, container));
    utils.act(() => store.profilerStore.stopProfiling());

    const allCommitData = [];

    function Validator({commitIndex, previousCommitDetails, rootID}) {
      const commitData = store.profilerStore.getCommitData(rootID, commitIndex);
      if (previousCommitDetails != null) {
        expect(commitData).toEqual(previousCommitDetails);
      } else {
        allCommitData.push(commitData);
        expect(commitData).toMatchSnapshot(
          `CommitDetails commitIndex: ${commitIndex}`,
        );
      }
      return null;
    }

    const rootID = store.roots[0];

    for (let commitIndex = 0; commitIndex < 4; commitIndex++) {
      utils.act(() => {
        TestRenderer.create(
          <Validator
            commitIndex={commitIndex}
            previousCommitDetails={null}
            rootID={rootID}
          />,
        );
      });
    }

    expect(allCommitData).toHaveLength(4);

    utils.exportImportHelper(bridge, store);

    for (let commitIndex = 0; commitIndex < 4; commitIndex++) {
      utils.act(() => {
        TestRenderer.create(
          <Validator
            commitIndex={commitIndex}
            previousCommitDetails={allCommitData[commitIndex]}
            rootID={rootID}
          />,
        );
      });
    }
  });

  it('should record changed props/state/context/hooks', () => {
    let instance = null;

    const ModernContext = React.createContext(0);

    class LegacyContextProvider extends React.Component<
      any,
      {|count: number|},
    > {
      static childContextTypes = {
        count: PropTypes.number,
      };
      state = {count: 0};
      getChildContext() {
        return this.state;
      }
      render() {
        instance = this;
        return (
          <ModernContext.Provider value={this.state.count}>
            <React.Fragment>
              <ModernContextConsumer />
              <LegacyContextConsumer />
            </React.Fragment>
          </ModernContext.Provider>
        );
      }
    }

    const FunctionComponentWithHooks = ({count}) => {
      React.useMemo(() => count, [count]);
      return null;
    };

    class ModernContextConsumer extends React.Component<any> {
      static contextType = ModernContext;
      render() {
        return <FunctionComponentWithHooks count={this.context} />;
      }
    }

    class LegacyContextConsumer extends React.Component<any> {
      static contextTypes = {
        count: PropTypes.number,
      };
      render() {
        return <FunctionComponentWithHooks count={this.context.count} />;
      }
    }

    const container = document.createElement('div');

    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => ReactDOM.render(<LegacyContextProvider />, container));
    expect(instance).not.toBeNull();
    utils.act(() => (instance: any).setState({count: 1}));
    utils.act(() =>
      ReactDOM.render(<LegacyContextProvider foo={123} />, container),
    );
    utils.act(() =>
      ReactDOM.render(<LegacyContextProvider bar="abc" />, container),
    );
    utils.act(() => ReactDOM.render(<LegacyContextProvider />, container));
    utils.act(() => store.profilerStore.stopProfiling());

    const allCommitData = [];

    function Validator({commitIndex, previousCommitDetails, rootID}) {
      const commitData = store.profilerStore.getCommitData(rootID, commitIndex);
      if (previousCommitDetails != null) {
        expect(commitData).toEqual(previousCommitDetails);
      } else {
        allCommitData.push(commitData);
        expect(commitData).toMatchSnapshot(
          `CommitDetails commitIndex: ${commitIndex}`,
        );
      }
      return null;
    }

    const rootID = store.roots[0];

    for (let commitIndex = 0; commitIndex < 5; commitIndex++) {
      utils.act(() => {
        TestRenderer.create(
          <Validator
            commitIndex={commitIndex}
            previousCommitDetails={null}
            rootID={rootID}
          />,
        );
      });
    }

    expect(allCommitData).toHaveLength(5);

    utils.exportImportHelper(bridge, store);

    for (let commitIndex = 0; commitIndex < 5; commitIndex++) {
      utils.act(() => {
        TestRenderer.create(
          <Validator
            commitIndex={commitIndex}
            previousCommitDetails={allCommitData[commitIndex]}
            rootID={rootID}
          />,
        );
      });
    }
  });

  it('should properly detect changed hooks', () => {
    const Context = React.createContext(0);

    function reducer(state, action) {
      switch (action.type) {
        case 'invert':
          return {value: !state.value};
        default:
          throw new Error();
      }
    }

    let dispatch = null;
    let setState = null;

    const Component = ({count, string}) => {
      // These hooks may change and initiate re-renders.
      setState = React.useState('abc')[1];
      dispatch = React.useReducer(reducer, {value: true})[1];

      // This hook's return value may change between renders,
      // but the hook itself isn't stateful.
      React.useContext(Context);

      // These hooks and their dependencies may not change between renders.
      // We're using them to ensure that they don't trigger false positives.
      React.useCallback(() => () => {}, [string]);
      React.useMemo(() => string, [string]);

      // These hooks never "change".
      React.useEffect(() => {}, [string]);
      React.useLayoutEffect(() => {}, [string]);

      return null;
    };

    const container = document.createElement('div');

    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() =>
      ReactDOM.render(
        <Context.Provider value={true}>
          <Component count={1} />
        </Context.Provider>,
        container,
      ),
    );

    // Second render has no changed hooks, only changed props.
    utils.act(() =>
      ReactDOM.render(
        <Context.Provider value={true}>
          <Component count={2} />
        </Context.Provider>,
        container,
      ),
    );

    // Third render has a changed reducer hook
    utils.act(() => dispatch({type: 'invert'}));

    // Fourth render has a changed state hook
    utils.act(() => setState('def'));

    // Fifth render has a changed context value, but no changed hook.
    // Technically, DevTools will miss this "context" change since it only tracks legacy context.
    utils.act(() =>
      ReactDOM.render(
        <Context.Provider value={false}>
          <Component count={2} />
        </Context.Provider>,
        container,
      ),
    );

    utils.act(() => store.profilerStore.stopProfiling());

    const allCommitData = [];

    function Validator({commitIndex, previousCommitDetails, rootID}) {
      const commitData = store.profilerStore.getCommitData(rootID, commitIndex);
      if (previousCommitDetails != null) {
        expect(commitData).toEqual(previousCommitDetails);
      } else {
        allCommitData.push(commitData);
        expect(commitData).toMatchSnapshot(
          `CommitDetails commitIndex: ${commitIndex}`,
        );
      }
      return null;
    }

    const rootID = store.roots[0];

    for (let commitIndex = 0; commitIndex < 5; commitIndex++) {
      utils.act(() => {
        TestRenderer.create(
          <Validator
            commitIndex={commitIndex}
            previousCommitDetails={null}
            rootID={rootID}
          />,
        );
      });
    }

    expect(allCommitData).toHaveLength(5);

    // Export and re-import profile data and make sure it is retained.
    utils.exportImportHelper(bridge, store);

    for (let commitIndex = 0; commitIndex < 5; commitIndex++) {
      utils.act(() => {
        TestRenderer.create(
          <Validator
            commitIndex={commitIndex}
            previousCommitDetails={allCommitData[commitIndex]}
            rootID={rootID}
          />,
        );
      });
    }
  });

  it('should calculate a self duration based on actual children (not filtered children)', () => {
    store.componentFilters = [utils.createDisplayNameFilter('^Parent$')];

    const Grandparent = () => {
      Scheduler.unstable_advanceTime(10);
      return (
        <React.Fragment>
          <Parent key="one" />
          <Parent key="two" />
        </React.Fragment>
      );
    };
    const Parent = () => {
      Scheduler.unstable_advanceTime(2);
      return <Child />;
    };
    const Child = () => {
      Scheduler.unstable_advanceTime(1);
      return null;
    };

    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() =>
      ReactDOM.render(<Grandparent />, document.createElement('div')),
    );
    utils.act(() => store.profilerStore.stopProfiling());

    let commitData = null;

    function Validator({commitIndex, rootID}) {
      commitData = store.profilerStore.getCommitData(rootID, commitIndex);
      expect(commitData).toMatchSnapshot(
        `CommitDetails with filtered self durations`,
      );
      return null;
    }

    const rootID = store.roots[0];

    utils.act(() => {
      TestRenderer.create(<Validator commitIndex={0} rootID={rootID} />);
    });

    expect(commitData).not.toBeNull();
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
      Scheduler.unstable_advanceTime(10);
      return (
        <React.Suspense fallback={<Fallback />}>
          <Async />
        </React.Suspense>
      );
    };
    const Fallback = () => {
      Scheduler.unstable_advanceTime(2);
      return 'Fallback...';
    };
    const Async = () => {
      Scheduler.unstable_advanceTime(3);
      return getData();
    };

    utils.act(() => store.profilerStore.startProfiling());
    await utils.actAsync(() =>
      ReactDOM.render(<Parent />, document.createElement('div')),
    );
    utils.act(() => store.profilerStore.stopProfiling());

    const allCommitData = [];

    function Validator({commitIndex, rootID}) {
      const commitData = store.profilerStore.getCommitData(rootID, commitIndex);
      allCommitData.push(commitData);
      expect(commitData).toMatchSnapshot(
        `CommitDetails with filtered self durations`,
      );
      return null;
    }

    const rootID = store.roots[0];

    for (let commitIndex = 0; commitIndex < 2; commitIndex++) {
      utils.act(() => {
        TestRenderer.create(
          <Validator commitIndex={commitIndex} rootID={rootID} />,
        );
      });
    }

    expect(allCommitData).toHaveLength(2);

    done();
  });

  it('should collect data for each rendered fiber', () => {
    const Parent = ({count}) => {
      Scheduler.unstable_advanceTime(10);
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
    const Child = ({duration}) => {
      Scheduler.unstable_advanceTime(duration);
      return null;
    };
    const MemoizedChild = React.memo(Child);

    const container = document.createElement('div');

    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => ReactDOM.render(<Parent count={1} />, container));
    utils.act(() => ReactDOM.render(<Parent count={2} />, container));
    utils.act(() => ReactDOM.render(<Parent count={3} />, container));
    utils.act(() => store.profilerStore.stopProfiling());

    const allFiberCommits = [];

    function Validator({fiberID, previousFiberCommits, rootID}) {
      const fiberCommits = store.profilerStore.profilingCache.getFiberCommits({
        fiberID,
        rootID,
      });
      if (previousFiberCommits != null) {
        expect(fiberCommits).toEqual(previousFiberCommits);
      } else {
        allFiberCommits.push(fiberCommits);
        expect(fiberCommits).toMatchSnapshot(
          `FiberCommits: element ${fiberID}`,
        );
      }
      return null;
    }

    const rootID = store.roots[0];

    for (let index = 0; index < store.numElements; index++) {
      utils.act(() => {
        const fiberID = store.getElementIDAtIndex(index);
        if (fiberID == null) {
          throw Error(`Unexpected null ID for element at index ${index}`);
        }
        TestRenderer.create(
          <Validator
            fiberID={fiberID}
            previousFiberCommits={null}
            rootID={rootID}
          />,
        );
      });
    }

    expect(allFiberCommits).toHaveLength(store.numElements);

    utils.exportImportHelper(bridge, store);

    for (let index = 0; index < store.numElements; index++) {
      utils.act(() => {
        const fiberID = store.getElementIDAtIndex(index);
        if (fiberID == null) {
          throw Error(`Unexpected null ID for element at index ${index}`);
        }
        TestRenderer.create(
          <Validator
            fiberID={fiberID}
            previousFiberCommits={allFiberCommits[index]}
            rootID={rootID}
          />,
        );
      });
    }
  });

  it('should report every traced interaction', () => {
    const Parent = ({count}) => {
      Scheduler.unstable_advanceTime(10);
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
    const Child = ({duration}) => {
      Scheduler.unstable_advanceTime(duration);
      return null;
    };
    const MemoizedChild = React.memo(Child);

    const container = document.createElement('div');

    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() =>
      SchedulerTracing.unstable_trace(
        'mount: one child',
        Scheduler.unstable_now(),
        () => ReactDOM.render(<Parent count={1} />, container),
      ),
    );
    utils.act(() =>
      SchedulerTracing.unstable_trace(
        'update: two children',
        Scheduler.unstable_now(),
        () => ReactDOM.render(<Parent count={2} />, container),
      ),
    );
    utils.act(() => store.profilerStore.stopProfiling());

    let interactions = null;

    function Validator({previousInteractions, rootID}) {
      interactions = store.profilerStore.profilingCache.getInteractionsChartData(
        {
          rootID,
        },
      ).interactions;
      if (previousInteractions != null) {
        expect(interactions).toEqual(previousInteractions);
      } else {
        expect(interactions).toMatchSnapshot('Interactions');
      }
      return null;
    }

    const rootID = store.roots[0];

    utils.act(() =>
      TestRenderer.create(
        <Validator previousInteractions={null} rootID={rootID} />,
      ),
    );

    expect(interactions).not.toBeNull();

    utils.exportImportHelper(bridge, store);

    utils.act(() =>
      TestRenderer.create(
        <Validator previousInteractions={interactions} rootID={rootID} />,
      ),
    );
  });
});
