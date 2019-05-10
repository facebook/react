// @flow

import typeof ReactTestRenderer from 'react-test-renderer';
import type { Element } from 'src/devtools/views/Components/types';
import type Bridge from 'src/bridge';
import type Store from 'src/devtools/store';

describe('OwnersListContext', () => {
  let React;
  let ReactDOM;
  let TestRenderer: ReactTestRenderer;
  let bridge: Bridge;
  let store: Store;
  let utils;

  let BridgeContext;
  let OwnersListContext;
  let OwnersListContextController;
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
    OwnersListContext = require('src/devtools/views/Components/OwnersListContext')
      .OwnersListContext;
    OwnersListContextController = require('src/devtools/views/Components/OwnersListContext')
      .OwnersListContextController;
    StoreContext = require('src/devtools/views/context').StoreContext;
    TreeContextController = require('src/devtools/views/Components/TreeContext')
      .TreeContextController;
  });

  const Contexts = ({ children, defaultOwnerID = null }) => (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <TreeContextController defaultOwnerID={defaultOwnerID}>
          <OwnersListContextController>{children}</OwnersListContextController>
        </TreeContextController>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );

  it('should fetch the owners list for the selected element', async done => {
    const Grandparent = () => <Parent />;
    const Parent = () => {
      return (
        <React.Fragment>
          <Child />
          <Child />
        </React.Fragment>
      );
    };
    const Child = () => null;

    utils.act(() =>
      ReactDOM.render(<Grandparent />, document.createElement('div'))
    );

    expect(store).toMatchSnapshot('mount');

    const parent = ((store.getElementAtIndex(1): any): Element);
    const firstChild = ((store.getElementAtIndex(2): any): Element);

    let didFinish = false;

    function Suspender({ owner }) {
      const read = React.useContext(OwnersListContext);
      const owners = read(owner.id);
      expect(owners).toMatchSnapshot(
        `owners for "${(owner && owner.displayName) || ''}"`
      );
      didFinish = true;
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts defaultOwnerID={parent.id}>
            <React.Suspense fallback={null}>
              <Suspender owner={parent} />
            </React.Suspense>
          </Contexts>
        ),
      3
    );
    expect(didFinish).toBe(true);

    didFinish = false;
    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts defaultOwnerID={firstChild.id}>
            <React.Suspense fallback={null}>
              <Suspender owner={firstChild} />
            </React.Suspense>
          </Contexts>
        ),
      3
    );
    expect(didFinish).toBe(true);

    done();
  });

  it('should fetch the owners list for the selected element that includes filtered components', async done => {
    store.componentFilters = [utils.createDisplayNameFilter('^Parent$')];

    const Grandparent = () => <Parent />;
    const Parent = () => {
      return (
        <React.Fragment>
          <Child />
          <Child />
        </React.Fragment>
      );
    };
    const Child = () => null;

    utils.act(() =>
      ReactDOM.render(<Grandparent />, document.createElement('div'))
    );

    expect(store).toMatchSnapshot('mount');

    const firstChild = ((store.getElementAtIndex(1): any): Element);

    let didFinish = false;

    function Suspender({ owner }) {
      const read = React.useContext(OwnersListContext);
      const owners = read(owner.id);
      expect(owners).toMatchSnapshot(
        `owners for "${(owner && owner.displayName) || ''}"`
      );
      didFinish = true;
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts defaultOwnerID={firstChild.id}>
            <React.Suspense fallback={null}>
              <Suspender owner={firstChild} />
            </React.Suspense>
          </Contexts>
        ),
      3
    );
    expect(didFinish).toBe(true);

    done();
  });

  it('should include the current element even if there are no other owners', async done => {
    store.componentFilters = [utils.createDisplayNameFilter('^Parent$')];

    const Grandparent = () => <Parent />;
    const Parent = () => null;

    utils.act(() =>
      ReactDOM.render(<Grandparent />, document.createElement('div'))
    );

    expect(store).toMatchSnapshot('mount');

    const grandparent = ((store.getElementAtIndex(0): any): Element);

    let didFinish = false;

    function Suspender({ owner }) {
      const read = React.useContext(OwnersListContext);
      const owners = read(owner.id);
      expect(owners).toMatchSnapshot(
        `owners for "${(owner && owner.displayName) || ''}"`
      );
      didFinish = true;
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts defaultOwnerID={grandparent.id}>
            <React.Suspense fallback={null}>
              <Suspender owner={grandparent} />
            </React.Suspense>
          </Contexts>
        ),
      3
    );
    expect(didFinish).toBe(true);

    done();
  });
});
