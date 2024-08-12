/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type Store from 'react-devtools-shared/src/devtools/store';

import {getVersionedRenderImplementation} from './utils';

describe('ProfilingCache', () => {
  let PropTypes;
  let React;
  let ReactDOM;
  let ReactDOMClient;
  let Scheduler;
  let bridge: FrontendBridge;
  let legacyRender;
  let store: Store;
  let utils;

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    legacyRender = utils.legacyRender;

    bridge = global.bridge;
    store = global.store;
    store.collapseNodesByDefault = false;
    store.recordChangeDescriptions = true;

    PropTypes = require('prop-types');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    Scheduler = require('scheduler');
  });

  const {render, getContainer} = getVersionedRenderImplementation();

  // @reactVersion >= 16.9
  // @reactVersion <= 18.2
  it('should collect data for each root (including ones added or mounted after profiling started) (legacy render)', () => {
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

    const RootA = ({children}) => children;
    const RootB = ({children}) => children;
    const RootC = ({children}) => children;

    const containerA = document.createElement('div');
    const containerB = document.createElement('div');
    const containerC = document.createElement('div');

    utils.act(() =>
      legacyRender(
        <RootA>
          <Parent count={2} />
        </RootA>,
        containerA,
      ),
    );
    utils.act(() =>
      legacyRender(
        <RootB>
          <Parent count={1} />
        </RootB>,
        containerB,
      ),
    );
    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() =>
      legacyRender(
        <RootA>
          <Parent count={3} />
        </RootA>,
        containerA,
      ),
    );
    utils.act(() =>
      legacyRender(
        <RootC>
          <Parent count={1} />
        </RootC>,
        containerC,
      ),
    );
    utils.act(() =>
      legacyRender(
        <RootA>
          <Parent count={1} />
        </RootA>,
        containerA,
      ),
    );
    utils.act(() => ReactDOM.unmountComponentAtNode(containerB));
    utils.act(() =>
      legacyRender(
        <RootA>
          <Parent count={0} />
        </RootA>,
        containerA,
      ),
    );
    utils.act(() => store.profilerStore.stopProfiling());
    utils.act(() => ReactDOM.unmountComponentAtNode(containerA));

    const rootIDs = Array.from(
      store.profilerStore.profilingData.dataForRoots.values(),
    ).map(({rootID}) => rootID);
    expect(rootIDs).toHaveLength(3);

    const originalProfilingDataForRoot = [];

    let data = store.profilerStore.getDataForRoot(rootIDs[0]);
    expect(data.displayName).toMatchInlineSnapshot(`"RootA"`);
    expect(data.commitData).toHaveLength(3);
    originalProfilingDataForRoot.push(data);

    data = store.profilerStore.getDataForRoot(rootIDs[1]);
    expect(data.displayName).toMatchInlineSnapshot(`"RootC"`);
    expect(data.commitData).toHaveLength(1);
    originalProfilingDataForRoot.push(data);

    data = store.profilerStore.getDataForRoot(rootIDs[2]);
    expect(data.displayName).toMatchInlineSnapshot(`"RootB"`);
    expect(data.commitData).toHaveLength(1);
    originalProfilingDataForRoot.push(data);

    utils.exportImportHelper(bridge, store);

    rootIDs.forEach((rootID, index) => {
      const current = store.profilerStore.getDataForRoot(rootID);
      const prev = originalProfilingDataForRoot[index];
      expect(current).toEqual(prev);
    });
  });

  // @reactVersion >= 18
  it('should collect data for each root (including ones added or mounted after profiling started) (createRoot)', () => {
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

    const RootA = ({children}) => children;
    const RootB = ({children}) => children;
    const RootC = ({children}) => children;

    const containerA = document.createElement('div');
    const containerB = document.createElement('div');
    const containerC = document.createElement('div');

    const rootA = ReactDOMClient.createRoot(containerA);
    const rootB = ReactDOMClient.createRoot(containerB);
    const rootC = ReactDOMClient.createRoot(containerC);

    utils.act(() =>
      rootA.render(
        <RootA>
          <Parent count={2} />
        </RootA>,
      ),
    );
    utils.act(() =>
      rootB.render(
        <RootB>
          <Parent count={1} />
        </RootB>,
      ),
    );
    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() =>
      rootA.render(
        <RootA>
          <Parent count={3} />
        </RootA>,
      ),
    );
    utils.act(() =>
      rootC.render(
        <RootC>
          <Parent count={1} />
        </RootC>,
      ),
    );
    utils.act(() =>
      rootA.render(
        <RootA>
          <Parent count={1} />
        </RootA>,
      ),
    );
    utils.act(() => rootB.unmount());
    utils.act(() =>
      rootA.render(
        <RootA>
          <Parent count={0} />
        </RootA>,
      ),
    );
    utils.act(() => store.profilerStore.stopProfiling());
    utils.act(() => rootA.unmount());

    const rootIDs = Array.from(
      store.profilerStore.profilingData.dataForRoots.values(),
    ).map(({rootID}) => rootID);
    expect(rootIDs).toHaveLength(3);

    const originalProfilingDataForRoot = [];

    let data = store.profilerStore.getDataForRoot(rootIDs[0]);
    expect(data.displayName).toMatchInlineSnapshot(`"RootA"`);
    expect(data.commitData).toHaveLength(3);
    originalProfilingDataForRoot.push(data);

    data = store.profilerStore.getDataForRoot(rootIDs[1]);
    expect(data.displayName).toMatchInlineSnapshot(`"RootC"`);
    expect(data.commitData).toHaveLength(1);
    originalProfilingDataForRoot.push(data);

    data = store.profilerStore.getDataForRoot(rootIDs[2]);
    expect(data.displayName).toMatchInlineSnapshot(`"RootB"`);
    expect(data.commitData).toHaveLength(1);
    originalProfilingDataForRoot.push(data);

    utils.exportImportHelper(bridge, store);

    rootIDs.forEach((rootID, index) => {
      const current = store.profilerStore.getDataForRoot(rootID);
      const prev = originalProfilingDataForRoot[index];
      expect(current).toEqual(prev);
    });
  });

  // @reactVersion >= 16.9
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

    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => render(<Parent count={2} />));
    utils.act(() => render(<Parent count={3} />));
    utils.act(() => render(<Parent count={1} />));
    utils.act(() => render(<Parent count={0} />));
    utils.act(() => store.profilerStore.stopProfiling());

    const rootID = store.roots[0];

    const prevCommitData =
      store.profilerStore.getDataForRoot(rootID).commitData;
    expect(prevCommitData).toHaveLength(4);

    utils.exportImportHelper(bridge, store);

    const nextCommitData =
      store.profilerStore.getDataForRoot(rootID).commitData;
    expect(nextCommitData).toHaveLength(4);
    nextCommitData.forEach((commitData, index) => {
      expect(commitData).toEqual(prevCommitData[index]);
    });
  });

  // @reactVersion >= 16.9
  // @reactVersion <= 18.2
  it('should record changed props/state/context/hooks for React version [16.9; 18.2] with legacy context', () => {
    let instance = null;

    const ModernContext = React.createContext(0);

    class LegacyContextProvider extends React.Component<any, {count: number}> {
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

    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => render(<LegacyContextProvider />));
    expect(instance).not.toBeNull();
    utils.act(() => (instance: any).setState({count: 1}));
    utils.act(() => render(<LegacyContextProvider foo={123} />));
    utils.act(() => render(<LegacyContextProvider bar="abc" />));
    utils.act(() => render(<LegacyContextProvider />));
    utils.act(() => store.profilerStore.stopProfiling());

    const rootID = store.roots[0];

    let changeDescriptions = store.profilerStore
      .getDataForRoot(rootID)
      .commitData.map(commitData => commitData.changeDescriptions);
    expect(changeDescriptions).toHaveLength(5);
    expect(changeDescriptions[0]).toMatchInlineSnapshot(`
      Map {
        2 => {
          "context": null,
          "didHooksChange": false,
          "isFirstMount": true,
          "props": null,
          "state": null,
        },
        4 => {
          "context": null,
          "didHooksChange": false,
          "isFirstMount": true,
          "props": null,
          "state": null,
        },
        5 => {
          "context": null,
          "didHooksChange": false,
          "isFirstMount": true,
          "props": null,
          "state": null,
        },
        6 => {
          "context": null,
          "didHooksChange": false,
          "isFirstMount": true,
          "props": null,
          "state": null,
        },
        7 => {
          "context": null,
          "didHooksChange": false,
          "isFirstMount": true,
          "props": null,
          "state": null,
        },
      }
    `);
    expect(changeDescriptions[1]).toMatchInlineSnapshot(`
      Map {
        5 => {
          "context": null,
          "didHooksChange": false,
          "hooks": [],
          "isFirstMount": false,
          "props": [
            "count",
          ],
          "state": null,
        },
        4 => {
          "context": true,
          "didHooksChange": false,
          "hooks": null,
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
        7 => {
          "context": null,
          "didHooksChange": false,
          "hooks": [],
          "isFirstMount": false,
          "props": [
            "count",
          ],
          "state": null,
        },
        6 => {
          "context": [
            "count",
          ],
          "didHooksChange": false,
          "hooks": null,
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
        2 => {
          "context": null,
          "didHooksChange": false,
          "hooks": [],
          "isFirstMount": false,
          "props": [],
          "state": [
            "count",
          ],
        },
      }
    `);
    expect(changeDescriptions[2]).toMatchInlineSnapshot(`
      Map {
        5 => {
          "context": null,
          "didHooksChange": false,
          "hooks": [],
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
        4 => {
          "context": false,
          "didHooksChange": false,
          "hooks": null,
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
        7 => {
          "context": null,
          "didHooksChange": false,
          "hooks": [],
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
        6 => {
          "context": [],
          "didHooksChange": false,
          "hooks": null,
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
        2 => {
          "context": null,
          "didHooksChange": false,
          "hooks": [],
          "isFirstMount": false,
          "props": [
            "foo",
          ],
          "state": [],
        },
      }
    `);
    expect(changeDescriptions[3]).toMatchInlineSnapshot(`
      Map {
        5 => {
          "context": null,
          "didHooksChange": false,
          "hooks": [],
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
        4 => {
          "context": false,
          "didHooksChange": false,
          "hooks": null,
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
        7 => {
          "context": null,
          "didHooksChange": false,
          "hooks": [],
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
        6 => {
          "context": [],
          "didHooksChange": false,
          "hooks": null,
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
        2 => {
          "context": null,
          "didHooksChange": false,
          "hooks": [],
          "isFirstMount": false,
          "props": [
            "foo",
            "bar",
          ],
          "state": [],
        },
      }
    `);
    expect(changeDescriptions[4]).toMatchInlineSnapshot(`
      Map {
        5 => {
          "context": null,
          "didHooksChange": false,
          "hooks": [],
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
        4 => {
          "context": false,
          "didHooksChange": false,
          "hooks": null,
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
        7 => {
          "context": null,
          "didHooksChange": false,
          "hooks": [],
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
        6 => {
          "context": [],
          "didHooksChange": false,
          "hooks": null,
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
        2 => {
          "context": null,
          "didHooksChange": false,
          "hooks": [],
          "isFirstMount": false,
          "props": [
            "bar",
          ],
          "state": [],
        },
      }
    `);

    utils.exportImportHelper(bridge, store);

    const prevChangeDescriptions = [...changeDescriptions];

    changeDescriptions = store.profilerStore
      .getDataForRoot(rootID)
      .commitData.map(commitData => commitData.changeDescriptions);
    expect(changeDescriptions).toHaveLength(5);

    for (let commitIndex = 0; commitIndex < 5; commitIndex++) {
      expect(changeDescriptions[commitIndex]).toEqual(
        prevChangeDescriptions[commitIndex],
      );
    }
  });

  // @reactVersion > 18.2
  // @gate !disableLegacyContext
  it('should record changed props/state/context/hooks for React version (18.2; ∞) with legacy context enabled', () => {
    let instance = null;

    const ModernContext = React.createContext(0);

    class LegacyContextProvider extends React.Component<any, {count: number}> {
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

    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => render(<LegacyContextProvider />));
    expect(instance).not.toBeNull();
    utils.act(() => (instance: any).setState({count: 1}));
    utils.act(() => render(<LegacyContextProvider foo={123} />));
    utils.act(() => render(<LegacyContextProvider bar="abc" />));
    utils.act(() => render(<LegacyContextProvider />));
    utils.act(() => store.profilerStore.stopProfiling());

    const rootID = store.roots[0];

    let changeDescriptions = store.profilerStore
      .getDataForRoot(rootID)
      .commitData.map(commitData => commitData.changeDescriptions);
    expect(changeDescriptions).toHaveLength(5);
    expect(changeDescriptions[0]).toEqual(
      new Map([
        [
          2,
          {
            context: null,
            didHooksChange: false,
            isFirstMount: true,
            props: null,
            state: null,
          },
        ],
        [
          4,
          {
            context: null,
            didHooksChange: false,
            isFirstMount: true,
            props: null,
            state: null,
          },
        ],
        [
          5,
          {
            context: null,
            didHooksChange: false,
            isFirstMount: true,
            props: null,
            state: null,
          },
        ],
        [
          6,
          {
            context: null,
            didHooksChange: false,
            isFirstMount: true,
            props: null,
            state: null,
          },
        ],
        [
          7,
          {
            context: null,
            didHooksChange: false,
            isFirstMount: true,
            props: null,
            state: null,
          },
        ],
      ]),
    );

    expect(changeDescriptions[1]).toEqual(
      new Map([
        [
          5,
          {
            context: null,
            didHooksChange: false,
            hooks: [],
            isFirstMount: false,
            props: ['count'],
            state: null,
          },
        ],
        [
          4,
          {
            context: true,
            didHooksChange: false,
            hooks: null,
            isFirstMount: false,
            props: [],
            state: null,
          },
        ],
        [
          7,
          {
            context: null,
            didHooksChange: false,
            hooks: [],
            isFirstMount: false,
            props: ['count'],
            state: null,
          },
        ],
        [
          6,
          {
            context: ['count'],
            didHooksChange: false,
            hooks: null,
            isFirstMount: false,
            props: [],
            state: null,
          },
        ],
        [
          2,
          {
            context: null,
            didHooksChange: false,
            hooks: [],
            isFirstMount: false,
            props: [],
            state: ['count'],
          },
        ],
      ]),
    );

    expect(changeDescriptions[2]).toEqual(
      new Map([
        [
          5,
          {
            context: null,
            didHooksChange: false,
            hooks: [],
            isFirstMount: false,
            props: [],
            state: null,
          },
        ],
        [
          4,
          {
            context: false,
            didHooksChange: false,
            hooks: null,
            isFirstMount: false,
            props: [],
            state: null,
          },
        ],
        [
          7,
          {
            context: null,
            didHooksChange: false,
            hooks: [],
            isFirstMount: false,
            props: [],
            state: null,
          },
        ],
        [
          6,
          {
            context: [],
            didHooksChange: false,
            hooks: null,
            isFirstMount: false,
            props: [],
            state: null,
          },
        ],
        [
          2,
          {
            context: null,
            didHooksChange: false,
            hooks: [],
            isFirstMount: false,
            props: ['foo'],
            state: [],
          },
        ],
      ]),
    );

    expect(changeDescriptions[3]).toEqual(
      new Map([
        [
          5,
          {
            context: null,
            didHooksChange: false,
            hooks: [],
            isFirstMount: false,
            props: [],
            state: null,
          },
        ],
        [
          4,
          {
            context: false,
            didHooksChange: false,
            hooks: null,
            isFirstMount: false,
            props: [],
            state: null,
          },
        ],
        [
          7,
          {
            context: null,
            didHooksChange: false,
            hooks: [],
            isFirstMount: false,
            props: [],
            state: null,
          },
        ],
        [
          6,
          {
            context: [],
            didHooksChange: false,
            hooks: null,
            isFirstMount: false,
            props: [],
            state: null,
          },
        ],
        [
          2,
          {
            context: null,
            didHooksChange: false,
            hooks: [],
            isFirstMount: false,
            props: ['foo', 'bar'],
            state: [],
          },
        ],
      ]),
    );

    expect(changeDescriptions[4]).toEqual(
      new Map([
        [
          5,
          {
            context: null,
            didHooksChange: false,
            hooks: [],
            isFirstMount: false,
            props: [],
            state: null,
          },
        ],
        [
          4,
          {
            context: false,
            didHooksChange: false,
            hooks: null,
            isFirstMount: false,
            props: [],
            state: null,
          },
        ],
        [
          7,
          {
            context: null,
            didHooksChange: false,
            hooks: [],
            isFirstMount: false,
            props: [],
            state: null,
          },
        ],
        [
          6,
          {
            context: [],
            didHooksChange: false,
            hooks: null,
            isFirstMount: false,
            props: [],
            state: null,
          },
        ],
        [
          2,
          {
            context: null,
            didHooksChange: false,
            hooks: [],
            isFirstMount: false,
            props: ['bar'],
            state: [],
          },
        ],
      ]),
    );

    utils.exportImportHelper(bridge, store);

    const prevChangeDescriptions = [...changeDescriptions];

    changeDescriptions = store.profilerStore
      .getDataForRoot(rootID)
      .commitData.map(commitData => commitData.changeDescriptions);
    expect(changeDescriptions).toHaveLength(5);

    for (let commitIndex = 0; commitIndex < 5; commitIndex++) {
      expect(changeDescriptions[commitIndex]).toEqual(
        prevChangeDescriptions[commitIndex],
      );
    }
  });

  // @reactVersion >= 18.0
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

    let snapshot = 0;
    function getServerSnapshot() {
      return snapshot;
    }
    function getClientSnapshot() {
      return snapshot;
    }

    let syncExternalStoreCallback;
    function subscribe(callback) {
      syncExternalStoreCallback = callback;
    }

    let dispatch = null;
    let setState = null;

    const Component = ({count, string}) => {
      // These hooks may change and initiate re-renders.
      setState = React.useState('abc')[1];
      dispatch = React.useReducer(reducer, {value: true})[1];
      React.useSyncExternalStore(
        subscribe,
        getClientSnapshot,
        getServerSnapshot,
      );

      // This hook's return value may change between renders,
      // but the hook itself isn't stateful.
      React.useContext(Context);

      // These hooks never change in a way that schedules an update.
      React.useCallback(() => () => {}, [string]);
      React.useMemo(() => string, [string]);
      React.useCallback(() => () => {}, [count]);
      React.useMemo(() => count, [count]);
      React.useCallback(() => () => {});
      React.useMemo(() => string);

      // These hooks never change in a way that schedules an update.
      React.useEffect(() => {}, [string]);
      React.useLayoutEffect(() => {}, [string]);
      React.useEffect(() => {}, [count]);
      React.useLayoutEffect(() => {}, [count]);
      React.useEffect(() => {});
      React.useLayoutEffect(() => {});

      return null;
    };

    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() =>
      render(
        <Context.Provider value={true}>
          <Component count={1} />
        </Context.Provider>,
      ),
    );

    // Second render has no changed hooks, only changed props.
    utils.act(() =>
      render(
        <Context.Provider value={true}>
          <Component count={2} />
        </Context.Provider>,
      ),
    );

    // Third render has a changed reducer hook.
    utils.act(() => dispatch({type: 'invert'}));

    // Fourth render has a changed state hook.
    utils.act(() => setState('def'));

    // Fifth render has a changed context value, but no changed hook.
    utils.act(() =>
      render(
        <Context.Provider value={false}>
          <Component count={2} />
        </Context.Provider>,
      ),
    );

    // 6th renderer is triggered by a sync external store change.
    utils.act(() => {
      snapshot++;
      syncExternalStoreCallback();
    });

    utils.act(() => store.profilerStore.stopProfiling());

    const rootID = store.roots[0];

    const changeDescriptions = store.profilerStore
      .getDataForRoot(rootID)
      .commitData.map(commitData => commitData.changeDescriptions);
    expect(changeDescriptions).toHaveLength(6);

    // 1st render: No change
    expect(changeDescriptions[0]).toMatchInlineSnapshot(`
      Map {
        3 => {
          "context": null,
          "didHooksChange": false,
          "isFirstMount": true,
          "props": null,
          "state": null,
        },
      }
    `);

    // 2nd render: Changed props
    expect(changeDescriptions[1]).toMatchInlineSnapshot(`
      Map {
        3 => {
          "context": false,
          "didHooksChange": false,
          "hooks": [],
          "isFirstMount": false,
          "props": [
            "count",
          ],
          "state": null,
        },
      }
    `);

    // 3rd render: Changed useReducer
    expect(changeDescriptions[2]).toMatchInlineSnapshot(`
      Map {
        3 => {
          "context": false,
          "didHooksChange": true,
          "hooks": [
            1,
          ],
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
      }
    `);

    // 4th render: Changed useState
    expect(changeDescriptions[3]).toMatchInlineSnapshot(`
      Map {
        3 => {
          "context": false,
          "didHooksChange": true,
          "hooks": [
            0,
          ],
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
      }
    `);

    // 5th render: Changed context
    expect(changeDescriptions[4]).toMatchInlineSnapshot(`
      Map {
        3 => {
          "context": true,
          "didHooksChange": false,
          "hooks": [],
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
      }
    `);

    // 6th render: Sync external store
    expect(changeDescriptions[5]).toMatchInlineSnapshot(`
      Map {
        3 => {
          "context": false,
          "didHooksChange": true,
          "hooks": [
            2,
          ],
          "isFirstMount": false,
          "props": [],
          "state": null,
        },
      }
    `);

    expect(changeDescriptions).toHaveLength(6);

    // Export and re-import profile data and make sure it is retained.
    utils.exportImportHelper(bridge, store);

    for (let commitIndex = 0; commitIndex < 6; commitIndex++) {
      const commitData = store.profilerStore.getCommitData(rootID, commitIndex);
      expect(commitData.changeDescriptions).toEqual(
        changeDescriptions[commitIndex],
      );
    }
  });

  // @reactVersion >= 18.0
  it('should calculate durations based on actual children (not filtered children)', () => {
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
    utils.act(() => render(<Grandparent />));
    utils.act(() => store.profilerStore.stopProfiling());

    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Grandparent>
            <Child>
            <Child>
    `);

    const rootID = store.roots[0];
    const commitData = store.profilerStore.getDataForRoot(rootID).commitData;
    expect(commitData).toHaveLength(1);

    // Actual duration should also include both filtered <Parent> components.
    expect(commitData[0].fiberActualDurations).toMatchInlineSnapshot(`
      Map {
        1 => 16,
        2 => 16,
        3 => 1,
        4 => 1,
      }
    `);

    expect(commitData[0].fiberSelfDurations).toMatchInlineSnapshot(`
      Map {
        1 => 0,
        2 => 10,
        3 => 1,
        4 => 1,
      }
    `);
  });

  // @reactVersion >= 17.0
  it('should calculate durations correctly for suspended views', async () => {
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
    await utils.actAsync(() => render(<Parent />));
    utils.act(() => store.profilerStore.stopProfiling());

    const rootID = store.roots[0];
    const commitData = store.profilerStore.getDataForRoot(rootID).commitData;
    expect(commitData).toHaveLength(2);
    expect(commitData[0].fiberActualDurations).toMatchInlineSnapshot(`
      Map {
        1 => 15,
        2 => 15,
        3 => 5,
        4 => 2,
      }
    `);
    expect(commitData[0].fiberSelfDurations).toMatchInlineSnapshot(`
      Map {
        1 => 0,
        2 => 10,
        3 => 3,
        4 => 2,
      }
    `);
    expect(commitData[1].fiberActualDurations).toMatchInlineSnapshot(`
      Map {
        5 => 3,
        3 => 3,
      }
    `);
    expect(commitData[1].fiberSelfDurations).toMatchInlineSnapshot(`
      Map {
        5 => 3,
        3 => 0,
      }
    `);
  });

  // @reactVersion >= 16.9
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

    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => render(<Parent count={1} />));
    utils.act(() => render(<Parent count={2} />));
    utils.act(() => render(<Parent count={3} />));
    utils.act(() => store.profilerStore.stopProfiling());

    const rootID = store.roots[0];
    const allFiberCommits = [];
    for (let index = 0; index < store.numElements; index++) {
      const fiberID = store.getElementIDAtIndex(index);
      const fiberCommits = store.profilerStore.profilingCache.getFiberCommits({
        fiberID,
        rootID,
      });

      allFiberCommits.push(fiberCommits);
    }

    expect(allFiberCommits).toMatchInlineSnapshot(`
      [
        [
          0,
          1,
          2,
        ],
        [
          0,
          1,
          2,
        ],
        [
          1,
          2,
        ],
        [
          2,
        ],
        [
          0,
        ],
      ]
    `);

    utils.exportImportHelper(bridge, store);

    for (let index = 0; index < store.numElements; index++) {
      const fiberID = store.getElementIDAtIndex(index);
      const fiberCommits = store.profilerStore.profilingCache.getFiberCommits({
        fiberID,
        rootID,
      });

      expect(fiberCommits).toEqual(allFiberCommits[index]);
    }
  });

  // @reactVersion >= 18.0.0
  // @reactVersion <= 18.2.0
  it('should handle unexpectedly shallow suspense trees for react v[18.0.0 - 18.2.0] (legacy render)', () => {
    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() =>
      legacyRender(<React.Suspense />, document.createElement('div')),
    );
    utils.act(() => store.profilerStore.stopProfiling());

    const rootID = store.roots[0];
    const commitData = store.profilerStore.getDataForRoot(rootID).commitData;
    expect(commitData).toMatchInlineSnapshot(`
      [
        {
          "changeDescriptions": Map {},
          "duration": 0,
          "effectDuration": null,
          "fiberActualDurations": Map {
            1 => 0,
            2 => 0,
          },
          "fiberSelfDurations": Map {
            1 => 0,
            2 => 0,
          },
          "passiveEffectDuration": null,
          "priorityLevel": "Immediate",
          "timestamp": 0,
          "updaters": [
            {
              "compiledWithForget": false,
              "displayName": "render()",
              "hocDisplayNames": null,
              "id": 1,
              "key": null,
              "type": 11,
            },
          ],
        },
      ]
    `);
  });

  // @reactVersion >= 18.0.0
  // @reactVersion <= 18.2.0
  it('should handle unexpectedly shallow suspense trees for react v[18.0.0 - 18.2.0] (createRoot)', () => {
    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => render(<React.Suspense />));
    utils.act(() => store.profilerStore.stopProfiling());

    const rootID = store.roots[0];
    const commitData = store.profilerStore.getDataForRoot(rootID).commitData;
    expect(commitData).toMatchInlineSnapshot(`
      [
        {
          "changeDescriptions": Map {},
          "duration": 0,
          "effectDuration": null,
          "fiberActualDurations": Map {
            1 => 0,
            2 => 0,
          },
          "fiberSelfDurations": Map {
            1 => 0,
            2 => 0,
          },
          "passiveEffectDuration": null,
          "priorityLevel": "Normal",
          "timestamp": 0,
          "updaters": [
            {
              "compiledWithForget": false,
              "displayName": "createRoot()",
              "hocDisplayNames": null,
              "id": 1,
              "key": null,
              "type": 11,
            },
          ],
        },
      ]
    `);
  });

  // @reactVersion > 18.2.0
  it('should handle unexpectedly shallow suspense trees', () => {
    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => render(<React.Suspense />));
    utils.act(() => store.profilerStore.stopProfiling());

    const rootID = store.roots[0];
    const commitData = store.profilerStore.getDataForRoot(rootID).commitData;
    expect(commitData).toMatchInlineSnapshot(`
      [
        {
          "changeDescriptions": Map {},
          "duration": 0,
          "effectDuration": null,
          "fiberActualDurations": Map {
            1 => 0,
            2 => 0,
          },
          "fiberSelfDurations": Map {
            1 => 0,
            2 => 0,
          },
          "passiveEffectDuration": null,
          "priorityLevel": "Normal",
          "timestamp": 0,
          "updaters": [
            {
              "compiledWithForget": false,
              "displayName": "createRoot()",
              "hocDisplayNames": null,
              "id": 1,
              "key": null,
              "type": 11,
            },
          ],
        },
      ]
    `);
  });

  // See https://github.com/facebook/react/issues/18831
  // @reactVersion >= 16.9
  it('should not crash during route transitions with Suspense', () => {
    const RouterContext = React.createContext();

    function App() {
      return (
        <Router>
          <Switch>
            <Route path="/">
              <Home />
            </Route>
            <Route path="/about">
              <About />
            </Route>
          </Switch>
        </Router>
      );
    }

    const Home = () => {
      return (
        <React.Suspense>
          <Link path="/about">Home</Link>
        </React.Suspense>
      );
    };

    const About = () => <div>About</div>;

    // Mimics https://github.com/ReactTraining/react-router/blob/master/packages/react-router/modules/Router.js
    function Router({children}) {
      const [path, setPath] = React.useState('/');
      return (
        <RouterContext.Provider value={{path, setPath}}>
          {children}
        </RouterContext.Provider>
      );
    }

    // Mimics https://github.com/ReactTraining/react-router/blob/master/packages/react-router/modules/Switch.js
    function Switch({children}) {
      return (
        <RouterContext.Consumer>
          {context => {
            let element = null;
            React.Children.forEach(children, child => {
              if (context.path === child.props.path) {
                element = child.props.children;
              }
            });
            return element ? React.cloneElement(element) : null;
          }}
        </RouterContext.Consumer>
      );
    }

    // Mimics https://github.com/ReactTraining/react-router/blob/master/packages/react-router/modules/Route.js
    function Route({children, path}) {
      return null;
    }

    const linkRef = React.createRef();

    // Mimics https://github.com/ReactTraining/react-router/blob/master/packages/react-router-dom/modules/Link.js
    function Link({children, path}) {
      return (
        <RouterContext.Consumer>
          {context => {
            return (
              <button ref={linkRef} onClick={() => context.setPath(path)}>
                {children}
              </button>
            );
          }}
        </RouterContext.Consumer>
      );
    }

    utils.act(() => render(<App />));
    expect(getContainer().textContent).toBe('Home');
    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() =>
      linkRef.current.dispatchEvent(
        new MouseEvent('click', {bubbles: true, cancelable: true}),
      ),
    );
    utils.act(() => store.profilerStore.stopProfiling());
    expect(getContainer().textContent).toBe('About');
  });

  // @reactVersion >= 18.0
  it('components that were deleted and added to updaters during the layout phase should not crash', () => {
    let setChildUnmounted;
    function Child() {
      const [, setState] = React.useState(false);

      React.useLayoutEffect(() => {
        return () => setState(true);
      });

      return null;
    }

    function App() {
      const [childUnmounted, _setChildUnmounted] = React.useState(false);
      setChildUnmounted = _setChildUnmounted;
      return <>{!childUnmounted && <Child />}</>;
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    utils.act(() => root.render(<App />));
    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => setChildUnmounted(true));
    utils.act(() => store.profilerStore.stopProfiling());

    const updaters = store.profilerStore.getCommitData(
      store.roots[0],
      0,
    ).updaters;
    expect(updaters.length).toEqual(1);
    expect(updaters[0].displayName).toEqual('App');
  });

  // @reactVersion >= 18.0
  it('components in a deleted subtree and added to updaters during the layout phase should not crash', () => {
    let setChildUnmounted;
    function Child() {
      return <GrandChild />;
    }

    function GrandChild() {
      const [, setState] = React.useState(false);

      React.useLayoutEffect(() => {
        return () => setState(true);
      });

      return null;
    }

    function App() {
      const [childUnmounted, _setChildUnmounted] = React.useState(false);
      setChildUnmounted = _setChildUnmounted;
      return <>{!childUnmounted && <Child />}</>;
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    utils.act(() => root.render(<App />));
    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => setChildUnmounted(true));
    utils.act(() => store.profilerStore.stopProfiling());

    const updaters = store.profilerStore.getCommitData(
      store.roots[0],
      0,
    ).updaters;
    expect(updaters.length).toEqual(1);
    expect(updaters[0].displayName).toEqual('App');
  });

  // @reactVersion >= 18.0
  it('components that were deleted should not be added to updaters during the passive phase', () => {
    let setChildUnmounted;
    function Child() {
      const [, setState] = React.useState(false);
      React.useEffect(() => {
        return () => setState(true);
      });

      return null;
    }

    function App() {
      const [childUnmounted, _setChildUnmounted] = React.useState(false);
      setChildUnmounted = _setChildUnmounted;
      return <>{!childUnmounted && <Child />}</>;
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    utils.act(() => root.render(<App />));
    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => setChildUnmounted(true));
    utils.act(() => store.profilerStore.stopProfiling());

    const updaters = store.profilerStore.getCommitData(
      store.roots[0],
      0,
    ).updaters;
    expect(updaters.length).toEqual(1);
    expect(updaters[0].displayName).toEqual('App');
  });
});
