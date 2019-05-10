// @flow

import typeof ReactTestRenderer from 'react-test-renderer';
import type { Element } from 'src/devtools/views/Components/types';
import type Bridge from 'src/bridge';
import type Store from 'src/devtools/store';

describe('InspectedElementContext', () => {
  let React;
  let ReactDOM;
  let TestRenderer: ReactTestRenderer;
  let bridge: Bridge;
  let store: Store;
  let utils;

  let BridgeContext;
  let InspectedElementContext;
  let InspectedElementContextController;
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
    InspectedElementContext = require('src/devtools/views/Components/InspectedElementContext')
      .InspectedElementContext;
    InspectedElementContextController = require('src/devtools/views/Components/InspectedElementContext')
      .InspectedElementContextController;
    StoreContext = require('src/devtools/views/context').StoreContext;
    TreeContextController = require('src/devtools/views/Components/TreeContext')
      .TreeContextController;
  });

  const Contexts = ({
    children,
    defaultSelectedElementID = null,
    defaultSelectedElementIndex = null,
  }) => (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <TreeContextController
          defaultSelectedElementID={defaultSelectedElementID}
          defaultSelectedElementIndex={defaultSelectedElementIndex}
        >
          <InspectedElementContextController>
            {children}
          </InspectedElementContextController>
        </TreeContextController>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );

  it('should inspect the currently selected element', async done => {
    const Example = () => {
      const [count] = React.useState(1);
      return count;
    };

    const container = document.createElement('div');
    utils.act(() => ReactDOM.render(<Example foo={1} bar="abc" />, container));
    expect(store).toMatchSnapshot('1: mount');

    const example = ((store.getElementAtIndex(0): any): Element);

    let didFinish = false;

    function Suspender({ target }) {
      const { read } = React.useContext(InspectedElementContext);
      const inspectedElement = read(target.id);
      expect(inspectedElement).toMatchSnapshot(
        `2: Inspected element ${target.id}`
      );
      didFinish = true;
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={example.id}
            defaultSelectedElementIndex={0}
          >
            <React.Suspense fallback={null}>
              <Suspender target={example} />
            </React.Suspense>
          </Contexts>
        ),
      3
    );
    expect(didFinish).toBe(true);

    done();
  });

  it('should poll for updates for the currently selected element', async done => {
    const Example = () => null;

    const container = document.createElement('div');
    utils.act(() => ReactDOM.render(<Example foo={1} bar="abc" />, container));
    expect(store).toMatchSnapshot('1: mount');

    const example = ((store.getElementAtIndex(0): any): Element);

    let inspectedElement = null;

    function Suspender({ target }) {
      const { read } = React.useContext(InspectedElementContext);
      inspectedElement = read(target.id);
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={example.id}
            defaultSelectedElementIndex={0}
          >
            <React.Suspense fallback={null}>
              <Suspender target={example} />
            </React.Suspense>
          </Contexts>
        ),
      3
    );
    expect(inspectedElement).toMatchSnapshot('2: initial render');

    await utils.actAsync(() =>
      ReactDOM.render(<Example foo={2} bar="def" />, container)
    );

    inspectedElement = null;
    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={example.id}
            defaultSelectedElementIndex={0}
          >
            <React.Suspense fallback={null}>
              <Suspender target={example} />
            </React.Suspense>
          </Contexts>
        ),
      1
    );
    expect(inspectedElement).toMatchSnapshot('2: updated state');

    done();
  });
});
