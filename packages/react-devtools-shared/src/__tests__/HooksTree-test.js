describe('HooksTree', () => {
  let React;
  let ReactDOM;
  let bridge: FrontendBridge;
  let store: Store;
  let utils;
  let HooksTree;

  let BridgeContext;
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

    BridgeContext = require('react-devtools-shared/src/devtools/views/context')
      .BridgeContext;
    InspectedElementContextController = require('react-devtools-shared/src/devtools/views/Components/InspectedElementContext')
      .InspectedElementContextController;
    StoreContext = require('react-devtools-shared/src/devtools/views/context')
      .StoreContext;
    TreeContextController = require('react-devtools-shared/src/devtools/views/Components/TreeContext')
      .TreeContextController;

    HooksTree = require('react-devtools-shared/src/devtools/views/Components/HooksTree')
      .HooksTreeView;
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
          defaultSelectedElementIndex={defaultSelectedElementIndex}>
          <InspectedElementContextController>
            {children}
          </InspectedElementContextController>
        </TreeContextController>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );

  it('shows the complex value of custom hooks with sub-hooks', () => {
    // props from `InspectedElementContext display complex values of useDebugValue: DisplayedComplexValue 1` snapshot

    const container = document.createElement('div');
    ReactDOM.render(
      <Contexts>
        <HooksTree
          hooks={[
            {
              id: null,
              isStateEditable: false,
              name: 'DebuggableHook',
              value: {
                foo: 2,
              },
              subHooks: [
                {
                  id: 0,
                  isStateEditable: true,
                  name: 'State',
                  value: 1,
                  subHooks: [],
                },
              ],
            },
          ]}
        />
      </Contexts>,
      container,
    );

    const hook = container.querySelector('.NameValueRow');
    // it's actually DebuggableHook: {foo:2} but the first colon is added by css
    // which isn't available in the test
    expect(hook.textContent).toEqual('DebuggableHook{foo: 2}');
  });
});
