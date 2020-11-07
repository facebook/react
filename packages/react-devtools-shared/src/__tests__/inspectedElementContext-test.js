/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof ReactTestRenderer from 'react-test-renderer';
import type {
  CopyInspectedElementPath,
  GetInspectedElementPath,
  StoreAsGlobal,
} from 'react-devtools-shared/src/devtools/views/Components/InspectedElementContext';
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

  let TestUtilsAct;
  let TestRendererAct;

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
    TestUtilsAct = TestUtils.unstable_concurrentAct;
    TestRenderer = utils.requireTestRenderer();
    TestRendererAct = TestUtils.unstable_concurrentAct;

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
      get: function(_, name) {
        return function() {
          return null;
        };
      },
    });

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(
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
      anonymous_fn,
      array_buffer,
      array_of_arrays,
      big_int,
      bound_fn,
      data_view,
      date,
      fn,
      html_element,
      immutable,
      map,
      map_of_maps,
      object_of_objects,
      object_with_symbol,
      proxy,
      react_element,
      regexp,
      set,
      set_of_sets,
      symbol,
      typed_array,
    } = (inspectedElement: any).props;

    expect(anonymous_fn[meta.inspectable]).toBe(false);
    expect(anonymous_fn[meta.name]).toBe('function');
    expect(anonymous_fn[meta.type]).toBe('function');
    expect(anonymous_fn[meta.preview_long]).toBe('ƒ () {}');
    expect(anonymous_fn[meta.preview_short]).toBe('ƒ () {}');

    expect(array_buffer[meta.size]).toBe(3);
    expect(array_buffer[meta.inspectable]).toBe(false);
    expect(array_buffer[meta.name]).toBe('ArrayBuffer');
    expect(array_buffer[meta.type]).toBe('array_buffer');
    expect(array_buffer[meta.preview_short]).toBe('ArrayBuffer(3)');
    expect(array_buffer[meta.preview_long]).toBe('ArrayBuffer(3)');

    expect(array_of_arrays[0][meta.size]).toBe(2);
    expect(array_of_arrays[0][meta.inspectable]).toBe(true);
    expect(array_of_arrays[0][meta.name]).toBe('Array');
    expect(array_of_arrays[0][meta.type]).toBe('array');
    expect(array_of_arrays[0][meta.preview_long]).toBe('[Array(3), Array(0)]');
    expect(array_of_arrays[0][meta.preview_short]).toBe('Array(2)');

    expect(big_int[meta.inspectable]).toBe(false);
    expect(big_int[meta.name]).toBe('123');
    expect(big_int[meta.type]).toBe('bigint');
    expect(big_int[meta.preview_long]).toBe('123n');
    expect(big_int[meta.preview_short]).toBe('123n');

    expect(bound_fn[meta.inspectable]).toBe(false);
    expect(bound_fn[meta.name]).toBe('bound exampleFunction');
    expect(bound_fn[meta.type]).toBe('function');
    expect(bound_fn[meta.preview_long]).toBe('ƒ bound exampleFunction() {}');
    expect(bound_fn[meta.preview_short]).toBe('ƒ bound exampleFunction() {}');

    expect(data_view[meta.size]).toBe(3);
    expect(data_view[meta.inspectable]).toBe(false);
    expect(data_view[meta.name]).toBe('DataView');
    expect(data_view[meta.type]).toBe('data_view');
    expect(data_view[meta.preview_long]).toBe('DataView(3)');
    expect(data_view[meta.preview_short]).toBe('DataView(3)');

    expect(date[meta.inspectable]).toBe(false);
    expect(date[meta.type]).toBe('date');
    expect(new Date(date[meta.preview_long]).toISOString()).toBe(
      exampleDateISO,
    );
    expect(new Date(date[meta.preview_short]).toISOString()).toBe(
      exampleDateISO,
    );

    expect(fn[meta.inspectable]).toBe(false);
    expect(fn[meta.name]).toBe('exampleFunction');
    expect(fn[meta.type]).toBe('function');
    expect(fn[meta.preview_long]).toBe('ƒ exampleFunction() {}');
    expect(fn[meta.preview_short]).toBe('ƒ exampleFunction() {}');

    expect(html_element[meta.inspectable]).toBe(false);
    expect(html_element[meta.name]).toBe('DIV');
    expect(html_element[meta.type]).toBe('html_element');
    expect(html_element[meta.preview_long]).toBe('<div />');
    expect(html_element[meta.preview_short]).toBe('<div />');

    expect(immutable[meta.inspectable]).toBeUndefined(); // Complex type
    expect(immutable[meta.name]).toBe('Map');
    expect(immutable[meta.type]).toBe('iterator');
    expect(immutable[meta.preview_long]).toBe(
      'Map(3) {"a" => List(3), "b" => 123, "c" => Map(2)}',
    );
    expect(immutable[meta.preview_short]).toBe('Map(3)');

    expect(map[meta.inspectable]).toBeUndefined(); // Complex type
    expect(map[meta.name]).toBe('Map');
    expect(map[meta.type]).toBe('iterator');
    expect(map[0][meta.type]).toBe('array');
    expect(map[meta.preview_long]).toBe(
      'Map(2) {"name" => "Brian", "food" => "sushi"}',
    );
    expect(map[meta.preview_short]).toBe('Map(2)');

    expect(map_of_maps[meta.inspectable]).toBeUndefined(); // Complex type
    expect(map_of_maps[meta.name]).toBe('Map');
    expect(map_of_maps[meta.type]).toBe('iterator');
    expect(map_of_maps[0][meta.type]).toBe('array');
    expect(map_of_maps[meta.preview_long]).toBe(
      'Map(2) {"first" => Map(2), "second" => Map(2)}',
    );
    expect(map_of_maps[meta.preview_short]).toBe('Map(2)');

    expect(object_of_objects.inner[meta.size]).toBe(3);
    expect(object_of_objects.inner[meta.inspectable]).toBe(true);
    expect(object_of_objects.inner[meta.name]).toBe('');
    expect(object_of_objects.inner[meta.type]).toBe('object');
    expect(object_of_objects.inner[meta.preview_long]).toBe(
      '{boolean: true, number: 123, string: "abc"}',
    );
    expect(object_of_objects.inner[meta.preview_short]).toBe('{…}');

    expect(object_with_symbol['Symbol(name)']).toBe('hello');

    expect(proxy[meta.inspectable]).toBe(false);
    expect(proxy[meta.name]).toBe('function');
    expect(proxy[meta.type]).toBe('function');
    expect(proxy[meta.preview_long]).toBe('ƒ () {}');
    expect(proxy[meta.preview_short]).toBe('ƒ () {}');

    expect(react_element[meta.inspectable]).toBe(false);
    expect(react_element[meta.name]).toBe('span');
    expect(react_element[meta.type]).toBe('react_element');
    expect(react_element[meta.preview_long]).toBe('<span />');
    expect(react_element[meta.preview_short]).toBe('<span />');

    expect(regexp[meta.inspectable]).toBe(false);
    expect(regexp[meta.name]).toBe('/abc/giu');
    expect(regexp[meta.preview_long]).toBe('/abc/giu');
    expect(regexp[meta.preview_short]).toBe('/abc/giu');
    expect(regexp[meta.type]).toBe('regexp');

    expect(set[meta.inspectable]).toBeUndefined(); // Complex type
    expect(set[meta.name]).toBe('Set');
    expect(set[meta.type]).toBe('iterator');
    expect(set[0]).toBe('abc');
    expect(set[1]).toBe(123);
    expect(set[meta.preview_long]).toBe('Set(2) {"abc", 123}');
    expect(set[meta.preview_short]).toBe('Set(2)');

    expect(set_of_sets[meta.inspectable]).toBeUndefined(); // Complex type
    expect(set_of_sets[meta.name]).toBe('Set');
    expect(set_of_sets[meta.type]).toBe('iterator');
    expect(set_of_sets['0'][meta.inspectable]).toBe(true);
    expect(set_of_sets[meta.preview_long]).toBe('Set(2) {Set(3), Set(3)}');
    expect(set_of_sets[meta.preview_short]).toBe('Set(2)');

    expect(symbol[meta.inspectable]).toBe(false);
    expect(symbol[meta.name]).toBe('Symbol(symbol)');
    expect(symbol[meta.type]).toBe('symbol');
    expect(symbol[meta.preview_long]).toBe('Symbol(symbol)');
    expect(symbol[meta.preview_short]).toBe('Symbol(symbol)');

    expect(typed_array[meta.inspectable]).toBeUndefined(); // Complex type
    expect(typed_array[meta.size]).toBe(3);
    expect(typed_array[meta.name]).toBe('Int8Array');
    expect(typed_array[meta.type]).toBe('typed_array');
    expect(typed_array[0]).toBe(100);
    expect(typed_array[1]).toBe(-100);
    expect(typed_array[2]).toBe(0);
    expect(typed_array[meta.preview_long]).toBe('Int8Array(3) [100, -100, 0]');
    expect(typed_array[meta.preview_short]).toBe('Int8Array(3)');

    done();
  });

  it('should not consume iterables while inspecting', async done => {
    const Example = () => null;

    function* generator() {
      throw Error('Should not be consumed!');
    }

    const container = document.createElement('div');

    const iterable = generator();
    await utils.actAsync(() =>
      ReactDOM.render(<Example prop={iterable} />, container),
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

    const {prop} = (inspectedElement: any).props;
    expect(prop[meta.inspectable]).toBe(false);
    expect(prop[meta.name]).toBe('Generator');
    expect(prop[meta.type]).toBe('opaque_iterator');
    expect(prop[meta.preview_long]).toBe('Generator');
    expect(prop[meta.preview_short]).toBe('Generator');

    done();
  });

  it('should support objects with no prototype', async done => {
    const Example = () => null;

    const object = Object.create(null);
    object.string = 'abc';
    object.number = 123;
    object.boolean = true;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(<Example object={object} />, container),
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
    expect(inspectedElement.props.object).toEqual({
      boolean: true,
      number: 123,
      string: 'abc',
    });

    done();
  });

  it('should support objects with overridden hasOwnProperty', async done => {
    const Example = () => null;

    const object = {
      name: 'blah',
      hasOwnProperty: true,
    };

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(<Example object={object} />, container),
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
    expect(inspectedElement.props.object).toEqual({
      name: 'blah',
      hasOwnProperty: true,
    });

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

  it('should support objects with with inherited keys', async done => {
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
      ReactDOM.render(<Example object={object} />, container),
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
    expect(inspectedElement.props.object).toEqual({
      123: 3,
      'Symbol(enumerableSymbol)': 3,
      'Symbol(enumerableSymbolBase)': 1,
      enumerableString: 2,
      enumerableStringBase: 1,
    });

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
    TestUtilsAct(() => {
      TestRendererAct(() => {
        getInspectedElementPath(id, ['props', 'nestedObject', 'a']);
        jest.runOnlyPendingTimers();
      });
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('2: Inspect props.nestedObject.a');

    inspectedElement = null;
    TestUtilsAct(() => {
      TestRendererAct(() => {
        getInspectedElementPath(id, ['props', 'nestedObject', 'a', 'b', 'c']);
        jest.runOnlyPendingTimers();
      });
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot(
      '3: Inspect props.nestedObject.a.b.c',
    );

    inspectedElement = null;
    TestUtilsAct(() => {
      TestRendererAct(() => {
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
    TestUtilsAct(() => {
      TestRendererAct(() => {
        getInspectedElementPath(id, ['hooks', 0, 'value']);
        jest.runOnlyPendingTimers();
      });
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('5: Inspect hooks.0.value');

    inspectedElement = null;
    TestUtilsAct(() => {
      TestRendererAct(() => {
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
    TestUtilsAct(() => {
      TestRendererAct(() => {
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
    TestRendererAct(() => {
      getInspectedElementPath(id, ['props', 'nestedObject', 'a']);
      jest.runOnlyPendingTimers();
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('2: Inspect props.nestedObject.a');

    inspectedElement = null;
    TestRendererAct(() => {
      getInspectedElementPath(id, ['props', 'nestedObject', 'c']);
      jest.runOnlyPendingTimers();
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('3: Inspect props.nestedObject.c');

    TestRendererAct(() => {
      TestUtilsAct(() => {
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

    TestRendererAct(() => {
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

    TestUtilsAct(() => {
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

    TestRendererAct(() => {
      TestUtilsAct(() => {
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

  it('should enable inspected values to be stored as global variables', async done => {
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
      ReactDOM.render(
        <Example nestedObject={nestedObject} />,
        document.createElement('div'),
      ),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let storeAsGlobal: StoreAsGlobal = ((null: any): StoreAsGlobal);

    function Suspender({target}) {
      const context = React.useContext(InspectedElementContext);
      storeAsGlobal = context.storeAsGlobal;
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
    expect(storeAsGlobal).not.toBeNull();

    const logSpy = jest.fn();
    spyOn(console, 'log').and.callFake(logSpy);

    // Should store the whole value (not just the hydrated parts)
    storeAsGlobal(id, ['props', 'nestedObject']);
    jest.runOnlyPendingTimers();
    expect(logSpy).toHaveBeenCalledWith('$reactTemp1');
    expect(global.$reactTemp1).toBe(nestedObject);

    logSpy.mockReset();

    // Should store the nested property specified (not just the outer value)
    storeAsGlobal(id, ['props', 'nestedObject', 'a', 'b']);
    jest.runOnlyPendingTimers();
    expect(logSpy).toHaveBeenCalledWith('$reactTemp2');
    expect(global.$reactTemp2).toBe(nestedObject.a.b);

    done();
  });

  it('should enable inspected values to be copied to the clipboard', async done => {
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
      ReactDOM.render(
        <Example nestedObject={nestedObject} />,
        document.createElement('div'),
      ),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let copyPath: CopyInspectedElementPath = ((null: any): CopyInspectedElementPath);

    function Suspender({target}) {
      const context = React.useContext(InspectedElementContext);
      copyPath = context.copyInspectedElementPath;
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
    expect(copyPath).not.toBeNull();

    // Should copy the whole value (not just the hydrated parts)
    copyPath(id, ['props', 'nestedObject']);
    jest.runOnlyPendingTimers();
    expect(global.mockClipboardCopy).toHaveBeenCalledTimes(1);
    expect(global.mockClipboardCopy).toHaveBeenCalledWith(
      JSON.stringify(nestedObject),
    );

    global.mockClipboardCopy.mockReset();

    // Should copy the nested property specified (not just the outer value)
    copyPath(id, ['props', 'nestedObject', 'a', 'b']);
    jest.runOnlyPendingTimers();
    expect(global.mockClipboardCopy).toHaveBeenCalledTimes(1);
    expect(global.mockClipboardCopy).toHaveBeenCalledWith(
      JSON.stringify(nestedObject.a.b),
    );

    done();
  });

  it('should enable complex values to be copied to the clipboard', async done => {
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
    // $FlowFixMe
    const bigInt = BigInt(123); // eslint-disable-line no-undef

    await utils.actAsync(() =>
      ReactDOM.render(
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

    let copyPath: CopyInspectedElementPath = ((null: any): CopyInspectedElementPath);

    function Suspender({target}) {
      const context = React.useContext(InspectedElementContext);
      copyPath = context.copyInspectedElementPath;
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
    expect(copyPath).not.toBeNull();

    // Should copy the whole value (not just the hydrated parts)
    copyPath(id, ['props']);
    jest.runOnlyPendingTimers();
    // Should not error despite lots of unserialized values.

    global.mockClipboardCopy.mockReset();

    // Should copy the nested property specified (not just the outer value)
    copyPath(id, ['props', 'bigInt']);
    jest.runOnlyPendingTimers();
    expect(global.mockClipboardCopy).toHaveBeenCalledTimes(1);
    expect(global.mockClipboardCopy).toHaveBeenCalledWith(
      JSON.stringify('123n'),
    );

    global.mockClipboardCopy.mockReset();

    // Should copy the nested property specified (not just the outer value)
    copyPath(id, ['props', 'typedArray']);
    jest.runOnlyPendingTimers();
    expect(global.mockClipboardCopy).toHaveBeenCalledTimes(1);
    expect(global.mockClipboardCopy).toHaveBeenCalledWith(
      JSON.stringify({0: 100, 1: -100, 2: 0}),
    );

    done();
  });

  it('should display complex values of useDebugValue', async done => {
    let getInspectedElementPath: GetInspectedElementPath = ((null: any): GetInspectedElementPath);
    let inspectedElement = null;
    function Suspender({target}) {
      const context = React.useContext(InspectedElementContext);
      getInspectedElementPath = context.getInspectedElementPath;
      inspectedElement = context.getInspectedElement(target);
      return null;
    }

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
      ReactDOM.render(<DisplayedComplexValue />, container),
    );

    const ignoredComplexValueIndex = 0;
    const ignoredComplexValueId = ((store.getElementIDAtIndex(
      ignoredComplexValueIndex,
    ): any): number);
    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={ignoredComplexValueId}
            defaultSelectedElementIndex={ignoredComplexValueIndex}>
            <React.Suspense fallback={null}>
              <Suspender target={ignoredComplexValueId} />
            </React.Suspense>
          </Contexts>,
        ),
      false,
    );
    expect(getInspectedElementPath).not.toBeNull();
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('DisplayedComplexValue');

    done();
  });
});
