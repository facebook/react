/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof ReactTestRenderer from 'react-test-renderer';
import {withErrorsOrWarningsIgnored} from 'react-devtools-shared/src/__tests__/utils';

import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type Store from 'react-devtools-shared/src/devtools/store';

describe('InspectedElement', () => {
  let React;
  let ReactDOM;
  let ReactDOMClient;
  let PropTypes;
  let TestRenderer: ReactTestRenderer;
  let bridge: FrontendBridge;
  let store: Store;
  let utils;

  let BridgeContext;
  let InspectedElementContext;
  let InspectedElementContextController;
  let SettingsContextController;
  let StoreContext;
  let TreeContextController;

  let TestUtilsAct;
  let TestRendererAct;

  let legacyRender;
  let testRendererInstance;

  let ErrorBoundary;
  let errorBoundaryInstance;

  global.IS_REACT_ACT_ENVIRONMENT = true;

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    legacyRender = utils.legacyRender;

    bridge = global.bridge;
    store = global.store;
    store.collapseNodesByDefault = false;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    PropTypes = require('prop-types');
    TestUtilsAct = require('internal-test-utils').act;
    TestRenderer = utils.requireTestRenderer();
    TestRendererAct = require('internal-test-utils').act;

    BridgeContext =
      require('react-devtools-shared/src/devtools/views/context').BridgeContext;
    InspectedElementContext =
      require('react-devtools-shared/src/devtools/views/Components/InspectedElementContext').InspectedElementContext;
    InspectedElementContextController =
      require('react-devtools-shared/src/devtools/views/Components/InspectedElementContext').InspectedElementContextController;
    SettingsContextController =
      require('react-devtools-shared/src/devtools/views/Settings/SettingsContext').SettingsContextController;
    StoreContext =
      require('react-devtools-shared/src/devtools/views/context').StoreContext;
    TreeContextController =
      require('react-devtools-shared/src/devtools/views/Components/TreeContext').TreeContextController;

    // Used by inspectElementAtIndex() helper function
    utils.act(() => {
      testRendererInstance = TestRenderer.create(null, {
        unstable_isConcurrent: true,
      });
    });

    errorBoundaryInstance = null;

    ErrorBoundary = class extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        this.setState({error});
      }
      render() {
        errorBoundaryInstance = this;

        if (this.state.error) {
          return null;
        }
        return this.props.children;
      }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const Contexts = ({
    children,
    defaultSelectedElementID = null,
    defaultSelectedElementIndex = null,
  }) => (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <SettingsContextController>
          <TreeContextController
            defaultSelectedElementID={defaultSelectedElementID}
            defaultSelectedElementIndex={defaultSelectedElementIndex}>
            <React.Suspense fallback="Loading...">
              <InspectedElementContextController>
                {children}
              </InspectedElementContextController>
            </React.Suspense>
          </TreeContextController>
        </SettingsContextController>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );

  function useInspectedElement() {
    const {inspectedElement} = React.useContext(InspectedElementContext);
    return inspectedElement;
  }

  function useInspectElementPath() {
    const {inspectPaths} = React.useContext(InspectedElementContext);
    return inspectPaths;
  }

  function noop() {}

  async function inspectElementAtIndex(
    index,
    useCustomHook = noop,
    shouldThrow = false,
  ) {
    let didFinish = false;
    let inspectedElement = null;

    function Suspender() {
      useCustomHook();
      inspectedElement = useInspectedElement();
      didFinish = true;
      return null;
    }

    const id = ((store.getElementIDAtIndex(index): any): number);

    await utils.actAsync(() => {
      testRendererInstance.update(
        <ErrorBoundary>
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={index}>
            <React.Suspense fallback={null}>
              <Suspender id={id} index={index} />
            </React.Suspense>
          </Contexts>
        </ErrorBoundary>,
      );
    }, false);

    if (!shouldThrow) {
      expect(didFinish).toBe(true);
    }

    return inspectedElement;
  }

  it('should inspect the currently selected element', async () => {
    const Example = () => {
      const [count] = React.useState(1);
      return count;
    };

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(<Example a={1} b="abc" />, container),
    );

    const inspectedElement = await inspectElementAtIndex(0);
    expect(inspectedElement).toMatchInlineSnapshot(`
      {
        "context": null,
        "events": undefined,
        "hooks": [
          {
            "hookSource": {
              "columnNumber": "removed by Jest serializer",
              "fileName": "react-devtools-shared/src/__tests__/inspectedElement-test.js",
              "functionName": "Example",
              "lineNumber": "removed by Jest serializer",
            },
            "id": 0,
            "isStateEditable": true,
            "name": "State",
            "subHooks": [],
            "value": 1,
          },
        ],
        "id": 2,
        "owners": null,
        "props": {
          "a": 1,
          "b": "abc",
        },
        "rootType": "render()",
        "state": null,
      }
    `);
  });

  it('should have hasLegacyContext flag set to either "true" or "false" depending on which context API is used.', async () => {
    const contextData = {
      bool: true,
    };

    // Legacy Context API.
    class LegacyContextProvider extends React.Component<any> {
      static childContextTypes = {
        bool: PropTypes.bool,
      };
      getChildContext() {
        return contextData;
      }
      render() {
        return this.props.children;
      }
    }
    class LegacyContextConsumer extends React.Component<any> {
      static contextTypes = {
        bool: PropTypes.bool,
      };
      render() {
        return null;
      }
    }

    // Modern Context API
    const BoolContext = React.createContext(contextData.bool);
    BoolContext.displayName = 'BoolContext';

    class ModernContextType extends React.Component<any> {
      static contextType = BoolContext;
      render() {
        return null;
      }
    }

    const ModernContext = React.createContext();
    ModernContext.displayName = 'ModernContext';

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(
        <React.Fragment>
          <LegacyContextProvider>
            <LegacyContextConsumer />
          </LegacyContextProvider>
          <BoolContext.Consumer>{value => null}</BoolContext.Consumer>
          <ModernContextType />
          <ModernContext.Provider value={contextData}>
            <ModernContext.Consumer>{value => null}</ModernContext.Consumer>
          </ModernContext.Provider>
        </React.Fragment>,
        container,
      ),
    );

    const cases = [
      {
        // <LegacyContextConsumer />
        index: 1,
        shouldHaveLegacyContext: true,
      },
      {
        // <BoolContext.Consumer>
        index: 2,
        shouldHaveLegacyContext: false,
      },
      {
        // <ModernContextType />
        index: 3,
        shouldHaveLegacyContext: false,
      },
      {
        // <ModernContext.Consumer>
        index: 5,
        shouldHaveLegacyContext: false,
      },
    ];

    for (let i = 0; i < cases.length; i++) {
      const {index, shouldHaveLegacyContext} = cases[i];

      // HACK: Recreate TestRenderer instance because we rely on default state values
      // from props like defaultSelectedElementID and it's easier to reset here than
      // to read the TreeDispatcherContext and update the selected ID that way.
      // We're testing the inspected values here, not the context wiring, so that's ok.
      utils.withErrorsOrWarningsIgnored(
        ['An update to %s inside a test was not wrapped in act'],
        () => {
          testRendererInstance = TestRenderer.create(null, {
            unstable_isConcurrent: true,
          });
        },
      );

      const inspectedElement = await inspectElementAtIndex(index);

      expect(inspectedElement.context).not.toBe(null);
      expect(inspectedElement.hasLegacyContext).toBe(shouldHaveLegacyContext);
    }
  });

  it('should poll for updates for the currently selected element', async () => {
    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(
      () => legacyRender(<Example a={1} b="abc" />, container),
      false,
    );

    let inspectedElement = await inspectElementAtIndex(0);
    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "a": 1,
        "b": "abc",
      }
    `);

    await utils.actAsync(
      () => legacyRender(<Example a={2} b="def" />, container),
      false,
    );

    // TODO (cache)
    // This test only passes if both the check-for-updates poll AND the test renderer.update() call are included below.
    // It seems like either one of the two should be sufficient but:
    // 1. Running only check-for-updates schedules a transition that React never renders.
    // 2. Running only renderer.update() loads stale data (first props)

    // Wait for our check-for-updates poll to get the new data.
    jest.runOnlyPendingTimers();
    await Promise.resolve();

    inspectedElement = await inspectElementAtIndex(0);
    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "a": 2,
        "b": "def",
      }
    `);
  });

  it('should not re-render a function with hooks if it did not update since it was last inspected', async () => {
    let targetRenderCount = 0;

    const Wrapper = ({children}) => children;
    const Target = React.memo(props => {
      targetRenderCount++;
      // Even though his hook isn't referenced, it's used to observe backend rendering.
      React.useState(0);
      return null;
    });

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(
        <Wrapper>
          <Target a={1} b="abc" />
        </Wrapper>,
        container,
      ),
    );

    targetRenderCount = 0;

    let inspectedElement = await inspectElementAtIndex(1);
    expect(targetRenderCount).toBe(1);
    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "a": 1,
        "b": "abc",
      }
    `);

    const prevInspectedElement = inspectedElement;

    targetRenderCount = 0;
    inspectedElement = await inspectElementAtIndex(1);
    expect(targetRenderCount).toBe(0);
    expect(inspectedElement).toEqual(prevInspectedElement);

    targetRenderCount = 0;

    await utils.actAsync(
      () =>
        legacyRender(
          <Wrapper>
            <Target a={2} b="def" />
          </Wrapper>,
          container,
        ),
      false,
    );

    // Target should have been rendered once (by ReactDOM) and once by DevTools for inspection.
    inspectedElement = await inspectElementAtIndex(1);
    expect(targetRenderCount).toBe(2);
    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "a": 2,
        "b": "def",
      }
    `);
  });

  // See github.com/facebook/react/issues/22241#issuecomment-931299972
  it('should properly recover from a cache miss on the frontend', async () => {
    let targetRenderCount = 0;

    const Wrapper = ({children}) => children;
    const Target = React.memo(props => {
      targetRenderCount++;
      // Even though his hook isn't referenced, it's used to observe backend rendering.
      React.useState(0);
      return null;
    });

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(
        <Wrapper>
          <Target a={1} b="abc" />
        </Wrapper>,
        container,
      ),
    );

    targetRenderCount = 0;

    let inspectedElement = await inspectElementAtIndex(1);
    expect(targetRenderCount).toBe(1);
    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "a": 1,
        "b": "abc",
      }
    `);

    const prevInspectedElement = inspectedElement;

    // This test causes an intermediate error to be logged but we can ignore it.
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Wait for our check-for-updates poll to get the new data.
    jest.runOnlyPendingTimers();
    await Promise.resolve();

    // Clear the frontend cache to simulate DevTools being closed and re-opened.
    // The backend still thinks the most recently-inspected element is still cached,
    // so the frontend needs to tell it to resend a full value.
    // We can verify this by asserting that the component is re-rendered again.
    utils.withErrorsOrWarningsIgnored(
      ['An update to %s inside a test was not wrapped in act'],
      () => {
        testRendererInstance = TestRenderer.create(null, {
          unstable_isConcurrent: true,
        });
      },
    );

    const {
      clearCacheForTests,
    } = require('react-devtools-shared/src/inspectedElementMutableSource');
    clearCacheForTests();

    targetRenderCount = 0;
    inspectedElement = await inspectElementAtIndex(1);
    expect(targetRenderCount).toBe(1);
    expect(inspectedElement).toEqual(prevInspectedElement);
  });

  it('should temporarily disable console logging when re-running a component to inspect its hooks', async () => {
    let targetRenderCount = 0;

    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const Target = React.memo(props => {
      targetRenderCount++;
      console.error('error');
      console.info('info');
      console.log('log');
      console.warn('warn');
      React.useState(0);
      return null;
    });

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await utils.actAsync(() => root.render(<Target a={1} b="abc" />));

    expect(targetRenderCount).toBe(1);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('error');
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledWith('info');
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith('log');
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith('warn');

    const inspectedElement = await inspectElementAtIndex(0);

    expect(inspectedElement).not.toBe(null);
    expect(targetRenderCount).toBe(2);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('should support simple data types', async () => {
    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(
        <Example
          boolean_false={false}
          boolean_true={true}
          infinity={Infinity}
          integer_zero={0}
          integer_one={1}
          float={1.23}
          string="abc"
          string_empty=""
          nan={NaN}
          value_null={null}
          value_undefined={undefined}
        />,
        container,
      ),
    );

    const inspectedElement = await inspectElementAtIndex(0);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "boolean_false": false,
        "boolean_true": true,
        "float": 1.23,
        "infinity": Infinity,
        "integer_one": 1,
        "integer_zero": 0,
        "nan": NaN,
        "string": "abc",
        "string_empty": "",
        "value_null": null,
        "value_undefined": undefined,
      }
    `);
  });

  it('should support complex data types', async () => {
    const Immutable = require('immutable');

    const Example = () => null;

    const arrayOfArrays = [[['abc', 123, true], []]];
    const div = document.createElement('div');
    const exampleFunction = () => {};
    const exampleDateISO = '2019-12-31T23:42:42.000Z';
    const setShallow = new Set(['abc', 123]);
    const mapShallow = new Map([
      ['name', 'Brian'],
      ['food', 'sushi'],
    ]);
    const setOfSets = new Set([new Set(['a', 'b', 'c']), new Set([1, 2, 3])]);
    const mapOfMaps = new Map([
      ['first', mapShallow],
      ['second', mapShallow],
    ]);
    const objectOfObjects = {
      inner: {string: 'abc', number: 123, boolean: true},
    };
    const objectWithSymbol = {
      [Symbol('name')]: 'hello',
    };
    const typedArray = Int8Array.from([100, -100, 0]);
    const arrayBuffer = typedArray.buffer;
    const dataView = new DataView(arrayBuffer);
    const immutableMap = Immutable.fromJS({
      a: [{hello: 'there'}, 'fixed', true],
      b: 123,
      c: {
        '1': 'xyz',
        xyz: 1,
      },
    });

    class Class {
      anonymousFunction = () => {};
    }
    const instance = new Class();

    const proxyInstance = new Proxy(() => {}, {
      get: function (_, name) {
        return function () {
          return null;
        };
      },
    });

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(
        <Example
          anonymous_fn={instance.anonymousFunction}
          array_buffer={arrayBuffer}
          array_of_arrays={arrayOfArrays}
          // eslint-disable-next-line no-undef
          big_int={BigInt(123)}
          bound_fn={exampleFunction.bind(this)}
          data_view={dataView}
          date={new Date(exampleDateISO)}
          fn={exampleFunction}
          html_element={div}
          immutable={immutableMap}
          map={mapShallow}
          map_of_maps={mapOfMaps}
          object_of_objects={objectOfObjects}
          object_with_symbol={objectWithSymbol}
          proxy={proxyInstance}
          react_element={<span />}
          regexp={/abc/giu}
          set={setShallow}
          set_of_sets={setOfSets}
          symbol={Symbol('symbol')}
          typed_array={typedArray}
        />,
        container,
      ),
    );

    const inspectedElement = await inspectElementAtIndex(0);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "anonymous_fn": Dehydrated {
          "preview_short": ƒ () {},
          "preview_long": ƒ () {},
        },
        "array_buffer": Dehydrated {
          "preview_short": ArrayBuffer(3),
          "preview_long": ArrayBuffer(3),
        },
        "array_of_arrays": [
          Dehydrated {
            "preview_short": Array(2),
            "preview_long": [Array(3), Array(0)],
          },
        ],
        "big_int": Dehydrated {
          "preview_short": 123n,
          "preview_long": 123n,
        },
        "bound_fn": Dehydrated {
          "preview_short": ƒ bound exampleFunction() {},
          "preview_long": ƒ bound exampleFunction() {},
        },
        "data_view": Dehydrated {
          "preview_short": DataView(3),
          "preview_long": DataView(3),
        },
        "date": Dehydrated {
          "preview_short": Tue Dec 31 2019 23:42:42 GMT+0000 (Coordinated Universal Time),
          "preview_long": Tue Dec 31 2019 23:42:42 GMT+0000 (Coordinated Universal Time),
        },
        "fn": Dehydrated {
          "preview_short": ƒ exampleFunction() {},
          "preview_long": ƒ exampleFunction() {},
        },
        "html_element": Dehydrated {
          "preview_short": <div />,
          "preview_long": <div />,
        },
        "immutable": {
          "0": Dehydrated {
            "preview_short": Array(2),
            "preview_long": ["a", List(3)],
          },
          "1": Dehydrated {
            "preview_short": Array(2),
            "preview_long": ["b", 123],
          },
          "2": Dehydrated {
            "preview_short": Array(2),
            "preview_long": ["c", Map(2)],
          },
        },
        "map": {
          "0": Dehydrated {
            "preview_short": Array(2),
            "preview_long": ["name", "Brian"],
          },
          "1": Dehydrated {
            "preview_short": Array(2),
            "preview_long": ["food", "sushi"],
          },
        },
        "map_of_maps": {
          "0": Dehydrated {
            "preview_short": Array(2),
            "preview_long": ["first", Map(2)],
          },
          "1": Dehydrated {
            "preview_short": Array(2),
            "preview_long": ["second", Map(2)],
          },
        },
        "object_of_objects": {
          "inner": Dehydrated {
            "preview_short": {…},
            "preview_long": {boolean: true, number: 123, string: "abc"},
          },
        },
        "object_with_symbol": {
          "Symbol(name)": "hello",
        },
        "proxy": Dehydrated {
          "preview_short": ƒ () {},
          "preview_long": ƒ () {},
        },
        "react_element": Dehydrated {
          "preview_short": <span />,
          "preview_long": <span />,
        },
        "regexp": Dehydrated {
          "preview_short": /abc/giu,
          "preview_long": /abc/giu,
        },
        "set": {
          "0": "abc",
          "1": 123,
        },
        "set_of_sets": {
          "0": Dehydrated {
            "preview_short": Set(3),
            "preview_long": Set(3) {"a", "b", "c"},
          },
          "1": Dehydrated {
            "preview_short": Set(3),
            "preview_long": Set(3) {1, 2, 3},
          },
        },
        "symbol": Dehydrated {
          "preview_short": Symbol(symbol),
          "preview_long": Symbol(symbol),
        },
        "typed_array": {
          "0": 100,
          "1": -100,
          "2": 0,
        },
      }
    `);
  });

  it('should not consume iterables while inspecting', async () => {
    const Example = () => null;

    function* generator() {
      throw Error('Should not be consumed!');
    }

    const container = document.createElement('div');

    const iterable = generator();
    await utils.actAsync(() =>
      legacyRender(<Example prop={iterable} />, container),
    );

    const inspectedElement = await inspectElementAtIndex(0);
    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "prop": Dehydrated {
          "preview_short": Generator,
          "preview_long": Generator,
        },
      }
    `);
  });

  it('should support objects with no prototype', async () => {
    const Example = () => null;

    const object = Object.create(null);
    object.string = 'abc';
    object.number = 123;
    object.boolean = true;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(<Example object={object} />, container),
    );

    const inspectedElement = await inspectElementAtIndex(0);
    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "object": {
          "boolean": true,
          "number": 123,
          "string": "abc",
        },
      }
    `);
  });

  it('should support objects with overridden hasOwnProperty', async () => {
    const Example = () => null;

    const object = {
      name: 'blah',
      hasOwnProperty: true,
    };

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(<Example object={object} />, container),
    );

    const inspectedElement = await inspectElementAtIndex(0);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "object": {
          "hasOwnProperty": true,
          "name": "blah",
        },
      }
    `);
  });

  it('should support custom objects with enumerable properties and getters', async () => {
    class CustomData {
      _number = 42;
      get number() {
        return this._number;
      }
      set number(value) {
        this._number = value;
      }
    }

    const descriptor = ((Object.getOwnPropertyDescriptor(
      CustomData.prototype,
      'number',
    ): any): PropertyDescriptor<number>);
    descriptor.enumerable = true;
    Object.defineProperty(CustomData.prototype, 'number', descriptor);

    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(<Example data={new CustomData()} />, container),
    );

    const inspectedElement = await inspectElementAtIndex(0);
    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "data": {
          "_number": 42,
          "number": 42,
        },
      }
    `);
  });

  it('should support objects with inherited keys', async () => {
    const Example = () => null;

    const base = Object.create(Object.prototype, {
      enumerableStringBase: {
        value: 1,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      [Symbol('enumerableSymbolBase')]: {
        value: 1,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      nonEnumerableStringBase: {
        value: 1,
        writable: true,
        enumerable: false,
        configurable: true,
      },
      [Symbol('nonEnumerableSymbolBase')]: {
        value: 1,
        writable: true,
        enumerable: false,
        configurable: true,
      },
    });

    const object = Object.create(base, {
      enumerableString: {
        value: 2,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      nonEnumerableString: {
        value: 3,
        writable: true,
        enumerable: false,
        configurable: true,
      },
      123: {
        value: 3,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      [Symbol('nonEnumerableSymbol')]: {
        value: 2,
        writable: true,
        enumerable: false,
        configurable: true,
      },
      [Symbol('enumerableSymbol')]: {
        value: 3,
        writable: true,
        enumerable: true,
        configurable: true,
      },
    });

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(<Example object={object} />, container),
    );

    const inspectedElement = await inspectElementAtIndex(0);
    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "object": {
          "123": 3,
          "Symbol(enumerableSymbol)": 3,
          "Symbol(enumerableSymbolBase)": 1,
          "enumerableString": 2,
          "enumerableStringBase": 1,
        },
      }
    `);
  });

  it('should allow component prop value and value`s prototype has same name params.', async () => {
    const testData = Object.create(
      {
        a: undefined,
        b: Infinity,
        c: NaN,
        d: 'normal',
      },
      {
        a: {
          value: undefined,
          writable: true,
          enumerable: true,
          configurable: true,
        },
        b: {
          value: Infinity,
          writable: true,
          enumerable: true,
          configurable: true,
        },
        c: {
          value: NaN,
          writable: true,
          enumerable: true,
          configurable: true,
        },
        d: {
          value: 'normal',
          writable: true,
          enumerable: true,
          configurable: true,
        },
      },
    );
    const Example = ({data}) => null;
    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(<Example data={testData} />, container),
    );

    const inspectedElement = await inspectElementAtIndex(0);
    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "data": {
          "a": undefined,
          "b": Infinity,
          "c": NaN,
          "d": "normal",
        },
      }
    `);
  });

  it('should not dehydrate nested values until explicitly requested', async () => {
    const Example = () => {
      const [state] = React.useState({
        foo: {
          bar: {
            baz: 'hi',
          },
        },
      });

      return state.foo.bar.baz;
    };

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(
        <Example
          nestedObject={{
            a: {
              b: {
                c: [
                  {
                    d: {
                      e: {},
                    },
                  },
                ],
              },
            },
          }}
        />,
        container,
      ),
    );

    let inspectedElement = null;
    let inspectElementPath = null;

    // Render once to get a handle on inspectElementPath()
    inspectedElement = await inspectElementAtIndex(0, () => {
      inspectElementPath = useInspectElementPath();
    });

    async function loadPath(path) {
      await TestUtilsAct(async () => {
        await TestRendererAct(async () => {
          inspectElementPath(path);
          jest.runOnlyPendingTimers();
        });
      });

      inspectedElement = await inspectElementAtIndex(0);
    }

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "nestedObject": {
          "a": Dehydrated {
            "preview_short": {…},
            "preview_long": {b: {…}},
          },
        },
      }
    `);

    await loadPath(['props', 'nestedObject', 'a']);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "nestedObject": {
          "a": {
            "b": {
              "c": Dehydrated {
                "preview_short": Array(1),
                "preview_long": [{…}],
              },
            },
          },
        },
      }
    `);

    await loadPath(['props', 'nestedObject', 'a', 'b', 'c']);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "nestedObject": {
          "a": {
            "b": {
              "c": [
                {
                  "d": Dehydrated {
                    "preview_short": {…},
                    "preview_long": {e: {…}},
                  },
                },
              ],
            },
          },
        },
      }
    `);

    await loadPath(['props', 'nestedObject', 'a', 'b', 'c', 0, 'd']);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "nestedObject": {
          "a": {
            "b": {
              "c": [
                {
                  "d": {
                    "e": {},
                  },
                },
              ],
            },
          },
        },
      }
    `);

    await loadPath(['hooks', 0, 'value']);

    expect(inspectedElement.hooks).toMatchInlineSnapshot(`
      [
        {
          "hookSource": {
            "columnNumber": "removed by Jest serializer",
            "fileName": "react-devtools-shared/src/__tests__/inspectedElement-test.js",
            "functionName": "Example",
            "lineNumber": "removed by Jest serializer",
          },
          "id": 0,
          "isStateEditable": true,
          "name": "State",
          "subHooks": [],
          "value": {
            "foo": {
              "bar": Dehydrated {
                "preview_short": {…},
                "preview_long": {baz: "hi"},
              },
            },
          },
        },
      ]
    `);

    await loadPath(['hooks', 0, 'value', 'foo', 'bar']);

    expect(inspectedElement.hooks).toMatchInlineSnapshot(`
      [
        {
          "hookSource": {
            "columnNumber": "removed by Jest serializer",
            "fileName": "react-devtools-shared/src/__tests__/inspectedElement-test.js",
            "functionName": "Example",
            "lineNumber": "removed by Jest serializer",
          },
          "id": 0,
          "isStateEditable": true,
          "name": "State",
          "subHooks": [],
          "value": {
            "foo": {
              "bar": {
                "baz": "hi",
              },
            },
          },
        },
      ]
    `);
  });

  it('should dehydrate complex nested values when requested', async () => {
    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(
        <Example
          set_of_sets={new Set([new Set([1, 2, 3]), new Set(['a', 'b', 'c'])])}
        />,
        container,
      ),
    );

    let inspectedElement = null;
    let inspectElementPath = null;

    // Render once to get a handle on inspectElementPath()
    inspectedElement = await inspectElementAtIndex(0, () => {
      inspectElementPath = useInspectElementPath();
    });

    async function loadPath(path) {
      await TestUtilsAct(async () => {
        await TestRendererAct(async () => {
          inspectElementPath(path);
          jest.runOnlyPendingTimers();
        });
      });

      inspectedElement = await inspectElementAtIndex(0);
    }

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "set_of_sets": {
          "0": Dehydrated {
            "preview_short": Set(3),
            "preview_long": Set(3) {1, 2, 3},
          },
          "1": Dehydrated {
            "preview_short": Set(3),
            "preview_long": Set(3) {"a", "b", "c"},
          },
        },
      }
    `);

    await loadPath(['props', 'set_of_sets', 0]);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "set_of_sets": {
          "0": {
            "0": 1,
            "1": 2,
            "2": 3,
          },
          "1": Dehydrated {
            "preview_short": Set(3),
            "preview_long": Set(3) {"a", "b", "c"},
          },
        },
      }
    `);
  });

  it('should include updates for nested values that were previously hydrated', async () => {
    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(
        <Example
          nestedObject={{
            a: {
              value: 1,
              b: {
                value: 1,
              },
            },
            c: {
              value: 1,
              d: {
                value: 1,
                e: {
                  value: 1,
                },
              },
            },
          }}
        />,
        container,
      ),
    );

    let inspectedElement = null;
    let inspectElementPath = null;

    // Render once to get a handle on inspectElementPath()
    inspectedElement = await inspectElementAtIndex(0, () => {
      inspectElementPath = useInspectElementPath();
    });

    async function loadPath(path) {
      await TestUtilsAct(async () => {
        await TestRendererAct(async () => {
          inspectElementPath(path);
          jest.runOnlyPendingTimers();
        });
      });

      inspectedElement = await inspectElementAtIndex(0);
    }

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "nestedObject": {
          "a": Dehydrated {
            "preview_short": {…},
            "preview_long": {b: {…}, value: 1},
          },
          "c": Dehydrated {
            "preview_short": {…},
            "preview_long": {d: {…}, value: 1},
          },
        },
      }
    `);

    await loadPath(['props', 'nestedObject', 'a']);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "nestedObject": {
          "a": {
            "b": {
              "value": 1,
            },
            "value": 1,
          },
          "c": Dehydrated {
            "preview_short": {…},
            "preview_long": {d: {…}, value: 1},
          },
        },
      }
    `);

    await loadPath(['props', 'nestedObject', 'c']);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "nestedObject": {
          "a": {
            "b": {
              "value": 1,
            },
            "value": 1,
          },
          "c": {
            "d": {
              "e": Dehydrated {
                "preview_short": {…},
                "preview_long": {value: 1},
              },
              "value": 1,
            },
            "value": 1,
          },
        },
      }
    `);

    await TestRendererAct(async () => {
      await TestUtilsAct(async () => {
        legacyRender(
          <Example
            nestedObject={{
              a: {
                value: 2,
                b: {
                  value: 2,
                },
              },
              c: {
                value: 2,
                d: {
                  value: 2,
                  e: {
                    value: 2,
                  },
                },
              },
            }}
          />,
          container,
        );
      });
    });

    // Wait for pending poll-for-update and then update inspected element data.
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    inspectedElement = await inspectElementAtIndex(0);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "nestedObject": {
          "a": {
            "b": {
              "value": 2,
            },
            "value": 2,
          },
          "c": {
            "d": {
              "e": Dehydrated {
                "preview_short": {…},
                "preview_long": {value: 2},
              },
              "value": 2,
            },
            "value": 2,
          },
        },
      }
    `);
  });

  it('should return a full update if a path is inspected for an object that has other pending changes', async () => {
    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(
        <Example
          nestedObject={{
            a: {
              value: 1,
              b: {
                value: 1,
              },
            },
            c: {
              value: 1,
              d: {
                value: 1,
                e: {
                  value: 1,
                },
              },
            },
          }}
        />,
        container,
      ),
    );

    let inspectedElement = null;
    let inspectElementPath = null;

    // Render once to get a handle on inspectElementPath()
    inspectedElement = await inspectElementAtIndex(0, () => {
      inspectElementPath = useInspectElementPath();
    });

    async function loadPath(path) {
      await TestUtilsAct(async () => {
        await TestRendererAct(async () => {
          inspectElementPath(path);
          jest.runOnlyPendingTimers();
        });
      });

      inspectedElement = await inspectElementAtIndex(0);
    }

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "nestedObject": {
          "a": Dehydrated {
            "preview_short": {…},
            "preview_long": {b: {…}, value: 1},
          },
          "c": Dehydrated {
            "preview_short": {…},
            "preview_long": {d: {…}, value: 1},
          },
        },
      }
    `);

    await loadPath(['props', 'nestedObject', 'a']);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "nestedObject": {
          "a": {
            "b": {
              "value": 1,
            },
            "value": 1,
          },
          "c": Dehydrated {
            "preview_short": {…},
            "preview_long": {d: {…}, value: 1},
          },
        },
      }
    `);

    await TestRendererAct(async () => {
      await TestUtilsAct(async () => {
        legacyRender(
          <Example
            nestedObject={{
              a: {
                value: 2,
                b: {
                  value: 2,
                },
              },
              c: {
                value: 2,
                d: {
                  value: 2,
                  e: {
                    value: 2,
                  },
                },
              },
            }}
          />,
          container,
        );
      });
    });

    await loadPath(['props', 'nestedObject', 'c']);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "nestedObject": {
          "a": {
            "b": {
              "value": 2,
            },
            "value": 2,
          },
          "c": {
            "d": {
              "e": Dehydrated {
                "preview_short": {…},
                "preview_long": {value: 2},
              },
              "value": 2,
            },
            "value": 2,
          },
        },
      }
    `);
  });

  it('should not tear if hydration is requested after an update', async () => {
    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(
        <Example
          nestedObject={{
            value: 1,
            a: {
              value: 1,
              b: {
                value: 1,
              },
            },
          }}
        />,
        container,
      ),
    );

    let inspectedElement = null;
    let inspectElementPath = null;

    // Render once to get a handle on inspectElementPath()
    inspectedElement = await inspectElementAtIndex(0, () => {
      inspectElementPath = useInspectElementPath();
    });

    async function loadPath(path) {
      await TestUtilsAct(async () => {
        await TestRendererAct(async () => {
          inspectElementPath(path);
          jest.runOnlyPendingTimers();
        });
      });

      inspectedElement = await inspectElementAtIndex(0);
    }

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "nestedObject": {
          "a": Dehydrated {
            "preview_short": {…},
            "preview_long": {b: {…}, value: 1},
          },
          "value": 1,
        },
      }
    `);

    await TestUtilsAct(async () => {
      legacyRender(
        <Example
          nestedObject={{
            value: 2,
            a: {
              value: 2,
              b: {
                value: 2,
              },
            },
          }}
        />,
        container,
      );
    });

    await loadPath(['props', 'nestedObject', 'a']);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "nestedObject": {
          "a": Dehydrated {
            "preview_short": {…},
            "preview_long": {b: {…}, value: 2},
          },
          "value": 2,
        },
      }
    `);
  });

  it('should inspect hooks for components that only use context', async () => {
    const Context = React.createContext(true);
    const Example = () => {
      const value = React.useContext(Context);
      return value;
    };

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(<Example a={1} b="abc" />, container),
    );

    const inspectedElement = await inspectElementAtIndex(0);
    expect(inspectedElement).toMatchInlineSnapshot(`
      {
        "context": null,
        "events": undefined,
        "hooks": [
          {
            "hookSource": {
              "columnNumber": "removed by Jest serializer",
              "fileName": "react-devtools-shared/src/__tests__/inspectedElement-test.js",
              "functionName": "Example",
              "lineNumber": "removed by Jest serializer",
            },
            "id": null,
            "isStateEditable": false,
            "name": "Context",
            "subHooks": [],
            "value": true,
          },
        ],
        "id": 2,
        "owners": null,
        "props": {
          "a": 1,
          "b": "abc",
        },
        "rootType": "render()",
        "state": null,
      }
    `);
  });

  it('should enable inspected values to be stored as global variables', async () => {
    const Example = () => null;

    const nestedObject = {
      a: {
        value: 1,
        b: {
          value: 1,
          c: {
            value: 1,
          },
        },
      },
    };

    await utils.actAsync(() =>
      legacyRender(
        <Example nestedObject={nestedObject} />,
        document.createElement('div'),
      ),
    );

    let storeAsGlobal: StoreAsGlobal = ((null: any): StoreAsGlobal);

    const id = ((store.getElementIDAtIndex(0): any): number);
    await inspectElementAtIndex(0, () => {
      storeAsGlobal = (path: Array<string | number>) => {
        const rendererID = store.getRendererIDForElement(id);
        if (rendererID !== null) {
          const {
            storeAsGlobal: storeAsGlobalAPI,
          } = require('react-devtools-shared/src/backendAPI');
          storeAsGlobalAPI({
            bridge,
            id,
            path,
            rendererID,
          });
        }
      };
    });

    jest.spyOn(console, 'log').mockImplementation(() => {});

    // Should store the whole value (not just the hydrated parts)
    storeAsGlobal(['props', 'nestedObject']);
    jest.runOnlyPendingTimers();
    expect(console.log).toHaveBeenCalledWith('$reactTemp0');
    expect(global.$reactTemp0).toBe(nestedObject);

    console.log.mockReset();

    // Should store the nested property specified (not just the outer value)
    storeAsGlobal(['props', 'nestedObject', 'a', 'b']);
    jest.runOnlyPendingTimers();
    expect(console.log).toHaveBeenCalledWith('$reactTemp1');
    expect(global.$reactTemp1).toBe(nestedObject.a.b);
  });

  it('should enable inspected values to be copied to the clipboard', async () => {
    const Example = () => null;

    const nestedObject = {
      a: {
        value: 1,
        b: {
          value: 1,
          c: {
            value: 1,
          },
        },
      },
    };

    await utils.actAsync(() =>
      legacyRender(
        <Example nestedObject={nestedObject} />,
        document.createElement('div'),
      ),
    );

    let copyPath: CopyInspectedElementPath =
      ((null: any): CopyInspectedElementPath);

    const id = ((store.getElementIDAtIndex(0): any): number);
    await inspectElementAtIndex(0, () => {
      copyPath = (path: Array<string | number>) => {
        const rendererID = store.getRendererIDForElement(id);
        if (rendererID !== null) {
          const {
            copyInspectedElementPath,
          } = require('react-devtools-shared/src/backendAPI');
          copyInspectedElementPath({
            bridge,
            id,
            path,
            rendererID,
          });
        }
      };
    });

    // Should copy the whole value (not just the hydrated parts)
    copyPath(['props', 'nestedObject']);
    jest.runOnlyPendingTimers();
    expect(global.mockClipboardCopy).toHaveBeenCalledTimes(1);
    expect(global.mockClipboardCopy).toHaveBeenCalledWith(
      JSON.stringify(nestedObject),
    );

    global.mockClipboardCopy.mockReset();

    // Should copy the nested property specified (not just the outer value)
    copyPath(['props', 'nestedObject', 'a', 'b']);
    jest.runOnlyPendingTimers();
    expect(global.mockClipboardCopy).toHaveBeenCalledTimes(1);
    expect(global.mockClipboardCopy).toHaveBeenCalledWith(
      JSON.stringify(nestedObject.a.b),
    );
  });

  it('should enable complex values to be copied to the clipboard', async () => {
    const Immutable = require('immutable');

    const Example = () => null;

    const set = new Set(['abc', 123]);
    const map = new Map([
      ['name', 'Brian'],
      ['food', 'sushi'],
    ]);
    const setOfSets = new Set([new Set(['a', 'b', 'c']), new Set([1, 2, 3])]);
    const mapOfMaps = new Map([
      ['first', map],
      ['second', map],
    ]);
    const typedArray = Int8Array.from([100, -100, 0]);
    const arrayBuffer = typedArray.buffer;
    const dataView = new DataView(arrayBuffer);
    const immutable = Immutable.fromJS({
      a: [{hello: 'there'}, 'fixed', true],
      b: 123,
      c: {
        '1': 'xyz',
        xyz: 1,
      },
    });
    const bigInt = BigInt(123); // eslint-disable-line no-undef

    await utils.actAsync(() =>
      legacyRender(
        <Example
          arrayBuffer={arrayBuffer}
          dataView={dataView}
          map={map}
          set={set}
          mapOfMaps={mapOfMaps}
          setOfSets={setOfSets}
          typedArray={typedArray}
          immutable={immutable}
          bigInt={bigInt}
        />,
        document.createElement('div'),
      ),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let copyPath: CopyInspectedElementPath =
      ((null: any): CopyInspectedElementPath);

    await inspectElementAtIndex(0, () => {
      copyPath = (path: Array<string | number>) => {
        const rendererID = store.getRendererIDForElement(id);
        if (rendererID !== null) {
          const {
            copyInspectedElementPath,
          } = require('react-devtools-shared/src/backendAPI');
          copyInspectedElementPath({
            bridge,
            id,
            path,
            rendererID,
          });
        }
      };
    });

    // Should copy the whole value (not just the hydrated parts)
    copyPath(['props']);
    jest.runOnlyPendingTimers();
    // Should not error despite lots of unserialized values.

    global.mockClipboardCopy.mockReset();

    // Should copy the nested property specified (not just the outer value)
    copyPath(['props', 'bigInt']);
    jest.runOnlyPendingTimers();
    expect(global.mockClipboardCopy).toHaveBeenCalledTimes(1);
    expect(global.mockClipboardCopy).toHaveBeenCalledWith(
      JSON.stringify('123n'),
    );

    global.mockClipboardCopy.mockReset();

    // Should copy the nested property specified (not just the outer value)
    copyPath(['props', 'typedArray']);
    jest.runOnlyPendingTimers();
    expect(global.mockClipboardCopy).toHaveBeenCalledTimes(1);
    expect(global.mockClipboardCopy).toHaveBeenCalledWith(
      JSON.stringify({0: 100, 1: -100, 2: 0}),
    );
  });

  it('should display complex values of useDebugValue', async () => {
    const container = document.createElement('div');

    function useDebuggableHook() {
      React.useDebugValue({foo: 2});
      React.useState(1);
      return 1;
    }
    function DisplayedComplexValue() {
      useDebuggableHook();
      return null;
    }

    await utils.actAsync(() =>
      legacyRender(<DisplayedComplexValue />, container),
    );

    const {hooks} = await inspectElementAtIndex(0);
    expect(hooks).toMatchInlineSnapshot(`
      [
        {
          "hookSource": {
            "columnNumber": "removed by Jest serializer",
            "fileName": "react-devtools-shared/src/__tests__/inspectedElement-test.js",
            "functionName": "DisplayedComplexValue",
            "lineNumber": "removed by Jest serializer",
          },
          "id": null,
          "isStateEditable": false,
          "name": "DebuggableHook",
          "subHooks": [
            {
              "hookSource": {
                "columnNumber": "removed by Jest serializer",
                "fileName": "react-devtools-shared/src/__tests__/inspectedElement-test.js",
                "functionName": "useDebuggableHook",
                "lineNumber": "removed by Jest serializer",
              },
              "id": 0,
              "isStateEditable": true,
              "name": "State",
              "subHooks": [],
              "value": 1,
            },
          ],
          "value": {
            "foo": 2,
          },
        },
      ]
    `);
  });

  // See github.com/facebook/react/issues/21654
  it('should support Proxies that dont return an iterator', async () => {
    const Example = () => null;
    const proxy = new Proxy(
      {},
      {
        get: (target, prop, receiver) => {
          target[prop] = value => {};
          return target[prop];
        },
      },
    );

    const container = document.createElement('div');
    await utils.actAsync(() =>
      legacyRender(<Example proxy={proxy} />, container),
    );

    const inspectedElement = await inspectElementAtIndex(0);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      {
        "proxy": {
          "$$typeof": Dehydrated {
            "preview_short": ƒ () {},
            "preview_long": ƒ () {},
          },
          "Symbol(Symbol.iterator)": Dehydrated {
            "preview_short": ƒ () {},
            "preview_long": ƒ () {},
          },
          "constructor": Dehydrated {
            "preview_short": ƒ () {},
            "preview_long": ƒ () {},
          },
        },
      }
    `);
  });

  // Regression test for github.com/facebook/react/issues/22099
  it('should not error when an unchanged component is re-inspected after component filters changed', async () => {
    const Example = () => <div />;

    const container = document.createElement('div');
    await utils.actAsync(() => legacyRender(<Example />, container));

    // Select/inspect element
    let inspectedElement = await inspectElementAtIndex(0);
    expect(inspectedElement).toMatchInlineSnapshot(`
      {
        "context": null,
        "events": undefined,
        "hooks": null,
        "id": 2,
        "owners": null,
        "props": {},
        "rootType": "render()",
        "state": null,
      }
    `);

    await utils.actAsync(async () => {
      // Ignore transient warning this causes
      utils.withErrorsOrWarningsIgnored(['No element found with id'], () => {
        store.componentFilters = [];

        // Flush events to the renderer.
        jest.runOnlyPendingTimers();
      });
    }, false);

    // HACK: Recreate TestRenderer instance because we rely on default state values
    // from props like defaultSelectedElementID and it's easier to reset here than
    // to read the TreeDispatcherContext and update the selected ID that way.
    // We're testing the inspected values here, not the context wiring, so that's ok.
    utils.withErrorsOrWarningsIgnored(
      ['An update to %s inside a test was not wrapped in act'],
      () => {
        testRendererInstance = TestRenderer.create(null, {
          unstable_isConcurrent: true,
        });
      },
    );

    // Select/inspect the same element again
    inspectedElement = await inspectElementAtIndex(0);
    expect(inspectedElement).toMatchInlineSnapshot(`
      {
        "context": null,
        "events": undefined,
        "hooks": null,
        "id": 2,
        "owners": null,
        "props": {},
        "rootType": "render()",
        "state": null,
      }
    `);
  });

  it('should display the root type for ReactDOM.hydrate', async () => {
    const Example = () => <div />;

    await utils.actAsync(() => {
      const container = document.createElement('div');
      container.innerHTML = '<div></div>';
      withErrorsOrWarningsIgnored(
        ['ReactDOM.hydrate is no longer supported in React 18'],
        () => {
          ReactDOM.hydrate(<Example />, container);
        },
      );
    }, false);

    const inspectedElement = await inspectElementAtIndex(0);
    expect(inspectedElement.rootType).toMatchInlineSnapshot(`"hydrate()"`);
  });

  it('should display the root type for ReactDOM.render', async () => {
    const Example = () => <div />;

    await utils.actAsync(() => {
      const container = document.createElement('div');
      legacyRender(<Example />, container);
    }, false);

    const inspectedElement = await inspectElementAtIndex(0);
    expect(inspectedElement.rootType).toMatchInlineSnapshot(`"render()"`);
  });

  it('should display the root type for ReactDOMClient.hydrateRoot', async () => {
    const Example = () => <div />;

    await utils.actAsync(() => {
      const container = document.createElement('div');
      container.innerHTML = '<div></div>';
      ReactDOMClient.hydrateRoot(container, <Example />);
    }, false);

    const inspectedElement = await inspectElementAtIndex(0);
    expect(inspectedElement.rootType).toMatchInlineSnapshot(`"hydrateRoot()"`);
  });

  it('should display the root type for ReactDOMClient.createRoot', async () => {
    const Example = () => <div />;

    await utils.actAsync(() => {
      const container = document.createElement('div');
      ReactDOMClient.createRoot(container).render(<Example />);
    }, false);

    const inspectedElement = await inspectElementAtIndex(0);
    expect(inspectedElement.rootType).toMatchInlineSnapshot(`"createRoot()"`);
  });

  it('should gracefully surface backend errors on the frontend rather than timing out', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    let shouldThrow = false;

    const Example = () => {
      const [count] = React.useState(0);

      if (shouldThrow) {
        throw Error('Expected');
      } else {
        return count;
      }
    };

    await utils.actAsync(() => {
      const container = document.createElement('div');
      ReactDOMClient.createRoot(container).render(<Example />);
    }, false);

    shouldThrow = true;

    const value = await inspectElementAtIndex(0, noop, true);

    expect(value).toBe(null);

    const error = errorBoundaryInstance.state.error;
    expect(error.message).toBe('Expected');
    expect(error.stack).toContain('inspectHooksOfFiber');
  });

  describe('$r', () => {
    it('should support function components', async () => {
      const Example = () => {
        const [count] = React.useState(1);
        return count;
      };

      const container = document.createElement('div');
      await utils.actAsync(() =>
        legacyRender(<Example a={1} b="abc" />, container),
      );

      await inspectElementAtIndex(0);

      expect(global.$r).toMatchInlineSnapshot(`
        {
          "hooks": [
            {
              "hookSource": {
                "columnNumber": "removed by Jest serializer",
                "fileName": "react-devtools-shared/src/__tests__/inspectedElement-test.js",
                "functionName": "Example",
                "lineNumber": "removed by Jest serializer",
              },
              "id": 0,
              "isStateEditable": true,
              "name": "State",
              "subHooks": [],
              "value": 1,
            },
          ],
          "props": {
            "a": 1,
            "b": "abc",
          },
          "type": [Function],
        }
      `);
    });

    it('should support memoized function components', async () => {
      const Example = React.memo(function Example(props) {
        const [count] = React.useState(1);
        return count;
      });

      const container = document.createElement('div');
      await utils.actAsync(() =>
        legacyRender(<Example a={1} b="abc" />, container),
      );

      await inspectElementAtIndex(0);

      expect(global.$r).toMatchInlineSnapshot(`
        {
          "hooks": [
            {
              "hookSource": {
                "columnNumber": "removed by Jest serializer",
                "fileName": "react-devtools-shared/src/__tests__/inspectedElement-test.js",
                "functionName": "Example",
                "lineNumber": "removed by Jest serializer",
              },
              "id": 0,
              "isStateEditable": true,
              "name": "State",
              "subHooks": [],
              "value": 1,
            },
          ],
          "props": {
            "a": 1,
            "b": "abc",
          },
          "type": [Function],
        }
      `);
    });

    it('should support forward refs', async () => {
      const Example = React.forwardRef(function Example(props, ref) {
        const [count] = React.useState(1);
        return count;
      });

      const container = document.createElement('div');
      await utils.actAsync(() =>
        legacyRender(<Example a={1} b="abc" />, container),
      );

      await inspectElementAtIndex(0);

      expect(global.$r).toMatchInlineSnapshot(`
        {
          "hooks": [
            {
              "hookSource": {
                "columnNumber": "removed by Jest serializer",
                "fileName": "react-devtools-shared/src/__tests__/inspectedElement-test.js",
                "functionName": "Example",
                "lineNumber": "removed by Jest serializer",
              },
              "id": 0,
              "isStateEditable": true,
              "name": "State",
              "subHooks": [],
              "value": 1,
            },
          ],
          "props": {
            "a": 1,
            "b": "abc",
          },
          "type": [Function],
        }
      `);
    });

    it('should support class components', async () => {
      class Example extends React.Component {
        state = {
          count: 0,
        };
        render() {
          return null;
        }
      }

      const container = document.createElement('div');
      await utils.actAsync(() =>
        legacyRender(<Example a={1} b="abc" />, container),
      );

      await inspectElementAtIndex(0);

      expect(global.$r.props).toMatchInlineSnapshot(`
              {
                "a": 1,
                "b": "abc",
              }
            `);
      expect(global.$r.state).toMatchInlineSnapshot(`
              {
                "count": 0,
              }
            `);
    });
  });

  describe('inline errors and warnings', () => {
    async function getErrorsAndWarningsForElementAtIndex(index) {
      const id = ((store.getElementIDAtIndex(index): any): number);
      if (id == null) {
        throw Error(`Element at index "${index}"" not found in store`);
      }

      let errors = null;
      let warnings = null;

      function Suspender({target}) {
        const inspectedElement = useInspectedElement();
        errors = inspectedElement.errors;
        warnings = inspectedElement.warnings;
        return null;
      }

      let root;
      await utils.actAsync(() => {
        root = TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={index}>
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>,
          {unstable_isConcurrent: true},
        );
      }, false);
      await utils.actAsync(() => {
        root.unmount();
      }, false);

      return {errors, warnings};
    }

    it('during render get recorded', async () => {
      const Example = () => {
        console.error('test-only: render error');
        console.warn('test-only: render warning');
        return null;
      };

      const container = document.createElement('div');

      await withErrorsOrWarningsIgnored(['test-only: '], async () => {
        await utils.actAsync(() =>
          legacyRender(<Example repeatWarningCount={1} />, container),
        );
      });

      const data = await getErrorsAndWarningsForElementAtIndex(0);
      expect(data).toMatchInlineSnapshot(`
        {
          "errors": [
            [
              "test-only: render error",
              1,
            ],
          ],
          "warnings": [
            [
              "test-only: render warning",
              1,
            ],
          ],
        }
      `);
    });

    it('during render get deduped', async () => {
      const Example = () => {
        console.error('test-only: render error');
        console.error('test-only: render error');
        console.warn('test-only: render warning');
        console.warn('test-only: render warning');
        console.warn('test-only: render warning');
        return null;
      };

      const container = document.createElement('div');
      await utils.withErrorsOrWarningsIgnored(['test-only:'], async () => {
        await utils.actAsync(() =>
          legacyRender(<Example repeatWarningCount={1} />, container),
        );
      });
      const data = await getErrorsAndWarningsForElementAtIndex(0);
      expect(data).toMatchInlineSnapshot(`
        {
          "errors": [
            [
              "test-only: render error",
              2,
            ],
          ],
          "warnings": [
            [
              "test-only: render warning",
              3,
            ],
          ],
        }
      `);
    });

    it('during layout (mount) get recorded', async () => {
      const Example = () => {
        // Note we only test mount because once the component unmounts,
        // it is no longer in the store and warnings are ignored.
        React.useLayoutEffect(() => {
          console.error('test-only: useLayoutEffect error');
          console.warn('test-only: useLayoutEffect warning');
        }, []);
        return null;
      };

      const container = document.createElement('div');
      await utils.withErrorsOrWarningsIgnored(['test-only:'], async () => {
        await utils.actAsync(() =>
          legacyRender(<Example repeatWarningCount={1} />, container),
        );
      });

      const data = await getErrorsAndWarningsForElementAtIndex(0);
      expect(data).toMatchInlineSnapshot(`
        {
          "errors": [
            [
              "test-only: useLayoutEffect error",
              1,
            ],
          ],
          "warnings": [
            [
              "test-only: useLayoutEffect warning",
              1,
            ],
          ],
        }
      `);
    });

    it('during passive (mount) get recorded', async () => {
      const Example = () => {
        // Note we only test mount because once the component unmounts,
        // it is no longer in the store and warnings are ignored.
        React.useEffect(() => {
          console.error('test-only: useEffect error');
          console.warn('test-only: useEffect warning');
        }, []);
        return null;
      };

      const container = document.createElement('div');
      await utils.withErrorsOrWarningsIgnored(['test-only:'], async () => {
        await utils.actAsync(() =>
          legacyRender(<Example repeatWarningCount={1} />, container),
        );
      });

      const data = await getErrorsAndWarningsForElementAtIndex(0);
      expect(data).toMatchInlineSnapshot(`
        {
          "errors": [
            [
              "test-only: useEffect error",
              1,
            ],
          ],
          "warnings": [
            [
              "test-only: useEffect warning",
              1,
            ],
          ],
        }
      `);
    });

    it('from react get recorded without a component stack', async () => {
      const Example = () => {
        return [<div />];
      };

      const container = document.createElement('div');
      await utils.withErrorsOrWarningsIgnored(
        ['Warning: Each child in a list should have a unique "key" prop.'],
        async () => {
          await utils.actAsync(() =>
            legacyRender(<Example repeatWarningCount={1} />, container),
          );
        },
      );

      const data = await getErrorsAndWarningsForElementAtIndex(0);
      expect(data).toMatchInlineSnapshot(`
        {
          "errors": [
            [
              "Warning: Each child in a list should have a unique "key" prop. See https://reactjs.org/link/warning-keys for more information.
            at Example",
              1,
            ],
          ],
          "warnings": [],
        }
      `);
    });

    it('can be cleared for the whole app', async () => {
      const Example = () => {
        console.error('test-only: render error');
        console.warn('test-only: render warning');
        return null;
      };

      const container = document.createElement('div');
      await utils.withErrorsOrWarningsIgnored(['test-only:'], async () => {
        await utils.actAsync(() =>
          legacyRender(<Example repeatWarningCount={1} />, container),
        );
      });

      const {
        clearErrorsAndWarnings,
      } = require('react-devtools-shared/src/backendAPI');
      clearErrorsAndWarnings({bridge, store});

      // Flush events to the renderer.
      jest.runOnlyPendingTimers();

      const data = await getErrorsAndWarningsForElementAtIndex(0);
      expect(data).toMatchInlineSnapshot(`
        {
          "errors": [],
          "warnings": [],
        }
      `);
    });

    it('can be cleared for a particular Fiber (only warnings)', async () => {
      const Example = ({id}) => {
        console.error(`test-only: render error #${id}`);
        console.warn(`test-only: render warning #${id}`);
        return null;
      };

      const container = document.createElement('div');
      await utils.withErrorsOrWarningsIgnored(['test-only:'], async () => {
        await utils.actAsync(() =>
          legacyRender(
            <React.Fragment>
              <Example id={1} />
              <Example id={2} />
            </React.Fragment>,
            container,
          ),
        );
      });

      let id = ((store.getElementIDAtIndex(1): any): number);
      const rendererID = store.getRendererIDForElement(id);

      const {
        clearWarningsForElement,
      } = require('react-devtools-shared/src/backendAPI');
      clearWarningsForElement({bridge, id, rendererID});

      // Flush events to the renderer.
      jest.runOnlyPendingTimers();

      let data = [
        await getErrorsAndWarningsForElementAtIndex(0),
        await getErrorsAndWarningsForElementAtIndex(1),
      ];
      expect(data).toMatchInlineSnapshot(`
        [
          {
            "errors": [
              [
                "test-only: render error #1",
                1,
              ],
            ],
            "warnings": [
              [
                "test-only: render warning #1",
                1,
              ],
            ],
          },
          {
            "errors": [
              [
                "test-only: render error #2",
                1,
              ],
            ],
            "warnings": [],
          },
        ]
      `);

      id = ((store.getElementIDAtIndex(0): any): number);
      clearWarningsForElement({bridge, id, rendererID});

      // Flush events to the renderer.
      jest.runOnlyPendingTimers();

      data = [
        await getErrorsAndWarningsForElementAtIndex(0),
        await getErrorsAndWarningsForElementAtIndex(1),
      ];
      expect(data).toMatchInlineSnapshot(`
        [
          {
            "errors": [
              [
                "test-only: render error #1",
                1,
              ],
            ],
            "warnings": [],
          },
          {
            "errors": [
              [
                "test-only: render error #2",
                1,
              ],
            ],
            "warnings": [],
          },
        ]
      `);
    });

    it('can be cleared for a particular Fiber (only errors)', async () => {
      const Example = ({id}) => {
        console.error(`test-only: render error #${id}`);
        console.warn(`test-only: render warning #${id}`);
        return null;
      };

      const container = document.createElement('div');
      await utils.withErrorsOrWarningsIgnored(['test-only:'], async () => {
        await utils.actAsync(() =>
          legacyRender(
            <React.Fragment>
              <Example id={1} />
              <Example id={2} />
            </React.Fragment>,
            container,
          ),
        );
      });

      let id = ((store.getElementIDAtIndex(1): any): number);
      const rendererID = store.getRendererIDForElement(id);

      const {
        clearErrorsForElement,
      } = require('react-devtools-shared/src/backendAPI');
      clearErrorsForElement({bridge, id, rendererID});

      // Flush events to the renderer.
      jest.runOnlyPendingTimers();

      let data = [
        await getErrorsAndWarningsForElementAtIndex(0),
        await getErrorsAndWarningsForElementAtIndex(1),
      ];
      expect(data).toMatchInlineSnapshot(`
        [
          {
            "errors": [
              [
                "test-only: render error #1",
                1,
              ],
            ],
            "warnings": [
              [
                "test-only: render warning #1",
                1,
              ],
            ],
          },
          {
            "errors": [],
            "warnings": [
              [
                "test-only: render warning #2",
                1,
              ],
            ],
          },
        ]
      `);

      id = ((store.getElementIDAtIndex(0): any): number);
      clearErrorsForElement({bridge, id, rendererID});

      // Flush events to the renderer.
      jest.runOnlyPendingTimers();

      data = [
        await getErrorsAndWarningsForElementAtIndex(0),
        await getErrorsAndWarningsForElementAtIndex(1),
      ];
      expect(data).toMatchInlineSnapshot(`
        [
          {
            "errors": [],
            "warnings": [
              [
                "test-only: render warning #1",
                1,
              ],
            ],
          },
          {
            "errors": [],
            "warnings": [
              [
                "test-only: render warning #2",
                1,
              ],
            ],
          },
        ]
      `);
    });
  });

  it('inspecting nested renderers should not throw', async () => {
    // Ignoring react art warnings
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const ReactArt = require('react-art');
    const ArtSVGMode = require('art/modes/svg');
    const ARTCurrentMode = require('art/modes/current');
    store.componentFilters = [];

    ARTCurrentMode.setCurrent(ArtSVGMode);
    const {Surface, Group} = ReactArt;

    function Child() {
      return (
        <Surface width={1} height={1}>
          <Group />
        </Surface>
      );
    }
    function App() {
      return <Child />;
    }

    await utils.actAsync(() => {
      legacyRender(<App />, document.createElement('div'));
    });
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <App>
          ▾ <Child>
            ▾ <Surface>
                <svg>
      [root]
          <Group>
    `);

    const inspectedElement = await inspectElementAtIndex(4);
    expect(inspectedElement.owners).toMatchInlineSnapshot(`
      [
        {
          "displayName": "Child",
          "hocDisplayNames": null,
          "id": 3,
          "key": null,
          "type": 5,
        },
        {
          "displayName": "App",
          "hocDisplayNames": null,
          "id": 2,
          "key": null,
          "type": 5,
        },
      ]
    `);
  });

  describe('error boundary', () => {
    it('can toggle error', async () => {
      class LocalErrorBoundary extends React.Component<any> {
        state = {hasError: false};
        static getDerivedStateFromError(error) {
          return {hasError: true};
        }
        render() {
          const {hasError} = this.state;
          return hasError ? 'has-error' : this.props.children;
        }
      }

      const Example = () => 'example';

      await utils.actAsync(() =>
        legacyRender(
          <LocalErrorBoundary>
            <Example />
          </LocalErrorBoundary>,
          document.createElement('div'),
        ),
      );

      const targetErrorBoundaryID = ((store.getElementIDAtIndex(
        0,
      ): any): number);
      const inspect = index => {
        // HACK: Recreate TestRenderer instance so we can inspect different elements
        utils.withErrorsOrWarningsIgnored(
          ['An update to %s inside a test was not wrapped in act'],
          () => {
            testRendererInstance = TestRenderer.create(null, {
              unstable_isConcurrent: true,
            });
          },
        );
        return inspectElementAtIndex(index);
      };
      const toggleError = async forceError => {
        await withErrorsOrWarningsIgnored(['ErrorBoundary'], async () => {
          await TestUtilsAct(async () => {
            bridge.send('overrideError', {
              id: targetErrorBoundaryID,
              rendererID: store.getRendererIDForElement(targetErrorBoundaryID),
              forceError,
            });
          });
        });

        await TestUtilsAct(async () => {
          jest.runOnlyPendingTimers();
        });
      };

      // Inspect <ErrorBoundary /> and see that we cannot toggle error state
      // on error boundary itself
      let inspectedElement = await inspect(0);
      expect(inspectedElement.canToggleError).toBe(false);
      expect(inspectedElement.targetErrorBoundaryID).toBe(null);

      // Inspect <Example />
      inspectedElement = await inspect(1);
      expect(inspectedElement.canToggleError).toBe(true);
      expect(inspectedElement.isErrored).toBe(false);
      expect(inspectedElement.targetErrorBoundaryID).toBe(
        targetErrorBoundaryID,
      );

      // Suppress expected error and warning.
      const consoleErrorMock = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const consoleWarnMock = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      // now force error state on <Example />
      await toggleError(true);

      consoleErrorMock.mockRestore();
      consoleWarnMock.mockRestore();

      // we are in error state now, <Example /> won't show up
      withErrorsOrWarningsIgnored(['Invalid index'], () => {
        expect(store.getElementIDAtIndex(1)).toBe(null);
      });

      // Inpsect <ErrorBoundary /> to toggle off the error state
      inspectedElement = await inspect(0);
      expect(inspectedElement.canToggleError).toBe(true);
      expect(inspectedElement.isErrored).toBe(true);
      // its error boundary ID is itself because it's caught the error
      expect(inspectedElement.targetErrorBoundaryID).toBe(
        targetErrorBoundaryID,
      );

      await toggleError(false);

      // We can now inspect <Example /> with ability to toggle again
      inspectedElement = await inspect(1);
      expect(inspectedElement.canToggleError).toBe(true);
      expect(inspectedElement.isErrored).toBe(false);
      expect(inspectedElement.targetErrorBoundaryID).toBe(
        targetErrorBoundaryID,
      );
    });
  });
});
