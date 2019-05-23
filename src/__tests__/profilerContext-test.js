// @flow

import typeof ReactTestRenderer from 'react-test-renderer';
import type { Element } from 'src/devtools/views/Components/types';
import type Bridge from 'src/bridge';
import type Store from 'src/devtools/store';

describe('ProfilerContext', () => {
  let React;
  let ReactDOM;
  let TestRenderer: ReactTestRenderer;
  let bridge: Bridge;
  let store: Store;
  let utils;

  let BridgeContext;
  let ProfilerContext;
  let ProfilerContextController;
  let StoreContext;
  let TreeContextController;

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    bridge = global.bridge;
    store = global.store;
    store.collapseNodesByDefault = false;

    React = require('react');
    ReactDOM = require('react-dom');
    TestRenderer = utils.requireTestRenderer();

    BridgeContext = require('src/devtools/views/context').BridgeContext;
    ProfilerContext = require('src/devtools/views/Profiler/ProfilerContext')
      .ProfilerContext;
    ProfilerContextController = require('src/devtools/views/Profiler/ProfilerContext')
      .ProfilerContextController;
    StoreContext = require('src/devtools/views/context').StoreContext;
    TreeContextController = require('src/devtools/views/Components/TreeContext')
      .TreeContextController;
  });

  const Contexts = ({
    children = null,
    defaultSelectedElementID = null,
    defaultSelectedElementIndex = null,
  }) => (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <TreeContextController
          defaultSelectedElementID={defaultSelectedElementID}
          defaultSelectedElementIndex={defaultSelectedElementIndex}
        >
          <ProfilerContextController>{children}</ProfilerContextController>
        </TreeContextController>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );

  it('should gracefully handle an empty profiling session', () => {
    const Example = () => {
      const [count] = React.useState(1);
      return count;
    };

    const container = document.createElement('div');
    utils.act(() => ReactDOM.render(<Example foo={1} bar="abc" />, container));
    expect(store).toMatchSnapshot('1: mount');

    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => store.profilerStore.stopProfiling());

    utils.act(() => {
      TestRenderer.create(<Contexts />);
    });
  });
});
