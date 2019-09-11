/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof ReactTestRenderer from 'react-test-renderer';
import type {GetInspectedElementPath} from 'react-devtools-shared/src/devtools/views/Components/InspectedElementContext';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type Store from 'react-devtools-shared/src/devtools/store';

describe('InspectedElementContext', () => {
  let React;
  let ReactDOM;
  let PropTypes;
  let TestRenderer: ReactTestRenderer;
  let bridge: FrontendBridge;
  let store: Store;
  let meta;
  let utils;

  let BridgeContext;
  let InspectedElementContext;
  let InspectedElementContextController;
  let StoreContext;
  let TestUtils;
  let TreeContextController;

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    meta = require('react-devtools-shared/src/hydration').meta;

    bridge = global.bridge;
    store = global.store;
    store.collapseNodesByDefault = false;

    React = require('react');
    ReactDOM = require('react-dom');
    PropTypes = require('prop-types');
    TestUtils = require('react-dom/test-utils');
    TestRenderer = utils.requireTestRenderer();

    BridgeContext = require('react-devtools-shared/src/devtools/views/context')
      .BridgeContext;
    InspectedElementContext = require('react-devtools-shared/src/devtools/views/Components/InspectedElementContext')
      .InspectedElementContext;
    InspectedElementContextController = require('react-devtools-shared/src/devtools/views/Components/InspectedElementContext')
      .InspectedElementContextController;
    StoreContext = require('react-devtools-shared/src/devtools/views/context')
      .StoreContext;
    TreeContextController = require('react-devtools-shared/src/devtools/views/Components/TreeContext')
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
          defaultSelectedElementIndex={defaultSelectedElementIndex}>
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
    await utils.actAsync(() =>
      ReactDOM.render(<Example a={1} b="abc" />, container),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let didFinish = false;

    function Suspender({target}) {
      const {getInspectedElement} = React.useContext(InspectedElementContext);
      const inspectedElement = getInspectedElement(id);
      expect(inspectedElement).toMatchSnapshot(`1: Inspected element ${id}`);
      didFinish = true;
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}>
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>,
        ),
      false,
    );
    expect(didFinish).toBe(true);

    done();
  });

  it('should have hasLegacyContext flag set to either "true" or "false" depending on which context API is used.', async done => {
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
      ReactDOM.render(
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

    const ids = [
      {
        // <LegacyContextConsumer />
        id: ((store.getElementIDAtIndex(1): any): number),
        shouldHaveLegacyContext: true,
      },
      {
        // <BoolContext.Consumer>
        id: ((store.getElementIDAtIndex(2): any): number),
        shouldHaveLegacyContext: false,
      },
      {
        // <ModernContextType />
        id: ((store.getElementIDAtIndex(3): any): number),
        shouldHaveLegacyContext: false,
      },
      {
        // <ModernContext.Consumer>
        id: ((store.getElementIDAtIndex(5): any): number),
        shouldHaveLegacyContext: false,
      },
    ];

    function Suspender({target, shouldHaveLegacyContext}) {
      const {getInspectedElement} = React.useContext(InspectedElementContext);
      const inspectedElement = getInspectedElement(target);

      expect(inspectedElement.context).not.toBe(null);
      expect(inspectedElement.hasLegacyContext).toBe(shouldHaveLegacyContext);

      return null;
    }

    for (let i = 0; i < ids.length; i++) {
      const {id, shouldHaveLegacyContext} = ids[i];

      await utils.actAsync(
        () =>
          TestRenderer.create(
            <Contexts
              defaultSelectedElementID={id}
              defaultSelectedElementIndex={0}>
              <React.Suspense fallback={null}>
                <Suspender
                  target={id}
                  shouldHaveLegacyContext={shouldHaveLegacyContext}
                />
              </React.Suspense>
            </Contexts>,
          ),
        false,
      );
    }
    done();
  });

  it('should poll for updates for the currently selected element', async done => {
    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(
      () => ReactDOM.render(<Example a={1} b="abc" />, container),
      false,
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let inspectedElement = null;

    function Suspender({target}) {
      const {getInspectedElement} = React.useContext(InspectedElementContext);
      inspectedElement = getInspectedElement(id);
      return null;
    }

    let renderer;

    await utils.actAsync(() => {
      renderer = TestRenderer.create(
        <Contexts defaultSelectedElementID={id} defaultSelectedElementIndex={0}>
          <React.Suspense fallback={null}>
            <Suspender target={id} />
          </React.Suspense>
        </Contexts>,
      );
    }, false);
    expect(inspectedElement).toMatchSnapshot('1: initial render');

    await utils.actAsync(
      () => ReactDOM.render(<Example a={2} b="def" />, container),
      false,
    );

    inspectedElement = null;
    await utils.actAsync(
      () =>
        renderer.update(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}>
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>,
        ),
      false,
    );
    expect(inspectedElement).toMatchSnapshot('2: updated state');

    done();
  });

  it('should not re-render a function with hooks if it did not update since it was last inspected', async done => {
    let targetRenderCount = 0;

    const Wrapper = ({children}) => children;
    const Target = React.memo(props => {
      targetRenderCount++;
      React.useState(0);
      return null;
    });

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(
        <Wrapper>
          <Target a={1} b="abc" />
        </Wrapper>,
        container,
      ),
    );

    const id = ((store.getElementIDAtIndex(1): any): number);

    let inspectedElement = null;

    function Suspender({target}) {
      const {getInspectedElement} = React.useContext(InspectedElementContext);
      inspectedElement = getInspectedElement(target);
      return null;
    }

    targetRenderCount = 0;

    let renderer;
    await utils.actAsync(
      () =>
        (renderer = TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={1}>
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>,
        )),
      false,
    );
    expect(targetRenderCount).toBe(1);
    expect(inspectedElement).toMatchSnapshot('1: initial render');

    const initialInspectedElement = inspectedElement;

    targetRenderCount = 0;
    inspectedElement = null;
    await utils.actAsync(
      () =>
        renderer.update(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={1}>
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>,
        ),
      false,
    );
    expect(targetRenderCount).toBe(0);
    expect(inspectedElement).toEqual(initialInspectedElement);

    targetRenderCount = 0;

    await utils.actAsync(
      () =>
        ReactDOM.render(
          <Wrapper>
            <Target a={2} b="def" />
          </Wrapper>,
          container,
        ),
      false,
    );

    // Target should have been rendered once (by ReactDOM) and once by DevTools for inspection.
    expect(targetRenderCount).toBe(2);
    expect(inspectedElement).toMatchSnapshot('2: updated state');

    done();
  });

  it('should temporarily disable console logging when re-running a component to inspect its hooks', async done => {
    let targetRenderCount = 0;

    const errorSpy = ((console: any).error = jest.fn());
    const infoSpy = ((console: any).info = jest.fn());
    const logSpy = ((console: any).log = jest.fn());
    const warnSpy = ((console: any).warn = jest.fn());

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
    await utils.actAsync(() =>
      ReactDOM.render(<Target a={1} b="abc" />, container),
    );

    expect(targetRenderCount).toBe(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith('error');
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith('info');
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith('log');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('warn');

    const id = ((store.getElementIDAtIndex(0): any): number);

    let inspectedElement = null;

    function Suspender({target}) {
      const {getInspectedElement} = React.useContext(InspectedElementContext);
      inspectedElement = getInspectedElement(target);
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={1}>
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>,
        ),
      false,
    );

    expect(inspectedElement).not.toBe(null);
    expect(targetRenderCount).toBe(2);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    done();
  });

  it('should support simple data types', async done => {
    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(
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

    const id = ((store.getElementIDAtIndex(0): any): number);
    let inspectedElement = null;

    function Suspender({target}) {
      const {getInspectedElement} = React.useContext(InspectedElementContext);
      inspectedElement = getInspectedElement(id);
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}>
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>,
        ),
      false,
    );

    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('1: Initial inspection');

    const {props} = (inspectedElement: any);
    expect(props.boolean_false).toBe(false);
    expect(props.boolean_true).toBe(true);
    expect(Number.isFinite(props.infinity)).toBe(false);
    expect(props.integer_zero).toEqual(0);
    expect(props.integer_one).toEqual(1);
    expect(props.float).toEqual(1.23);
    expect(props.string).toEqual('abc');
    expect(props.string_empty).toEqual('');
    expect(props.nan).toBeNaN();
    expect(props.value_null).toBeNull();
    expect(props.value_undefined).toBeUndefined();

    done();
  });

  it('should support complex data types', async done => {
    const Immutable = require('immutable');

    const Example = () => null;

    const div = document.createElement('div');
    const exampleFunction = () => {};
    const setShallow = new Set(['abc', 123]);
    const mapShallow = new Map([['name', 'Brian'], ['food', 'sushi']]);
    const setOfSets = new Set([new Set(['a', 'b', 'c']), new Set([1, 2, 3])]);
    const mapOfMaps = new Map([['first', mapShallow], ['second', mapShallow]]);
    const typedArray = Int8Array.from([100, -100, 0]);
    const immutableMap = Immutable.fromJS({
      a: [{hello: 'there'}, 'fixed', true],
      b: 123,
      c: {
        '1': 'xyz',
        xyz: 1,
      },
    });

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(
        <Example
          array_buffer={typedArray.buffer}
          date={new Date()}
          fn={exampleFunction}
          html_element={div}
          immutable={immutableMap}
          map={mapShallow}
          map_of_maps={mapOfMaps}
          react_element={<span />}
          set={setShallow}
          set_of_sets={setOfSets}
          symbol={Symbol('symbol')}
          typed_array={typedArray}
        />,
        container,
      ),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let inspectedElement = null;

    function Suspender({target}) {
      const {getInspectedElement} = React.useContext(InspectedElementContext);
      inspectedElement = getInspectedElement(id);
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}>
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>,
        ),
      false,
    );

    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot(`1: Inspected element ${id}`);

    const {
      array_buffer,
      date,
      fn,
      html_element,
      immutable,
      map,
      map_of_maps,
      react_element,
      set,
      set_of_sets,
      symbol,
      typed_array,
    } = (inspectedElement: any).props;

    expect(array_buffer[meta.size]).toBe(3);
    expect(array_buffer[meta.inspectable]).toBe(false);
    expect(array_buffer[meta.name]).toBe('ArrayBuffer');
    expect(array_buffer[meta.type]).toBe('array_buffer');

    expect(date[meta.inspectable]).toBe(false);
    expect(date[meta.type]).toBe('date');

    expect(fn[meta.inspectable]).toBe(false);
    expect(fn[meta.name]).toBe('exampleFunction');
    expect(fn[meta.type]).toBe('function');

    expect(html_element[meta.inspectable]).toBe(false);
    expect(html_element[meta.name]).toBe('DIV');
    expect(html_element[meta.type]).toBe('html_element');

    expect(immutable[meta.inspectable]).toBeUndefined(); // Complex type
    expect(immutable[meta.name]).toBe('Map');
    expect(immutable[meta.type]).toBe('iterator');

    expect(map[meta.inspectable]).toBeUndefined(); // Complex type
    expect(map[meta.name]).toBe('Map');
    expect(map[meta.type]).toBe('iterator');
    expect(map[0][meta.type]).toBe('array');

    expect(map_of_maps[meta.inspectable]).toBeUndefined(); // Complex type
    expect(map_of_maps[meta.name]).toBe('Map');
    expect(map_of_maps[meta.type]).toBe('iterator');
    expect(map_of_maps[0][meta.type]).toBe('array');

    expect(react_element[meta.inspectable]).toBe(false);
    expect(react_element[meta.name]).toBe('span');
    expect(react_element[meta.type]).toBe('react_element');

    expect(set[meta.inspectable]).toBeUndefined(); // Complex type
    expect(set[meta.name]).toBe('Set');
    expect(set[meta.type]).toBe('iterator');
    expect(set[0]).toBe('abc');
    expect(set[1]).toBe(123);

    expect(set_of_sets[meta.inspectable]).toBeUndefined(); // Complex type
    expect(set_of_sets[meta.name]).toBe('Set');
    expect(set_of_sets[meta.type]).toBe('iterator');
    expect(set_of_sets['0'][meta.inspectable]).toBe(true);

    expect(symbol[meta.inspectable]).toBe(false);
    expect(symbol[meta.name]).toBe('Symbol(symbol)');
    expect(symbol[meta.type]).toBe('symbol');

    expect(typed_array[meta.inspectable]).toBeUndefined(); // Complex type
    expect(typed_array[meta.size]).toBe(3);
    expect(typed_array[meta.name]).toBe('Int8Array');
    expect(typed_array[meta.type]).toBe('typed_array');
    expect(typed_array[0]).toBe(100);
    expect(typed_array[1]).toBe(-100);
    expect(typed_array[2]).toBe(0);

    done();
  });

  it('should support custom objects with enumerable properties and getters', async done => {
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
      ReactDOM.render(<Example data={new CustomData()} />, container),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let didFinish = false;

    function Suspender({target}) {
      const {getInspectedElement} = React.useContext(InspectedElementContext);
      const inspectedElement = getInspectedElement(id);
      expect(inspectedElement).toMatchSnapshot(`1: Inspected element ${id}`);
      didFinish = true;
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}>
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>,
        ),
      false,
    );
    expect(didFinish).toBe(true);

    done();
  });

  it('should not dehydrate nested values until explicitly requested', async done => {
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
      ReactDOM.render(
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

    const id = ((store.getElementIDAtIndex(0): any): number);

    let getInspectedElementPath: GetInspectedElementPath = ((null: any): GetInspectedElementPath);
    let inspectedElement = null;

    function Suspender({target}) {
      const context = React.useContext(InspectedElementContext);
      getInspectedElementPath = context.getInspectedElementPath;
      inspectedElement = context.getInspectedElement(target);
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}>
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>,
        ),
      false,
    );
    expect(getInspectedElementPath).not.toBeNull();
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('1: Initially inspect element');

    inspectedElement = null;
    TestUtils.act(() => {
      TestRenderer.act(() => {
        getInspectedElementPath(id, ['props', 'nestedObject', 'a']);
        jest.runOnlyPendingTimers();
      });
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('2: Inspect props.nestedObject.a');

    inspectedElement = null;
    TestUtils.act(() => {
      TestRenderer.act(() => {
        getInspectedElementPath(id, ['props', 'nestedObject', 'a', 'b', 'c']);
        jest.runOnlyPendingTimers();
      });
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot(
      '3: Inspect props.nestedObject.a.b.c',
    );

    inspectedElement = null;
    TestUtils.act(() => {
      TestRenderer.act(() => {
        getInspectedElementPath(id, [
          'props',
          'nestedObject',
          'a',
          'b',
          'c',
          0,
          'd',
        ]);
        jest.runOnlyPendingTimers();
      });
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot(
      '4: Inspect props.nestedObject.a.b.c.0.d',
    );

    inspectedElement = null;
    TestUtils.act(() => {
      TestRenderer.act(() => {
        getInspectedElementPath(id, ['hooks', 0, 'value']);
        jest.runOnlyPendingTimers();
      });
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('5: Inspect hooks.0.value');

    inspectedElement = null;
    TestUtils.act(() => {
      TestRenderer.act(() => {
        getInspectedElementPath(id, ['hooks', 0, 'value', 'foo', 'bar']);
        jest.runOnlyPendingTimers();
      });
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot(
      '6: Inspect hooks.0.value.foo.bar',
    );

    done();
  });

  it('should dehydrate complex nested values when requested', async done => {
    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(
        <Example
          set_of_sets={new Set([new Set([1, 2, 3]), new Set(['a', 'b', 'c'])])}
        />,
        container,
      ),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let getInspectedElementPath: GetInspectedElementPath = ((null: any): GetInspectedElementPath);
    let inspectedElement = null;

    function Suspender({target}) {
      const context = React.useContext(InspectedElementContext);
      getInspectedElementPath = context.getInspectedElementPath;
      inspectedElement = context.getInspectedElement(target);
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}>
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>,
        ),
      false,
    );
    expect(getInspectedElementPath).not.toBeNull();
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('1: Initially inspect element');

    inspectedElement = null;
    TestUtils.act(() => {
      TestRenderer.act(() => {
        getInspectedElementPath(id, ['props', 'set_of_sets', 0]);
        jest.runOnlyPendingTimers();
      });
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('2: Inspect props.set_of_sets.0');

    done();
  });

  it('should include updates for nested values that were previously hydrated', async done => {
    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(
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

    const id = ((store.getElementIDAtIndex(0): any): number);

    let getInspectedElementPath: GetInspectedElementPath = ((null: any): GetInspectedElementPath);
    let inspectedElement = null;

    function Suspender({target}) {
      const context = React.useContext(InspectedElementContext);
      getInspectedElementPath = context.getInspectedElementPath;
      inspectedElement = context.getInspectedElement(id);
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}>
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>,
        ),
      false,
    );
    expect(getInspectedElementPath).not.toBeNull();
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('1: Initially inspect element');

    inspectedElement = null;
    TestRenderer.act(() => {
      getInspectedElementPath(id, ['props', 'nestedObject', 'a']);
      jest.runOnlyPendingTimers();
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('2: Inspect props.nestedObject.a');

    inspectedElement = null;
    TestRenderer.act(() => {
      getInspectedElementPath(id, ['props', 'nestedObject', 'c']);
      jest.runOnlyPendingTimers();
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('3: Inspect props.nestedObject.c');

    TestRenderer.act(() => {
      TestUtils.act(() => {
        ReactDOM.render(
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

    TestRenderer.act(() => {
      inspectedElement = null;
      jest.advanceTimersByTime(1000);
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('4: update inspected element');

    done();
  });

  it('should not tear if hydration is requested after an update', async done => {
    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(
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

    const id = ((store.getElementIDAtIndex(0): any): number);

    let getInspectedElementPath: GetInspectedElementPath = ((null: any): GetInspectedElementPath);
    let inspectedElement = null;

    function Suspender({target}) {
      const context = React.useContext(InspectedElementContext);
      getInspectedElementPath = context.getInspectedElementPath;
      inspectedElement = context.getInspectedElement(id);
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}>
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>,
        ),
      false,
    );
    expect(getInspectedElementPath).not.toBeNull();
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('1: Initially inspect element');

    TestUtils.act(() => {
      ReactDOM.render(
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

    inspectedElement = null;

    TestRenderer.act(() => {
      TestUtils.act(() => {
        getInspectedElementPath(id, ['props', 'nestedObject', 'a']);
        jest.runOnlyPendingTimers();
      });
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('2: Inspect props.nestedObject.a');

    done();
  });

  it('should inspect hooks for components that only use context', async done => {
    const Context = React.createContext(true);
    const Example = () => {
      const value = React.useContext(Context);
      return value;
    };

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(<Example a={1} b="abc" />, container),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let didFinish = false;

    function Suspender({target}) {
      const {getInspectedElement} = React.useContext(InspectedElementContext);
      const inspectedElement = getInspectedElement(id);
      expect(inspectedElement).toMatchSnapshot(`1: Inspected element ${id}`);
      didFinish = true;
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}>
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>,
        ),
      false,
    );
    expect(didFinish).toBe(true);

    done();
  });
});
