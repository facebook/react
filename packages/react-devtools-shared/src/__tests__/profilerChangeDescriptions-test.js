/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

describe('Profiler change descriptions', () => {
  let React;
  let legacyRender;
  let store: Store;
  let utils;

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    legacyRender = utils.legacyRender;

    store = global.store;
    store.collapseNodesByDefault = false;
    store.recordChangeDescriptions = true;

    React = require('react');
  });

  // @reactVersion >=18.0
  it('should identify useContext as the cause for a re-render', () => {
    const Context = React.createContext(0);

    function Child() {
      const context = React.useContext(Context);
      return context;
    }

    function areEqual() {
      return true;
    }

    const MemoizedChild = React.memo(Child, areEqual);
    const ForwardRefChild = React.forwardRef(function RefForwardingComponent(
      props,
      ref,
    ) {
      return <Child />;
    });

    let forceUpdate = null;

    const App = function App() {
      const [val, dispatch] = React.useReducer(x => x + 1, 0);

      forceUpdate = dispatch;

      return (
        <Context.Provider value={val}>
          <Child />
          <MemoizedChild />
          <ForwardRefChild />
        </Context.Provider>
      );
    };

    const container = document.createElement('div');

    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => legacyRender(<App />, container));
    utils.act(() => forceUpdate());
    utils.act(() => store.profilerStore.stopProfiling());

    const rootID = store.roots[0];
    const commitData = store.profilerStore.getCommitData(rootID, 1);

    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <App>
          ▾ <Context.Provider>
              <Child>
            ▾ <Child> [Memo]
                <Child>
            ▾ <RefForwardingComponent> [ForwardRef]
                <Child>
    `);

    let element = store.getElementAtIndex(2);
    expect(element.displayName).toBe('Child');
    expect(element.hocDisplayNames).toBeNull();
    expect(commitData.changeDescriptions.get(element.id))
      .toMatchInlineSnapshot(`
      Object {
        "context": true,
        "didHooksChange": false,
        "hooks": null,
        "isFirstMount": false,
        "props": Array [],
        "state": null,
      }
    `);

    element = store.getElementAtIndex(3);
    expect(element.displayName).toBe('Child');
    expect(element.hocDisplayNames).toEqual(['Memo']);
    expect(commitData.changeDescriptions.get(element.id)).toBeUndefined();

    element = store.getElementAtIndex(4);
    expect(element.displayName).toBe('Child');
    expect(element.hocDisplayNames).toBeNull();
    expect(commitData.changeDescriptions.get(element.id))
      .toMatchInlineSnapshot(`
      Object {
        "context": true,
        "didHooksChange": false,
        "hooks": null,
        "isFirstMount": false,
        "props": Array [],
        "state": null,
      }
    `);

    element = store.getElementAtIndex(5);
    expect(element.displayName).toBe('RefForwardingComponent');
    expect(element.hocDisplayNames).toEqual(['ForwardRef']);
    expect(commitData.changeDescriptions.get(element.id))
      .toMatchInlineSnapshot(`
      Object {
        "context": null,
        "didHooksChange": false,
        "hooks": null,
        "isFirstMount": false,
        "props": Array [],
        "state": null,
      }
    `);

    element = store.getElementAtIndex(6);
    expect(element.displayName).toBe('Child');
    expect(element.hocDisplayNames).toBeNull();
    expect(commitData.changeDescriptions.get(element.id))
      .toMatchInlineSnapshot(`
      Object {
        "context": true,
        "didHooksChange": false,
        "hooks": null,
        "isFirstMount": false,
        "props": Array [],
        "state": null,
      }
    `);
  });
});
