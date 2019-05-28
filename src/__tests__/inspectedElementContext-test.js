// @flow

import typeof ReactTestRenderer from 'react-test-renderer';
import type { Element } from 'src/devtools/views/Components/types';
import type Bridge from 'src/bridge';
import type Store from 'src/devtools/store';

describe('InspectedElementContext', () => {
  let React;
  let ReactDOM;
  let act;
  let TestRenderer: ReactTestRenderer;
  let bridge: Bridge;
  let store: Store;
  let utils;

  let BridgeContext;
  let InspectedElementContext;
  let InspectedElementContextController;
  let StoreContext;
  let TreeContextController;

  // a version of actAsync that *doesn't* recursively flush timers
  async function actAsync(cb: () => *): Promise<void> {
    // $FlowFixMe Flow doesn't know about "await act()" yet
    await act(async () => {
      await cb();
    });
    // $FlowFixMe Flow doesn't know about "await act()" yet
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
  }

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    bridge = global.bridge;
    store = global.store;
    store.collapseNodesByDefault = false;

    React = require('react');
    ReactDOM = require('react-dom');
    act = require('react-dom/test-utils').act;
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

    await actAsync(() =>
      TestRenderer.create(
        <Contexts
          defaultSelectedElementID={example.id}
          defaultSelectedElementIndex={0}
        >
          <React.Suspense fallback={null}>
            <Suspender target={example} />
          </React.Suspense>
        </Contexts>
      )
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

    await actAsync(() =>
      TestRenderer.create(
        <Contexts
          defaultSelectedElementID={example.id}
          defaultSelectedElementIndex={0}
        >
          <React.Suspense fallback={null}>
            <Suspender target={example} />
          </React.Suspense>
        </Contexts>
      )
    );
    expect(inspectedElement).toMatchSnapshot('2: initial render');

    await actAsync(() =>
      ReactDOM.render(<Example foo={2} bar="def" />, container)
    );

    inspectedElement = null;
    await actAsync(() =>
      TestRenderer.create(
        <Contexts
          defaultSelectedElementID={example.id}
          defaultSelectedElementIndex={0}
        >
          <React.Suspense fallback={null}>
            <Suspender target={example} />
          </React.Suspense>
        </Contexts>
      )
    );
    expect(inspectedElement).toMatchSnapshot('2: updated state');

    done();
  });

  it('should not re-render a function with hooks if it did not update since it was last inspected', async done => {
    let targetRenderCount = 0;

    const Wrapper = ({ children }) => children;
    const Target = React.memo(props => {
      targetRenderCount++;
      React.useState(0);
      return null;
    });

    const container = document.createElement('div');
    utils.act(() =>
      ReactDOM.render(
        <Wrapper>
          <Target foo={1} bar="abc" />
        </Wrapper>,
        container
      )
    );
    expect(store).toMatchSnapshot('1: mount');

    const id = ((store.getElementIDAtIndex(1): any): number);

    let inspectedElement = null;

    function Suspender({ target }) {
      const { read } = React.useContext(InspectedElementContext);
      inspectedElement = read(target);
      return null;
    }

    targetRenderCount = 0;

    let renderer;
    await actAsync(
      () =>
        (renderer = TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={1}
          >
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>
        ))
    );
    expect(targetRenderCount).toBe(1);
    expect(inspectedElement).toMatchSnapshot('2: initial render');

    const initialInspectedElement = inspectedElement;

    targetRenderCount = 0;
    inspectedElement = null;
    await actAsync(() =>
      renderer.update(
        <Contexts defaultSelectedElementID={id} defaultSelectedElementIndex={1}>
          <React.Suspense fallback={null}>
            <Suspender target={id} />
          </React.Suspense>
        </Contexts>
      )
    );
    expect(targetRenderCount).toBe(0);
    expect(inspectedElement).toEqual(initialInspectedElement);

    targetRenderCount = 0;

    await actAsync(() =>
      ReactDOM.render(
        <Wrapper>
          <Target foo={2} bar="def" />
        </Wrapper>,
        container
      )
    );

    // Target should have been rendered once (by ReactDOM) and once by DevTools for inspection.
    expect(targetRenderCount).toBe(2);
    expect(inspectedElement).toMatchSnapshot('3: updated state');

    done();
  });
});
