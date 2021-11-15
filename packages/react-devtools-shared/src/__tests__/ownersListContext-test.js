/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof ReactTestRenderer from 'react-test-renderer';
import type {Element} from 'react-devtools-shared/src/devtools/views/Components/types';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type Store from 'react-devtools-shared/src/devtools/store';

describe('OwnersListContext', () => {
  let React;
  let TestRenderer: ReactTestRenderer;
  let bridge: FrontendBridge;
  let legacyRender;
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

    legacyRender = utils.legacyRender;

    bridge = global.bridge;
    store = global.store;
    store.collapseNodesByDefault = false;

    React = require('react');
    TestRenderer = utils.requireTestRenderer();

    BridgeContext = require('react-devtools-shared/src/devtools/views/context')
      .BridgeContext;
    OwnersListContext = require('react-devtools-shared/src/devtools/views/Components/OwnersListContext')
      .OwnersListContext;
    OwnersListContextController = require('react-devtools-shared/src/devtools/views/Components/OwnersListContext')
      .OwnersListContextController;
    StoreContext = require('react-devtools-shared/src/devtools/views/context')
      .StoreContext;
    TreeContextController = require('react-devtools-shared/src/devtools/views/Components/TreeContext')
      .TreeContextController;
  });

  const Contexts = ({children, defaultOwnerID = null}) => (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <TreeContextController defaultOwnerID={defaultOwnerID}>
          <OwnersListContextController>{children}</OwnersListContextController>
        </TreeContextController>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );

  it('should fetch the owners list for the selected element', async () => {
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
      legacyRender(<Grandparent />, document.createElement('div')),
    );

    expect(store).toMatchSnapshot('mount');

    const parent = ((store.getElementAtIndex(1): any): Element);
    const firstChild = ((store.getElementAtIndex(2): any): Element);

    let didFinish = false;

    function Suspender({owner}) {
      const read = React.useContext(OwnersListContext);
      const owners = read(owner.id);
      expect(owners).toMatchSnapshot(
        `owners for "${(owner && owner.displayName) || ''}"`,
      );
      didFinish = true;
      return null;
    }

    await utils.actAsync(() =>
      TestRenderer.create(
        <Contexts defaultOwnerID={parent.id}>
          <React.Suspense fallback={null}>
            <Suspender owner={parent} />
          </React.Suspense>
        </Contexts>,
      ),
    );
    expect(didFinish).toBe(true);

    didFinish = false;
    await utils.actAsync(() =>
      TestRenderer.create(
        <Contexts defaultOwnerID={firstChild.id}>
          <React.Suspense fallback={null}>
            <Suspender owner={firstChild} />
          </React.Suspense>
        </Contexts>,
      ),
    );
    expect(didFinish).toBe(true);
  });

  it('should fetch the owners list for the selected element that includes filtered components', async () => {
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
      legacyRender(<Grandparent />, document.createElement('div')),
    );

    expect(store).toMatchSnapshot('mount');

    const firstChild = ((store.getElementAtIndex(1): any): Element);

    let didFinish = false;

    function Suspender({owner}) {
      const read = React.useContext(OwnersListContext);
      const owners = read(owner.id);
      expect(owners).toMatchSnapshot(
        `owners for "${(owner && owner.displayName) || ''}"`,
      );
      didFinish = true;
      return null;
    }

    await utils.actAsync(() =>
      TestRenderer.create(
        <Contexts defaultOwnerID={firstChild.id}>
          <React.Suspense fallback={null}>
            <Suspender owner={firstChild} />
          </React.Suspense>
        </Contexts>,
      ),
    );
    expect(didFinish).toBe(true);
  });

  it('should include the current element even if there are no other owners', async () => {
    store.componentFilters = [utils.createDisplayNameFilter('^Parent$')];

    const Grandparent = () => <Parent />;
    const Parent = () => null;

    utils.act(() =>
      legacyRender(<Grandparent />, document.createElement('div')),
    );

    expect(store).toMatchSnapshot('mount');

    const grandparent = ((store.getElementAtIndex(0): any): Element);

    let didFinish = false;

    function Suspender({owner}) {
      const read = React.useContext(OwnersListContext);
      const owners = read(owner.id);
      expect(owners).toMatchSnapshot(
        `owners for "${(owner && owner.displayName) || ''}"`,
      );
      didFinish = true;
      return null;
    }

    await utils.actAsync(() =>
      TestRenderer.create(
        <Contexts defaultOwnerID={grandparent.id}>
          <React.Suspense fallback={null}>
            <Suspender owner={grandparent} />
          </React.Suspense>
        </Contexts>,
      ),
    );
    expect(didFinish).toBe(true);
  });

  it('should include all owners for a component wrapped in react memo', async () => {
    const InnerComponent = (props, ref) => <div ref={ref} />;
    const ForwardRef = React.forwardRef(InnerComponent);
    const Memo = React.memo(ForwardRef);
    const Grandparent = () => {
      const ref = React.createRef();
      return <Memo ref={ref} />;
    };

    utils.act(() =>
      legacyRender(<Grandparent />, document.createElement('div')),
    );

    let didFinish = false;
    function Suspender({owner}) {
      const read = React.useContext(OwnersListContext);
      const owners = read(owner.id);
      didFinish = true;
      expect(owners.length).toBe(3);
      expect(owners).toMatchSnapshot(
        `owners for "${(owner && owner.displayName) || ''}"`,
      );
      return null;
    }

    const wrapped = ((store.getElementAtIndex(2): any): Element);
    await utils.actAsync(() =>
      TestRenderer.create(
        <Contexts defaultOwnerID={wrapped.id}>
          <React.Suspense fallback={null}>
            <Suspender owner={wrapped} />
          </React.Suspense>
        </Contexts>,
      ),
    );
    expect(didFinish).toBe(true);
  });
});
